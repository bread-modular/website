'use client';

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import styles from './Header.module.css';
import CartIcon from './CartIcon';
import { isOriginalDocsPath, isOriginalPath } from '@/lib/original';

const ORIGINAL_NAV = [
  { href: '/original/modules', label: 'MODULES' },
  { href: '/docs', label: 'DOCS' },
  { href: '/courses', label: 'COURSES' },
  { href: '/blog', label: 'BLOG' },
  { href: '/ui/16bit', label: '16BIT UI' },
  { href: '/ui/32bit', label: '32BIT UI' },
];

const CURRENT_NAV = [
  { href: '/case', label: 'CASE' },
  { href: '/docs', label: 'DOCS' },
  { href: '/firmwares', label: 'FIRMWARES' },
  { href: '/blog', label: 'BLOG' },
];

export default function Header() {
  const pathname = usePathname() ?? '/';
  const isOriginal = isOriginalPath(pathname);
  const isOriginalDocs = isOriginalDocsPath(pathname);
  const [open, setOpen] = useState(false);
  const nav = isOriginal ? ORIGINAL_NAV : CURRENT_NAV;

  return (
    <div className={styles.header}>
      <header className={styles.headerContent} role="banner">
        <Link
          href={isOriginal ? '/original' : '/'}
          className={styles.logo}
          aria-label={isOriginal ? 'Bread Modular Original Home' : 'Bread Modular Home'}
          onClick={() => setOpen(false)}
        >
          <Image
            src="/images/bread-modular-logo.png"
            alt="Bread Modular Logo"
            fill
            sizes="298px"
            style={{ objectFit: 'contain' }}
            priority
          />
          {isOriginal && <span className={styles.variantBadge}>ORIGINAL</span>}
        </Link>
        {/* Phones: cart and menu button sit next to the logo, links open below */}
        <div className={styles.mobileActions}>
          <CartIcon />
          <button
            type="button"
            className={styles.menuButton}
            aria-expanded={open}
            aria-controls="main-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen(!open)}
          >
            <span className={open ? styles.menuIconOpen : styles.menuIcon} aria-hidden="true" />
          </button>
        </div>
        <nav id="main-nav" className={`${styles.nav} ${open ? styles.navOpen : ''}`} aria-label="Main navigation">
          <ul>
            {nav.map(item => (
              <li key={item.href}>
                <Link href={item.href} onClick={() => setOpen(false)}>{item.label}</Link>
              </li>
            ))}
            <li className={styles.cartItem}><CartIcon /></li>
          </ul>
        </nav>
      </header>
      <div className={styles.variantSwitch}>
        {isOriginal ? (
          isOriginalDocs ? (
            <>You&apos;re reading docs for <strong>Bread Modular Original</strong>. <Link href="/docs">See current docs →</Link></>
          ) : (
            <>You&apos;re viewing <strong>Bread Modular Original</strong>. <Link href="/">See current version →</Link></>
          )
        ) : (
          <>Looking for the <strong>Bread Modular Original</strong>? <Link href="/original">See Original →</Link></>
        )}
      </div>
      <div className={styles.separator} role="separator"></div>
    </div>
  );
}
