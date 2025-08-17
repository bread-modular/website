import { useEffect, useState } from 'react';

// Accept any ref-like object with a current HTMLElement (or null)
export function useContainerWidth(ref: { current: HTMLElement | null }) {
  const [width, setWidth] = useState<number | null>(null);
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const update = () => setWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return width;
}
