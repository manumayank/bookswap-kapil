'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import Logo from '@/components/Logo';
import { hand } from '@/components/initiative/hand';

/*
 * Footer: the last page of a school notebook (ruled lines, red margin, binder
 * holes, handwritten links) with a giant outlined "Sybrary" watermark that
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
      {/* binder holes + margin line */}
      <span aria-hidden className="notebook-holes hidden sm:block absolute left-4 top-10 bottom-40 w-[18px]" />
      <span aria-hidden className="absolute top-0 bottom-0 left-[36px] sm:left-[60px] w-[2px] bg-accent/70" />

      {/* doodle that draws itself */}
      <svg
        aria-hidden
        viewBox="0 0 170 110"
        className="notebook-doodle hidden md:block absolute right-8 lg:right-16 top-10 w-[150px] lg:w-[170px] text-primary"
      >
        <path d="M30 62 A34 34 0 0 1 98 38" />
        <path d="M98 38 l-11 -3 M98 38 l-5 10" />
        <path d="M110 58 A34 34 0 0 1 44 86" />
        <path d="M44 86 l11 2 M44 86 l4 -10" />
        <path d="M62 52 q8 -4 13 1 v20 q-6 -4 -13 -1 z M88 52 q-8 -4 -13 1 v20 q6 -4 13 -1 z" />
        <path d="M118 20 C126 12 140 14 146 22 M128 30 C134 26 142 28 146 32" />
      </svg>

      <div className="container relative pl-[56px] sm:pl-[92px]">
        <div className="pt-10">
          <Link href="/" aria-label="Sybrary home" className="inline-flex h-[40px] items-center rounded-lg">
            <Logo variant="full" height={40} />
          </Link>
          <p className={`${hand} mt-[40px] text-[2.1rem] sm:text-[2.6rem] leading-[40px] sm:leading-[80px] text-foreground max-w-[22ch]`}>
            See you at the school gate.
          </p>
          <p className="max-w-[52ch] text-muted leading-[40px]">
            A second life for school books. Your phone number stays private until you agree to a deal.
          </p>
        </div>

        <div className="mt-[40px] grid gap-x-10 gap-y-[40px] sm:grid-cols-2 lg:grid-cols-[repeat(3,minmax(0,1fr))_auto]">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h2 className="text-base font-extrabold leading-[40px]">{col.title}</h2>
              <ul>
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={`${hand} notebook-link inline-flex items-center h-[40px] text-[1.65rem] font-bold text-foreground`}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="lg:pt-[40px]">
            <Link href="/sell" className="btn btn-sun -rotate-2 hover:rotate-0">
              List your books
            </Link>
          </div>
        </div>

      </div>

      {/* Giant outlined watermark, left-aligned with the content */}
      <div aria-hidden className="notebook-watermark container relative mt-[40px] flex justify-start pl-[48px] sm:pl-[84px] select-none">
        {WORD.map((ch, i) => (
          <span key={i} style={{ transitionDelay: `${i * 60}ms` }}>
            {ch}
          </span>
        ))}
      </div>
    </footer>
  );
}
