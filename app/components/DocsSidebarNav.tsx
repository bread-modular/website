'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import type { DocCategory, Doc } from '@/lib/docs';
import styles from './DocsSidebarNav.module.css';

interface Props {
  categories: DocCategory[];
  currentDoc: Doc | null;
}

export default function DocsSidebarNav({ categories, currentDoc }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(
    currentDoc ? currentDoc.categorySlug : null
  );
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLAnchorElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Toggle category highlight
  const toggleCategory = (slug: string) => {
    setActiveCategory(activeCategory === slug ? null : slug);
  };

  // Reset active category when current doc changes
  useEffect(() => {
    if (currentDoc) {
      setActiveCategory(currentDoc.categorySlug);
    }
  }, [currentDoc]);

  // Scroll to active item when component mounts or when currentDoc changes
  useEffect(() => {
    if (activeItemRef.current && sidebarRef.current) {
      // Wait a bit for the DOM to fully render
      setTimeout(() => {
        if (activeItemRef.current && sidebarRef.current) {
          const sidebarRect = sidebarRef.current.getBoundingClientRect();
          const activeItemRect = activeItemRef.current.getBoundingClientRect();
          
          // Calculate the scroll position to center the active item in the sidebar
          const scrollPosition = 
            activeItemRect.top + 
            sidebarRef.current.scrollTop - 
            sidebarRect.top - 
            (sidebarRect.height / 2) + 
            (activeItemRect.height / 2);
          
          sidebarRef.current.scrollTo({
            top: scrollPosition,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  }, [currentDoc]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Render categories and docs
  const renderCategories = () => (
    categories.map((category) => (
      <div key={category.slug} className={styles.category}>
        <h3 
          className={`${styles.categoryTitle} ${activeCategory === category.slug ? styles.activeCategoryTitle : ''}`}
          onClick={() => toggleCategory(category.slug)}
        >
          <span>{category.name}</span>
          <span className={styles.categoryCount}>{category.docs.length}</span>
        </h3>
        <ul className={styles.docList}>
          {category.docs.map((doc) => {
            const isActive = currentDoc && 
              doc.slug === currentDoc.slug && 
              category.slug === currentDoc.categorySlug;
            
            return (
              <li key={doc.slug}>
                <Link
                  href={`/docs/${category.slug}/${doc.slug}`}
                  className={`${styles.docLink} ${isActive ? styles.active : ''}`}
                  ref={isActive ? activeItemRef : null}
                  onClick={() => setIsExpanded(false)}
                >
                  {doc.title}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    ))
  );

  return (
    <aside className={styles.sidebar} ref={sidebarRef}>
      {/* Mobile dropdown toggle */}
      <div className={styles.mobileToggle} ref={dropdownRef}>
        <button 
          className={styles.expandButton}
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          aria-controls="sidebar-content"
        >
          {currentDoc ? (
            <>
              <span>{currentDoc.categoryName}</span>
              <span className={`${styles.arrow} ${isExpanded ? styles.up : ''}`}>▼</span>
            </>
          ) : (
            <>
              <span>Documentation</span>
              <span className={`${styles.arrow} ${isExpanded ? styles.up : ''}`}>▼</span>
            </>
          )}
        </button>
        
        <div 
          id="sidebar-content"
          className={`${styles.sidebarContent} ${isExpanded ? styles.expanded : ''}`}
        >
          {renderCategories()}
        </div>
      </div>

      {/* Desktop navigation content */}
      <div className={styles.desktopContent}>
        {renderCategories()}
      </div>
    </aside>
  );
} 