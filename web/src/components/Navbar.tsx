'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import NotificationBell from './NotificationBell';

const NAV_LINKS = [
  { href: '/browse', label: 'Browse' },
  { href: '/need', label: 'Requests' },
  { href: '/papers', label: 'Papers' },
] as const;

export default function Navbar() {
  const { user, isAuthenticated, logout, hydrate } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <nav className="glass sticky top-0 z-50 w-full animate-slide-down">
      <div className="container flex h-20 items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white font-black text-xl shadow-lg shadow-primary/20 transition-transform group-hover:scale-110">
            S
          </div>
          <span className="text-xl font-black tracking-tight text-foreground">
            Sybrary
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-10">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[11px] font-black uppercase tracking-widest text-muted hover:text-primary transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated && user ? (
            <>
              <NotificationBell />
              <div className="relative group">
                <button className="w-10 h-10 rounded-xl bg-primary/10 border border-card-border flex items-center justify-center text-sm font-black text-primary transition-colors hover:bg-primary hover:text-white">
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </button>
                <div className="absolute right-0 top-full mt-2 w-52 card-premium p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <div className="px-3 py-2 border-b border-card-border mb-1">
                    <p className="text-sm font-bold truncate">{user.name}</p>
                    <p className="text-[10px] text-muted truncate">{user.email}</p>
                  </div>
                  <Link href="/dashboard" className="block px-3 py-2 text-xs font-semibold rounded-lg hover:bg-muted-extra-light transition-colors">
                    My Dashboard
                  </Link>
                  <Link href="/sell" className="block px-3 py-2 text-xs font-semibold rounded-lg hover:bg-muted-extra-light transition-colors">
                    List a Book
                  </Link>
                  <Link href="/notifications" className="block px-3 py-2 text-xs font-semibold rounded-lg hover:bg-muted-extra-light transition-colors">
                    Notifications
                  </Link>
                  {user.isAdmin && (
                    <Link href="/admin/dashboard" className="block px-3 py-2 text-xs font-semibold rounded-lg hover:bg-muted-extra-light transition-colors">
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={logout}
                    className="w-full text-left px-3 py-2 text-xs font-semibold rounded-lg hover:bg-accent/10 text-accent transition-colors"
                  >
                    Log out
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="text-xs font-bold px-4 py-2 hover:text-primary transition-colors">Log in</Link>
              <Link href="/sell" className="btn btn-primary h-11 px-6 text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20">List a Book</Link>
            </>
          )}

          {/* Mobile menu toggle */}
          <button
            className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl border border-card-border"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <span className="text-lg">{mobileOpen ? '✕' : '☰'}</span>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden glass border-t border-card-border animate-slide-down">
          <div className="container flex flex-col gap-1 py-4 px-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-xs font-black uppercase tracking-widest text-muted hover:text-primary py-3 transition-colors"
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated ? (
              <>
                <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="text-xs font-black uppercase tracking-widest text-muted hover:text-primary py-3 transition-colors">Dashboard</Link>
                <Link href="/sell" onClick={() => setMobileOpen(false)} className="text-xs font-black uppercase tracking-widest text-primary py-3 transition-colors">List a Book</Link>
              </>
            ) : (
              <Link href="/sell" onClick={() => setMobileOpen(false)} className="text-xs font-black uppercase tracking-widest text-primary py-3 transition-colors">List a Book</Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
