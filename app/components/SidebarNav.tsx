'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from '../docs/[category]/[slug]/page.module.css';

interface SidebarNavProps {
  categories: any[];
  currentDoc: any;
}

export default function SidebarNav({ categories, currentDoc }: SidebarNavProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const currentCategory = categories.find(
    (cat) => cat.slug === currentDoc.categorySlug
  );

  return (
    <aside className={styles.sidebar}>
      <div className={styles.mobileToggle}>
        <button 
          onClick={() => setIsExpanded(!isExpanded)} 
          className={styles.expandButton}
        >
          {currentCategory?.name} - {currentDoc.title}
          <span className={`${styles.arrow} ${isExpanded ? styles.up : styles.down}`}>
            ▼
          </span>
        </button>
      </div>
      
      <div className={`${styles.sidebarContent} ${isExpanded ? styles.expanded : ''}`}>
        {categories.map((category) => (
          <div key={category.slug} className={styles.category}>
            <h3 className={styles.categoryTitle}>{category.name}</h3>
            <ul className={styles.docList}>
              {category.docs.map((d) => (
                <li key={d.slug}>
                  <Link
                    href={`/docs/${category.slug}/${d.slug}`}
                    className={`${styles.docLink} ${
                      d.slug === currentDoc.slug && category.slug === currentDoc.categorySlug
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
      </div>
    </aside>
  );
} 