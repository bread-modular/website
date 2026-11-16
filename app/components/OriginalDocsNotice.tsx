import Link from 'next/link';
import styles from './OriginalDocsNotice.module.css';

// Shown on every Bread Modular Original doc so readers (and search engines)
// can always find the current docs.
export default function OriginalDocsNotice() {
  return (
    <aside className={styles.notice}>
      These docs are for <strong>Bread Modular Original</strong>.{' '}
      <Link href="/docs">See the current Bread Modular docs →</Link>
    </aside>
  );
}
