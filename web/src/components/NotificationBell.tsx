'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bell } from 'lucide-react';
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

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', handle);
      document.removeEventListener('keydown', onKey);
    };
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
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
        aria-haspopup="true"
        aria-expanded={open}
        className="btn btn-outline btn-sm btn-icon relative"
        style={{ width: 40, height: 40 }}
      >
        <Bell size={18} strokeWidth={2.4} aria-hidden className={unread > 0 ? 'origin-top animate-[bellRing_1.2s_ease-in-out_1]' : ''} />
        {unread > 0 && (
          <span
            aria-hidden
            className="absolute -top-2 -right-2 min-w-[22px] h-[22px] px-1 rounded-full bg-danger text-on-accent border-2 border-edge text-[11px] font-extrabold flex items-center justify-center"
          >
            {badge}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-4 top-[84px] sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:mt-3 sm:w-[340px] z-50">
          <div className="card-premium p-2 animate-menu">
            <div className="flex items-center justify-between gap-2 px-3 pt-2 pb-3 mb-1 border-b-2 border-card-border">
              <p className="font-bold">Notifications</p>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={() => markAll.mutate()}
                  className="text-sm font-semibold text-primary hover:underline underline-offset-4 px-2 h-10 rounded-md"
                  disabled={markAll.isPending}
                >
                  Mark all as read
                </button>
              )}
            </div>

            {items.length === 0 ? (
              <p className="px-3 py-8 text-sm text-muted text-center">
                You&apos;re all caught up. We&apos;ll let you know when a buyer or seller replies.
              </p>
            ) : (
              <ul className="max-h-96 overflow-y-auto">
                {items.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => handleClickItem(n)}
                      className="w-full text-left px-3 py-3 rounded-[10px] transition-colors hover:bg-muted-extra-light flex gap-3"
                    >
                      <span
                        aria-hidden
                        className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${n.isRead ? 'bg-transparent' : 'bg-primary'}`}
                      />
                      <span className="min-w-0">
                        <span className={`block text-sm truncate ${n.isRead ? 'font-medium' : 'font-bold'}`}>
                          {n.title}
                          {!n.isRead && <span className="sr-only"> (unread)</span>}
                        </span>
                        <span className="block text-sm text-muted mt-0.5 line-clamp-2">{n.body}</span>
                        <span className="block text-xs text-muted-light mt-1">{formatRelativeTime(n.sentAt)}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center mt-1 h-11 text-sm font-bold text-primary hover:bg-muted-extra-light rounded-[10px] transition-colors"
            >
              See all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
