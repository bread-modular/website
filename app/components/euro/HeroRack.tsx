'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getCaseLayout, getCaseSummary, DEFAULT_CASE_CONFIG, type LayoutId } from '@/lib/euro/case';
import LayoutIcon from './LayoutIcon';
import type { HeroScene } from './HeroScene';
import styles from './HeroRack.module.css';

// The layouts the animation grows through, in this order
const LAYOUTS: LayoutId[] = ['single', 'double', 'double-tier', 'studio'];
const POSTER = LAYOUTS.indexOf('studio');   // the picture that stands in until the 3D case is loaded

// The case configurator playing by itself. Loads three.js and the case files
// only in the browser, after the page is up.
export default function HeroRack() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HeroScene | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [stage, setStage] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    let cancelled = false;
    import('./HeroScene')
      .then(({ createHeroScene }) => {
        if (cancelled || !containerRef.current) return null;
        return createHeroScene(containerRef.current, { layouts: LAYOUTS, onStage: setStage, isCancelled: () => cancelled });
      })
      .then(created => {
        if (!created) return;
        sceneRef.current = created;
        setPaused(created.paused);
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('failed');
      });
    return () => {
      cancelled = true;
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, []);

  function togglePaused() {
    sceneRef.current?.setPaused(!paused);
    setPaused(!paused);
  }

  const ready = status === 'ready';
  const shown = ready ? stage : POSTER;
  const layout = getCaseLayout(LAYOUTS[shown]);
  const summary = getCaseSummary({ ...DEFAULT_CASE_CONFIG, layout: layout.id });

  return (
    <div className={styles.demo}>
      <div
        ref={containerRef}
        className={`${styles.rack} ${ready ? styles.ready : ''}`}
        role="img"
        aria-label="The Bread Modular case in 3D: one 42 HP case gets its modules and patch cables, then grows into a double case, two double cases on a stand and a six case studio set"
      >
        <Image
          src="/images/euro/case-studio.webp"
          alt="The Bread Modular Studio case: six 3D printed 42 HP Eurorack cases on a stand, filled with modules and patched"
          fill
          sizes="(max-width: 1240px) 100vw, 1200px"
          preload
          className={styles.poster}
        />
      </div>

      <div className={styles.readout} aria-live="off">
        <small>Case configurator</small>{' '}
        <strong>{layout.name} · {layout.hp} HP</strong>{' '}
        <span>{layout.cases} {layout.cases === 1 ? 'case' : 'cases'} · {summary.prints} parts to print</span>
      </div>
      {ready && <p className={styles.hint}>Drag to rotate</p>}
      {status === 'loading' && (
        <p className={styles.loading} role="status">
          <span className={styles.spinner} aria-hidden="true" />
          Loading 3D
        </p>
      )}
      {status === 'failed' && <p className={styles.hint}>The 3D case needs WebGL</p>}

      <div className={styles.bar}>
        <button
          type="button"
          className={styles.pause}
          onClick={togglePaused}
          disabled={!ready}
          aria-label={paused ? 'Play the animation' : 'Pause the animation'}
          title={paused ? 'Play' : 'Pause'}
        >
          <svg viewBox="0 0 16 16" aria-hidden="true">
            {paused ? <path d="M4.5 2.5v11l9-5.5z" /> : <path d="M3.5 2.5h3v11h-3zM9.5 2.5h3v11h-3z" />}
          </svg>
        </button>
        <div className={styles.layouts} role="group" aria-label="Case layout">
          {LAYOUTS.map((id, i) => {
            const option = getCaseLayout(id);
            return (
              <button
                key={id}
                type="button"
                className={i === shown ? styles.layoutActive : styles.layout}
                aria-pressed={i === shown}
                disabled={!ready}
                onClick={() => sceneRef.current?.goTo(i)}
              >
                <LayoutIcon id={id} className={styles.icon} />
                <strong>{option.name}</strong>{' '}
                <small>{option.hp} HP</small>
              </button>
            );
          })}
        </div>
        <Link href={layout.id === DEFAULT_CASE_CONFIG.layout ? '/case' : `/case?layout=${layout.id}`} className={styles.open}>
          Make this case <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}
