'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Leaf, Recycle } from 'lucide-react';
import { boardLabel } from '@/lib/labels';

/*
 * Hero artwork: a billing machine that prints a "reuse receipt" for the class
 * picked in the hero sentence. Keys tap, the display counts up, the bill feeds
 * out of the slot line by line, then a discount stamp lands.
 * Figures are illustrative (a sample set), not live data.
 */

const SUBJECTS = ['English', 'Maths', 'Science', 'Social studies', 'Hindi'];

function sampleSet(cls: number) {
  const base = 150 + cls * 26;
  return SUBJECTS.map((name, i) => {
    const mrp = Math.round((base + i * 24) / 10) * 10;
    const reuse = Math.round((mrp * 0.44) / 10) * 10;
    return { name, mrp, reuse };
  });
}

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

function useReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const m = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduce(m.matches);
    const on = (e: MediaQueryListEvent) => setReduce(e.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return reduce;
}

function useCountUp(target: number, run: number, delay: number, reduce: boolean) {
  const [val, setVal] = useState(reduce ? target : 0);
  useEffect(() => {
    if (reduce) {
      setVal(target);
      return;
    }
    let raf = 0;
    const startAt = performance.now() + delay;
    const tick = (t: number) => {
      const p = Math.min(1, Math.max(0, (t - startAt) / 900));
      setVal(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    setVal(0);
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run, delay, reduce]);
  return val;
}

export default function ReceiptArt({ classLevel, board: boardProp }: { classLevel: string; board: string }) {
  const reduce = useReducedMotion();

  // What's on the bill. Updated only once the sentence settles (debounced past
  // the hero's intro flip-through), and only if it actually changed, so the
  // bill prints once on load and reprints only on a real new choice.
  const [printed, setPrinted] = useState({ cls: Number(classLevel) || 6, board: boardProp });
  const [run, setRun] = useState(0);
  const printedKey = useRef(`${printed.cls}-${printed.board}`);
  useEffect(() => {
    const next = { cls: Number(classLevel) || 6, board: boardProp };
    const key = `${next.cls}-${next.board}`;
    const t = window.setTimeout(() => {
      if (key === printedKey.current) return;
      printedKey.current = key;
      setPrinted(next);
      setRun((r) => r + 1);
    }, 900);
    return () => window.clearTimeout(t);
  }, [classLevel, boardProp]);

  const { cls, board } = printed;
  const items = useMemo(() => sampleSet(cls), [cls]);
  const totalNew = items.reduce((a, b) => a + b.mrp, 0);
  const totalReuse = items.reduce((a, b) => a + b.reuse, 0);
  const saved = totalNew - totalReuse;
  const pct = Math.round((saved / totalNew) * 100);

  const display = useCountUp(totalReuse, run, 250, reduce);

  const today = useMemo(
    () => new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    [],
  );

  const lines: { key: string; node: React.ReactNode; cls?: string }[] = [
    {
      key: 'head',
      node: (
        <div className="text-center">
          <div className="font-extrabold tracking-[0.18em] text-[15px]">SYBRARY</div>
          <div className="text-[12px] opacity-70">Reuse receipt, {today}</div>
        </div>
      ),
    },
    {
      key: 'for',
      node: (
        <div className="flex justify-between text-[12px] opacity-80">
          <span>Class {cls}, {boardLabel(board) || board}</span>
          <span>5 books</span>
        </div>
      ),
    },
    { key: 'r1', node: <div className="receipt-rule" /> },
    ...items.map((it) => ({
      key: it.name,
      node: (
        <div className="flex items-baseline justify-between gap-3">
          <span className="truncate">{it.name}</span>
          <span className="tabular-nums whitespace-nowrap">
            <s className="opacity-45 mr-2">{it.mrp}</s>
            {it.reuse}
          </span>
        </div>
      ),
    })),
    { key: 'r2', node: <div className="receipt-rule" /> },
    {
      key: 'new',
      node: (
        <div className="flex justify-between opacity-70">
          <span>Bought new</span>
          <s className="tabular-nums">{inr(totalNew)}</s>
        </div>
      ),
    },
    {
      key: 'pay',
      node: (
        <div className="flex justify-between font-bold text-[15px]">
          <span>Reused set</span>
          <span className="tabular-nums">{inr(totalReuse)}</span>
        </div>
      ),
    },
    {
      key: 'saved',
      node: (
        <div className="mt-1 flex justify-between items-center rounded-[6px] bg-[#12a874] text-[#17153a] px-2 py-1 font-extrabold text-[16px]">
          <span>You saved</span>
          <span className="tabular-nums">{inr(saved)}</span>
        </div>
      ),
    },
    {
      key: 'eco',
      node: (
        <div className="flex items-center gap-1.5 text-[12px] opacity-80">
          <Leaf aria-hidden size={13} strokeWidth={2.6} className="text-[#0b7a54]" /> 5 books kept in use, none reprinted
        </div>
      ),
    },
    {
      key: 'bar',
      node: (
        <div className="pt-1">
          <div className="receipt-barcode h-8" />
          <div className="text-center text-[11px] opacity-60 mt-1">Thank you for reusing</div>
        </div>
      ),
    },
  ];

  const LINE_MS = 170;
  const PRINT_START = 650; // after the keys are tapped
  const stampAt = PRINT_START + lines.length * LINE_MS + 250;

  return (
    <figure
      aria-label={`Example reuse receipt for a Class ${cls} set: ${inr(totalReuse)} instead of ${inr(totalNew)} new, saving ${inr(saved)}.`}
      className="receipt-art relative mx-auto w-full max-w-[380px] select-none"
    >
      {/* Paper feeding out of the machine (wrapper clips at the slot) */}
      <div className="relative h-[440px] overflow-hidden px-6" aria-hidden>
        <div
          key={`paper-${run}`}
          className="receipt-paper absolute left-6 right-6 bottom-0"
          style={
            {
              '--feed-ms': `${lines.length * LINE_MS + 200}ms`,
              '--feed-delay': `${PRINT_START}ms`,
            } as React.CSSProperties
          }
        >
          <div className="receipt-zigzag" />
          <div className="bg-[#fffdf6] text-[#17153a] border-x-2 border-[#17153a] px-4 pt-3 pb-4 font-mono text-[13.5px] leading-[1.55] flex flex-col gap-[3px] shadow-[4px_0_0_0_var(--drop)]">
            {lines.map((l, i) => (
              <div
                key={`${l.key}-${run}`}
                className="receipt-line"
                style={{ animationDelay: `${PRINT_START + i * LINE_MS}ms` }}
              >
                {l.node}
              </div>
            ))}
          </div>

          {/* Discount stamp */}
          <div
            key={`stamp-${run}`}
            className="receipt-stamp absolute right-3 top-[44%] rounded-[12px] border-[3px] border-[#e83657] text-[#e83657] px-3 py-1 text-center font-extrabold leading-none"
            style={{ animationDelay: `${stampAt}ms` }}
          >
            <span className="block text-[11px] tracking-[0.12em]">SAVED</span>
            <span className="block text-[30px]">{pct}%</span>
          </div>
        </div>
      </div>

      {/* The billing machine */}
      <div aria-hidden className="relative -mt-1 rounded-[22px] border-2 border-edge bg-card shadow-pop-lg px-5 pt-4 pb-5">
        {/* paper slot */}
        <div className="absolute left-5 right-5 -top-[9px] h-[18px] rounded-full border-2 border-edge bg-foreground/90" />
        <div className="mt-3 flex items-stretch gap-4">
          {/* display */}
          <div className="flex-1 rounded-[12px] border-2 border-edge bg-[#17153a] px-3 py-2 flex flex-col justify-center">
            <span className="text-[10px] font-bold tracking-[0.14em] text-[#7cf0c6]/70">TOTAL</span>
            <span className="font-mono text-[26px] leading-none text-[#7cf0c6] tabular-nums">
              {inr(display)}
            </span>
          </div>
          {/* keypad */}
          <div className="grid grid-cols-3 gap-1.5">
            {Array.from({ length: 9 }).map((_, i) => (
              <span
                key={`${i}-${run}`}
                className={`receipt-key block w-[22px] h-[18px] rounded-[5px] border-2 border-edge ${
                  i === 8 ? 'bg-secondary' : i % 4 === 0 ? 'bg-sun' : 'bg-muted-extra-light'
                }`}
                style={{ animationDelay: `${80 + ((i * 5) % 9) * 55}ms` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Sticker */}
      <span
        aria-hidden
        className="sticker absolute -left-3 top-24 text-[15px] animate-pop hidden sm:inline-flex"
        style={{ '--delay': `${stampAt + 250}ms`, '--tilt': '-7deg' } as React.CSSProperties}
      >
        <Recycle size={17} strokeWidth={2.6} /> Reused, not reprinted
      </span>
    </figure>
  );
}
