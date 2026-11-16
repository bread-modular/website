'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import styles from './EuroLayout.module.css';

const NAV = [
  { href: '/case', label: 'Case' },
  { href: '/docs', label: 'Docs' },
  { href: '/firmwares', label: 'Firmwares' },
  { href: '/blog', label: 'Blog' },
];

export default function EuroHeader() {
  const pathname = usePathname() ?? '/';
  const [open, setOpen] = useState(false);

  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link href="/" className={styles.logo} aria-label="Bread Modular Home" onClick={() => setOpen(false)}>
          <Image src="/images/bread-modular-logo.png" alt="Bread Modular" width={175} height={24} priority />
        </Link>
        <button
          type="button"
          className={styles.menuButton}
          aria-expanded={open}
          aria-controls="euro-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen(!open)}
        >
          <span className={open ? styles.menuIconOpen : styles.menuIcon} aria-hidden="true" />
        </button>
        <nav id="euro-nav" className={`${styles.nav} ${open ? styles.navOpen : ''}`} aria-label="Main navigation">
          {NAV.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={pathname === item.href ? styles.navActive : undefined}
              aria-current={pathname === item.href ? 'page' : undefined}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <Link href="/original" className={styles.navOriginal} onClick={() => setOpen(false)}>
            Original
          </Link>
        </nav>
      </div>
    </header>
  );
}
