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
      {/* punch holes down the left edge */}
      <span aria-hidden className="notebook-holes hidden sm:block absolute left-3 top-10 bottom-10 w-[18px]" />
      {/* margin line */}
      <span aria-hidden className="absolute top-0 bottom-0 left-[22px] sm:left-[46px] w-[2px] bg-accent/70" />

      <div className="container relative pl-10 sm:pl-[72px] pt-10">
        <div className="grid gap-y-[40px] gap-x-12 xl:gap-x-16 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-start">
          {/* Left: sign-off */}
          <div>
            <p className={`${hand} text-[2.1rem] sm:text-[2.6rem] leading-[40px] sm:leading-[80px] text-foreground max-w-[22ch]`}>
              See you at the school gate.
            </p>
            <div className="mt-[20px] flex flex-wrap gap-3">
              <Link href="/sell" className="btn btn-sun -rotate-2 hover:rotate-0">
                List your books
              </Link>
              <Link href="/browse" className="btn btn-outline rotate-1 hover:rotate-0">
                Find books
              </Link>
            </div>
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
            {/* circle centre (70,55) r=36; arrowheads follow the tangent at each arc's end */}
            <path pathLength={1} d="M35.2 45.7 A36 36 0 0 1 104.8 45.7" />
            <path pathLength={1} d="M104.8 64.3 A36 36 0 0 1 35.2 64.3" className="text-secondary" stroke="currentColor" />
            <path pathLength={1} d="M104.8 45.7 l2.6 -9.7 M104.8 45.7 l-7.1 -7.1" />
            <path pathLength={1} d="M35.2 64.3 l-2.6 9.7 M35.2 64.3 l7.1 7.1" className="text-secondary" stroke="currentColor" />
            <path pathLength={1} d="M57 47 q8 -3 13 1 v18 q-6 -4 -13 -1 z" />
            <path pathLength={1} d="M83 47 q-8 -3 -13 1 v18 q6 -4 13 -1 z" />
          </svg>
        </div>
      </div>

      {/* Giant outlined watermark, left-aligned with the content */}
      <div aria-hidden className="notebook-watermark container relative mt-[34px] pb-3 sm:pb-5 flex justify-start pl-8 sm:pl-[64px] select-none">
        {WORD.map((ch, i) => (
          <span key={i} style={{ transitionDelay: `${i * 60}ms` }}>
            {ch}
          </span>
        ))}
      </div>
    </footer>
  );
}
