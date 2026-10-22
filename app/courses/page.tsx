import Layout from '@/app/components/Layout';
import styles from './page.module.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllCourses } from '@/lib/courses';

export const metadata: Metadata = {
  title: 'Courses - Bread Modular',
  description: 'Hands-on courses to learn audio electronics and synthesis with Bread Modular.',
  openGraph: {
    title: 'Courses - Bread Modular',
    description: 'Hands-on courses to learn audio electronics and synthesis with Bread Modular.',
    type: 'website',
    url: '/courses',
    images: ['/images/courses/audio-electronics/part1-02.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Courses - Bread Modular',
    description: 'Hands-on courses to learn audio electronics and synthesis with Bread Modular.',
    images: ['/images/courses/audio-electronics/part1-02.jpg'],
  },
};

export default async function CoursesPage() {
  const courses = await getAllCourses();

  return (
    <Layout>
      <div className={styles.fullWidthContainer}>
        <main className={styles.content}>
          <h1>Courses</h1>
          <p className={styles.introText}>
            Hands-on courses to learn audio electronics from first principles.
            Build real circuits, inspect them with an oscilloscope and hear the results.
          </p>

          <div className={styles.courseGrid}>
            {courses.map((course) => (
              <Link href={`/courses/${course.slug}`} key={course.slug} className={styles.courseCard}>
                {course.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={course.image} alt={course.title} className={styles.courseImage} />
                )}
                <div className={styles.courseBody}>
                  <div className={styles.courseMeta}>
                    {course.level && <span className={styles.badge}>{course.level}</span>}
                    <span className={styles.badge}>{course.lessons.length} lessons</span>
                  </div>
                  <h2 className={styles.courseTitle}>{course.title}</h2>
                  <p className={styles.courseSummary}>{course.summary}</p>
                  <span className={styles.cta}>View course →</span>
                </div>
              </Link>
            ))}
          </div>
        </main>
      </div>
    </Layout>
  );
}
