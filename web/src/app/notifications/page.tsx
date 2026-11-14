'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, BellRing, BookCheck, CheckCheck, ChevronLeft, ChevronRight, RotateCcw, ShoppingBag, XCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  Notification,
} from '@/hooks/useNotifications';
import { getNotificationLink, formatRelativeTime } from '@/lib/notificationLinks';
import PageHeader from '@/components/forms/PageHeader';
import FormAlert from '@/components/forms/FormAlert';
import EmptyState from '@/components/forms/EmptyState';

function iconFor(type: string): LucideIcon {
  if (type === 'NEW_MATCH_FOR_REQUEST') return BellRing;
  if (type === 'LISTING_APPROVED' || type === 'LISTING_SUBMITTED') return BookCheck;
  if (type === 'LISTING_REJECTED' || type === 'DEAL_CANCELLED') return XCircle;
  if (type.startsWith('DEAL_')) return ShoppingBag;
  return Bell;
}

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

  const { data, isLoading, isError, refetch } = useNotifications({ page, limit: 20 });
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const totalPages = data ? Math.ceil(data.total / data.limit) : 1;
  const items = data?.notifications ?? [];
  const unread = data?.unreadCount ?? 0;

  function handleClickItem(n: Notification) {
    if (!n.isRead) markRead.mutate(n.id);
    router.push(getNotificationLink(n));
  }

  const description = isLoading
    ? 'Updates on your listings, deals and book requests.'
    : unread > 0
      ? `${unread} unread. Updates on your listings, deals and book requests.`
      : 'You’re all caught up. Updates on your listings, deals and book requests show here.';

  return (
    <div className="container max-w-3xl py-10 md:py-14">
      <PageHeader
        title="Notifications"
        description={description}
        actions={
          unread > 0 ? (
            <button
              type="button"
              onClick={() => markAll.mutate()}
              disabled={markAll.isPending}
              className="btn btn-outline btn-sm"
            >
              <CheckCheck size={16} strokeWidth={2.5} aria-hidden />
              {markAll.isPending ? 'Marking…' : 'Mark all as read'}
            </button>
          ) : undefined
        }
      />

      {markAll.isError && (
        <FormAlert className="mb-4">We couldn’t mark your notifications as read. Try again.</FormAlert>
      )}

      {isLoading ? (
        <ul className="card-flat divide-y-2 divide-card-border overflow-hidden" aria-busy="true" aria-label="Loading notifications">
          {[0, 1, 2, 3, 4].map((i) => (
            <li key={i} className="flex gap-4 p-4 sm:p-5">
              <div className="skeleton h-10 w-10 shrink-0 rounded-full" />
              <div className="flex-1">
                <div className="skeleton mb-2 h-4 w-1/2" />
                <div className="skeleton h-4 w-5/6" />
              </div>
            </li>
          ))}
        </ul>
      ) : isError ? (
        <FormAlert
          title="Notifications didn’t load"
          action={
            <button type="button" onClick={() => refetch()} className="btn btn-outline btn-sm">
              <RotateCcw size={16} strokeWidth={2.5} aria-hidden />
              Try again
            </button>
          }
        >
          Check your connection and try again.
        </FormAlert>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications yet"
          actions={
            <>
              <Link href="/sell" className="btn btn-primary">
                List your books
              </Link>
              <Link href="/need" className="btn btn-outline">
                Request a book
              </Link>
            </>
          }
        >
          <p>You’ll hear here when a listing is approved, a parent sends you a request, or a book you asked for is listed.</p>
        </EmptyState>
      ) : (
        <ul className="card-flat divide-y-2 divide-card-border overflow-hidden">
          {items.map((n) => {
            const Icon = iconFor(n.type);
            return (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => handleClickItem(n)}
                  className={`group flex w-full items-start gap-4 p-4 text-left transition-colors hover:bg-muted-extra-light focus-visible:!rounded-none sm:p-5 ${
                    !n.isRead ? 'bg-primary/5' : ''
                  }`}
                >
                  <span
                    className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 ${
                      n.isRead ? 'border-card-border bg-card text-muted' : 'border-edge bg-sun text-ink'
                    }`}
                    aria-hidden
                  >
                    <Icon size={18} strokeWidth={2.25} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-3">
                      <span className={`leading-snug ${n.isRead ? 'font-semibold text-muted' : 'font-bold text-foreground'}`}>
                        {!n.isRead && <span className="sr-only">Unread: </span>}
                        {n.title}
                      </span>
                      <time dateTime={n.sentAt} className="shrink-0 whitespace-nowrap text-[13px] text-muted">
                        {formatRelativeTime(n.sentAt)}
                      </time>
                    </span>
                    <span className="mt-1 block text-sm text-muted">{n.body}</span>
                  </span>
                  {!n.isRead && <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" aria-hidden />}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {totalPages > 1 && (
        <nav aria-label="Notification pages" className="mt-6 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn btn-outline btn-sm"
          >
            <ChevronLeft size={16} strokeWidth={2.5} aria-hidden />
            Newer
          </button>
          <span className="text-sm text-muted">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="btn btn-outline btn-sm"
          >
            Older
            <ChevronRight size={16} strokeWidth={2.5} aria-hidden />
          </button>
        </nav>
      )}
    </div>
  );
}
