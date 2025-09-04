import Layout from '@/app/components/Layout';
import styles from '../page.module.css';
import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDocCategories } from '@/lib/docs';

type Props = { params: Promise<{ category: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: categoryParam } = await params;
  const categories = await getDocCategories();
  const category = categories.find(c => c.slug === categoryParam);
  const title = category ? `${category.name} Docs - Bread Modular` : 'Docs - Bread Modular';
  const description = category
    ? `Browse all documentation in ${category.name}.`
    : 'Documentation - Bread Modular';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      url: `/docs/${categoryParam}`,
      images: ['/images/home-slide/01.jpg'],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/images/home-slide/01.jpg'],
    },
  };
}

export default async function DocsCategoryPage({ params }: Props) {
  const { category: categoryParam } = await params;
  const categories = await getDocCategories();
  const category = categories.find(c => c.slug === categoryParam);

  if (!category) return notFound();

  return (
    <Layout>
      <div className={styles.fullWidthContainer}>
        <main className={styles.content}>
          <h1>{category.name}</h1>

          {category.docs.length > 0 ? (
            <section className={styles.categorySection}>
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
                        <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l 4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                      </svg>
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ) : (
            <div>
              <p>No docs found in this category.</p>
            </div>
          )}
        </main>
      </div>
    </Layout>
  );
}
