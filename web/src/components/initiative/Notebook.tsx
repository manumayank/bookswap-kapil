import type { CSSProperties, ReactNode } from 'react';
import { hand } from './hand';

/** Height of one ruled line; body text uses the same leading so it sits on the lines. */
export const RULE = 30;

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

/** Sun highlighter swiped behind a phrase. */
export function Highlight({ children }: { children: ReactNode }) {
  return (
    <mark className="bg-sun/50 dark:bg-sun/30 text-inherit px-[0.15em] -mx-[0.05em] rounded-[3px] [box-decoration-break:clone] [-webkit-box-decoration-break:clone]">
      {children}
    </mark>
  );
}

/** A handwritten aside in the notebook's pencil colour. */
export function Note({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`${hand} text-[1.6rem] leading-[30px] text-primary ${className}`}>{children}</p>;
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
      className={`relative w-full max-w-[280px] rounded-[6px] border-2 border-edge bg-card p-3 pb-2 shadow-pop ${className}`}
      style={{ transform: `rotate(${tilt}deg)` }}
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
        <span className={`${hand} block text-[1.45rem] leading-7 text-foreground`}>{caption}</span>
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

/** Sticky note pinned to the page. Always ink text: these fills are light in both themes. */
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
  return (
    <aside
      className={`relative ${STICKY_TONES[tone]} text-ink border-2 border-edge rounded-[4px] shadow-pop-sm px-5 pt-6 pb-5 ${className}`}
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      <span
        aria-hidden
        className="absolute left-1/2 top-2 -translate-x-1/2 w-4 h-4 rounded-full bg-accent border-2 border-edge shadow-pop-sm"
      />
      {children}
    </aside>
  );
}
