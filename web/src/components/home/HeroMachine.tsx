'use client';

import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import ReceiptArt from './ReceiptArt';
import { receiptFor } from './receiptData';
import { boardLabel } from '@/lib/labels';
import type { MachineScene } from './machineScene';

type Props = { classLevel: string; board: string; ready: boolean };

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

/**
 * Home hero billing machine.
 * Shows the SVG machine immediately; after the page has rendered it loads the
 * three.js machine (home page only) and crossfades to it once its first frame is
 * drawn. Reduced motion, no WebGL or any load error keeps the SVG machine.
 */
export default function HeroMachine({ classLevel, board, ready }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<MachineScene | null>(null);
  // 'loading' shows a small loader; '3d' the three.js machine; 'fallback' the SVG
  // machine (only when 3D can't run: reduced motion, no WebGL, or a load error)
  const [mode, setMode] = useState<'loading' | '3d' | 'fallback'>('loading');
  const active = mode === '3d';
  const [muted, setMuted] = useState(false);
  const readyAt = useRef<number | null>(null);
  const printedKey = useRef<string | null>(null);

  const cls = Number(classLevel) || 6;
  const label = boardLabel(board) || board;

  // load the 3D machine after first paint
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !webglAvailable()) {
      setMode('fallback');
      return;
    }
    let cancelled = false;
    let idle: number | undefined;
    const start = () => {
      import('./machineScene')
        .then(({ createMachineScene }) => {
          if (cancelled || !canvasRef.current) return;
          const scene = createMachineScene(canvasRef.current, { onFirstFrame: () => !cancelled && setMode('3d') });
          sceneRef.current = scene;
          setMuted(scene.isMuted());
          // catch up with the hero: if the sentence already settled, print now
          if (readyAt.current !== null) {
            const r = receiptFor(cls, label);
            printedKey.current = `${cls}-${board}`;
            scene.print(r);
          } else {
            scene.typing();
          }
        })
        .catch((err) => {
          // keep the SVG machine
          if (process.env.NODE_ENV !== 'production') console.error('HeroMachine 3D failed', err);
          if (!cancelled) setMode('fallback');
        });
    };
    const ric = (window as any).requestIdleCallback as ((cb: () => void, o?: { timeout: number }) => number) | undefined;
    if (ric) idle = ric(start, { timeout: 400 });
    else idle = window.setTimeout(start, 50);
    return () => {
      cancelled = true;
      const cic = (window as any).cancelIdleCallback as ((id: number) => void) | undefined;
      if (ric && cic && idle !== undefined) cic(idle);
      else if (idle !== undefined) window.clearTimeout(idle);
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // print when the hero settles, and reprint (debounced) when class/board change
  useEffect(() => {
    if (!ready) return;
    if (readyAt.current === null) readyAt.current = performance.now();
    const key = `${cls}-${board}`;
    const first = printedKey.current === null;
    const t = window.setTimeout(
      () => {
        const scene = sceneRef.current;
        if (!scene || printedKey.current === key) return;
        printedKey.current = key;
        scene.print(receiptFor(cls, label));
      },
      first ? 0 : 900,
    );
    return () => window.clearTimeout(t);
  }, [ready, cls, board, label]);

  // pause rendering while the hero is off screen
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([e]) => sceneRef.current?.setVisible(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={wrapRef} className="relative mx-auto w-full max-w-[560px] h-[560px] sm:h-[600px]">
      {mode === 'fallback' && (
        <div className="absolute inset-0 flex items-end justify-center">
          <ReceiptArt classLevel={classLevel} board={board} ready={ready} />
        </div>
      )}
      {mode === 'loading' && (
        <div className="absolute inset-0 flex items-end justify-center pb-24" role="status" aria-label="Loading">
          <span className="flex gap-2" aria-hidden>
            {['bg-primary', 'bg-secondary', 'bg-sun'].map((c, i) => (
              <span
                key={c}
                className={`block w-3 h-3 rounded-full border-2 border-edge ${c} animate-[loaderBounce_0.9s_ease-in-out_infinite]`}
                style={{ animationDelay: `${i * 0.12}s` }}
              />
            ))}
          </span>
        </div>
      )}
      {active && (
        <button
          type="button"
          onClick={() => {
            const next = !muted;
            sceneRef.current?.setMuted(next);
            setMuted(next);
          }}
          aria-label={muted ? 'Turn machine sounds on' : 'Turn machine sounds off'}
          aria-pressed={!muted}
          title={muted ? 'Sound off' : 'Sound on'}
          className="btn btn-outline btn-sm btn-icon absolute right-1 bottom-2 z-10"
          style={{ width: 38, height: 38, borderRadius: 999 }}
        >
          {muted ? <VolumeX size={17} aria-hidden /> : <Volume2 size={17} aria-hidden />}
        </button>
      )}
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`Billing machine printing an example reuse receipt for a Class ${cls} ${label} set.`}
        aria-hidden={!active}
        className={`absolute inset-0 h-full w-full transition-opacity duration-500 ${active ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
}
