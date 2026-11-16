'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { NAVIGATION_START } from '@/lib/navigation-events';
import styles from './NavigationLoader.module.css';

const DELAY = 200;        // ms: a page that shows up before this needs no loading screen
const GIVE_UP = 20000;    // ms: never leave the screen up if a navigation is dropped

function Loader() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const here = `${pathname}?${search}`;
  const hereRef = useRef(here);
  const [from, setFrom] = useState<string | null>(null);   // the page a slow navigation started on

  useEffect(() => {
    hereRef.current = here;
  }, [here]);

  useEffect(() => {
    let timers: number[] = [];
    function onStart(event: Event) {
      timers.forEach(clearTimeout);
      timers = [];
      // This runs inside the router's transition: the reset lands with the
      // new page, so going back to the page of an earlier wait shows nothing
      setFrom(null);
      // A link to this page or to a part of it (#step-3) loads nothing
      const target = new URL((event as CustomEvent<string>).detail, window.location.href);
      if (target.pathname === window.location.pathname && target.search === window.location.search) return;
      // A state change here would also wait for the new page: show it from a timer
      const start = hereRef.current;
      timers.push(
        window.setTimeout(() => setFrom(start), DELAY),
        window.setTimeout(() => setFrom(null), GIVE_UP),
      );
    }
    window.addEventListener(NAVIGATION_START, onStart);
    return () => {
      window.removeEventListener(NAVIGATION_START, onStart);
      timers.forEach(clearTimeout);
    };
  }, []);

  // Gone as soon as the new page is in
  if (from !== here) return null;
  return (
    <div className={styles.loader} role="status" aria-live="polite">
      <div className={styles.bar} />
      <div className={styles.veil}>
        <span className={styles.spinner} aria-hidden="true" />
        <span className={styles.label}>Loading…</span>
      </div>
    </div>
  );
}

// Shows a loading screen when a page takes a moment to come in after a click
export default function NavigationLoader() {
  return (
    <Suspense fallback={null}>
      <Loader />
    </Suspense>
  );
}
