import Link from 'next/link';
import { getAllModules } from '@/lib/modules';
import styles from './DocsModuleNav.module.css';
import ScrollManager from './ModuleNavScrollManager';

export default async function ModuleNav({ currentModuleId }: { currentModuleId: string }) {
  const modules = await getAllModules();

  return (
    <nav className={styles.nav}>
      <div className={styles.container}>
        <div className={styles.scroll}>
          {modules.map((module) => (
            <Link
              key={module.id}
              href={`/modules/${module.id}`}
              className={`${styles.link} ${module.id === currentModuleId ? styles.active : ''}`}
              data-active={module.id === currentModuleId}
            >
              {module.title}
            </Link>
          ))}
        </div>
      </div>
      <ScrollManager />
    </nav>
  );
} 