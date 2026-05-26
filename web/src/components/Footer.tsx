import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full bg-card border-t border-card-border py-16 mt-20">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-6">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">S</div>
              <span className="text-xl font-bold tracking-tight">Sybrary</span>
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
              <li><Link href="/safety" className="hover:text-primary transition-colors">Safety Tips</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-6">Support</h4>
            <ul className="space-y-4 text-sm text-muted">
              <li><Link href="/contact" className="hover:text-primary transition-colors">Report a problem</Link></li>
              <li><Link href="/help" className="hover:text-primary transition-colors">Help Center</Link></li>
              <li><Link href="/privacy-policy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-card-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-light text-xs">&copy; 2026 Sybrary. Built for parents, by parents.</p>
          <div className="flex gap-6 text-xs text-muted-light">
            <Link href="/safety" className="hover:text-primary transition-colors">Safety Guidelines</Link>
            <Link href="/sitemap" className="hover:text-primary transition-colors">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
