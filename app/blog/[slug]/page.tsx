import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Layout from '@/app/components/Layout';
import MarkdownContent from '@/app/components/media/MarkdownContent';
import { getBlogPost, getAllBlogPosts, extractFirstImageFromHtml } from '@/lib/blog';
import BlogPostNavigation from '@/app/components/BlogPostNavigation';
import styles from './page.module.css';

interface Props {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getBlogPost(params.slug);
  
  if (!post) {
    return {
      title: 'Not Found',
      description: 'The blog post you are looking for does not exist.'
    };
  }

  // Extract the first image from the content or use a default image
  const contentImage = await extractFirstImageFromHtml(post.contentHtml);
  const imageUrl = contentImage || '/images/bread-modular-system.jpg';

  return {
    title: `${post.title} | Bread Modular Blog`,
    description: post.summary,
    metadataBase: new URL(process.env.SITE_URL || 'https://breadmodular.com'),
    openGraph: {
      title: post.title,
      description: post.summary,
      type: 'article',
      url: `/blog/${post.slug}`,
      images: [imageUrl],
      publishedTime: post.date,
      authors: [post.author]
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.summary,
      images: [imageUrl],
    },
  };
}

export async function generateStaticParams() {
  const posts = await getAllBlogPosts();
  
  return posts.map(post => ({
    slug: post.slug,
  }));
}

export default async function BlogPostPage({ params }: Props) {
  const [post, allPosts] = await Promise.all([
    getBlogPost(params.slug),
    getAllBlogPosts()
  ]);

  if (!post) {
    notFound();
  }

  return (
    <Layout>
      <article className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>{post.title}</h1>
          <div className={styles.meta}>
            <span className={styles.author}>{post.author}</span>
            <time dateTime={post.date} className={styles.date}>
              {new Date(post.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </time>
          </div>
        </header>
        
        <div className={styles.content}>
          <MarkdownContent content={post.contentHtml} />
        </div>

        <BlogPostNavigation posts={allPosts} currentPost={post} />
      </article>
    </Layout>
  );
} 