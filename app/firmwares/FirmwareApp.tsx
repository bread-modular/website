'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { Firmware } from '@/lib/euro/firmwares';
import ui from '@/app/components/euro/ui.module.css';
import styles from './page.module.css';

function Loading() {
  return <p className={styles.appLoading}>Loading the settings page…</p>;
}

// Each firmware's settings page, loaded only when that firmware is opened
const APPS: Record<string, React.ComponentType<{ className?: string }>> = {
  '32bit-master': dynamic(() => import('./apps/32bit-master'), { ssr: false, loading: Loading }),
};

// A firmware's settings page in the site. Fullscreen covers the whole site, like
// the 16bit eLab scope; the page stays mounted, so its connection stays open.
// children: the line above the app (how to connect); fullscreen shows the name there.
export default function FirmwareApp({ firmware, children }: { firmware: Firmware; children?: React.ReactNode }) {
  const [fullscreen, setFullscreen] = useState(false);
  const toggle = useCallback(() => setFullscreen(on => !on), []);
  const title = `${firmware.module} ${firmware.name}`;
  const App = APPS[firmware.id];

  // Fullscreen: lock page scroll and close with Escape
  useEffect(() => {
    if (!fullscreen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      // Escape in one of the app's value boxes cancels the edit there (the app is in a shadow root)
      const target = e.composedPath()[0] as HTMLElement | undefined;
      if (e.key !== 'Escape' || target?.closest?.('input, select, textarea')) return;
      setFullscreen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [fullscreen]);

  return (
    <section className={fullscreen ? styles.appFullscreen : styles.app} aria-label={`${title} settings page`}>
      <div className={styles.appBar}>
        {fullscreen ? (
          <div className={styles.appTitle}>
            <span className={styles.optionModule}>{firmware.module}</span>
            <strong>{firmware.name}</strong>
            <small>{firmware.tagline}</small>
          </div>
        ) : (
          <p className={styles.howTo}>{children}</p>
        )}
        <button
          type="button"
          className={fullscreen ? styles.exitButton : ui.buttonGhost}
          onClick={toggle}
          title={fullscreen ? 'Exit fullscreen (Esc)' : 'Show only the app, over the whole window'}
        >
          {fullscreen ? '✕ Exit Fullscreen' : '⛶ Fullscreen'}
        </button>
      </div>
      <div className={styles.appBox}>
        {App && <App className={styles.appHost} />}
      </div>
    </section>
  );
}
