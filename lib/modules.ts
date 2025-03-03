'use server';

import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import { cache } from 'react';

export interface ModuleVersion {
  name: string;
  price: number;
  productId?: string;
}

export interface ModuleSpec {
  id: string;
  title: string;
  description: string;
  image: string;
  versions: ModuleVersion[];
  checkout?: {
    link: string;
    price: number;
  };
  featured?: boolean;
  size?: 'base' | 'double' | 'triple';
}

export interface Module extends ModuleSpec {
  contentHtml: string;
}

const MODULES_DIRECTORY = path.join(process.cwd(), 'content/modules');

// Helper function to get the clean ID without numeric prefix
function getCleanId(filename: string): string {
  return filename.replace(/^\d+-/, '').replace(/\.md$/, '');
}

export async function getAllModuleIds() {
  const filenames = await fs.readdir(MODULES_DIRECTORY);
  return filenames
    .filter(filename => filename.endsWith('.md'))
    .map(filename => getCleanId(filename));
}

export const getModuleData = cache(async (id: string): Promise<Module | null> => {
  try {
    // Find the file that matches the ID (with or without numeric prefix)
    const files = await fs.readdir(MODULES_DIRECTORY);
    const filename = files.find(f => getCleanId(f) === id);
    
    if (!filename) {
      throw new Error(`Module not found: ${id}`);
    }

    const fullPath = path.join(MODULES_DIRECTORY, filename);
    const fileContents = await fs.readFile(fullPath, 'utf8');
    
    // Parse markdown metadata and content
    const { data, content } = matter(fileContents);
    
    // Convert markdown to HTML
    const processedContent = await remark()
      .use(html)
      .process(content);
    const contentHtml = processedContent.toString();

    // Return the module data with the clean ID
    return {
      id: getCleanId(filename),
      title: data.title,
      description: data.description,
      image: data.image,
      versions: data.versions || [],
      checkout: data.checkout,
      featured: data.featured,
      size: data.size,
      contentHtml,
    };
  } catch (error) {
    console.error(`Error loading module ${id}:`, error);
    return null;
  }
});

export async function getAllModules(): Promise<ModuleSpec[]> {
  const filenames = await fs.readdir(MODULES_DIRECTORY);
  
  // Sort filenames by their numeric prefix
  const sortedFilenames = filenames
    .filter(filename => filename.endsWith('.md'))
    .sort((a, b) => {
      const aMatch = a.match(/^(\d+)-/);
      const bMatch = b.match(/^(\d+)-/);
      const aNum = aMatch ? parseInt(aMatch[1]) : 0;
      const bNum = bMatch ? parseInt(bMatch[1]) : 0;
      return aNum - bNum;
    });

  const modules = await Promise.all(
    sortedFilenames.map(async filename => {
      const moduleData = await getModuleData(getCleanId(filename));
      return moduleData;
    })
  );
  
  return modules.filter((module): module is Module => module !== null);
} 