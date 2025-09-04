import { getDocCategories } from '@/lib/docs';
import Layout from '@/app/components/Layout';
import styles from './page.module.css';
import type { Metadata } from 'next';
import Link from 'next/link';

export async function generateMetadata(): Promise<Metadata> {
  // Fallback metadata if no docs are available
  return {
    title: 'Documentation - Bread Modular',
    description: 'Learn how to build and use Bread Modular synthesizer modules.',
    openGraph: {
      title: 'Documentation - Bread Modular',
      description: 'Learn how to build and use Bread Modular synthesizer modules.',
      type: 'article',
      url: '/docs',
      images: ['/images/home-slide/01.jpg'],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Documentation - Bread Modular',
      description: 'Learn how to build and use Bread Modular synthesizer modules.',
      images: ['/images/home-slide/01.jpg'],
    },
  };
}

export default async function DocsPage() {
  const categories = await getDocCategories();
  
  return (
    <Layout>
      <div className={styles.fullWidthContainer}>
        <main className={styles.content}>
          <h1>Documentation</h1>
          
          <p className={styles.introText}>
            Welcome to the Bread Modular documentation.
            <br/>
            Here you can learn all about Bread Modular, from the getting started guide to patch ideas and specifications.
          </p>
          
          {categories.length > 0 ? (
            categories.map((category) => (
              <section key={category.slug} className={styles.categorySection}>
                <h2 className={styles.categoryTitle}>
                  <Link href={`/docs/${category.slug}`} className={styles.categoryTitleLink}>
                    {category.name}
                  </Link>
                </h2>
                
                <div className={styles.docsGrid}>
                  {category.docs.map((doc) => (
                    <Link 
                      href={`/docs/${category.slug}/${doc.slug}`} 
                      key={doc.slug}
                      className={styles.docCard}
                    >
                      <h3 className={styles.docTitle}>{doc.title}</h3>
                      <p className={styles.docSummary}>{doc.summary}</p>
                      <span className={styles.readMoreLink}>
                        Read more
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                        </svg>
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            ))
          ) : (
            <div>
              <p>Documentation is coming soon.</p>
            </div>
          )}
        </main>
      </div>
    </Layout>
  );
} 
