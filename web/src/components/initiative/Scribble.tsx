'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

type Kind = 'underline' | 'circle';

const PATHS: Record<Kind, { d: string; viewBox: string; box: string; stroke: string }> = {
  underline: {
    viewBox: '0 0 200 14',
    d: 'M3 9 C 38 4, 72 12, 108 7 S 168 4, 197 8',
    box: 'left-0 right-0 -bottom-[0.38em] h-[0.5em]',
    stroke: 'var(--primary)',
  },
  circle: {
    viewBox: '0 0 200 64',
    d: 'M26 13 C 74 -3, 176 1, 194 27 C 206 48, 128 63, 64 58 C 14 54, -3 35, 13 19 C 22 10, 42 6, 58 7',
    box: '-left-[0.45em] -right-[0.45em] -top-[0.42em] -bottom-[0.42em]',
    stroke: 'var(--accent)',
  },
};

/**
 * A pencil mark (underline or loose circle) that draws itself once, the first
 * time the words scroll into view. Reduced motion shows it already drawn.
 */
export default function Scribble({ children, kind = 'underline' }: { children: ReactNode; kind?: Kind }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDrawn(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setDrawn(true);
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -15% 0px', threshold: 1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const p = PATHS[kind];

  return (
    <span ref={ref} className="relative inline-block whitespace-nowrap">
      {children}
      <svg
        aria-hidden
        viewBox={p.viewBox}
        preserveAspectRatio="none"
        className={`pointer-events-none absolute overflow-visible ${p.box}`}
      >
        <path
          d={p.d}
          fill="none"
          stroke={p.stroke}
          strokeWidth={kind === 'circle' ? 2.25 : 2.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          pathLength={1}
          style={{
            strokeDasharray: 1,
            strokeDashoffset: drawn ? 0 : 1,
            transition: 'stroke-dashoffset 900ms cubic-bezier(0.2, 0.8, 0.2, 1)',
          }}
        />
      </svg>
    </span>
  );
}
