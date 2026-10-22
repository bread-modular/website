import PageTransition from '@/app/components/PageTransition';

export default function DocTemplate({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
