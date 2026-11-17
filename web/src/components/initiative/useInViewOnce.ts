'use client';

import { useEffect, useState, type RefObject } from 'react';

/**
 * True once the element has scrolled into the middle band of the viewport.
 * The band (not just "anywhere on screen") keeps marks from firing before the
 * reader gets to them; anything already in the band on load waits `initialDelay`
 * so it isn't hidden behind the page's own fade-in. Reduced motion: true at once.
 */
export function useInViewOnce(
  ref: RefObject<Element>,
  { initialDelay = 700, rootMargin = '-18% 0px -32% 0px' }: { initialDelay?: number; rootMargin?: string } = {},
) {
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setSeen(true);
      return;
    }
    const mountedAt = performance.now();
    let timer = 0;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        const wait = Math.max(0, initialDelay - (performance.now() - mountedAt));
        timer = window.setTimeout(() => setSeen(true), wait);
      },
      { rootMargin, threshold: 0 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearTimeout(timer);
    };
  }, [ref, initialDelay, rootMargin]);

  return seen;
}
