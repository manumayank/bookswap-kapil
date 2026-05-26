'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  Notification,
} from '@/hooks/useNotifications';
import { getNotificationLink, formatRelativeTime } from '@/lib/notificationLinks';

export default function NotificationsPage() {
  const router = useRouter();
  const { isAuthenticated, hydrate } = useAuthStore();
  const [page, setPage] = useState(1);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (!token) router.replace('/login');
    }
  }, [isAuthenticated, router]);

  const { data, isLoading } = useNotifications({ page, limit: 20 });
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const totalPages = data ? Math.ceil(data.total / data.limit) : 1;
  const items = data?.notifications ?? [];
  const unread = data?.unreadCount ?? 0;

  function handleClickItem(n: Notification) {
    if (!n.isRead) markRead.mutate(n.id);
    router.push(getNotificationLink(n));
  }

  return (
    <div className="container max-w-3xl px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black">Notifications</h1>
        {unread > 0 && (
          <button
            onClick={() => markAll.mutate()}
            className="text-xs font-bold text-primary hover:underline"
            disabled={markAll.isPending}
          >
            Mark all as read
          </button>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted">No notifications yet.</p>
      ) : (
        <ul className="card-premium p-2 space-y-1">
          {items.map((n) => (
            <li key={n.id}>
              <button
                onClick={() => handleClickItem(n)}
                className={`w-full text-left p-4 rounded-lg transition-colors hover:bg-muted-extra-light ${
                  !n.isRead ? 'bg-primary/5 border-l-2 border-primary' : ''
                }`}
              >
                <p className="text-sm font-bold">{n.title}</p>
                <p className="text-xs text-muted mt-1">{n.body}</p>
                <p className="text-[10px] text-muted mt-2">{formatRelativeTime(n.sentAt)}</p>
              </button>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn btn-secondary text-xs px-4 py-2 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-xs text-muted">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="btn btn-secondary text-xs px-4 py-2 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
