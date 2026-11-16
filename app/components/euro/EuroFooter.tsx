import Link from 'next/link';
import styles from './EuroLayout.module.css';

export default function EuroFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.footerBrand}>
          <strong>Bread Modular</strong>
          <span>Eurorack Made Affordable</span>
        </div>
        <nav className={styles.footerLinks} aria-label="Footer navigation">
          <div>
            <h3>Eurorack</h3>
            <Link href="/case">3D printed case</Link>
            <Link href="/firmwares">Firmwares</Link>
            <Link href="/docs">Docs</Link>
            <Link href="/blog">Blog</Link>
          </div>
          <div>
            <h3>Original</h3>
            <Link href="/original">Bread Modular Original</Link>
            <Link href="/original/modules">Original modules</Link>
            <Link href="/courses">Courses</Link>
          </div>
          <div>
            <h3>Community</h3>
            <Link href="https://discord.gg/W72YQKU7mq">Discord</Link>
            <Link href="https://instagram.com/breadmodular">Instagram</Link>
            <Link href="https://youtube.com/@breadmodular">YouTube</Link>
            <Link href="https://github.com/bread-modular/bread-modular">GitHub</Link>
          </div>
          <div>
            <h3>For AI agents</h3>
            <a href="/llms.txt">llms.txt</a>
            <a href="/api/case">Case files (JSON)</a>
          </div>
        </nav>
        <p className={styles.footerBottom}>© {new Date().getFullYear()} Bread Modular by GDI4K Inc. All rights reserved.</p>
      </div>
    </footer>
  );
}
