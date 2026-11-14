'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import NotificationBell from './NotificationBell';
import Logo from '@/components/Logo';

const NAV_LINKS = [
  { href: '/browse', label: 'Browse' },
  { href: '/need', label: 'Requests' },
  { href: '/papers', label: 'Papers' },
] as const;

const MENU_ITEM =
  'block px-3 py-2.5 text-sm font-semibold rounded-lg hover:bg-muted-extra-light transition-colors';
const MOBILE_ITEM =
  'text-xs font-black uppercase tracking-widest text-muted hover:text-primary py-3 transition-colors';

export default function Navbar() {
  const { user, isAuthenticated, isHydrated, logout, hydrate } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Close avatar menu on outside click / Escape
  useEffect(() => {
    if (!menuOpen) return;
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const closeAll = () => {
    setMenuOpen(false);
    setMobileOpen(false);
  };

  const handleLogout = () => {
    closeAll();
    logout();
  };

  return (
    <nav className="glass sticky top-0 z-50 w-full animate-slide-down">
      <div className="container flex h-20 items-center justify-between gap-3">
        <Link href="/" aria-label="Sybrary home" className="flex items-center shrink-0 transition-opacity hover:opacity-85">
          <span className="hidden sm:flex"><Logo variant="full" height={44} /></span>
          <span className="flex sm:hidden"><Logo variant="short" height={36} /></span>
        </Link>

        <div className="hidden lg:flex items-center gap-10">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs font-black uppercase tracking-widest text-muted hover:text-primary transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {!isHydrated ? (
            <div className="flex items-center gap-3" aria-hidden>
              <div className="skeleton w-10 h-10 rounded-xl" />
              <div className="skeleton hidden sm:block w-28 h-10 rounded-xl" />
            </div>
          ) : isAuthenticated && user ? (
            <>
              <NotificationBell />
              <div ref={menuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  aria-label="Account menu"
                  className="w-10 h-10 rounded-xl bg-primary/10 border border-card-border flex items-center justify-center text-sm font-black text-primary transition-colors hover:bg-primary hover:text-white"
                >
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full pt-2 w-56 z-50">
                    <div role="menu" className="card-flat p-2 shadow-xl">
                      <div className="px-3 py-2 border-b border-card-border mb-1">
                        <p className="text-sm font-bold truncate">{user.name}</p>
                        <p className="text-xs text-muted truncate">{user.email}</p>
                      </div>
                      <Link role="menuitem" href="/dashboard" onClick={closeAll} className={MENU_ITEM}>
                        My Dashboard
                      </Link>
                      <Link role="menuitem" href="/dashboard/deals" onClick={closeAll} className={MENU_ITEM}>
                        My Deals
                      </Link>
                      <Link role="menuitem" href="/sell" onClick={closeAll} className={MENU_ITEM}>
                        List a Book
                      </Link>
                      <Link role="menuitem" href="/notifications" onClick={closeAll} className={MENU_ITEM}>
                        Notifications
                      </Link>
                      {user.isAdmin && (
                        <Link role="menuitem" href="/admin/dashboard" onClick={closeAll} className={MENU_ITEM}>
                          Admin Panel
                        </Link>
                      )}
                      <button
                        role="menuitem"
                        type="button"
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2.5 text-sm font-semibold rounded-lg hover:bg-accent/10 text-accent transition-colors"
                      >
                        Log out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="hidden sm:inline text-sm font-bold px-4 py-2 hover:text-primary transition-colors">
                Log in
              </Link>
              <Link
                href="/sell"
                className="btn btn-primary hidden sm:inline-flex h-11 px-6 text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20"
              >
                List a Book
              </Link>
            </>
          )}

          {/* Mobile menu toggle */}
          <button
            type="button"
            className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl border border-card-border"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            <span className="text-lg" aria-hidden>{mobileOpen ? '✕' : '☰'}</span>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden glass border-t border-card-border animate-slide-down">
          <div className="container flex flex-col gap-1 py-4">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} onClick={closeAll} className={MOBILE_ITEM}>
                {link.label}
              </Link>
            ))}
            {isAuthenticated ? (
              <>
                <Link href="/dashboard" onClick={closeAll} className={MOBILE_ITEM}>Dashboard</Link>
                <Link href="/dashboard/deals" onClick={closeAll} className={MOBILE_ITEM}>My Deals</Link>
                <Link href="/notifications" onClick={closeAll} className={MOBILE_ITEM}>Notifications</Link>
                {user?.isAdmin && (
                  <Link href="/admin/dashboard" onClick={closeAll} className={MOBILE_ITEM}>Admin Panel</Link>
                )}
                <Link href="/sell" onClick={closeAll} className={`${MOBILE_ITEM} !text-primary`}>List a Book</Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-left text-xs font-black uppercase tracking-widest text-accent py-3"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={closeAll} className={MOBILE_ITEM}>Log in</Link>
                <Link href="/sell" onClick={closeAll} className={`${MOBILE_ITEM} !text-primary`}>List a Book</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
