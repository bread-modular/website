import { notFound } from 'next/navigation';
import Layout from '@/app/components/Layout';
import MarkdownContent from '@/app/components/media/MarkdownContent';
import { getDoc, getDocCategories, extractFirstImageFromHtml } from '@/lib/docs';
import { getModulesMetadata } from '@/lib/modules';
import styles from './page.module.css';
import DocsSidebarNav from '@/app/components/DocsSidebarNav';
import DocsMobileNav from '@/app/components/DocsMobileNav';
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

  // Extract the first image from the content or use a default image
  const contentImage = await extractFirstImageFromHtml(doc.contentHtml);
  const imageUrl = contentImage || '/images/home-slide/01.jpg';

  return {
    title: `${doc.title} | Bread Modular`,
    description: doc.summary,
    openGraph: {
      title: doc.title,
      description: doc.summary,
      type: 'article',
      url: `/docs/${category}/${slug}`,
      images: [imageUrl],
    },
    twitter: {
      card: 'summary_large_image',
      title: doc.title,
      description: doc.summary,
      images: [imageUrl],
    },
  };
}

export default async function DocPage({ params }: Props) {
  const {slug, category} = (await params);
  const [doc, categories, moduleMetadata] = await Promise.all([
    getDoc(category, slug),
    getDocCategories(),
    getModulesMetadata()
  ]);

  if (!doc) {
    notFound();
  }

  return (
    <Layout>
      <div className={styles.container}>
        <DocsSidebarNav categories={categories} currentDoc={doc} />
        <main className={styles.content}>
          <h1>{doc.title}</h1>
          <div className={styles.markdownWrapper}>
            <MarkdownContent content={doc.contentHtml} moduleMetadata={moduleMetadata} />
          </div>
          <DocsMobileNav categories={categories} currentDoc={doc} />
        </main>
      </div>
    </Layout>
  );
} 