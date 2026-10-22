'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import styles from './SidebarNav.module.css';

export interface SidebarNavItem {
  href: string;
  title: string;
}

export interface SidebarNavSection {
  title?: string;
  items: SidebarNavItem[];
}

interface Props {
  eyebrow: string;
  title: string;
  titleHref: string;
  sections: SidebarNavSection[];
  // "steps": numbered markers with a progress bar (courses)
  // "list": dot markers (docs)
  variant?: 'steps' | 'list';
  // Extra content shown under the header, e.g. a call-to-action link
  action?: React.ReactNode;
}

// Shared sidebar for docs and courses. It is rendered from a layout so it stays
// mounted between pages; the current item is derived from the URL.
export default function SidebarNav({
  eyebrow,
  title,
  titleHref,
  sections,
  variant = 'list',
  action
}: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const allItems = sections.flatMap(section => section.items);
  const currentIndex = allItems.findIndex(item => item.href === pathname);
  const currentItem = allItems[currentIndex];
  const currentSection = sections.find(section => section.items.includes(currentItem));
  const isSteps = variant === 'steps';

  const [isExpanded, setIsExpanded] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLAnchorElement>(null);
  const hasMountedRef = useRef(false);

  // Close the mobile dropdown after navigating
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setIsExpanded(false);
  }

  // Links only prefetch once they are visible, which never happens for the
  // collapsed mobile list. Prefetch every page up front so navigating is
  // instant no matter how the visitor arrived.
  const hrefsKey = allItems.map(item => item.href).join('|');
  useEffect(() => {
    hrefsKey.split('|').forEach(href => router.prefetch(href));
  }, [hrefsKey, router]);

  // Keep the active item visible. On first load, center it instantly; after
  // that only scroll (smoothly) if the user navigated to an item out of view.
  useEffect(() => {
    const sidebar = navRef.current;
    const activeItem = activeItemRef.current;
    if (!sidebar || !activeItem || sidebar.scrollHeight <= sidebar.clientHeight) return;

    const sidebarRect = sidebar.getBoundingClientRect();
    const activeItemRect = activeItem.getBoundingClientRect();

    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      sidebar.scrollTop +=
        activeItemRect.top - sidebarRect.top - sidebarRect.height / 2 + activeItemRect.height / 2;
      return;
    }

    const isVisible =
      activeItemRect.top >= sidebarRect.top && activeItemRect.bottom <= sidebarRect.bottom;
    if (!isVisible) {
      activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [pathname]);

  // Close the mobile dropdown when clicking outside
  useEffect(() => {
    if (!isExpanded) return;
    function handleClickOutside(event: MouseEvent) {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded]);

  const progress = ((currentIndex + 1) / allItems.length) * 100;
  const toggleLabel = currentItem
    ? currentSection?.title
      ? `${currentSection.title} / ${currentItem.title}`
      : currentItem.title
    : 'Browse';

  return (
    <aside className={`${styles.sidebar} ${isSteps ? styles.stepsVariant : ''}`} ref={sidebarRef}>
      <div className={styles.header}>
        <span className={styles.eyebrow}>{eyebrow}</span>
        <Link href={titleHref} className={styles.title}>
          {title}
        </Link>
      </div>

      {isSteps && currentIndex !== -1 && (
        <div className={styles.progress}>
          <div className={styles.progressTrack}>
            <div className={styles.progressBar} style={{ width: `${progress}%` }} />
          </div>
          <span className={styles.progressText}>
            {currentIndex + 1} / {allItems.length}
          </span>
        </div>
      )}

      {action && <div className={styles.action}>{action}</div>}

      <button
        className={styles.mobileToggle}
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls="sidebar-nav-items"
      >
        <span className={styles.mobileToggleTitle}>{toggleLabel}</span>
        <span className={`${styles.chevron} ${isExpanded ? styles.chevronUp : ''}`}>▼</span>
      </button>

      <div
        id="sidebar-nav-items"
        ref={navRef}
        className={`${styles.nav} ${isExpanded ? styles.expanded : ''}`}
      >
        {sections.map((section, sectionIndex) => {
          const offset = sections
            .slice(0, sectionIndex)
            .reduce((count, s) => count + s.items.length, 0);

          return (
            <div key={section.title ?? sectionIndex} className={styles.section}>
              {section.title && (
                <h3
                  className={`${styles.sectionTitle} ${section === currentSection ? styles.currentSectionTitle : ''}`}
                >
                  {section.title}
                </h3>
              )}
              <ol className={styles.items}>
                {section.items.map((item, i) => {
                  const index = offset + i;
                  const isCurrent = index === currentIndex;
                  const isDone = isSteps && currentIndex !== -1 && index < currentIndex;
                  const state = isDone ? styles.done : isCurrent ? styles.current : '';

                  return (
                    <li key={item.href} className={`${styles.item} ${state}`}>
                      <Link
                        href={item.href}
                        className={styles.itemLink}
                        aria-current={isCurrent ? 'page' : undefined}
                        ref={isCurrent ? activeItemRef : null}
                      >
                        <span className={styles.marker}>
                          {isSteps ? (isDone ? '✓' : index + 1) : null}
                        </span>
                        <span className={styles.itemTitle}>{item.title}</span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
