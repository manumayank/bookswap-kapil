import Link from 'next/link';
import Logo from '@/components/Logo';

export default function Footer() {
  return (
    <footer className="w-full bg-card border-t border-card-border py-16 mt-20">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12">
          <div className="md:col-span-2">
            <Link href="/" aria-label="Sybrary home" className="inline-flex items-center mb-6">
              <Logo variant="full" height={40} />
            </Link>
            <p className="text-muted text-sm leading-relaxed max-w-sm">
              Making education accessible and sustainable for parents through effortless local book exchanges.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-6">For Buyers</h4>
            <ul className="space-y-4 text-sm text-muted">
              <li><Link href="/browse" className="hover:text-primary transition-colors">Browse Books</Link></li>
              <li><Link href="/need" className="hover:text-primary transition-colors">Post a Request</Link></li>
              <li><Link href="/papers" className="hover:text-primary transition-colors">Question Papers</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-6">For Sellers</h4>
            <ul className="space-y-4 text-sm text-muted">
              <li><Link href="/sell" className="hover:text-primary transition-colors">List a Book</Link></li>
              <li><Link href="/dashboard" className="hover:text-primary transition-colors">Seller Dashboard</Link></li>
              <li><Link href="/dashboard/deals" className="hover:text-primary transition-colors">My Deals</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-6">Support</h4>
            <ul className="space-y-4 text-sm text-muted">
              <li><Link href="/contact" className="hover:text-primary transition-colors">Report a problem</Link></li>
              <li><Link href="/notifications" className="hover:text-primary transition-colors">Notifications</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-card-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-light text-xs">&copy; 2026 Sybrary. Built for parents, by parents.</p>
          <div className="flex gap-6 text-xs text-muted-light">
            <Link href="/contact" className="hover:text-primary transition-colors">Contact us</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
