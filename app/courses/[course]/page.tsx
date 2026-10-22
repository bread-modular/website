import Layout from '@/app/components/Layout';
import MarkdownContent from '@/app/components/media/MarkdownContent';
import styles from '../page.module.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllCourses, getCourse } from '@/lib/courses';

type Props = { params: Promise<{ course: string }> };

export async function generateStaticParams() {
  const courses = await getAllCourses();
  return courses.map(course => ({ course: course.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { course: courseSlug } = await params;
  const course = await getCourse(courseSlug);

  if (!course) {
    return {
      title: 'Not Found',
      description: 'The page you are looking for does not exist.'
    };
  }

  const imageUrl = course.image || '/images/home-slide/01.jpg';

  return {
    title: `${course.title} | Bread Modular Courses`,
    description: course.summary,
    openGraph: {
      title: course.title,
      description: course.summary,
      type: 'article',
      url: `/courses/${course.slug}`,
      images: [imageUrl],
    },
    twitter: {
      card: 'summary_large_image',
      title: course.title,
      description: course.summary,
      images: [imageUrl],
    },
  };
}

export default async function CoursePage({ params }: Props) {
  const { course: courseSlug } = await params;
  const course = await getCourse(courseSlug);

  if (!course) return notFound();

  const firstLesson = course.lessons[0];

  return (
    <Layout>
      <div className={styles.fullWidthContainer}>
        <main className={styles.overview}>
          <Link href="/courses" className={styles.breadcrumb}>← All courses</Link>
          <h1>{course.title}</h1>
          <p className={styles.overviewSummary}>{course.summary}</p>
          <div className={styles.courseMeta}>
            {course.level && <span className={styles.badge}>{course.level}</span>}
            <span className={styles.badge}>{course.lessons.length} lessons</span>
          </div>

          <MarkdownContent content={course.contentHtml} />

          {firstLesson && (
            <Link href={`/courses/${course.slug}/${firstLesson.slug}`} className={styles.startButton}>
              Start the course →
            </Link>
          )}

          <h2 className={styles.lessonsTitle}>Lessons</h2>
          <ol className={styles.lessonList}>
            {course.lessons.map((lesson, index) => (
              <li key={lesson.slug}>
                <Link href={`/courses/${course.slug}/${lesson.slug}`} className={styles.lessonItem}>
                  <span className={styles.lessonNumber}>{index + 1}</span>
                  <div className={styles.lessonText}>
                    <h3>{lesson.title}</h3>
                    <p>{lesson.summary}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        </main>
      </div>
    </Layout>
  );
}
