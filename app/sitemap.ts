import type { MetadataRoute } from 'next';
import { getDocCategories } from '@/lib/docs';
import { getAllBlogPosts } from '@/lib/blog';
import { getAllModuleIds } from '@/lib/modules';
import { getAllCourses } from '@/lib/courses';
import { CASE_LAYOUTS, DEFAULT_CASE_CONFIG } from '@/lib/euro/case';

const SITE = process.env.SITE_URL || 'https://breadmodular.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, posts, moduleIds, courses] = await Promise.all([
    getDocCategories(), getAllBlogPosts(), getAllModuleIds(), getAllCourses(),
  ]);

  const paths = [
    '/', '/case', '/docs', '/firmwares', '/blog',
    // Every case layout has its own print list and assembly guide
    ...CASE_LAYOUTS.filter(layout => layout.id !== DEFAULT_CASE_CONFIG.layout).map(layout => `/case?layout=${layout.id}`),
    '/original', '/original/modules', '/courses',
    ...categories.flatMap(category => [
      `/docs/${category.slug}`,
      ...category.docs.map(doc => `/docs/${category.slug}/${doc.slug}`),
    ]),
    ...courses.flatMap(course => [
      `/courses/${course.slug}`,
      ...course.lessons.map(lesson => `/courses/${course.slug}/${lesson.slug}`),
    ]),
    ...posts.map(post => `/blog/${post.slug}`),
    ...moduleIds.map(id => `/original/modules/${id}`),
  ];

  return paths.map(path => ({ url: `${SITE}${path}` }));
}
