'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { hand } from '@/components/initiative/hand';

/*
 * Footer: the last page of a school notebook (ruled lines, red margin, binder
 * sign-off on the left, handwritten links and a reuse sketch on the right) with a giant outlined "Sybrary" watermark that
 * rises into place when the footer scrolls into view.
 * Every line of text sits on the 40px ruling.
 */

const COLUMNS = [
  {
    title: 'Find books',
    links: [
      { href: '/browse', label: 'Browse listings' },
      { href: '/need', label: 'Request a book' },
      { href: '/papers', label: 'Exam papers' },
    ],
  },
  {
    title: 'Pass books on',
    links: [
      { href: '/sell', label: 'List your books' },
      { href: '/dashboard', label: 'Your dashboard' },
      { href: '/dashboard/deals', label: 'Your deals' },
    ],
  },
  {
    title: 'Sybrary',
    links: [
      { href: '/initiative', label: 'Our initiative' },
      { href: '/contact', label: 'Report a problem' },
      { href: '/notifications', label: 'Notifications' },
    ],
  },
];

const WORD = 'Sybrary'.split('');

export default function Footer() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!('IntersectionObserver' in window)) {
      el.classList.add('is-in');
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('is-in');
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <footer ref={ref} className="notebook-footer relative mt-24 overflow-hidden border-t-2 border-edge bg-card">
      {/* margin line */}
      <span aria-hidden className="absolute top-0 bottom-0 left-[22px] sm:left-[30px] w-[2px] bg-accent/70" />

      <div className="container relative pl-10 sm:pl-14 pt-10">
        <div className="grid gap-y-[40px] gap-x-12 xl:gap-x-16 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-start">
          {/* Left: sign-off */}
          <div>
            <p className={`${hand} text-[2.1rem] sm:text-[2.6rem] leading-[40px] sm:leading-[80px] text-foreground max-w-[22ch]`}>
              See you at the school gate.
            </p>
            <p className="max-w-[44ch] text-muted leading-[40px]">
              A second life for school books. Your phone number stays private until you agree to a deal.
            </p>
            <Link href="/sell" className="btn btn-sun mt-[20px] -rotate-2 hover:rotate-0">
              List your books
            </Link>
          </div>

          {/* Right: links */}
          <nav aria-label="Footer" className="grid gap-x-10 gap-y-[40px] grid-cols-2 sm:grid-cols-3">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h2 className="text-base font-extrabold leading-[40px]">{col.title}</h2>
                <ul>
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className={`${hand} notebook-link inline-flex items-center h-[40px] text-[1.6rem] font-bold text-foreground whitespace-nowrap`}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          {/* Right: reuse sketch that draws itself */}
          <svg
            aria-hidden
            viewBox="0 0 140 110"
            className="notebook-doodle hidden lg:block w-[120px] xl:w-[140px] h-auto self-center text-primary"
          >
            <path pathLength={1} d="M22 58 A34 34 0 0 1 88 34" />
            <path pathLength={1} d="M88 34 l-11 -3 M88 34 l-5 10" />
            <path pathLength={1} d="M100 54 A34 34 0 0 1 34 82" />
            <path pathLength={1} d="M34 82 l11 2 M34 82 l4 -10" />
            <path pathLength={1} d="M52 48 q8 -4 13 1 v20 q-6 -4 -13 -1 z" />
            <path pathLength={1} d="M78 48 q-8 -4 -13 1 v20 q6 -4 13 -1 z" />
          </svg>
        </div>
      </div>

      {/* Giant outlined watermark, left-aligned with the content */}
      <div aria-hidden className="notebook-watermark container relative mt-[40px] flex justify-start pl-8 sm:pl-12 select-none">
        {WORD.map((ch, i) => (
          <span key={i} style={{ transitionDelay: `${i * 60}ms` }}>
            {ch}
          </span>
        ))}
      </div>
    </footer>
  );
}
