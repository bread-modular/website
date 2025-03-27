import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';
import { getAllBlogPosts, extractFirstImageFromHtml } from '@/lib/blog';
import Layout from '@/app/components/Layout';
import NewsletterSignup from '@/app/components/NewsletterSignup';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Blog | Bread Modular',
  description: 'Latest news, tutorials, and updates from Bread Modular',
  metadataBase: new URL(process.env.SITE_URL || 'https://breadmodular.com'),
  openGraph: {
    title: 'Bread Modular Blog',
    description: 'Latest news, tutorials, and updates from Bread Modular',
    url: '/blog',
    siteName: 'Bread Modular',
    images: ['/images/bread-modular-system.jpg'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bread Modular Blog',
    description: 'Latest news, tutorials, and updates from Bread Modular',
    images: ['/images/bread-modular-system.jpg'],
  },
  alternates: {
    types: {
      'application/rss+xml': [
        { url: '/rss.xml', title: 'Bread Modular Blog RSS Feed' }
      ],
    },
  },
};

export default async function BlogPage() {
  const posts = await getAllBlogPosts();
  
  // Sort posts by date (newest first)
  const sortedPosts = [...posts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  // Preprocess posts to extract images
  const postsWithImages = await Promise.all(
    sortedPosts.map(async (post) => {
      // Prioritize image from frontmatter, fall back to extracting from content
      const contentImage = post.image || await extractFirstImageFromHtml(post.contentHtml);
      return {
        ...post,
        imageUrl: contentImage || null
      };
    })
  );

  // Split posts into featured and regular
  const featuredPost = postsWithImages.length > 0 ? postsWithImages[0] : null;
  const regularPosts = postsWithImages.slice(1);

  return (
    <Layout>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Bread Modular Blog</h1>
          <p className={styles.subtitle}>
            Stories and insights from the Bread Modular team
          </p>
          <Link href="/rss.xml" className={styles.rssLink}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 11a9 9 0 0 1 9 9"></path>
              <path d="M4 4a16 16 0 0 1 16 16"></path>
              <circle cx="5" cy="19" r="1"></circle>
            </svg>
            RSS Feed
          </Link>
        </header>

        {featuredPost && (
          <div className={styles.featuredSection}>
            <article className={styles.featuredPost}>
              <Link href={`/blog/${featuredPost.slug}`} className={styles.featuredLink}>
                <div className={styles.featuredImageWrapper}>
                  {featuredPost.imageUrl ? (
                    <Image 
                      src={featuredPost.imageUrl}
                      alt={featuredPost.title}
                      fill
                      className={styles.featuredImage}
                      sizes="(max-width: 1024px) 100vw, 1024px"
                      priority
                    />
                  ) : (
                    <div className={styles.placeholderImage}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21 15 16 10 5 21"></polyline>
                      </svg>
                    </div>
                  )}
                </div>
                <div className={styles.featuredContent}>
                  <div className={styles.featuredContentInner}>
                    <h2 className={styles.featuredTitle}>{featuredPost.title}</h2>
                    <p className={styles.featuredSummary}>{featuredPost.summary}</p>
                    <div className={styles.featuredMeta}>
                      <span className={styles.featuredAuthor}>{featuredPost.author}</span>
                      <time dateTime={featuredPost.date} className={styles.featuredDate}>
                        {new Date(featuredPost.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </time>
                    </div>
                  </div>
                </div>
              </Link>
            </article>
          </div>
        )}

        <div className={styles.newsletterContainer}>
          <NewsletterSignup />
        </div>

        <div className={styles.mainContent}>
          <h2 className={styles.latestTitle}>Latest Posts</h2>

          <div className={styles.postsGrid}>
            {regularPosts.length > 0 ? (
              regularPosts.map((post) => (
                <article key={post.slug} className={styles.postCard}>
                  <Link href={`/blog/${post.slug}`} className={styles.postLink}>
                    <div className={styles.postImageWrapper}>
                      {post.imageUrl ? (
                        <Image 
                          src={post.imageUrl}
                          alt={post.title}
                          fill
                          className={styles.postImage}
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      ) : (
                        <div className={styles.placeholderImage}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                            <polyline points="21 15 16 10 5 21"></polyline>
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className={styles.postContent}>
                      <h3 className={styles.postTitle}>{post.title}</h3>
                      <p className={styles.postSummary}>{post.summary}</p>
                      <div className={styles.postMeta}>
                        <span className={styles.postAuthor}>{post.author}</span>
                        <time dateTime={post.date} className={styles.postDate}>
                          {new Date(post.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </time>
                      </div>
                    </div>
                  </Link>
                </article>
              ))
            ) : featuredPost ? null : (
              <div className={styles.emptyState}>
                <p>No blog posts yet. Check back soon!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
} 