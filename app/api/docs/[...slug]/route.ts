import { promises as fs } from 'fs';
import path from 'path';

export async function GET(req: Request, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const slugArr = slug;
  const docsRoot = path.join(process.cwd(), 'content/docs');

  // Helper to find the real folder/file with number prefix
  async function findWithPrefix(parent: string, clean: string): Promise<string | null> {
    const entries = await fs.readdir(parent, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.replace(/^\d+-/, '') === clean) {
        return entry.name;
      }
    }
    return null;
  }

  let currentDir = docsRoot;
  const realPathParts: string[] = [];
  for (let i = 0; i < slugArr.length; i++) {
    const clean = slugArr[i];
    const found = await findWithPrefix(currentDir, clean);
    if (!found) {
      return new Response('Not found', { status: 404 });
    }
    realPathParts.push(found);
    currentDir = path.join(currentDir, found);
  }
  const filePath = path.join(docsRoot, ...realPathParts);
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
