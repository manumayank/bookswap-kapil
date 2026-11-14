'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Menu, X, LayoutDashboard, ArrowLeftRight, Bell, Shield, LogOut, PlusCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import NotificationBell from './NotificationBell';
import ThemeToggle from './ThemeToggle';
import Logo from '@/components/Logo';

// Each link is a sticker: its own fill and resting tilt. Fills are light in
// both themes, so the text is always ink.
const NAV_LINKS = [
  { href: '/browse', label: 'Browse', fill: 'bg-sun', tilt: '-rotate-3' },
  { href: '/need', label: 'Requests', fill: 'bg-[#bfe9d6]', tilt: 'rotate-2' },
  { href: '/papers', label: 'Exam papers', fill: 'bg-[#ffd0d8]', tilt: '-rotate-2' },
  { href: '/initiative', label: 'Our initiative', fill: 'bg-[#d9d7ff]', tilt: 'rotate-3' },
] as const;

const STICKER =
  'inline-flex items-center h-10 px-3 xl:px-4 rounded-[10px] border-2 border-[#17153a] text-ink text-[0.9375rem] font-extrabold transition-[transform,box-shadow] duration-200 ease-pop hover:rotate-0 hover:scale-[1.06] active:scale-95';

const MENU_ITEM =
  'flex items-center gap-3 px-3 h-11 text-[0.9375rem] font-semibold rounded-[10px] text-foreground hover:bg-muted-extra-light transition-colors';

export default function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, isHydrated, logout, hydrate } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Close menus on navigation
  useEffect(() => {
    setMenuOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  // Close avatar menu on outside click / Escape
  useEffect(() => {
    if (!menuOpen && !mobileOpen) return;
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setMobileOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen, mobileOpen]);

  const isActive = (href: string) => pathname === href || pathname?.startsWith(`${href}/`);

  const handleLogout = () => {
    setMenuOpen(false);
    setMobileOpen(false);
    logout();
  };

  const initial = user?.name?.trim()?.charAt(0)?.toUpperCase() || 'U';

  return (
    <header className="glass border-dashed sticky top-0 z-50 w-full">
      <nav aria-label="Main" className="container flex h-[72px] items-center justify-between gap-3">
        <Link href="/" aria-label="Sybrary home" className="flex items-center shrink-0 rounded-lg">
          <span className="hidden sm:flex"><Logo variant="full" height={46} /></span>
          <span className="flex sm:hidden"><Logo variant="short" height={40} /></span>
        </Link>

        <ul className="hidden lg:flex items-center gap-2 xl:gap-3">
          {NAV_LINKS.map((link) => {
            const active = isActive(link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={`${STICKER} ${link.fill} ${
                    active ? 'rotate-0 shadow-[3px_3px_0_0_#17153a] -translate-y-0.5' : `${link.tilt} shadow-[2px_2px_0_0_#17153a]`
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          {!isHydrated ? (
            <div className="flex items-center gap-2" aria-hidden>
              <div className="skeleton w-10 h-10" />
              <div className="skeleton hidden sm:block w-36 h-10" />
            </div>
          ) : isAuthenticated && user ? (
            <>
              <NotificationBell />
              <div ref={menuRef} className="relative hidden lg:block">
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  aria-label="Account menu"
                  className="btn btn-sun btn-sm btn-icon rounded-full text-base font-extrabold"
                  style={{ width: 40, height: 40, borderRadius: 999 }}
                >
                  {initial}
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full pt-3 w-64 z-50">
                    <div role="menu" className="card-premium p-2 animate-menu">
                      <div className="px-3 pt-2 pb-3 mb-1 border-b-2 border-card-border">
                        <p className="font-bold truncate">{user.name}</p>
                        <p className="text-sm text-muted truncate">{user.email}</p>
                      </div>
                      <Link role="menuitem" href="/dashboard" className={MENU_ITEM}>
                        <LayoutDashboard size={18} aria-hidden /> Your dashboard
                      </Link>
                      <Link role="menuitem" href="/dashboard/deals" className={MENU_ITEM}>
                        <ArrowLeftRight size={18} aria-hidden /> Your deals
                      </Link>
                      <Link role="menuitem" href="/notifications" className={MENU_ITEM}>
                        <Bell size={18} aria-hidden /> Notifications
                      </Link>
                      {user.isAdmin && (
                        <Link role="menuitem" href="/admin/dashboard" className={MENU_ITEM}>
                          <Shield size={18} aria-hidden /> Admin
                        </Link>
                      )}
                      <button
                        role="menuitem"
                        type="button"
                        onClick={handleLogout}
                        className={`${MENU_ITEM} w-full text-left !text-accent hover:!bg-accent/10`}
                      >
                        <LogOut size={18} aria-hidden /> Log out
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <Link href="/sell" className="btn btn-primary btn-sm hidden sm:inline-flex">
                <PlusCircle size={18} aria-hidden /> Sell books
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost btn-sm hidden sm:inline-flex">
                Log in
              </Link>
              <Link href="/sell" className="btn btn-primary btn-sm hidden sm:inline-flex">
                Sell your books
              </Link>
            </>
          )}

          <button
            type="button"
            className="btn btn-outline btn-sm btn-icon lg:hidden"
            style={{ width: 40, height: 40 }}
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
          >
            {mobileOpen ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div id="mobile-menu" className="lg:hidden border-t-2 border-edge bg-background animate-slide-down">
          <div className="container py-4 flex flex-col gap-2 max-h-[calc(100dvh-72px)] overflow-y-auto">
            <ul className="grid grid-cols-1 gap-2">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={isActive(link.href) ? 'page' : undefined}
                    className={`flex items-center justify-between h-12 px-4 rounded-[10px] border-2 border-[#17153a] text-ink font-extrabold text-lg transition-transform duration-200 ease-pop active:scale-[.98] ${link.fill} ${
                      isActive(link.href) ? 'shadow-[3px_3px_0_0_#17153a]' : 'shadow-[2px_2px_0_0_#17153a]'
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            {isHydrated && isAuthenticated && user ? (
              <div className="card-flat p-2 mt-2">
                <p className="px-3 pt-2 pb-2 text-sm text-muted truncate">Signed in as {user.name}</p>
                <Link href="/dashboard" className={MENU_ITEM}><LayoutDashboard size={18} aria-hidden /> Your dashboard</Link>
                <Link href="/dashboard/deals" className={MENU_ITEM}><ArrowLeftRight size={18} aria-hidden /> Your deals</Link>
                <Link href="/notifications" className={MENU_ITEM}><Bell size={18} aria-hidden /> Notifications</Link>
                {user.isAdmin && (
                  <Link href="/admin/dashboard" className={MENU_ITEM}><Shield size={18} aria-hidden /> Admin</Link>
                )}
                <button type="button" onClick={handleLogout} className={`${MENU_ITEM} w-full text-left !text-accent`}>
                  <LogOut size={18} aria-hidden /> Log out
                </button>
              </div>
            ) : isHydrated ? (
              <Link href="/login" className="btn btn-outline w-full mt-2">Log in</Link>
            ) : null}

            <Link href="/sell" className="btn btn-primary w-full">Sell your books</Link>
          </div>
        </div>
      )}
    </header>
  );
}
