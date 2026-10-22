import styles from './PageTransition.module.css';

// Used from template.tsx files: templates remount on navigation, so the
// page content fades in while the surrounding layout (sidebar) stays put.
export default function PageTransition({ children }: { children: React.ReactNode }) {
  return <div className={styles.page}>{children}</div>;
}
