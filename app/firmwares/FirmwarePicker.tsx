import Link from 'next/link';
import { FIRMWARES } from '@/lib/euro/firmwares';
import styles from './page.module.css';

// The firmware selection: one card per firmware, the open one marked.
export default function FirmwarePicker({ activeId }: { activeId?: string }) {
  return (
    <nav className={styles.picker} aria-label="Firmwares">
      {FIRMWARES.map(firmware => {
        const active = firmware.id === activeId;
        return (
          <Link
            key={firmware.id}
            href={`/firmwares/${firmware.id}`}
            scroll={false}
            className={active ? styles.optionActive : styles.option}
            aria-current={active ? 'page' : undefined}
          >
            <span className={styles.optionModule}>{firmware.module}</span>
            <strong>{firmware.name}</strong>
            <small>{firmware.tagline}</small>
          </Link>
        );
      })}
    </nav>
  );
}
