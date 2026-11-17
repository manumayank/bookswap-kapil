'use client';

import { useEffect, useRef } from 'react';

/*
 * Hero background: plain at rest, alive only around the cursor.
 *  - Drifting doodles: a few faint line-art school things near the edges that
 *    parallax gently with the mouse and wiggle once when the cursor comes close.
 *  - Book trail: moving the cursor drops tiny outlined books in brand colours
 *    that float up and fade within ~0.8s (max 12 at a time).
 * The canvas ignores pointer events (it listens on the hero section), renders
 * only while something is moving, pauses off-screen, and draws a still version
 * for reduced motion.
 */

type RGB = [number, number, number];
const hexToRgb = (v: string): RGB => {
  let h = v.trim().replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h || '000000', 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const rgba = (c: RGB, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

type Shape = (c: CanvasRenderingContext2D) => void;
const SHAPES: Record<string, Shape> = {
  openBook(c) {
    c.moveTo(0, -12); c.quadraticCurveTo(-16, -20, -32, -14); c.lineTo(-32, 16);
    c.quadraticCurveTo(-16, 10, 0, 18); c.quadraticCurveTo(16, 10, 32, 16); c.lineTo(32, -14);
    c.quadraticCurveTo(16, -20, 0, -12); c.lineTo(0, 18);
    for (let i = 0; i < 3; i++) {
      const y = -5 + i * 7;
      c.moveTo(-26, y - 1); c.lineTo(-7, y + 1); c.moveTo(7, y + 1); c.lineTo(26, y - 1);
    }
  },
  pencil(c) {
    c.rect(-34, -6, 56, 12);
    c.moveTo(22, -6); c.lineTo(38, 0); c.lineTo(22, 6);
    c.moveTo(32.5, -2); c.lineTo(32.5, 2);
    c.moveTo(-26, -6); c.lineTo(-26, 6);
  },
  ruler(c) {
    c.rect(-44, -9, 88, 18);
    for (let i = 0; i <= 12; i++) { const x = -36 + i * 6; c.moveTo(x, -9); c.lineTo(x, i % 2 ? -5 : -1); }
  },
  setSquare(c) {
    c.moveTo(-26, 24); c.lineTo(30, 24); c.lineTo(-26, -30); c.closePath();
    c.moveTo(-16, 14); c.lineTo(8, 14); c.lineTo(-16, -10); c.closePath();
  },
  clip(c) {
    c.moveTo(6, -12); c.lineTo(6, 18); c.arc(0, 18, 6, 0, Math.PI);
    c.lineTo(-6, -20); c.arc(2, -20, 8, Math.PI, Math.PI * 2); c.lineTo(10, 14);
  },
  bookStack(c) {
    c.rect(-24, 8, 48, 11); c.rect(-20, -3, 42, 11); c.rect(-22, -14, 38, 11);
    c.moveTo(-17, 8); c.lineTo(-17, 19); c.moveTo(16, -3); c.lineTo(16, 8); c.moveTo(-15, -14); c.lineTo(-15, -3);
  },
};
// positions as fractions of the hero, kept to the edges and the gap beside the machine
const ITEMS = [
  { s: 'openBook', fx: 0.04, fy: 0.1, rot: -0.15, depth: 14 },
  { s: 'pencil', fx: 0.44, fy: 0.07, rot: 0.3, depth: 8 },
  { s: 'setSquare', fx: 0.56, fy: 0.3, rot: 0.2, depth: 18 },
  { s: 'ruler', fx: 0.53, fy: 0.86, rot: -0.5, depth: 10 },
  { s: 'clip', fx: 0.975, fy: 0.5, rot: 0.6, depth: 6 },
  { s: 'bookStack', fx: 0.05, fy: 0.9, rot: 0.1, depth: 12 },
  { s: 'pencil', fx: 0.33, fy: 0.95, rot: -0.18, depth: 16 },
];
const TRAIL = { LIFE: 800, MAX: 12, MIN_DIST: 28, MIN_MS: 45 };

export default function HeroBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const root = document.documentElement;

    const C: Record<string, RGB> = {};
    let dark = false;
    const readColors = () => {
      const cs = getComputedStyle(root);
      C.ink = hexToRgb(cs.getPropertyValue('--foreground'));
      C.p = hexToRgb(cs.getPropertyValue('--primary'));
      C.g = hexToRgb(cs.getPropertyValue('--secondary'));
      C.sun = hexToRgb(cs.getPropertyValue('--sun'));
      C.r = hexToRgb(cs.getPropertyValue('--accent'));
      dark = root.classList.contains('dark');
    };

    let w = 0, h = 0, dpr = 1, raf = 0, last = 0, visible = true;
    const p = { x: 0, y: 0, in: false };
    const sp = { x: 0, y: 0 };
    let amp = 0;
    // alternate indigo and green so hovering lights some blue and some green
    const items = ITEMS.map((it, i) => ({ ...it, tint: i % 2 ? 'g' : 'p', ang: 0, av: 0, hot: false, glow: 0 }));
    let books: { x: number; y: number; born: number; rot: number; c: string }[] = [];
    let lastSpawn = { x: -1e9, y: -1e9, t: 0 };
    let ci = 0;

    const follow = (dt: number, ease: number) => {
      const k = 1 - Math.pow(1 - ease, dt);
      sp.x += (p.x - sp.x) * k;
      sp.y += (p.y - sp.y) * k;
      const ta = p.in ? 1 : 0;
      amp += (ta - amp) * (1 - Math.pow(0.9, dt));
      if (Math.abs(ta - amp) < 0.003) amp = ta;
      return Math.abs(p.x - sp.x) + Math.abs(p.y - sp.y) > 0.3 || amp !== ta;
    };

    function frame(dt: number, now: number) {
      if (!w || !h) return false;
      ctx!.clearRect(0, 0, w, h);
      // doodles
      let moving = follow(dt, 0.08);
      const nx = (sp.x / w - 0.5) * amp, ny = (sp.y / h - 0.5) * amp;
      ctx!.lineWidth = 1.5;
      ctx!.lineJoin = 'round';
      ctx!.lineCap = 'round';
      const small = w < 640;
      for (const it of items) {
        if (small && it.fx > 0.15 && it.fx < 0.9) continue; // phones: edges only
        const x = it.fx * w - nx * it.depth, y = it.fy * h - ny * it.depth;
        const d = p.in ? Math.hypot(p.x - x, p.y - y) : 1e9;
        if (d < 60 && !it.hot) { it.hot = true; it.av += (Math.random() < 0.5 ? -1 : 1) * 0.06; }
        else if (d > 90) it.hot = false;
        it.av = (it.av - it.ang * 0.08 * dt) * Math.pow(0.9, dt);
        it.ang += it.av * dt;
        it.glow += ((it.hot ? 1 : 0) - it.glow) * (1 - Math.pow(0.85, dt));
        if (Math.abs(it.av) > 1e-4 || Math.abs(it.ang) > 1e-3 || Math.abs(it.glow - (it.hot ? 1 : 0)) > 0.005) moving = true;
        ctx!.save();
        ctx!.translate(x, y);
        ctx!.rotate(it.rot + it.ang);
        ctx!.scale(1.1, 1.1);
        const base = dark ? 0.2 : 0.17;
        ctx!.strokeStyle = it.glow > 0.01 ? rgba(C[it.tint], base + 0.45 * it.glow) : rgba(C.ink, base);
        ctx!.beginPath();
        SHAPES[it.s](ctx!);
        ctx!.stroke();
        ctx!.restore();
      }
      // book trail
      books = books.filter((b) => now - b.born < TRAIL.LIFE);
      ctx!.lineWidth = 1.6;
      for (const b of books) {
        const t = (now - b.born) / TRAIL.LIFE;
        const alpha = Math.pow(1 - t, 1.5) * 0.75;
        const s = 0.7 + 0.3 * Math.min(1, t * 5);
        const col = C[b.c];
        ctx!.save();
        ctx!.translate(b.x, b.y - 12 * t);
        ctx!.rotate(b.rot);
        ctx!.scale(s, s);
        ctx!.beginPath();
        ctx!.moveTo(-5, -9); ctx!.lineTo(5, -9); ctx!.quadraticCurveTo(7, -9, 7, -7);
        ctx!.lineTo(7, 7); ctx!.quadraticCurveTo(7, 9, 5, 9); ctx!.lineTo(-5, 9);
        ctx!.quadraticCurveTo(-7, 9, -7, 7); ctx!.lineTo(-7, -7); ctx!.quadraticCurveTo(-7, -9, -5, -9);
        ctx!.closePath();
        ctx!.fillStyle = rgba(col, alpha * 0.2);
        ctx!.fill();
        ctx!.strokeStyle = rgba(col, alpha);
        ctx!.stroke();
        ctx!.beginPath();
        ctx!.moveTo(-4, -9); ctx!.lineTo(-4, 9);
        ctx!.moveTo(-1, -4); ctx!.lineTo(4, -4);
        ctx!.stroke();
        ctx!.restore();
      }
      return moving || books.length > 0;
    }

    const tick = (t: number) => {
      raf = 0;
      const dt = Math.min(3, Math.max(0, (t - last) / 16.667));
      last = t;
      if (frame(dt, t) && visible) raf = requestAnimationFrame(tick);
    };
    const kick = () => {
      if (reduce || raf || !visible) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };
    const paint = () => {
      if (frame(1, performance.now())) kick();
    };
    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = host.clientWidth;
      h = host.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paint();
    };

    const onPointer = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      p.x = e.clientX - r.left;
      p.y = e.clientY - r.top;
      if (!p.in) {
        p.in = true;
        if (amp < 0.02) { sp.x = p.x; sp.y = p.y; }
      }
      const now = performance.now();
      if (Math.hypot(p.x - lastSpawn.x, p.y - lastSpawn.y) >= TRAIL.MIN_DIST && now - lastSpawn.t >= TRAIL.MIN_MS) {
        lastSpawn = { x: p.x, y: p.y, t: now };
        books.push({ x: p.x, y: p.y, born: now, rot: (Math.random() - 0.5) * 0.8, c: ['p', 'g', 'sun', 'r'][ci++ % 4] });
        if (books.length > TRAIL.MAX) books.shift();
      }
      kick();
    };
    const onLeave = () => { p.in = false; kick(); };
    const onUp = (e: PointerEvent) => { if (e.pointerType !== 'mouse') onLeave(); };

    readColors();
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    const io = new IntersectionObserver(([en]) => {
      visible = en.isIntersecting;
      if (visible) kick();
      else if (raf) { cancelAnimationFrame(raf); raf = 0; }
    });
    io.observe(host);
    const mo = new MutationObserver(() => { readColors(); paint(); });
    mo.observe(root, { attributes: true, attributeFilter: ['class'] });
    if (!reduce) {
      host.addEventListener('pointermove', onPointer);
      host.addEventListener('pointerdown', onPointer);
      host.addEventListener('pointerleave', onLeave);
      host.addEventListener('pointercancel', onLeave);
      host.addEventListener('pointerup', onUp);
    }
    resize();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      mo.disconnect();
      host.removeEventListener('pointermove', onPointer);
      host.removeEventListener('pointerdown', onPointer);
      host.removeEventListener('pointerleave', onLeave);
      host.removeEventListener('pointercancel', onLeave);
      host.removeEventListener('pointerup', onUp);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />;
}
