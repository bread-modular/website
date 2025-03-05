import Link from 'next/link';
import { DocCategory, Doc } from '@/lib/docs';
import styles from './DocsMobileNav.module.css';

interface Props {
  categories: DocCategory[];
  currentDoc: Doc;
}

export default function DocsMobileNav({ categories, currentDoc }: Props) {
  // Find the current category
  const currentCategory = categories.find(
    (category) => category.slug === currentDoc.categorySlug
  );

  if (!currentCategory) return null;

  // Find the index of the current doc in the category
  const currentIndex = currentCategory.docs.findIndex(
    (doc) => doc.slug === currentDoc.slug
  );

  // Get previous and next docs
  const prevDoc = currentIndex > 0 ? currentCategory.docs[currentIndex - 1] : null;
  const nextDoc = currentIndex < currentCategory.docs.length - 1 
    ? currentCategory.docs[currentIndex + 1] 
    : null;

  // Find the next category if we're at the last doc of the current category
  const currentCategoryIndex = categories.findIndex(
    (category) => category.slug === currentDoc.categorySlug
  );
  
  const nextCategory = !nextDoc && currentCategoryIndex < categories.length - 1 
    ? categories[currentCategoryIndex + 1] 
    : null;
  
  const firstDocOfNextCategory = nextCategory && nextCategory.docs.length > 0 
    ? nextCategory.docs[0] 
    : null;

  // Find the previous category if we're at the first doc of the current category
  const prevCategory = !prevDoc && currentCategoryIndex > 0 
    ? categories[currentCategoryIndex - 1] 
    : null;
  
  const lastDocOfPrevCategory = prevCategory && prevCategory.docs.length > 0 
    ? prevCategory.docs[prevCategory.docs.length - 1] 
    : null;

  return (
    <div className={styles.mobileNav}>
      <div className={styles.navLinks}>
        {(prevDoc || lastDocOfPrevCategory) && (
          <Link 
            href={prevDoc 
              ? `/docs/${currentCategory.slug}/${prevDoc.slug}`
              : `/docs/${prevCategory!.slug}/${lastDocOfPrevCategory!.slug}`
            }
            className={styles.navLink}
          >
            <span className={styles.navDirection}>← Previous</span>
            <span className={styles.navTitle}>
              {prevDoc ? prevDoc.title : lastDocOfPrevCategory!.title}
            </span>
          </Link>
        )}

        {(nextDoc || firstDocOfNextCategory) && (
          <Link 
            href={nextDoc 
              ? `/docs/${currentCategory.slug}/${nextDoc.slug}`
              : `/docs/${nextCategory!.slug}/${firstDocOfNextCategory!.slug}`
            }
            className={`${styles.navLink} ${styles.navLinkNext}`}
          >
            <span className={styles.navDirection}>Next →</span>
            <span className={styles.navTitle}>
              {nextDoc ? nextDoc.title : firstDocOfNextCategory!.title}
            </span>
          </Link>
        )}
      </div>

      <div className={styles.moreSection}>
        <h2 className={styles.moreTitle}>More from {currentCategory.name}</h2>
        <div className={styles.docsGrid}>
          {currentCategory.docs
            .filter(doc => doc.slug !== currentDoc.slug) // Exclude current doc
            .map((doc) => (
              <Link
                key={doc.slug}
                href={`/docs/${currentCategory.slug}/${doc.slug}`}
                className={styles.docCard}
              >
                <h3 className={styles.docTitle}>{doc.title}</h3>
                <p className={styles.docSummary}>{doc.summary}</p>
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
} 