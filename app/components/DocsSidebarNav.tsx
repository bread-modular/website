'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { DocCategory, Doc } from '@/lib/docs';
import styles from './DocsSidebarNav.module.css';

interface Props {
  categories: DocCategory[];
  currentDoc: Doc | null;
}

export default function DocsSidebarNav({ categories, currentDoc }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <aside className={styles.sidebar}>
      {currentDoc ? (
        <div className={styles.mobileToggle}>
          <button 
            className={styles.expandButton}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {currentDoc.categoryName} - {currentDoc.title}
            <span className={`${styles.arrow} ${isExpanded ? styles.up : ''}`}>▼</span>
          </button>
        </div>
      ) : (
        <div className={styles.mobileToggle}>
          <button 
            className={styles.expandButton}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            Documentation
            <span className={`${styles.arrow} ${isExpanded ? styles.up : ''}`}>▼</span>
          </button>
        </div>
      )}
      <div className={`${styles.sidebarContent} ${isExpanded ? styles.expanded : ''}`}>
        {categories.map((category) => (
          <div key={category.slug} className={styles.category}>
            <h3 className={styles.categoryTitle}>{category.name}</h3>
            <ul className={styles.docList}>
              {category.docs.map((doc) => (
                <li key={doc.slug}>
                  <Link
                    href={`/docs/${category.slug}/${doc.slug}`}
                    className={`${styles.docLink} ${
                      currentDoc && doc.slug === currentDoc.slug && category.slug === currentDoc.categorySlug
                        ? styles.active
                        : ''
                    }`}
                  >
                    {doc.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </aside>
  );
} 