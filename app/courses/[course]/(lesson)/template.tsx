import PageTransition from '@/app/components/PageTransition';

export default function LessonTemplate({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
