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
  MessageSquareWarning,
} from 'lucide-react';

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/listings', label: 'Listings', icon: BookOpen },
  { href: '/admin/requests', label: 'Requests', icon: ClipboardList },
  { href: '/admin/grievances', label: 'Grievances', icon: MessageSquareWarning },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/schools', label: 'Schools', icon: School },
];

// Height of the global Navbar (72px row + 2px bottom border).
const NAV_OFFSET = 'top-[74px]';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground md:flex-row">
      {/* Phones and tablets: horizontal chip row under the Navbar */}
      <nav aria-label="Admin" className={`sticky ${NAV_OFFSET} z-40 border-b-2 border-edge bg-background md:hidden`}>
        <ul className="flex gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none]">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <li key={item.href} className="shrink-0">
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  data-active={active ? 'true' : undefined}
                  className="chip whitespace-nowrap"
                >
                  <Icon size={16} strokeWidth={2.25} aria-hidden="true" />
                  {item.label}
                </Link>
              </li>
            );
          })}
          <li className="shrink-0">
            <Link href="/" className="chip whitespace-nowrap border-transparent bg-transparent text-muted">
              <LogOut size={16} aria-hidden="true" />
              Leave admin
            </Link>
          </li>
        </ul>
      </nav>

      {/* Sidebar (md and up) */}
      <aside
        className={`hidden w-60 shrink-0 flex-col border-r-2 border-edge bg-card md:sticky md:flex ${NAV_OFFSET} md:h-[calc(100vh-74px)]`}
      >
        <div className="px-4 pb-4 pt-5">
          <Link href="/admin/dashboard" aria-label="Sybrary admin home" className="flex items-center gap-3 rounded-md">
            <Logo variant="short" height={36} theme="auto" />
            <span className="leading-tight">
              <span className="block text-base font-extrabold">Sybrary</span>
              <span className="block text-[13px] font-semibold text-muted">Admin</span>
            </span>
          </Link>
        </div>

        <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={`flex h-11 items-center gap-3 rounded-md border-2 px-3 text-[15px] font-semibold transition-colors ${
                      active
                        ? 'border-edge bg-sun text-ink shadow-pop-sm'
                        : 'border-transparent text-muted hover:bg-muted-extra-light hover:text-foreground'
                    }`}
                  >
                    <Icon size={18} strokeWidth={2.25} aria-hidden="true" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t-2 border-card-border p-3">
          <Link
            href="/"
            className="flex h-11 items-center gap-3 rounded-md border-2 border-transparent px-3 text-[15px] font-semibold text-muted transition-colors hover:bg-muted-extra-light hover:text-foreground"
          >
            <LogOut size={18} aria-hidden="true" />
            Leave admin
          </Link>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8 lg:px-10">
        <div className="mx-auto max-w-[1160px]">{children}</div>
      </main>
    </div>
  );
}
