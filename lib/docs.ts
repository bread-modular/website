'use server';

import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import { cache } from 'react';

export interface DocCategory {
  id: string;
  name: string;
  slug: string;
  docs: Doc[];
}

export interface Doc {
  id: string;
  title: string;
  summary: string;
  slug: string;
  categorySlug: string;
  categoryName: string;
  contentHtml: string;
}

const DOCS_DIRECTORY = path.join(process.cwd(), 'content/docs');

// Helper function to get clean ID/slug without numeric prefix
function getCleanId(filename: string): string {
  return filename.replace(/^\d+-/, '').replace(/\.md$/, '');
}

// Get all doc categories
export const getDocCategories = cache(async (): Promise<DocCategory[]> => {
  const entries = await fs.readdir(DOCS_DIRECTORY, { withFileTypes: true });
  const categories = entries
    .filter(entry => entry.isDirectory() && /^\d+-/.test(entry.name))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(entry => ({
      id: entry.name,
      name: getCleanId(entry.name).split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' '),
      slug: getCleanId(entry.name),
      docs: [] as Doc[]
    }));

  // Load docs for each category
  for (const category of categories) {
    const categoryPath = path.join(DOCS_DIRECTORY, category.id);
    const files = await fs.readdir(categoryPath);
    const docs = await Promise.all(
      files
        .filter(file => file.endsWith('.md'))
        .sort((a, b) => a.localeCompare(b))
        .map(file => getDoc(category.slug, getCleanId(file)))
    );
    category.docs = docs.filter((doc): doc is Doc => doc !== null);
  }

  return categories;
});

// Get a specific doc by category and slug
export const getDoc = cache(async (categorySlug: string, docSlug: string): Promise<Doc | null> => {
  try {
    // Find the category directory
    const entries = await fs.readdir(DOCS_DIRECTORY, { withFileTypes: true });
    const categoryDir = entries.find(entry => 
      entry.isDirectory() && getCleanId(entry.name) === categorySlug
    );

    if (!categoryDir) return null;

    // Find the doc file
    const categoryPath = path.join(DOCS_DIRECTORY, categoryDir.name);
    const files = await fs.readdir(categoryPath);
    const docFile = files.find(file => 
      file.endsWith('.md') && getCleanId(file) === docSlug
    );

    if (!docFile) return null;

    // Read and process the doc
    const fullPath = path.join(categoryPath, docFile);
    const fileContents = await fs.readFile(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    const processedContent = await remark()
      .use(html)
      .process(content);
    const contentHtml = processedContent.toString();

    return {
      id: docFile,
      title: data.title,
      summary: data.summary,
      slug: docSlug,
      categorySlug,
      categoryName: categorySlug.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' '),
      contentHtml
    };
  } catch (error) {
    console.error(`Error loading doc ${categorySlug}/${docSlug}:`, error);
    return null;
  }
}); 