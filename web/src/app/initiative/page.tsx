import type { Metadata } from 'next';
import Link from 'next/link';
import Scribble from '@/components/initiative/Scribble';
import { hand } from '@/components/initiative/hand';
import { Highlight, Note, Polaroid, Ruled, StickyNote } from '@/components/initiative/Notebook';

export const metadata: Metadata = {
  title: 'Our initiative – Sybrary',
  description:
    'Why we started Sybrary: school books are bought new every year and outgrown within one. Reusing them saves families money and means fewer books printed.',
};

const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=600&h=750&q=70`;

const PHOTOS = {
  stack: {
    src: img('photo-1686161238569-f32e92b6c363'),
    alt: 'A tall stack of books on a wooden table',
    credit: { name: 'Kelsy Gagnebin', href: 'https://unsplash.com/photos/a-stack-of-books-sitting-on-top-of-a-table-jcD8lXN27Xs' },
  },
  pencils: {
    src: img('photo-1513542789411-b6a5d4f31634'),
    alt: 'Coloured pencils lined up side by side on a white surface',
    credit: { name: 'Jess Bailey', href: 'https://unsplash.com/photos/l3N9Q27zULw' },
  },
  pen: {
    src: img('photo-1643222797501-fa6f15af1037'),
    alt: 'A small stack of books with a pen resting on top',
    credit: { name: 'Yuda Feby', href: 'https://unsplash.com/photos/a-stack-of-books-and-a-pen-on-a-table-sGimdDhwSWQ' },
  },
  reader: {
    src: img('photo-1540151812223-c30b3fab58e6'),
    alt: 'A boy sitting at a red table, reading a book',
    credit: { name: 'Anita Jankovic', href: 'https://unsplash.com/photos/boy-sitting-near-red-table-reading-book-162ppyjclxM' },
  },
};

const SOURCE_TREES =
  'http://conservatree.org/learn/EnviroIssues/TreeStats.shtml';

const STEPS = [
  {
    title: 'List what your child has outgrown',
    body: 'Add a photo, the class, board and school, and your price. Someone from our team checks every listing before it goes live.',
  },
  {
    title: 'A family asks for it',
    body: 'They send a request from the listing. You decide whether to accept. Until you do, your phone number and address stay hidden.',
  },
  {
    title: 'Hand it over',
    body: 'Once you accept, contact details are shared so you can plan the hand-over. Meet at the school gate or a place you choose; they pay you when the books change hands.',
  },
];

const p = 'text-[17px] leading-[30px] text-foreground';
const h2 = 'text-2xl md:text-[1.75rem] leading-[30px] md:leading-[30px]';

export default function InitiativePage() {
  return (
    <div className="container py-10 sm:py-16 animate-fade-in">
      <article className="relative mx-auto max-w-[940px] rounded-xl border-2 border-edge bg-card shadow-pop-lg">
        {/* Binder holes (tablet and up) */}
        <div aria-hidden className="hidden sm:flex absolute left-4 top-10 bottom-10 flex-col justify-between">
          {Array.from({ length: 9 }).map((_, i) => (
            <span key={i} className="block w-5 h-5 rounded-full bg-background border-2 border-edge shadow-[inset_2px_2px_0_0_var(--drop)]" />
          ))}
        </div>

        {/* Red margin line */}
        <div aria-hidden className="absolute inset-y-0 left-[30px] sm:left-[64px] w-[2px] bg-accent/55" />

        {/* Tape holding the sheet */}
        <span
          aria-hidden
          className="absolute -top-3 right-8 sm:right-16 h-7 w-28 rotate-[4deg] bg-sun/60 border border-edge/20"
        />

        <div className="pl-[46px] pr-5 sm:pl-[96px] sm:pr-10 lg:pr-14 pt-[60px] pb-[60px]">
          {/* ---------- Title ---------- */}
          <header>
            <h1 className="text-4xl md:text-5xl leading-[1.08] max-w-[16ch]">
              Every school book deserves a second life
            </h1>
            <Note className="mt-6 max-w-[40ch] -rotate-1">
              A few pages on why we started Sybrary, how it works, and where we hope it goes.
            </Note>
          </header>

          {/* ---------- Why we started ---------- */}
          <Ruled className="mt-[60px]">
            <h2 className={h2}>Why we started</h2>

            <Polaroid
              {...PHOTOS.stack}
              caption="One year of books. Then what?"
              tilt={3}
              className="mx-auto my-[30px] md:float-right md:ml-10 md:mr-[-8px] md:mt-[6px] md:mb-[30px] md:w-[240px]"
            />

            <div className="max-w-[62ch]">
              <p className={`mt-[30px] ${p}`}>
                It happens every year. The book list comes home, and families queue at the school shop or the
                bookstore near the gate to buy the full set new. The books get covered in brown paper, labelled,
                carried to school and back, and written in.
              </p>
              <p className={`mt-[30px] ${p}`}>
                Then, <Scribble kind="circle">within a year</Scribble>, they&apos;re outgrown. Most go on a
                shelf or into a cupboard. Some are given to the raddiwala. A few go to a cousin, if the cousin
                happens to be in the right class and the right board.
              </p>
              <p className={`mt-[30px] ${p}`}>
                Meanwhile, a family a few streets away is buying those same titles new for their child, who is
                moving up into that class. Two families, the same books, and no easy way to find each other.
                That&apos;s the gap we wanted to close.
              </p>
            </div>
          </Ruled>

          {/* ---------- What reuse saves ---------- */}
          <Ruled className="mt-[60px]" id="what-reuse-saves">
            <h2 className={h2}>What reuse saves</h2>

            <Polaroid
              {...PHOTOS.pencils}
              caption="Barely used, ready to pass on"
              tilt={-3}
              className="mx-auto my-[30px] md:float-right md:ml-10 md:mr-[-8px] md:mt-[6px] md:w-[240px]"
            />

            <div className="max-w-[62ch]">
              <p className={`mt-[30px] ${p}`}>
                <strong>Money, for both families.</strong> The parent buying pays less than the shop price, and
                the parent passing books on gets something back for books that would otherwise sit unused. The
                money moves between two families, at the school gate.
              </p>
              <p className={`mt-[30px] ${p}`}>
                <strong>Paper, trees and ink.</strong> School textbooks are printed on new paper, and paper comes
                from trees. One rough estimate puts it at about 24 trees for every ton of printing and writing
                paper made from new (virgin) pulp.
                <sup className="ml-0.5">
                  <a
                    href="#fn-1"
                    id="ref-1"
                    aria-label="Footnote 1"
                    className="font-bold text-primary underline decoration-2 underline-offset-2"
                  >
                    1
                  </a>
                </sup>{' '}
                We can&apos;t count how many books Sybrary keeps from being printed, but the idea is simple:{' '}
                <Highlight>every book that&apos;s reused is one less that needs printing.</Highlight>
              </p>
              <p className={`mt-[30px] ${p}`}>
                <strong>Stationery, too.</strong> Geometry boxes, art kits, calculators and notebooks with half
                their pages still blank. They&apos;re made to last far longer than one school year.
              </p>
            </div>

            <StickyNote tone="green" tilt={-2} className="mt-[30px] max-w-[300px]">
              <p className={`${hand} text-[1.6rem] leading-[1.15]`}>
                Reuse first. Recycle only when a book is truly worn out.
              </p>
            </StickyNote>
          </Ruled>

          {/* ---------- How it works ---------- */}
          <Ruled className="mt-[60px]" id="how-it-works">
            <h2 className={h2}>How it works</h2>

            <ol className="mt-[30px] max-w-[62ch] space-y-[30px]">
              {STEPS.map((s, i) => (
                <li key={s.title} className="grid grid-cols-[2.25rem_1fr] gap-x-2">
                  <span aria-hidden className={`${hand} text-[2.1rem] leading-[30px] font-bold text-accent`}>
                    {i + 1}.
                  </span>
                  <div>
                    <h3 className="text-lg leading-[30px] font-bold">{s.title}</h3>
                    <p className={p}>{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-[60px] grid gap-10 md:grid-cols-[1fr_260px] md:items-start">
              <StickyNote tone="lavender" tilt={1.5} className="max-w-[340px]">
                <p className="font-bold leading-snug">
                  Your phone number and address stay private until you accept a request.
                </p>
                <p className="mt-2 text-sm leading-relaxed">
                  No group chats and no numbers shared up front. Contact details are shared only once a
                  request is accepted.
                </p>
              </StickyNote>
              <Polaroid {...PHOTOS.pen} caption="Checked, listed, passed on" tilt={-2} className="mx-auto md:mx-0" />
            </div>
          </Ruled>

          {/* ---------- What we're aiming for ---------- */}
          <Ruled className="mt-[60px]" id="what-were-aiming-for">
            <h2 className={h2}>What we&apos;re aiming for</h2>

            <Polaroid
              {...PHOTOS.reader}
              caption="Its next reader"
              tilt={2.5}
              className="mx-auto my-[30px] md:float-right md:ml-10 md:mr-[-8px] md:mt-[6px] md:w-[240px]"
            />

            <div className="max-w-[62ch]">
              <p className={`mt-[30px] ${p}`}>
                We&apos;d like every school book to be{' '}
                <Scribble kind="underline">used by more than one child</Scribble>. A textbook that teaches one
                class and then waits in a cupboard has done half its job.
              </p>
              <p className={`mt-[30px] ${p}`}>
                We also want passing books on to feel normal at the school gate: at the end of term, you list
                what your child has finished, and a family moving up into that class picks it up. Parents helping
                parents, without anyone having to organise it.
              </p>
              <p className={`mt-[30px] ${p}`}>
                And if the book you need isn&apos;t listed yet, you can{' '}
                <Link href="/need" className="font-bold text-primary underline decoration-2 underline-offset-4">
                  request it
                </Link>
                . We&apos;ll let you know when a family near you lists a match.
              </p>
            </div>
          </Ruled>

          {/* ---------- Call to action ---------- */}
          <section className="mt-[60px] pt-[30px] border-t-2 border-dashed border-edge/40 clear-both">
            <h2 className="text-2xl md:text-3xl max-w-[22ch]">Pass this year&apos;s books on</h2>
            <p className="mt-3 max-w-[52ch] text-[17px] leading-[30px] text-muted">
              List what your child has outgrown in a couple of minutes, or find the books for next year from
              families nearby.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link href="/sell" className="btn btn-primary btn-lg">
                List your books
              </Link>
              <Link href="/browse" className="btn btn-outline btn-lg">
                Find books
              </Link>
            </div>
            <Note className="mt-6 -rotate-1">See you at the school gate.</Note>
          </section>
        </div>
      </article>

      {/* ---------- Footnotes and credits ---------- */}
      <footer className="mx-auto max-w-[940px] mt-8 px-1 sm:px-2 text-sm leading-relaxed text-muted">
        <ol className="space-y-1">
          <li id="fn-1">
            <span className="font-bold">1.</span>{' '}
            Conservatree, &ldquo;Trees into paper&rdquo;: a rough average of 24 trees per ton of printing
            and writing paper (kraft process, virgin fibre). The page itself calls all such figures
            ballpark estimates.{' '}
            <a
              href={SOURCE_TREES}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-1 underline-offset-2 hover:decoration-primary"
            >
              Read the source
            </a>{' '}
            <a href="#ref-1" className="underline decoration-1 underline-offset-2 hover:decoration-primary">
              Back to text
            </a>
          </li>
        </ol>
        <p className="mt-3 text-muted-light">
          Photos from Unsplash by{' '}
          {Object.values(PHOTOS).map((ph, i, arr) => (
            <span key={ph.credit.name}>
              <a
                href={ph.credit.href}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-1 underline-offset-2 hover:decoration-primary"
              >
                {ph.credit.name}
              </a>
              {i < arr.length - 2 ? ', ' : i === arr.length - 2 ? ' and ' : '.'}
            </span>
          ))}
        </p>
      </footer>
    </div>
  );
}
