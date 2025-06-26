import { promises as fs } from 'fs';
import path from 'path';

// Helper to strip number prefix from file/folder names
function stripPrefix(name: string) {
  return name.replace(/^\d+-/, '').replace(/\.md$/, '');
}

// Helper to create anchor from a clean URL path (e.g. /modules/midi)
function makeAnchorFromUrl(url: string) {
  // Remove leading slash, replace / with _, remove .md if present
  return '#' + url.replace(/^\//, '').replace(/\.md$/, '').replaceAll('/', '_');
}

// Helper to parse frontmatter
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

// Recursively collect all markdown files in a directory
async function collectMarkdownFiles(dir: string, rel: string[] = []): Promise<{ file: string, rel: string[] }[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  let files: { file: string, rel: string[] }[] = [];
  for (const entry of entries) {
    if (entry.isDirectory()) {
      files = files.concat(await collectMarkdownFiles(path.join(dir, entry.name), rel.concat(entry.name)));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push({ file: path.join(dir, entry.name), rel: rel.concat(entry.name) });
    }
  }
  return files;
}

// Build section tree for TOC and content
async function buildSectionTree() {
  const root = process.cwd();
  // Docs: group by first and second folder
  const docsFiles = await collectMarkdownFiles(path.join(root, 'content/docs'));
  const modulesFiles = await collectMarkdownFiles(path.join(root, 'content/modules'));
  const blogFiles = await collectMarkdownFiles(path.join(root, 'content/blog'));

  // Group docs by top-level and sub-level
  const docsTree: Record<string, Record<string, { file: string, rel: string[] }[]>> = {};
  for (const { file, rel } of docsFiles) {
    const [group, sub] = rel;
    const groupName = group ? stripPrefix(group) : '';
    const subName = sub ? stripPrefix(sub) : '';
    if (!docsTree[groupName]) docsTree[groupName] = {};
    if (!docsTree[groupName][subName]) docsTree[groupName][subName] = [];
    docsTree[groupName][subName].push({ file, rel });
  }
  // Modules and Blog are flat
  return { docsTree, modulesFiles, blogFiles };
}

// Generate anchor map for all files
function buildAnchorMap(docsTree: Record<string, Record<string, { file: string, rel: string[] }[]>>, modulesFiles: { file: string, rel: string[] }[], blogFiles: { file: string, rel: string[] }[]) {
  const anchorMap: Record<string, string> = {};
  // Docs
  for (const group in docsTree) {
    for (const sub in docsTree[group]) {
      for (const entry of docsTree[group][sub]) {
        const url = '/docs/' + entry.rel.map(stripPrefix).join('/');
        const urlMd = url + '.md';
        const anchor = makeAnchorFromUrl(url);
        anchorMap[url] = anchor;
        anchorMap[urlMd] = anchor;
      }
    }
  }
  // Modules
  for (const entry of modulesFiles) {
    const url = '/modules/' + entry.rel.map(stripPrefix).join('/');
    const urlMd = url + '.md';
    const anchor = makeAnchorFromUrl(url);
    anchorMap[url] = anchor;
    anchorMap[urlMd] = anchor;
  }
  // Blog
  for (const entry of blogFiles) {
    const url = '/blog/' + entry.rel.map(stripPrefix).join('/');
    const urlMd = url + '.md';
    const anchor = makeAnchorFromUrl(url);
    anchorMap[url] = anchor;
    anchorMap[urlMd] = anchor;
  }
  return anchorMap;
}

// Rewrite internal links (with or without .md) to anchors, and image URLs to absolute
function rewriteLinks(content: string, anchorMap: Record<string, string>) {
  // Internal links
  let result = content.replace(/\]\((\/(docs|modules|blog)\/[^)\s]+?(?:\.md)?)\)/g, (m, link) => {
    const anchor = anchorMap[link];
    if (anchor) return `](${anchor})`;
    return m;
  });
  // Images: ![alt](/images/foo.png) or ![](/images/foo.png)
  result = result.replace(/(!\[[^\]]*\]\()\/images\//g, '$1https://breadmodular.com/images/');
  return result;
}

export async function GET() {
  const { docsTree, modulesFiles, blogFiles } = await buildSectionTree();
  const anchorMap = buildAnchorMap(docsTree, modulesFiles, blogFiles);
  const howTo = [
    '# Bread Modular Full Documentation',
    '',
    '---',
    '## How to Read This Document',
    '',
    '- You can see the Table of Contents (TOC) below.',
    '- Each page has an assigned hash tag (e.g., #docs_getting-started_introduction).',
    '- Just next to each page title, you will see an <a> tag with the anchor format (e.g., <a href="#docs_getting-started_introduction"></a>).',
    '- **Internal links** (e.g., [MIDI](#modules_midi)) jump to anchors generated from the clean URL path for each section.',
    '- **Markdown content** for each page is enclosed between:',
    '    - ---markdown--- and ---end---',
    '- **Images** are referenced in markdown and use absolute URLs (e.g., https://breadmodular.com/images/...). You should try to load these images to get the full meaning of the document.',
    '- All content is grouped by Docs, Modules, and Blog.',
    '',
    '---',
    '',
    '## Table of Contents',
    ''
  ].join('\n');
  let toc = howTo;
  let body = '';

  // DOCS
  toc += '\n- [Docs](#docs)';
  body += '\n\n## Docs\n';
  for (const group in docsTree) {
    const groupAnchor = makeAnchorFromUrl('/docs/' + group);
    toc += `\n  - [${group.charAt(0).toUpperCase() + group.slice(1).replace(/-/g, ' ')}](${groupAnchor})`;
    body += `\n\n### ${group.charAt(0).toUpperCase() + group.slice(1).replace(/-/g, ' ')}\n`;
    // List all files in all subfolders under this group
    const files: { file: string, rel: string[] }[] = [];
    for (const sub in docsTree[group]) {
      for (const entry of docsTree[group][sub]) {
        files.push(entry);
      }
    }
    for (const entry of files) {
      const cleanName = stripPrefix(entry.rel[entry.rel.length - 1]);
      const anchor = anchorMap['/docs/' + entry.rel.map(stripPrefix).join('/') + '.md'];
      const content = await fs.readFile(entry.file, 'utf8');
      const { title, desc } = parseFrontmatter(content);
      toc += `\n    - [${title || cleanName}](${anchor})`;
      body += `\n\n#### ${title || cleanName} <a href=\"#${anchor.slice(1)}\"></a>\n`;
      if (desc) body += `**Description:** ${desc}\n`;
      body += '\n---markdown---\n' + rewriteLinks(content, anchorMap) + '\n---end---\n';
    }
  }

  // MODULES
  toc += '\n- [Modules](#modules)';
  body += '\n\n## Modules\n';
  for (const entry of modulesFiles) {
    const cleanName = stripPrefix(entry.rel[entry.rel.length - 1]);
    const anchor = anchorMap['/modules/' + entry.rel.map(stripPrefix).join('/') + '.md'];
    const content = await fs.readFile(entry.file, 'utf8');
    const { title, desc } = parseFrontmatter(content);
    toc += `\n  - [${title || cleanName}](#${anchor.slice(1)})`;
    body += `\n\n### ${title || cleanName} <a href=\"#${anchor.slice(1)}\"></a>\n`;
    if (desc) body += `**Description:** ${desc}\n`;
    body += '\n---markdown---\n' + rewriteLinks(content, anchorMap) + '\n---end---\n';
  }

  // BLOG
  toc += '\n- [Blog](#blog)';
  body += '\n\n## Blog\n';
  for (const entry of blogFiles) {
    const cleanName = stripPrefix(entry.rel[entry.rel.length - 1]);
    const anchor = anchorMap['/blog/' + entry.rel.map(stripPrefix).join('/') + '.md'];
    const content = await fs.readFile(entry.file, 'utf8');
    const { title, desc } = parseFrontmatter(content);
    toc += `\n  - [${title || cleanName}](#${anchor.slice(1)})`;
    body += `\n\n### ${title || cleanName} <a href=\"#${anchor.slice(1)}\"></a>\n`;
    if (desc) body += `**Description:** ${desc}\n`;
    body += '\n---markdown---\n' + rewriteLinks(content, anchorMap) + '\n---end---\n';
  }

  const note = '\n\n---\n**Note:** Internal links in this document jump to sections below.\n';
  return new Response(toc + note + body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
}
