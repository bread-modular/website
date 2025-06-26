import { promises as fs } from 'fs';
import path from 'path';

// Simple YAML frontmatter parser
function parseFrontmatter(content: string): { title: string, desc?: string } {
  const match = content.match(/^---\n([\s\S]*?)---/);
  if (match) {
    const yaml = match[1];
    const title = yaml.match(/title:\s*['"]?([^'"\n]+)['"]?/i)?.[1]?.trim();
    const desc = yaml.match(/summary:\s*['"]?([^'"\n]+)['"]?/i)?.[1]?.trim()
      || yaml.match(/description:\s*['"]?([^'"\n]+)['"]?/i)?.[1]?.trim();
    return { title: title || '', desc };
  }
  // fallback: try to get first # header
  const header = content.match(/^#\s+(.+)$/m)?.[1]?.trim();
  return { title: header || '', desc: undefined };
}

async function getMarkdownFilesDetailedCleanUrls(dir: string, baseUrl: string): Promise<Array<{ url: string, title: string, desc?: string }>> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: Array<{ url: string, title: string, desc?: string }> = [];
  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith('.md')) {
      const cleanName = entry.name.replace(/^\d+-/, '');
      const urlPath = path.join(baseUrl, cleanName).replace(/\\/g, '/');
      const fullPath = path.join(dir, entry.name);
      try {
        const content = await fs.readFile(fullPath, 'utf8');
        const { title, desc } = parseFrontmatter(content);
        files.push({ url: urlPath, title: title || cleanName.replace(/\.md$/, ''), desc });
      } catch {
        files.push({ url: urlPath, title: cleanName.replace(/\.md$/, '') });
      }
    }
  }
  return files;
}

function toTitleCase(str: string) {
  // Remove number prefix and dashes/underscores, capitalize words
  return str.replace(/^\d+-/, '').replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()).trim();
}

function stripNumberPrefix(str: string) {
  return str.replace(/^\d+-/, '');
}

async function getDocsGroupedCleanUrls(root: string): Promise<Record<string, Array<{ url: string, title: string, desc?: string }>>> {
  const groups: Record<string, Array<{ url: string, title: string, desc?: string }>> = {};
  const entries = await fs.readdir(root, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const groupName = toTitleCase(entry.name);
      const cleanDir = stripNumberPrefix(entry.name);
      const files = await fs.readdir(path.join(root, entry.name), { withFileTypes: true });
      const items: Array<{ url: string, title: string, desc?: string }> = [];
      for (const fileEntry of files) {
        if (fileEntry.isFile() && fileEntry.name.endsWith('.md')) {
          const cleanFile = stripNumberPrefix(fileEntry.name);
          const fullPath = path.join(root, entry.name, fileEntry.name);
          try {
            const content = await fs.readFile(fullPath, 'utf8');
            const { title, desc } = parseFrontmatter(content);
            items.push({
              url: `/docs/${cleanDir}/${cleanFile}`,
              title: title || cleanFile.replace(/\.md$/, ''),
              desc
            });
          } catch {
            items.push({
              url: `/docs/${cleanDir}/${cleanFile}`,
              title: cleanFile.replace(/\.md$/, ''),
            });
          }
        }
      }
      if (items.length) groups[groupName] = items;
    }
  }
  return groups;
}

export async function GET() {
  const root = process.cwd();
  const docsGroups = await getDocsGroupedCleanUrls(path.join(root, 'content/docs'));
  const modules = await getMarkdownFilesDetailedCleanUrls(path.join(root, 'content/modules'), '/modules');
  const blog = await getMarkdownFilesDetailedCleanUrls(path.join(root, 'content/blog'), '/blog');

  function section(title: string, items: Array<{ url: string, title: string, desc?: string }>) {
    if (!items.length) return '';
    return `## ${title}\n` + items.map(item => `- [${item.title}](${item.url})${item.desc ? ': ' + item.desc : ''}`).join('\n') + '\n';
  }

  function docsSection(groups: Record<string, Array<{ url: string, title: string, desc?: string }>>) {
    if (!Object.keys(groups).length) return '';
    return (
      '## Docs\n' +
      Object.entries(groups)
        .map(([group, items]) =>
          `### ${group}\n` + items.map(item => `- [${item.title}](${item.url})${item.desc ? ': ' + item.desc : ''}`).join('\n')
        ).join('\n') + '\n'
    );
  }

  const out = [
    '# Bread Modular Documentation',
    '',
    docsSection(docsGroups),
    section('Modules', modules),
    section('Blog', blog),
  ].join('\n');

  return new Response(out, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
}
