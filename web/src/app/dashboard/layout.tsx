'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';

const navItems = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/deals', label: 'My Deals' },
  { href: '/sell', label: 'Give Books' },
  { href: '/browse', label: 'Find Books' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.replace('/login');
      }
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container pt-8">
        {/* In-page section tabs (global Navbar stays the only sticky header) */}
        <nav
          aria-label="Dashboard sections"
          className="flex gap-2 overflow-x-auto pb-2 border-b border-card-border"
        >
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted hover:text-foreground hover:bg-muted-extra-light'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <main className="container py-8">
        {children}
      </main>
    </div>
  );
}
