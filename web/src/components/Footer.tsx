import Link from 'next/link';
import Logo from '@/components/Logo';

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
    title: 'Sell books',
    links: [
      { href: '/sell', label: 'List your books' },
      { href: '/dashboard', label: 'Your dashboard' },
      { href: '/dashboard/deals', label: 'Your deals' },
    ],
  },
  {
    title: 'Help',
    links: [
      { href: '/contact', label: 'Report a problem' },
      { href: '/notifications', label: 'Notifications' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mt-24 border-t-2 border-edge bg-muted-extra-light">
      <div className="pencil-stripe" aria-hidden />
      <div className="container py-14">
        <div className="grid gap-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-w-sm">
            <Link href="/" aria-label="Sybrary home" className="inline-flex rounded-lg">
              <Logo variant="full" height={48} />
            </Link>
            <p className="mt-4 text-muted leading-relaxed">
              Parents selling last year&apos;s school books to parents who need them this year. Your phone number
              stays private until you agree to a deal.
            </p>
            <Link href="/sell" className="btn btn-sun mt-6">
              List your books
            </Link>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h2 className="text-base font-extrabold mb-4">{col.title}</h2>
              <ul className="space-y-1">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="inline-flex items-center min-h-10 text-muted font-medium hover:text-foreground underline-offset-4 hover:underline decoration-2 decoration-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t-2 border-card-border flex flex-col sm:flex-row gap-3 justify-between text-sm text-muted">
          <p>&copy; {new Date().getFullYear()} Sybrary</p>
          <p>Textbooks and stationery only. Every listing is checked before it goes live.</p>
        </div>
      </div>
    </footer>
  );
}
