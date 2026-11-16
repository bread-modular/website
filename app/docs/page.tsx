import { getDocCategories } from '@/lib/docs';
import EuroLayout from '@/app/components/euro/EuroLayout';
import styles from './page.module.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import ui from '@/app/components/euro/ui.module.css';

export async function generateMetadata(): Promise<Metadata> {
  // Fallback metadata if no docs are available
  return {
    alternates: { canonical: '/docs' },
    title: 'Documentation - Bread Modular',
    description: 'Documentation for Bread Modular, Eurorack Made Affordable. Docs for Bread Modular Original are here too.',
    openGraph: {
      title: 'Documentation - Bread Modular',
      description: 'Documentation for Bread Modular, Eurorack Made Affordable. Docs for Bread Modular Original are here too.',
      type: 'article',
      url: '/docs',
      images: ['/images/home-slide/01.jpg'],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Documentation - Bread Modular',
      description: 'Documentation for Bread Modular, Eurorack Made Affordable. Docs for Bread Modular Original are here too.',
      images: ['/images/home-slide/01.jpg'],
    },
  };
}

export default async function DocsPage() {
  const categories = await getDocCategories();
  
  return (
    <EuroLayout>
      <div className={`${styles.fullWidthContainer} ${styles.belowTopBar}`}>
        <main className={styles.content}>
          <h1>Documentation</h1>
          
          <p className={styles.introText}>
            Welcome to the Bread Modular documentation.
            <br/>
            Docs for our Eurorack modules are coming soon. The 3D printed case is ready today:{' '}
            <Link href="/case" className={ui.textLink}>configure it and download the STL files</Link>.
          </p>

          <h2 className={styles.sectionTitle}>Bread Modular Original</h2>
          <p className={styles.introText}>
            Learn all about Bread Modular Original, from the getting started guide to patch ideas and specifications.
          </p>

          <div className={styles.chatBanner}>
            <a 
              href="https://notebooklm.google.com/notebook/09159f54-4055-407e-a2f8-818cbaf1744f/preview"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.chatBannerLink}
            >
              <span className={styles.chatBannerIcon}>💬</span>
              <div className={styles.chatBannerContent}>
                <strong>Chat with AI Assistant</strong>
                <span>Ask questions about Bread Modular Original documentation</span>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={styles.chatBannerArrow}>
                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
          
          {categories.length > 0 ? (
            categories.map((category) => (
              <section key={category.slug} className={styles.categorySection}>
                <h3 className={styles.categoryTitle}>
                  <Link href={`/docs/${category.slug}`} className={styles.categoryTitleLink}>
                    {category.name}
                  </Link>
                </h3>
                
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
    </EuroLayout>
  );
} 
