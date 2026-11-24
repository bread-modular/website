'use client';

import { useEffect, useRef } from 'react';

// The page's script (generated app.js): it gets the scoped document, window,
// listeners and timers below, and returns what closes it (its link).
type RunApp = (
  document: Document,
  window: Window,
  addEventListener: Window['addEventListener'],
  matchMedia: Window['matchMedia'],
  setInterval: Window['setInterval'],
  setTimeout: Window['setTimeout'],
  requestAnimationFrame: Window['requestAnimationFrame'],
) => () => void;

// A function of a browser object, called on the object (proxies hand out unbound methods)
function member<T extends object>(target: T, prop: string | symbol) {
  const value = Reflect.get(target, prop, target);
  return typeof value === 'function' ? value.bind(target) : value;
}

// Runs a firmware's settings page (a single file web app from the hardware repo,
// split by scripts/sync-firmware-apps.mjs) in a shadow root: its CSS and the
// site's stay apart, its script sees the shadow root as its document and
// everything it starts stops when the component goes.
export default function AppHost({ style, markup, run, className }: { style: string; markup: string; run: RunApp; className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const root = host.shadowRoot ?? host.attachShadow({ mode: 'open' });
    const sheet = document.createElement('style');
    sheet.textContent = style;
    const body = document.createElement('div');
    body.className = 'ms-body';
    body.innerHTML = markup;
    root.replaceChildren(sheet, body);

    const aborter = new AbortController();
    const { signal } = aborter;
    const withSignal = (options?: boolean | AddEventListenerOptions) =>
      typeof options === 'boolean' ? { capture: options, signal } : { ...options, signal };

    // Its document: the elements in its .ms-body div (its <body>), which also
    // takes its document listeners, so e.target is the element hit. A run that
    // is closed but still finishing (disconnect) only touches its own div.
    const scopedDocument = new Proxy(document, {
      get(target, prop) {
        switch (prop) {
          case 'body': return body;
          case 'activeElement': return root.activeElement;
          case 'getElementById': return (id: string) => body.querySelector(`#${CSS.escape(id)}`);
          case 'querySelector': return (selectors: string) => body.querySelector(selectors);
          case 'querySelectorAll': return (selectors: string) => body.querySelectorAll(selectors);
          case 'addEventListener':
            return (type: string, listener: EventListener, options?: boolean | AddEventListenerOptions) =>
              body.addEventListener(type, listener, withSignal(options));
          default: return member(target, prop);
        }
      },
    });
    const addWindowListener = (type: string, listener: EventListener, options?: boolean | AddEventListenerOptions) =>
      window.addEventListener(type, listener, withSignal(options));
    const scopedWindow = new Proxy(window, {
      get: (target, prop) => (prop === 'addEventListener' ? addWindowListener : member(target, prop)),
    });
    const matchMedia = (query: string) => {
      const list = window.matchMedia(query);
      return new Proxy(list, {
        get: (target, prop) => (prop === 'addEventListener'
          ? (type: string, listener: EventListener, options?: boolean | AddEventListenerOptions) =>
            target.addEventListener(type, listener, withSignal(options))
          : member(target, prop)),
      });
    };

    const intervals = new Set<number>();
    const timeouts = new Set<number>();
    const frames = new Set<number>();
    const setInterval = (handler: TimerHandler, ms?: number, ...args: unknown[]) => {
      const id = window.setInterval(handler, ms, ...args);
      intervals.add(id);
      return id;
    };
    const setTimeout = (handler: TimerHandler, ms?: number, ...args: unknown[]) => {
      const id = window.setTimeout(() => {
        timeouts.delete(id);
        if (typeof handler === 'function') handler(...args);
      }, ms);
      timeouts.add(id);
      return id;
    };
    const requestAnimationFrame = (callback: FrameRequestCallback) => {
      const id = window.requestAnimationFrame(time => {
        frames.delete(id);
        callback(time);
      });
      frames.add(id);
      return id;
    };

    let close: (() => void) | undefined;
    try {
      close = run(
        scopedDocument, scopedWindow, addWindowListener as Window['addEventListener'],
        matchMedia as Window['matchMedia'], setInterval as Window['setInterval'],
        setTimeout as Window['setTimeout'], requestAnimationFrame,
      );
    } catch (error) {
      console.error('The firmware settings page did not start:', error);
    }

    return () => {
      close?.();
      aborter.abort();
      intervals.forEach(id => window.clearInterval(id));
      timeouts.forEach(id => window.clearTimeout(id));
      frames.forEach(id => window.cancelAnimationFrame(id));
      root.replaceChildren();
    };
  }, [style, markup, run]);

  return <div ref={hostRef} className={className} />;
}
