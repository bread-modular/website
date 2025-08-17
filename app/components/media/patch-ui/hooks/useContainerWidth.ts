import { useEffect, useState, RefObject } from 'react';

export function useContainerWidth(ref: RefObject<HTMLElement>) {
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
