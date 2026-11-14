'use client';

import { useRef, type CSSProperties, type ReactNode } from 'react';
import { useInViewOnce } from './useInViewOnce';
import { hand } from './hand';

/** Height of one ruled line; body text uses the same leading so it sits on the lines. */
export const RULE = 32;

const ruledStyle: CSSProperties = {
  backgroundImage: `repeating-linear-gradient(to bottom, transparent 0 ${RULE - 1}px, rgb(var(--primary-rgb) / 0.16) ${RULE - 1}px ${RULE}px)`,
};

/** A block of ruled paper. Lines restart at the top of each block so text stays on them. */
export function Ruled({ children, className = '', id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} style={ruledStyle} className={`flow-root ${className}`}>
      {children}
    </section>
  );
}

/** Sun highlighter that swipes across the phrase when it scrolls into view. */
export function Highlight({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const on = useInViewOnce(ref, { initialDelay: 900 });
  return (
    <mark
      ref={ref}
      className="bg-transparent text-inherit px-[0.15em] -mx-[0.05em] rounded-[3px] [box-decoration-break:clone] [-webkit-box-decoration-break:clone] bg-no-repeat transition-[background-size] duration-[900ms] ease-out"
      style={{
        backgroundImage: 'linear-gradient(rgb(var(--sun-rgb) / 0.55), rgb(var(--sun-rgb) / 0.55))',
        backgroundSize: on ? '100% 100%' : '0% 100%',
      }}
    >
      {children}
    </mark>
  );
}

/** A handwritten aside in the notebook's pencil colour. */
export function Note({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`${hand} text-[1.8rem] leading-[32px] text-primary ${className}`}>{children}</p>;
}

type PolaroidProps = {
  src: string;
  alt: string;
  caption: string;
  credit: { name: string; href: string };
  tilt?: number;
  className?: string;
};

/** Photo print taped onto the page at an angle, with a handwritten caption. */
export function Polaroid({ src, alt, caption, credit, tilt = -2, className = '' }: PolaroidProps) {
  return (
    <figure
      className={`group/polaroid relative w-full max-w-[320px] rounded-[6px] border-2 border-edge bg-card p-3 pb-2 shadow-pop transition-[transform,box-shadow] duration-300 ease-pop [transform:rotate(var(--tilt))] hover:[transform:rotate(0deg)_translateY(-4px)] hover:shadow-pop-lg ${className}`}
      style={{ '--tilt': `${tilt}deg` } as CSSProperties}
    >
      <span
        aria-hidden
        className="absolute left-1/2 -top-3 h-6 w-24 -translate-x-1/2 rotate-[-3deg] bg-sun/60 border border-edge/20"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        width={600}
        height={750}
        loading="lazy"
        decoding="async"
        className="block w-full h-auto aspect-[4/5] object-cover rounded-[3px] border-2 border-edge bg-muted-extra-light"
      />
      <figcaption className="pt-2">
        <span className={`${hand} block text-[1.6rem] leading-8 text-foreground`}>{caption}</span>
        <span className="block mt-1 text-xs text-muted-light">
          Photo:{' '}
          <a href={credit.href} target="_blank" rel="noopener noreferrer" className="underline decoration-1 underline-offset-2 hover:decoration-primary">
            {credit.name}
          </a>{' '}
          on Unsplash
        </span>
      </figcaption>
    </figure>
  );
}

const STICKY_TONES = {
  sun: 'bg-sun',
  green: 'bg-secondary',
  lavender: 'bg-primary-light',
} as const;

/**
 * Sticky note pinned to the page. Flutters on when it scrolls into view; on hover
 * it lifts and straightens and the pin wiggles. Always ink text: these fills are
 * light in both themes.
 */
export function StickyNote({
  children,
  tone = 'sun',
  tilt = 2,
  className = '',
}: {
  children: ReactNode;
  tone?: keyof typeof STICKY_TONES;
  tilt?: number;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const on = useInViewOnce(ref, { initialDelay: 400, rootMargin: '0px 0px -15% 0px' });
  return (
    <aside
      ref={ref}
      className={`sticky-note group/note relative ${STICKY_TONES[tone]} text-ink border-2 border-edge rounded-[4px] shadow-pop-sm px-6 pt-7 pb-6 ${on ? 'is-on' : ''} ${className}`}
      style={{ '--tilt': `${tilt}deg` } as CSSProperties}
    >
      <span
        aria-hidden
        className="sticky-pin absolute left-1/2 top-2 -ml-2 w-4 h-4 rounded-full bg-accent border-2 border-edge shadow-pop-sm"
      />
      {/* folded corner */}
      <span
        aria-hidden
        className="absolute right-0 bottom-0 w-5 h-5 bg-[linear-gradient(135deg,transparent_50%,rgb(0_0_0/0.12)_50%)] rounded-tl-[4px] transition-[width,height] duration-300 ease-pop group-hover/note:w-7 group-hover/note:h-7"
      />
      {children}
    </aside>
  );
}
