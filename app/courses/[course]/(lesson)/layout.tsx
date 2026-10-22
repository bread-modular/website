import { notFound } from 'next/navigation';
import Layout from '@/app/components/Layout';
import SidebarNav from '@/app/components/SidebarNav';
import { getCourse } from '@/lib/courses';
import styles from './layout.module.css';

type Props = {
  children: React.ReactNode;
  params: Promise<{ course: string }>;
};

// The sidebar lives in a layout so it stays mounted while moving between
// lessons; only the lesson content (wrapped by template.tsx) changes.
export default async function LessonLayout({ children, params }: Props) {
  const { course: courseSlug } = await params;
  const course = await getCourse(courseSlug);
  if (!course) notFound();

  return (
    <Layout>
      <div className={styles.container}>
        <SidebarNav
          variant="steps"
          eyebrow="Course"
          title={course.title}
          titleHref={`/courses/${course.slug}`}
          sections={[
            {
              items: course.lessons.map(lesson => ({
                href: `/courses/${course.slug}/${lesson.slug}`,
                title: lesson.title
              }))
            }
          ]}
        />
        <div className={styles.content}>{children}</div>
      </div>
    </Layout>
  );
}
