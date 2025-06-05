import Link from "next/link";
import Image from "next/image";
import styles from './Header.module.css';
import CartIcon from './CartIcon';

export default function Header() {
  return (
    <div className={styles.header}>
      <header className={styles.headerContent} role="banner">
        <Link href="/" className={styles.logo} aria-label="Bread Modular Home">
          <Image 
            src="/images/bread-modular-logo.png"
            alt="Bread Modular Logo"
            fill
            style={{ objectFit: 'contain' }}
            priority
          />
        </Link>
        <nav className={styles.nav} aria-label="Main navigation">
          <ul>
            <li><Link href="/modules">MODULES</Link></li>
            <li><Link href="/docs">DOCS</Link></li>
            <li><Link href="/blog">BLOG</Link></li>
            <li className={styles.hiddenOnMobile}><Link href="/ui/16bit">16BIT UI</Link></li>
            <li><CartIcon /></li>
          </ul>
        </nav>
      </header>
      <div className={styles.separator} role="separator"></div>
    </div>
  );
} 