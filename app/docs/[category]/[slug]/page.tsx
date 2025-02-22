import { notFound } from 'next/navigation';
import Layout from '@/app/components/Layout';
import MarkdownContent from '@/app/components/MarkdownContent';
import { getDoc, getDocCategories } from '@/lib/docs';
import styles from './page.module.css';
import SidebarNav from '@/app/components/SidebarNav';
import { Metadata } from 'next';

interface Props {
  params: Promise<{
    category: string;
    slug: string;
  }>;
}

// Add generateMetadata function for dynamic metadata
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const {slug, category} = (await params);
  const doc = await getDoc(category, slug);
  
  if (!doc) {
    return {
      title: 'Not Found',
      description: 'The page you are looking for does not exist.'
    };
  }

  return {
    title: `${doc.title} | Bread Modular`,
    description: doc.summary,
    openGraph: {
      title: doc.title,
      description: doc.summary,
      type: 'article',
      url: `/docs/${category}/${slug}`,
    },
    twitter: {
      card: 'summary',
      title: doc.title,
      description: doc.summary,
    },
  };
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