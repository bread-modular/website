'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Footer.module.css';
import { isOriginalPath } from '@/lib/original';

export default function Footer() {
  const pathname = usePathname() ?? '/';
  const isOriginal = isOriginalPath(pathname);

  return (
    <footer className={styles.footer}>
      <div className={styles.content}>
        <div className={styles.links}>
          <div className={styles.section}>
            <h3>Resources</h3>
            <Link href="/docs">Docs</Link>
            {isOriginal && <Link href="/original/modules">Modules</Link>}
            <Link href="/blog">Blog</Link>
            {isOriginal
              ? <Link href="/">Bread Modular Eurorack</Link>
              : <Link href="/original">Bread Modular Original</Link>}
            <Link href="https://github.com/bread-modular/bread-modular">GitHub</Link>
          </div>
          <div className={styles.section}></div>
          <div className={`${styles.section} ${styles.communitySection}`}>
            <h3>Community</h3>
            <Link href="https://discord.gg/W72YQKU7mq">Discord</Link>
            <Link href="https://instagram.com/breadmodular">Instagram</Link>
            <Link href="https://youtube.com/@breadmodular">YouTube</Link>
          </div>
        </div>
        <div className={styles.bottom}>
          <p>© {new Date().getFullYear()} Bread Modular by GDI4K Inc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
