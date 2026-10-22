import { notFound } from 'next/navigation';
import MarkdownContent from '@/app/components/media/MarkdownContent';
import { getDoc, getDocCategories, extractFirstImageFromHtml } from '@/lib/docs';
import { getAllModulesMetadata } from '@/lib/modules';
import styles from './page.module.css';
import DocsMobileNav from '@/app/components/DocsMobileNav';
import { Metadata } from 'next';

interface Props {
  params: Promise<{
    category: string;
    slug: string;
  }>;
}

// Prerender every doc so pages load (and prefetch) instantly
export async function generateStaticParams() {
  const categories = await getDocCategories();
  return categories.flatMap(category =>
    category.docs.map(doc => ({ category: category.slug, slug: doc.slug }))
  );
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
  const [doc, categories, moduleMetadataList] = await Promise.all([
    getDoc(category, slug),
    getDocCategories(),
    getAllModulesMetadata()
  ]);

  if (!doc) {
    notFound();
  }

  return (
    <article>
      <h1 className={styles.title}>{doc.title}</h1>
      <div className={styles.markdownWrapper}>
        <MarkdownContent content={doc.contentHtml} moduleMetadataList={moduleMetadataList} />
      </div>
      <DocsMobileNav categories={categories} currentDoc={doc} />
    </article>
  );
}
