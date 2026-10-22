'use server';

import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import { cache } from 'react';

export interface Lesson {
  id: string;
  title: string;
  summary: string;
  slug: string;
  courseSlug: string;
  contentHtml: string;
}

export interface Course {
  id: string;
  title: string;
  summary: string;
  slug: string;
  image?: string;
  level?: string;
  contentHtml: string;
  lessons: Lesson[];
}

const COURSES_DIRECTORY = path.join(process.cwd(), 'content/courses');
const COURSE_INDEX_FILE = 'index.md';

// Helper function to get clean ID/slug without numeric prefix
function getCleanId(filename: string): string {
  return filename.replace(/^\d+-/, '').replace(/\.md$/, '');
}

async function markdownToHtml(markdown: string): Promise<string> {
  const processedContent = await remark().use(html).process(markdown);
  return processedContent.toString();
}

async function findCourseDir(courseSlug: string): Promise<string | null> {
  const entries = await fs.readdir(COURSES_DIRECTORY, { withFileTypes: true });
  const courseDir = entries.find(entry =>
    entry.isDirectory() && getCleanId(entry.name) === courseSlug
  );
  return courseDir ? courseDir.name : null;
}

// Get a specific lesson by course and slug
export const getLesson = cache(async (courseSlug: string, lessonSlug: string): Promise<Lesson | null> => {
  try {
    const courseDir = await findCourseDir(courseSlug);
    if (!courseDir) return null;

    const coursePath = path.join(COURSES_DIRECTORY, courseDir);
    const files = await fs.readdir(coursePath);
    const lessonFile = files.find(file =>
      file !== COURSE_INDEX_FILE && file.endsWith('.md') && getCleanId(file) === lessonSlug
    );

    if (!lessonFile) return null;

    const fileContents = await fs.readFile(path.join(coursePath, lessonFile), 'utf8');
    const { data, content } = matter(fileContents);

    return {
      id: lessonFile,
      title: data.title,
      summary: data.summary,
      slug: lessonSlug,
      courseSlug,
      contentHtml: await markdownToHtml(content)
    };
  } catch (error) {
    console.error(`Error loading lesson ${courseSlug}/${lessonSlug}:`, error);
    return null;
  }
});

// Get a specific course with all of its lessons
export const getCourse = cache(async (courseSlug: string): Promise<Course | null> => {
  try {
    const courseDir = await findCourseDir(courseSlug);
    if (!courseDir) return null;

    const coursePath = path.join(COURSES_DIRECTORY, courseDir);
    const fileContents = await fs.readFile(path.join(coursePath, COURSE_INDEX_FILE), 'utf8');
    const { data, content } = matter(fileContents);

    const files = await fs.readdir(coursePath);
    const lessons = await Promise.all(
      files
        .filter(file => file !== COURSE_INDEX_FILE && file.endsWith('.md'))
        .sort((a, b) => a.localeCompare(b))
        .map(file => getLesson(courseSlug, getCleanId(file)))
    );

    return {
      id: courseDir,
      title: data.title,
      summary: data.summary,
      slug: courseSlug,
      image: data.image,
      level: data.level,
      contentHtml: await markdownToHtml(content),
      lessons: lessons.filter((lesson): lesson is Lesson => lesson !== null)
    };
  } catch (error) {
    console.error(`Error loading course ${courseSlug}:`, error);
    return null;
  }
});

// Get all courses
export const getAllCourses = cache(async (): Promise<Course[]> => {
  const entries = await fs.readdir(COURSES_DIRECTORY, { withFileTypes: true });
  const courses = await Promise.all(
    entries
      .filter(entry => entry.isDirectory() && /^\d+-/.test(entry.name))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(entry => getCourse(getCleanId(entry.name)))
  );
  return courses.filter((course): course is Course => course !== null);
});
