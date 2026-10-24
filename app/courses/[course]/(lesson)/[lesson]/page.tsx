import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import MarkdownContent from '@/app/components/media/MarkdownContent';
import { getAllCourses, getCourse, getLesson } from '@/lib/courses';
import { extractFirstImageFromHtml } from '@/lib/docs';
import styles from './page.module.css';

type Props = { params: Promise<{ course: string; lesson: string }> };

export async function generateStaticParams() {
  const courses = await getAllCourses();
  return courses.flatMap(course =>
    course.lessons.map(lesson => ({ course: course.slug, lesson: lesson.slug }))
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { course: courseSlug, lesson: lessonSlug } = await params;
  const [course, lesson] = await Promise.all([
    getCourse(courseSlug),
    getLesson(courseSlug, lessonSlug)
  ]);

  if (!course || !lesson) {
    return {
      title: 'Not Found',
      description: 'The page you are looking for does not exist.'
    };
  }

  const contentImage = await extractFirstImageFromHtml(lesson.contentHtml);
  const imageUrl = contentImage || course.image || '/images/home-slide/01.jpg';
  const title = `${lesson.title} - ${course.title}`;

  return {
    title: `${title} | Bread Modular`,
    description: lesson.summary,
    openGraph: {
      title,
      description: lesson.summary,
      type: 'article',
      url: `/courses/${course.slug}/${lesson.slug}`,
      images: [imageUrl],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: lesson.summary,
      images: [imageUrl],
    },
  };
}

export default async function LessonPage({ params }: Props) {
  const { course: courseSlug, lesson: lessonSlug } = await params;
  const course = await getCourse(courseSlug);
  if (!course) notFound();

  const index = course.lessons.findIndex(lesson => lesson.slug === lessonSlug);
  if (index === -1) notFound();

  const lesson = course.lessons[index];
  const prevLesson = index > 0 ? course.lessons[index - 1] : null;
  const nextLesson = index < course.lessons.length - 1 ? course.lessons[index + 1] : null;

  return (
    <article>
      <p className={styles.lessonLabel}>Lesson {index + 1} of {course.lessons.length}</p>
      <h1 className={styles.title}>{lesson.title}</h1>
      <div className={styles.markdownWrapper}>
        <MarkdownContent content={lesson.contentHtml} />
      </div>

      <nav className={styles.navLinks} aria-label="Lesson navigation">
        {prevLesson && (
          <Link href={`/courses/${course.slug}/${prevLesson.slug}`} className={styles.navLink}>
            <span className={styles.navDirection}>← Previous</span>
            <span className={styles.navTitle}>{prevLesson.title}</span>
          </Link>
        )}
        {nextLesson ? (
          <Link href={`/courses/${course.slug}/${nextLesson.slug}`} className={`${styles.navLink} ${styles.navLinkNext}`}>
            <span className={styles.navDirection}>Next →</span>
            <span className={styles.navTitle}>{nextLesson.title}</span>
          </Link>
        ) : (
          <Link href={`/courses/${course.slug}`} className={`${styles.navLink} ${styles.navLinkNext}`}>
            <span className={styles.navDirection}>🎉 Course complete</span>
            <span className={styles.navTitle}>Back to {course.title}</span>
          </Link>
        )}
      </nav>
    </article>
  );
}
