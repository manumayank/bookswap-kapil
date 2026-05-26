'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  Notification,
} from '@/hooks/useNotifications';
import { getNotificationLink, formatRelativeTime } from '@/lib/notificationLinks';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const { data } = useNotifications({ page: 1, limit: 5 });
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const unread = data?.unreadCount ?? 0;
  const items = data?.notifications ?? [];

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (open && ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  function handleClickItem(n: Notification) {
    if (!n.isRead) markRead.mutate(n.id);
    setOpen(false);
    router.push(getNotificationLink(n));
  }

  const badge = unread > 9 ? '9+' : String(unread);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="relative w-10 h-10 rounded-xl bg-primary/10 border border-card-border flex items-center justify-center text-primary transition-colors hover:bg-primary hover:text-white"
      >
        <span aria-hidden className="text-lg">🔔</span>
        {unread > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-accent text-white text-[10px] font-black flex items-center justify-center"
            aria-label={`${unread} unread notifications`}
          >
            {badge}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 card-premium p-2 z-50">
          <div className="flex items-center justify-between px-3 py-2 border-b border-card-border mb-1">
            <p className="text-sm font-bold">Notifications</p>
            {unread > 0 && (
              <button
                onClick={() => markAll.mutate()}
                className="text-[10px] font-bold text-primary hover:underline"
                disabled={markAll.isPending}
              >
                Mark all as read
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <p className="px-3 py-6 text-xs text-muted text-center">No notifications yet.</p>
          ) : (
            <ul className="max-h-96 overflow-y-auto">
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => handleClickItem(n)}
                    className={`w-full text-left px-3 py-3 rounded-lg transition-colors hover:bg-muted-extra-light ${
                      !n.isRead ? 'bg-primary/5 border-l-2 border-primary' : ''
                    }`}
                  >
                    <p className="text-xs font-bold truncate">{n.title}</p>
                    <p className="text-[11px] text-muted mt-0.5 line-clamp-2">{n.body}</p>
                    <p className="text-[10px] text-muted mt-1">{formatRelativeTime(n.sentAt)}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="block mt-1 px-3 py-2 text-center text-[11px] font-bold text-primary hover:bg-muted-extra-light rounded-lg transition-colors"
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
