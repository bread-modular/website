'use client';

import { useEffect, useRef, useState } from 'react';
import type { CaseConfig } from '@/lib/euro/case';
import type { CaseScene, CaseView } from './scene';
import styles from './page.module.css';

interface Props {
  config: CaseConfig;
  view: CaseView;
  children?: React.ReactNode;   // drawn over the preview
}

// Loads three.js only in the browser, and only on this page.
export default function CaseViewer({ config, view, children }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<CaseScene | null>(null);
  const latest = useRef({ config, view });
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [busy, setBusy] = useState(false);   // print files of a new case are loading

  useEffect(() => {
    latest.current = { config, view };
    sceneRef.current?.update(config, view);
  }, [config, view]);

  useEffect(() => {
    let cancelled = false;
    import('./scene')
      .then(({ createCaseScene }) => {
        if (cancelled || !containerRef.current) return;
        const scene = createCaseScene(containerRef.current, setBusy);
        scene.update(latest.current.config, latest.current.view);
        sceneRef.current = scene;
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

  return (
    <div ref={containerRef} className={styles.viewer} role="img" aria-label="3D preview of the configured case">
      {(status === 'loading' || busy) && (
        <div className={styles.viewerLoading} role="status">
          <span className={styles.viewerSpinner} aria-hidden="true" />
          <p>{status === 'loading' ? 'Loading 3D preview…' : 'Loading parts…'}</p>
        </div>
      )}
      {status === 'failed' && <p className={styles.viewerNote}>The 3D preview needs WebGL. The print list below still works.</p>}
      {status === 'ready' && !children && <p className={styles.viewerHint}>Drag to rotate · Scroll or pinch to zoom</p>}
      {children}
    </div>
  );
}
