'use client';

import { WORDMARK } from './wordmarkPaths';

type WordmarkProps = {
  /** Rendered height in px; width follows the artwork. */
  height?: number;
  /** Write the r and y in on mount. Off: drawn immediately. */
  animate?: boolean;
  className?: string;
};

// Draw-in timing (seconds): "Sybra" fades in, then the r, then the y.
const T: Record<string, [delay: number, duration: number]> = {
  rStem: [0.15, 0.28],
  rArm: [0.4, 0.34],
  yArm: [0.62, 0.22],
  yBowl: [0.82, 0.26],
  yStem: [1.02, 0.24],
  yTail: [1.22, 0.42],
};
const R_HEAD = 0.72;
const Y_HEAD = 1.62;

const [, , VW, VH] = WORDMARK.viewBox.split(' ').map(Number);

/**
 * The Sybrary wordmark: an indigo r and a green y that write themselves in and
 * end in the reuse arrows (forward from the r, back from the y).
 */
export default function Wordmark({ height = 40, animate = true, className = '' }: WordmarkProps) {
  const width = Math.round((height * VW) / VH);
  const anim = animate ? 'wm-anim' : '';

  return (
    <svg
      viewBox={WORDMARK.viewBox}
      width={width}
      height={height}
      role="img"
      aria-label="Sybrary"
      className={`wordmark overflow-visible ${anim} ${className}`}
    >
      <path className="wm-pre" d={WORDMARK.prefix} fill="var(--foreground)" />
      {WORDMARK.r.map((s) => (
        <path
          key={s.id}
          className="wm-st"
          pathLength={1}
          d={s.d}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={s.w}
          strokeLinecap="butt"
          strokeLinejoin="round"
          style={{ animationDelay: `${T[s.id][0]}s`, animationDuration: `${T[s.id][1]}s` }}
        />
      ))}
      <path
        className="wm-hd wm-hd-r"
        d={WORDMARK.rHead}
        fill="var(--primary)"
        stroke="var(--primary)"
        strokeWidth={2.5}
        strokeLinejoin="round"
        style={{ animationDelay: `${R_HEAD}s` }}
      />
      {WORDMARK.y.map((s) => (
        <path
          key={s.id}
          className="wm-st"
          pathLength={1}
          d={s.d}
          fill="none"
          stroke="var(--secondary)"
          strokeWidth={s.w}
          strokeLinecap="butt"
          strokeLinejoin="round"
          style={{ animationDelay: `${T[s.id][0]}s`, animationDuration: `${T[s.id][1]}s` }}
        />
      ))}
      <path
        className="wm-hd wm-hd-y"
        d={WORDMARK.yHead}
        fill="var(--secondary)"
        stroke="var(--secondary)"
        strokeWidth={2.5}
        strokeLinejoin="round"
        style={{ animationDelay: `${Y_HEAD}s` }}
      />
    </svg>
  );
}
