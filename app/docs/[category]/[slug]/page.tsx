import { notFound } from 'next/navigation';
import Link from 'next/link';
import Layout from '@/app/components/Layout';
import MarkdownContent from '@/app/components/MarkdownContent';
import { getDoc, getDocCategories } from '@/lib/docs';
import styles from './page.module.css';

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
        <aside className={styles.sidebar}>
          {categories.map((category) => (
            <div key={category.slug} className={styles.category}>
              <h3 className={styles.categoryTitle}>{category.name}</h3>
              <ul className={styles.docList}>
                {category.docs.map((d) => (
                  <li key={d.slug}>
                    <Link
                      href={`/docs/${category.slug}/${d.slug}`}
                      className={`${styles.docLink} ${
                        d.slug === doc.slug && category.slug === doc.categorySlug
                          ? styles.active
                          : ''
                      }`}
                    >
                      {d.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </aside>

        <main className={styles.content}>
          <h1>{doc.title}</h1>
          <p className={styles.summary}>{doc.summary}</p>
          <div className={styles.markdownWrapper}>
            <MarkdownContent content={doc.contentHtml} />
          </div>
        </main>
      </div>
    </Layout>
  );
} 