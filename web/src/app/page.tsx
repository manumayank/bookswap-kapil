'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, ChevronDown, Leaf, Lock, PencilRuler, Recycle, Wallet } from 'lucide-react';
import BookCard from '@/components/BookCard';
import ErrorState from '@/components/ui/ErrorState';
import Reveal from '@/components/Reveal';
import ReceiptArt from '@/components/home/ReceiptArt';
import Select from '@/components/ui/Select';
import api from '@/lib/api';
import { boardLabel } from '@/lib/labels';

interface ApiListing {
  id: string;
  title: string;
  sellingPrice: number;
  buyingPrice?: number;
  condition: string;
  category: string;
  city: string;
  board?: string;
  class?: number;
  school?: { name: string } | null;
  images?: { imageUrl: string }[];
}

type Intent = 'buy' | 'sell';

const CLASSES = Array.from({ length: 12 }, (_, i) => String(i + 1));
const BOARDS = ['CBSE', 'ICSE', 'STATE', 'IB', 'IGCSE'];
const CITIES = ['Bangalore', 'Mumbai', 'Delhi', 'Pune', 'Chennai', 'Hyderabad', 'Kolkata', 'Ahmedabad'];

/* ------------------------------------------------------------------ */
/* Hero: the headline is the search form                               */
/* ------------------------------------------------------------------ */

type SlotProps = {
  label: string;
  value: string;
  display: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  tone?: 'sun' | 'primary';
  flipKey: number;
  columns?: number;
  /** Hold the slot at its first measured width (used while the intro cycles examples). */
  locked?: boolean;
};

/**
 * A yellow word in the hero sentence that opens a pencil-box dropdown.
 * Its width is set explicitly and eased, so changing the word glides instead of
 * snapping, and while `locked` it keeps its starting width so the headline never
 * re-wraps during the intro.
 */
function Slot({ label, value, display, onChange, options, tone = 'sun', flipKey, columns, locked }: SlotProps) {
  const measureRef = useRef<HTMLSpanElement>(null);
  const lockedRef = useRef(locked);
  lockedRef.current = locked;
  const [natural, setNatural] = useState<number | null>(null);
  // Last width measured while unlocked: what the slot holds during the intro.
  const [stable, setStable] = useState<number | null>(null);

  // Track the natural width of the current word (and re-measure when the font
  // loads or the breakpoint changes the font size).
  useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.offsetWidth;
      setNatural(w);
      if (!lockedRef.current) setStable(w);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [display]);

  const width = locked ? stable ?? natural : natural;

  return (
    <Select
      aria-label={label}
      value={value}
      onChange={onChange}
      options={options}
      columns={columns}
      menuMinWidth={columns && columns > 1 ? 240 : 200}
      className="align-baseline mx-[0.04em] my-[0.08em]"
      triggerClassName={`group inline-flex items-center gap-[0.12em] px-[0.22em] rounded-[0.22em] border-2 border-edge shadow-pop transition-transform duration-150 ease-pop hover:-translate-x-0.5 hover:-translate-y-0.5 hover:-rotate-1 aria-expanded:-translate-y-0.5 aria-expanded:-rotate-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40 ${
        tone === 'primary' ? 'bg-primary text-on-primary' : 'bg-sun text-ink'
      }`}
      renderTrigger={({ open }) => (
        <>
          <span
            className="relative inline-block whitespace-nowrap text-center overflow-hidden align-bottom transition-[width] duration-300 ease-out"
            style={width != null ? { width } : undefined}
          >
            <span key={flipKey} className="inline-block animate-[slotFlip_.35s_cubic-bezier(.34,1.56,.64,1)]">
              {display}
            </span>
            {/* invisible copy used only to measure the word's natural width */}
            <span ref={measureRef} aria-hidden className="absolute left-0 top-0 invisible whitespace-nowrap">
              {display}
            </span>
          </span>
          <ChevronDown
            aria-hidden
            className={`w-[0.42em] h-[0.42em] opacity-70 shrink-0 transition-transform duration-200 ease-pop ${open ? 'rotate-180' : ''}`}
            strokeWidth={3}
          />
        </>
      )}
    />
  );
}

type Demo = { intent: Intent; cls: string; board: string; city: string };

/*
 * Intro: right after the billing machine appears, the blanks flip quickly
 * through a few examples, one to three at a time, like a worksheet being filled
 * in, then settle on the real choice. Only then does the machine print the bill.
 * Display-only: the real state and the text below never change. Every example
 * is no wider than the final word and slots are width-locked meanwhile, so the
 * headline never re-wraps.
 */
type Step = Partial<Demo>;
const INTRO_STEPS: Step[] = [
  { intent: 'sell', city: 'Mumbai' },
  { cls: '8' },
  { board: 'ICSE', city: 'Pune', intent: 'buy' },
  { cls: '4', board: 'IB' },
  { city: 'Delhi' },
];
const INTRO_START = 250; // ms after load, as the machine pops in
const INTRO_STEP = 330; // ms between flips
const INTRO_SETTLE = 280; // pause on the final words before printing

function HeroSentence() {
  const router = useRouter();
  const [intent, setIntent] = useState<Intent>('buy');
  const [cls, setCls] = useState('6');
  const [board, setBoard] = useState('CBSE');
  const [city, setCity] = useState('Bangalore');
  const [flips, setFlips] = useState({ intent: 0, cls: 0, board: 0, city: 0 });
  const [demo, setDemo] = useState<Demo | null>(null);
  const [ready, setReady] = useState(false);
  const touched = useRef(false);

  const bump = (k: keyof typeof flips) => setFlips((f) => ({ ...f, [k]: f[k] + 1 }));

  const endIntro = () => {
    setDemo(null);
    setReady(true);
  };

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setReady(true);
      return;
    }
    const real: Demo = { intent: 'buy', cls: '6', board: 'CBSE', city: 'Bangalore' };
    const steps: Step[] = [...INTRO_STEPS, real];
    const timers: number[] = [];
    let current: Demo = real;
    steps.forEach((step, i) => {
      timers.push(
        window.setTimeout(() => {
          if (touched.current) return;
          const isLast = i === steps.length - 1;
          const next: Demo = isLast ? real : { ...current, ...step };
          // flip only the slots whose word actually changes
          setFlips((f) => ({
            intent: f.intent + (next.intent !== current.intent ? 1 : 0),
            cls: f.cls + (next.cls !== current.cls ? 1 : 0),
            board: f.board + (next.board !== current.board ? 1 : 0),
            city: f.city + (next.city !== current.city ? 1 : 0),
          }));
          current = next;
          setDemo(isLast ? null : next);
        }, INTRO_START + i * INTRO_STEP),
      );
    });
    timers.push(
      window.setTimeout(() => {
        if (!touched.current) setReady(true);
      }, INTRO_START + (steps.length - 1) * INTRO_STEP + INTRO_SETTLE),
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, []);

  const change = (k: keyof typeof flips, set: (v: string) => void) => (v: string) => {
    touched.current = true;
    endIntro();
    set(v);
    bump(k);
  };

  const go = (e: React.FormEvent) => {
    e.preventDefault();
    if (intent === 'sell') {
      router.push('/sell');
      return;
    }
    const q = new URLSearchParams({ class: cls, board });
    if (city) q.set('city', city);
    router.push(`/browse?${q.toString()}`);
  };

  const shown = demo ?? { intent, cls, board, city };
  const cityDisplay = shown.city || 'any city';
  const locked = demo !== null;

  return (
    <div className="grid gap-12 lg:gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
    <form onSubmit={go} aria-label="Find or sell school books">
      <h1 className="text-[2.15rem] leading-[1.32] sm:text-[3.4rem] sm:leading-[1.25] lg:text-[3.5rem] xl:text-[4rem] lg:leading-[1.24] font-extrabold tracking-[-0.035em] max-w-[17ch] animate-pop">
        I&apos;m{' '}
        <Slot
          label="I want to"
          value={intent}
          display={shown.intent === 'buy' ? 'looking for' : 'passing on'}
          locked={locked}
          onChange={change('intent', (v) => setIntent(v as Intent))}
          options={[
            { value: 'buy', label: 'looking for' },
            { value: 'sell', label: 'passing on' },
          ]}
          tone="primary"
          flipKey={flips.intent}
        />{' '}
        <Slot
          label="Class"
          value={cls}
          display={`Class ${shown.cls}`}
          locked={locked}
          onChange={change('cls', setCls)}
          options={CLASSES.map((c) => ({ value: c, label: c }))}
          columns={4}
          flipKey={flips.cls}
        />{' '}
        <Slot
          label="Board"
          value={board}
          display={boardLabel(shown.board) || shown.board}
          locked={locked}
          onChange={change('board', setBoard)}
          options={BOARDS.map((b) => ({ value: b, label: boardLabel(b) || b }))}
          flipKey={flips.board}
        />{' '}
        books in{' '}
        <Slot
          label="City"
          value={city}
          display={cityDisplay}
          locked={locked}
          onChange={change('city', setCity)}
          options={[...CITIES.map((c) => ({ value: c, label: c })), { value: '', label: 'any city' }]}
          flipKey={flips.city}
        />
        .
      </h1>

      <p className="mt-7 text-lg sm:text-xl text-muted max-w-[46ch] leading-relaxed animate-pop" style={{ '--delay': '140ms' } as React.CSSProperties}>
        {intent === 'buy'
          ? 'Give a school book its second term. Families save money, and every book reused is one less printed.'
          : 'List the books your child has outgrown. A family nearby uses them next term, and you get paid at hand-over.'}
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-3 animate-pop" style={{ '--delay': '220ms' } as React.CSSProperties}>
        <button type="submit" className="btn btn-primary btn-lg">
          {intent === 'buy' ? `Show Class ${cls} books` : `List my Class ${cls} books`}
        </button>
        <button
          type="button"
          onClick={() => {
            touched.current = true;
            endIntro();
            setIntent((i) => (i === 'buy' ? 'sell' : 'buy'));
            bump('intent');
          }}
          className="btn btn-ghost"
        >
          {intent === 'buy' ? 'I have books to pass on' : 'I need books instead'}
        </button>
      </div>
    </form>
    <ReceiptArt classLevel={cls} board={board} ready={ready} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

const STEPS = [
  {
    title: 'List what your child has outgrown',
    body: 'Add a photo, the class and board, and your price. Our team checks every listing before it goes live.',
  },
  {
    title: 'A family nearby asks for it',
    body: 'They send a request from the listing. You choose whether to accept, and your number stays hidden until you do.',
  },
  {
    title: 'Hand over, and the book starts its next term',
    body: 'Meet at the school gate or a place you pick. They pay you directly at hand-over.',
  },
];

const REASONS = [
  {
    icon: Wallet,
    tone: 'bg-sun text-ink',
    title: 'Money stays with families',
    body: 'You pay a parent, not a shop. Each listing shows how much less it costs than buying new.',
  },
  {
    icon: Leaf,
    tone: 'bg-secondary text-ink',
    title: 'Fewer books printed',
    body: 'Every reused textbook is one less to print, which saves paper and ink.',
  },
  {
    icon: Lock,
    tone: 'bg-primary text-on-primary',
    title: 'Your number stays private',
    body: 'Phone and address only show once a seller accepts a request. No group chats, no spam.',
  },
];

export default function HomePage() {
  const {
    data: listings,
    isLoading,
    isError,
    refetch,
  } = useQuery<ApiListing[]>({
    queryKey: ['listings', 'recent'],
    queryFn: async () => {
      const res = await api.get('/listings', { params: { limit: 8, sortBy: 'newest' } });
      const data = res.data?.data;
      return Array.isArray(data) ? data : [];
    },
    retry: false,
    staleTime: 60_000,
  });

  return (
    <div className="pb-8">
      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden border-b-2 border-edge">
        <div className="container relative pt-12 pb-16 sm:pt-16 sm:pb-20 lg:pt-16 lg:pb-20">
          <HeroSentence />

        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section className="container section-padding">
        <Reveal>
          <h2 className="text-3xl md:text-4xl max-w-[20ch]">How a book gets its second term</h2>
        </Reveal>
        <ol className="mt-10 grid gap-5 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal as="li" key={s.title} delay={i * 90} className="card-premium p-6 md:p-7 flex flex-col gap-3">
              <span className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-sun text-ink border-2 border-edge font-extrabold text-lg shadow-pop-sm">
                {i + 1}
              </span>
              <h3 className="text-xl">{s.title}</h3>
              <p className="text-muted leading-relaxed">{s.body}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* ---------- Recently listed ---------- */}
      <section className="container pb-[72px] lg:pb-[104px]">
        <Reveal className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl md:text-4xl">Ready for their next term</h2>
            <p className="mt-2 text-muted">The newest listings from parents, checked by our team.</p>
          </div>
          <Link href="/browse" className="btn btn-outline">
            Browse all books
          </Link>
        </Reveal>

        {isLoading ? (
          <div className="grid-marketplace" aria-busy="true" aria-label="Loading listings">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card-flat overflow-hidden">
                <div className="aspect-[4/3] skeleton rounded-none" />
                <div className="p-5 space-y-3">
                  <div className="h-4 skeleton" />
                  <div className="h-4 skeleton w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <ErrorState title="We couldn’t load the newest listings" onRetry={() => refetch()} />
        ) : !listings || listings.length === 0 ? (
          <div className="card-flat p-8 sm:p-12 text-center">
            <span className="inline-flex w-14 h-14 items-center justify-center rounded-md bg-sun text-ink border-2 border-edge shadow-pop-sm -rotate-3">
              <BookOpen aria-hidden size={26} strokeWidth={2.25} />
            </span>
            <h3 className="mt-5 text-2xl">Be the first to pass books on</h3>
            <p className="mt-2 text-muted max-w-md mx-auto">
              No listings yet. Add the books your child has outgrown and they&apos;ll show up here.
            </p>
            <Link href="/sell" className="btn btn-primary mt-6">
              List your books
            </Link>
          </div>
        ) : (
          <div className="grid-marketplace">
            {listings.slice(0, 8).map((listing) => (
              <BookCard
                key={listing.id}
                id={listing.id}
                title={listing.title}
                sellingPrice={listing.sellingPrice}
                buyingPrice={listing.buyingPrice}
                condition={listing.condition}
                category={listing.category}
                city={listing.city}
                board={listing.board}
                classLevel={listing.class}
                schoolName={listing.school?.name}
                imageUrl={listing.images?.[0]?.imageUrl}
              />
            ))}
          </div>
        )}
      </section>

      {/* ---------- Why reuse ---------- */}
      <section className="border-y-2 border-edge bg-muted-extra-light">
        <div className="container section-padding">
          <Reveal>
            <h2 className="text-3xl md:text-4xl max-w-[22ch]">Good for your wallet, and for the next class</h2>
          </Reveal>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {REASONS.map((r, i) => (
              <Reveal key={r.title} delay={i * 90} className="card-flat p-6 md:p-7">
                <span className={`inline-flex w-12 h-12 items-center justify-center rounded-md border-2 border-edge shadow-pop-sm ${r.tone}`}>
                  <r.icon aria-hidden size={22} strokeWidth={2.25} />
                </span>
                <h3 className="mt-5 text-xl">{r.title}</h3>
                <p className="mt-2 text-muted leading-relaxed">{r.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Shop by type ---------- */}
      <section className="container section-padding">
        <Reveal>
          <h2 className="text-3xl md:text-4xl">What families pass on</h2>
        </Reveal>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {[
            {
              icon: BookOpen,
              title: 'Textbooks',
              body: 'NCERT, ICSE, State board, IB and IGCSE books, guides and workbooks.',
              href: '/browse?category=BOOK',
              tone: 'bg-primary text-on-primary',
            },
            {
              icon: PencilRuler,
              title: 'Stationery',
              body: 'Geometry boxes, art kits, calculators and unused notebooks.',
              href: '/browse?category=STATIONERY',
              tone: 'bg-secondary text-ink',
            },
          ].map((c, i) => (
            <Reveal key={c.title} delay={i * 90}>
              <Link
                href={c.href}
                className="group card-premium card-interactive flex items-center gap-5 p-6 md:p-8 h-full"
              >
                <span
                  className={`inline-flex w-16 h-16 shrink-0 items-center justify-center rounded-lg border-2 border-edge transition-transform duration-300 ease-pop group-hover:-rotate-6 group-hover:scale-105 ${c.tone}`}
                >
                  <c.icon aria-hidden size={30} strokeWidth={2.25} />
                </span>
                <span className="min-w-0">
                  <span className="block text-2xl font-extrabold tracking-tight">{c.title}</span>
                  <span className="block mt-1 text-muted">{c.body}</span>
                  <span className="inline-block mt-3 font-bold text-primary underline decoration-2 underline-offset-4 decoration-transparent group-hover:decoration-primary transition-colors">
                    Browse {c.title.toLowerCase()}
                  </span>
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- Seller band ---------- */}
      <section className="container">
        <Reveal className="relative overflow-hidden rounded-2xl border-2 border-edge shadow-pop-lg bg-surface-inverse text-white">
          <div className="pencil-stripe" aria-hidden />
          <div className="grid gap-8 p-7 sm:p-10 lg:p-14 lg:grid-cols-[1.4fr_1fr] lg:items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl !text-white max-w-[18ch]">
                Outgrown books can teach another child.
              </h2>
              <p className="mt-4 text-lg text-white/80 max-w-[48ch] leading-relaxed">
                Clear the shelf before the new term. List a full set or a single guide, set your price, and hand it
                over when a family asks.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/sell" className="btn btn-sun btn-lg">
                  List your books
                </Link>
                <Link href="/need" className="btn btn-ghost btn-lg !text-white hover:!bg-white/10">
                  Request a book instead
                </Link>
              </div>
            </div>
            <ul className="grid gap-3 text-white/90">
              {['Checked by our team before it goes live', 'Your number stays hidden until you accept', 'Paid directly at hand-over'].map(
                (t) => (
                  <li key={t} className="flex items-center gap-3 rounded-md border-2 border-white/25 px-4 py-3 font-semibold">
                    <Recycle aria-hidden size={18} className="text-sun shrink-0" />
                    {t}
                  </li>
                ),
              )}
            </ul>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
