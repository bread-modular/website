'use server';

import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import { cache } from 'react';

export interface BlogPost {
  id: string;
  title: string;
  date: string;
  author: string;
  summary: string;
  slug: string;
  contentHtml: string;
  indexNo: number;
}

const BLOG_DIRECTORY = path.join(process.cwd(), 'content/blog');

// Helper function to get slug from filename
function getSlugFromFilename(filename: string): string {
  // Extract slug from format: <index_no>-<slug>.md
  return filename.replace(/^\d+-/, '').replace(/\.md$/, '');
}

// Helper function to get index number from filename
function getIndexNoFromFilename(filename: string): number {
  const match = filename.match(/^(\d+)-/);
  return match ? parseInt(match[1], 10) : 0;
}

// Helper function to extract the first image from HTML content
export async function extractFirstImageFromHtml(html: string): Promise<string | null> {
  // First try to find a regular image
  const imgRegex = /<img[^>]+src="([^">]+)"/i;
  const imgMatch = html.match(imgRegex);
  
  if (imgMatch) {
    return imgMatch[1];
  }
  
  // If no image found, try to find a YouTube embed
  const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/i;
  const youtubeMatch = html.match(youtubeRegex);
  
  if (youtubeMatch) {
    const videoId = youtubeMatch[1];
    // Return the high-quality thumbnail URL
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  }
  
  // If neither image nor YouTube embed found
  return null;
}

// Get all blog posts
export const getAllBlogPosts = cache(async (): Promise<BlogPost[]> => {
  try {
    await fs.access(BLOG_DIRECTORY);
  } catch (error) {
    // Create the blog directory if it doesn't exist
    await fs.mkdir(BLOG_DIRECTORY, { recursive: true });
    return [];
  }
  
  const files = await fs.readdir(BLOG_DIRECTORY);
  const blogPosts = await Promise.all(
    files
      .filter(file => file.endsWith('.md'))
      .map(file => getBlogPost(getSlugFromFilename(file)))
  );
  
  // Sort by date (newest first)
  return blogPosts
    .filter((post): post is BlogPost => post !== null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
});

// Get a specific blog post by slug
export const getBlogPost = cache(async (slug: string): Promise<BlogPost | null> => {
  try {
    // Find the blog post file
    const files = await fs.readdir(BLOG_DIRECTORY);
    const postFile = files.find(file => 
      file.endsWith('.md') && getSlugFromFilename(file) === slug
    );

    if (!postFile) return null;

    // Read and process the blog post
    const fullPath = path.join(BLOG_DIRECTORY, postFile);
    const fileContents = await fs.readFile(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    const processedContent = await remark()
      .use(html)
      .process(content);
    const contentHtml = processedContent.toString();

    return {
      id: postFile,
      title: data.title,
      date: data.date,
      author: data.author,
      summary: data.summary,
      slug,
      contentHtml,
      indexNo: getIndexNoFromFilename(postFile)
    };
  } catch (error) {
    console.error(`Error loading blog post ${slug}:`, error);
    return null;
  }
});

// Function to generate RSS feed
export async function generateRssFeed(): Promise<string> {
  const posts = await getAllBlogPosts();
  const site_url = process.env.SITE_URL || 'https://breadmodular.com';
  
  const feedItems = posts.map(post => {
    return `
      <item>
        <title>${post.title}</title>
        <description>${post.summary}</description>
        <pubDate>${new Date(post.date).toUTCString()}</pubDate>
        <link>${site_url}/blog/${post.slug}</link>
        <guid>${site_url}/blog/${post.slug}</guid>
        <author>${post.author}</author>
      </item>
    `;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8" ?>
    <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
      <channel>
        <title>Bread Modular Blog</title>
        <link>${site_url}/blog</link>
        <description>Latest updates, tutorials, and news from Bread Modular</description>
        <language>en</language>
        <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
        <atom:link href="${site_url}/rss.xml" rel="self" type="application/rss+xml" />
        ${feedItems}
      </channel>
    </rss>
  `;
} 