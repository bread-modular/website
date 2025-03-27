import Link from 'next/link';
import { BlogPost } from '@/lib/blog';
import styles from './BlogPostNavigation.module.css';

interface Props {
  posts: BlogPost[];
  currentPost: BlogPost;
}

export default function BlogPostNavigation({ posts, currentPost }: Props) {
  // Sort posts by date (newest first)
  const sortedPosts = [...posts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Find the index of the current post
  const currentIndex = sortedPosts.findIndex(post => post.slug === currentPost.slug);

  // Get previous and next posts
  const prevPost = currentIndex < sortedPosts.length - 1 ? sortedPosts[currentIndex + 1] : null;
  const nextPost = currentIndex > 0 ? sortedPosts[currentIndex - 1] : null;

  // Get related posts that aren't the current, previous, or next posts
  const relatedPosts = sortedPosts
    .filter(post => 
      post.slug !== currentPost.slug && 
      (!prevPost || post.slug !== prevPost.slug) && 
      (!nextPost || post.slug !== nextPost.slug)
    )
    .slice(0, 3); // Limit to 3 other posts

  return (
    <div className={styles.navigation}>
      <div className={styles.simpleNavLinks}>
        {prevPost ? (
          <Link href={`/blog/${prevPost.slug}`} className={styles.simpleNavLink}>
            Prev
          </Link>
        ) : (
          <span className={styles.disabledLink}>Prev</span>
        )}

        <Link href="/blog" className={styles.simpleNavLink}>
          Home
        </Link>

        {nextPost ? (
          <Link href={`/blog/${nextPost.slug}`} className={styles.simpleNavLink}>
            Next
          </Link>
        ) : (
          <span className={styles.disabledLink}>Next</span>
        )}
      </div>

      {relatedPosts.length > 0 && (
        <div className={styles.moreSection}>
          <h2 className={styles.moreTitle}>More Posts</h2>
          <div className={styles.postsGrid}>
            {relatedPosts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className={styles.postCard}
              >
                <h3 className={styles.postTitle}>{post.title}</h3>
                <p className={styles.postDate}>
                  {new Date(post.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
                <p className={styles.postSummary}>{post.summary}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 