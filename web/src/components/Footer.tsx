import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full bg-card border-t border-card-border py-16 mt-20">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-6">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">S</div>
              <span className="text-xl font-bold tracking-tight">Sybrary</span>
            </Link>
            <p className="text-muted text-sm leading-relaxed">
              Making education accessible and sustainable for parents through effortless local book exchanges.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-6">Categories</h4>
            <ul className="space-y-4 text-sm text-muted">
              <li><Link href="/browse?category=Book" className="hover:text-primary transition-colors">School Books</Link></li>
              <li><Link href="/browse?category=Stationery" className="hover:text-primary transition-colors">Stationery</Link></li>
              <li><Link href="/browse?condition=New" className="hover:text-primary transition-colors">New Materials</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-6">Support</h4>
            <ul className="space-y-4 text-sm text-muted">
              <li><Link href="/help" className="hover:text-primary transition-colors">Help Center</Link></li>
              <li><Link href="/privacy-policy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-6">Connect</h4>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-background border border-card-border flex items-center justify-center hover:bg-primary/5 cursor-pointer transition-colors text-sm font-bold" aria-label="Twitter">
                X
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-background border border-card-border flex items-center justify-center hover:bg-primary/5 cursor-pointer transition-colors text-sm font-bold" aria-label="LinkedIn">
                in
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-background border border-card-border flex items-center justify-center hover:bg-primary/5 cursor-pointer transition-colors text-sm font-bold" aria-label="Instagram">
                ig
              </a>
            </div>
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
