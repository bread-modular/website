import { promises as fs } from 'fs';
import path from 'path';

export async function GET(req: Request, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const slugArr = slug;
  const modulesRoot = path.join(process.cwd(), 'content/modules');

  // Helper to find the real file with number prefix
  async function findWithPrefix(parent: string, clean: string): Promise<string | null> {
    const entries = await fs.readdir(parent, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.replace(/^\d+-/, '') === clean) {
        return entry.name;
      }
    }
    return null;
  }

  // Only one segment for modules, e.g., midi.md
  const clean = slugArr.join('/');
  const found = await findWithPrefix(modulesRoot, clean);
  if (!found) {
    return new Response('Not found', { status: 404 });
  }
  const filePath = path.join(modulesRoot, found);
  try {
    let content = await fs.readFile(filePath, 'utf8');
    // Rewrite internal links to append .md if not present
    content = content.replace(/\]\((\/(docs|modules|blog)\/[^)\s]+?)(?<!\.md)\)/g, "]($1.md)");
    return new Response(content, {
      headers: { 'Content-Type': 'text/markdown; charset=utf-8' }
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
