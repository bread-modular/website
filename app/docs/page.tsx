import { getDocCategories, getDoc } from '@/lib/docs';
import Layout from '@/app/components/Layout';
import MarkdownContent from '@/app/components/MarkdownContent';
import SidebarNav from '@/app/components/SidebarNav';
import styles from './[category]/[slug]/page.module.css';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const categories = await getDocCategories();
  
  if (categories.length > 0 && categories[0].docs.length > 0) {
    const firstDoc = await getDoc(categories[0].slug, categories[0].docs[0].slug);
    
    if (firstDoc) {
      return {
        title: `${firstDoc.title} | Bread Modular`,
        description: firstDoc.summary,
        openGraph: {
          title: firstDoc.title,
          description: firstDoc.summary,
          type: 'article',
          url: '/docs',
        },
        twitter: {
          card: 'summary',
          title: firstDoc.title,
          description: firstDoc.summary,
        },
      };
    }
  }

  // Fallback metadata if no docs are available
  return {
    title: 'Documentation - Bread Modular',
    description: 'Learn how to build and use Bread Modular synthesizer modules.',
    openGraph: {
      title: 'Documentation - Bread Modular',
      description: 'Learn how to build and use Bread Modular synthesizer modules.',
      type: 'article',
      url: '/docs',
    },
    twitter: {
      card: 'summary',
      title: 'Documentation - Bread Modular',
      description: 'Learn how to build and use Bread Modular synthesizer modules.',
    },
  };
}

export default async function DocsPage() {
  const categories = await getDocCategories();
  
  // Get the first document's content
  if (categories.length > 0 && categories[0].docs.length > 0) {
    const firstDoc = await getDoc(categories[0].slug, categories[0].docs[0].slug);
    
    if (firstDoc) {
      return (
        <Layout>
          <div className={styles.container}>
            <SidebarNav categories={categories} currentDoc={firstDoc} />
            <main className={styles.content}>
              <h1>{firstDoc.title}</h1>
              <div className={styles.markdownWrapper}>
                <MarkdownContent content={firstDoc.contentHtml} />
              </div>
            </main>
          </div>
        </Layout>
      );
    }
  }

  // Fallback if no docs are available
  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.content}>
          <h1>Documentation</h1>
          <p>Documentation is coming soon.</p>
        </div>
      </div>
    </Layout>
  );
} 