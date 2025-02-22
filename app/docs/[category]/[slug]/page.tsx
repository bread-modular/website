import { notFound } from 'next/navigation';
import Link from 'next/link';
import Layout from '@/app/components/Layout';
import MarkdownContent from '@/app/components/MarkdownContent';
import { getDoc, getDocCategories } from '@/lib/docs';
import styles from './page.module.css';
import SidebarNav from '@/app/components/SidebarNav';

interface Props {
  params: Promise<{
    category: string;
    slug: string;
  }>;
}

export default async function DocPage({ params }: Props) {
  const {slug, category} = (await params);
  const [doc, categories] = await Promise.all([
    getDoc(category, slug),
    getDocCategories()
  ]);

  if (!doc) {
    notFound();
  }

  return (
    <Layout>
      <div className={styles.container}>
        <SidebarNav categories={categories} currentDoc={doc} />
        <main className={styles.content}>
          <h1>{doc.title}</h1>
          <div className={styles.markdownWrapper}>
            <MarkdownContent content={doc.contentHtml} />
          </div>
        </main>
      </div>
    </Layout>
  );
} 