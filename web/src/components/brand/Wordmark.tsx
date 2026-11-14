'use client';

import { useLayoutEffect, useState } from 'react';
import { WORDMARK } from './wordmarkPaths';

type WordmarkProps = {
  /** Rendered height in px; width follows the artwork. */
  height?: number;
  /** Write the r and y in on mount. Off: drawn immediately. */
  animate?: boolean;
  className?: string;
};

// Draw-in timing (seconds). Both arrows are drawn at the same time:
// the r from the left (stem up, arm sweeping right into its arrowhead) and the
// y from the right (stem down, tail curling left into its arrowhead), while the
// y's left arm and bowl are drawn back from the stem side so all of the y moves
// right-to-left. [delay, duration, drawn end-to-start]
const T: Record<string, [delay: number, duration: number, reverse?: boolean]> = {
  rStem: [0.2, 0.26],
  rArm: [0.46, 0.42],
  yStem: [0.2, 0.68],
  yBowl: [0.36, 0.5, true],
};
const R_HEAD = 0.86;
const Y_HEAD = 0.86;

/** Play the draw-in once per visit; later pages show the finished mark. */
const PLAYED_KEY = 'sybrary-wordmark-played';
let decided: boolean | null = null; // shared by every instance on the page
function shouldPlay() {
  if (decided !== null) return decided;
  decided = true;
  try {
    if (sessionStorage.getItem(PLAYED_KEY)) decided = false;
    else sessionStorage.setItem(PLAYED_KEY, '1');
  } catch {}
  return decided;
}

const [, , VW, VH] = WORDMARK.viewBox.split(' ').map(Number);

/**
 * The Sybrary wordmark: an indigo r and a green y that write themselves in and
 * end in the reuse arrows (forward from the r, back from the y).
 */
export default function Wordmark({ height = 40, animate = true, className = '' }: WordmarkProps) {
  const width = Math.round((height * VW) / VH);
  // Server and first client render agree (animated); before the first paint we
  // switch to the finished mark if this visit has already seen the draw-in.
  const [play, setPlay] = useState(animate);
  useLayoutEffect(() => {
    if (animate && !shouldPlay()) setPlay(false);
  }, [animate]);
  const anim = play ? 'wm-anim' : '';

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
          className={`wm-st ${T[s.id][2] ? 'wm-rev' : ''}`}
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
