'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from '@/components/Logo';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  School,
  ClipboardList,
  LogOut,
  AlertTriangle
} from 'lucide-react';

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/listings', label: 'Listings', icon: BookOpen },
  { href: '/admin/requests', label: 'Requests', icon: ClipboardList },
  { href: '/admin/schools', label: 'Schools', icon: School },
  { href: '/admin/grievances', label: 'Grievances', icon: AlertTriangle },
];

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-light)] focus-visible:ring-offset-2';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col md:flex-row">
      {/* Mobile nav: horizontal pill row, sticks under the public Navbar */}
      <nav
        aria-label="Admin"
        className="md:hidden sticky top-20 z-40 bg-slate-900 text-white border-b border-white/10"
      >
        <ul className="flex gap-2 overflow-x-auto px-4 py-2">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <li key={item.href} className="shrink-0">
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-2 h-10 px-4 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ring-offset-slate-900 ${focusRing} ${
                    active
                      ? 'bg-[var(--primary-dark)] text-white'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon size={16} aria-hidden="true" />
                  {item.label}
                </Link>
              </li>
            );
          })}
          <li className="shrink-0">
            <Link
              href="/"
              className={`flex items-center gap-2 h-10 px-4 rounded-full text-sm font-semibold whitespace-nowrap text-slate-300 hover:bg-white/10 hover:text-white transition-colors ring-offset-slate-900 ${focusRing}`}
            >
              <LogOut size={16} aria-hidden="true" />
              Exit
            </Link>
          </li>
        </ul>
      </nav>

      {/* Sidebar (md and up) */}
      <aside className="hidden md:flex md:sticky md:top-20 md:h-[calc(100vh-5rem)] w-64 shrink-0 bg-slate-900 text-white flex-col">
        <div className="p-4 border-b border-white/10">
          <Link
            href="/admin/dashboard"
            aria-label="Sybrary admin"
            className={`flex items-center gap-2 rounded-lg ring-offset-slate-900 ${focusRing}`}
          >
            <Logo variant="short" height={32} theme="dark" />
            <span className="text-lg font-bold">Sybrary <span className="text-slate-400 font-semibold">Admin</span></span>
          </Link>
        </div>

        <nav aria-label="Admin" className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center gap-3 px-4 h-11 rounded-lg font-medium transition-colors ring-offset-slate-900 ${focusRing} ${
                      active
                        ? 'bg-[var(--primary-dark)] text-white'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon size={20} aria-hidden="true" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-white/10">
          <Link
            href="/"
            className={`flex items-center gap-3 px-4 h-11 rounded-lg font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors ring-offset-slate-900 ${focusRing}`}
          >
            <LogOut size={20} aria-hidden="true" />
            Exit Admin
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}
