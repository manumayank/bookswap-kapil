# Listing Submitted Notification + In-App Notification UI — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a seller creates a listing, persist a `LISTING_SUBMITTED` notification, and add a web UI (bell icon + dropdown + `/notifications` page) so users can see all in-app notifications.

**Architecture:** Backend is a tiny extension — one enum value plus one `notification.create` call. The new surface area is on the web frontend: a React Query hook polls the existing `/api/notifications` endpoint, a `NotificationBell` component lives in the navbar, and a `/notifications` route renders the full paginated list.

**Tech Stack:** Prisma + PostgreSQL (backend), Next.js App Router + Tailwind + React Query + Zustand (web).

**Spec:** `docs/superpowers/specs/2026-04-27-listing-submitted-notification-and-whatsapp-otp-design.md`

**Verification:** No automated test framework in this repo. Verification is manual via the dev servers and Chrome, matching the existing convention.

---

## Task 1: Add `LISTING_SUBMITTED` to the `NotificationType` enum

**Files:**
- Modify: `backend/prisma/schema.prisma` (the `NotificationType` enum, around line 282)

- [ ] **Step 1: Edit the enum**

In `backend/prisma/schema.prisma`, locate:

```prisma
enum NotificationType {
  LISTING_APPROVED
  LISTING_REJECTED
  NEW_MATCH_FOR_REQUEST
  DEAL_REQUESTED
  DEAL_ACCEPTED
  DEAL_COMPLETED
  DEAL_CANCELLED
}
```

Replace with:

```prisma
enum NotificationType {
  LISTING_SUBMITTED
  LISTING_APPROVED
  LISTING_REJECTED
  NEW_MATCH_FOR_REQUEST
  DEAL_REQUESTED
  DEAL_ACCEPTED
  DEAL_COMPLETED
  DEAL_CANCELLED
}
```

- [ ] **Step 2: Generate the Prisma migration**

Run from `backend/`:

```bash
npm run db:migrate -- --name add_listing_submitted_notification_type
```

Expected: Prisma creates a new migration folder under `backend/prisma/migrations/` and applies it. Output ends with `Your database is now in sync with your schema.` and Prisma client regenerates.

If the dev DB isn't running, start it first: `docker-compose up -d` from the repo root.

- [ ] **Step 3: Verify the enum is updated in the generated client**

Run:

```bash
node -e "const { NotificationType } = require('./node_modules/.prisma/client'); console.log(NotificationType.LISTING_SUBMITTED);"
```

Expected output: `LISTING_SUBMITTED`

- [ ] **Step 4: Commit**

```bash
git add backend/prisma/schema.prisma backend/prisma/migrations/
git commit -m "Add LISTING_SUBMITTED to NotificationType enum"
```

---

## Task 2: Write the `LISTING_SUBMITTED` notification when a listing is created

**Files:**
- Modify: `backend/src/modules/listings/listings.service.ts` (the `createListing` function, around lines 28-71)

- [ ] **Step 1: Add the notification.create call**

In `backend/src/modules/listings/listings.service.ts`, find the `createListing` function. After the `prisma.listing.create({ ... })` call and BEFORE the `checkRequestMatches(listing.id).catch(console.error);` line, insert:

```ts
  // Acknowledge the seller's submission with an in-app notification
  await prisma.notification.create({
    data: {
      userId,
      type: 'LISTING_SUBMITTED',
      channel: 'PUSH',
      title: 'Listing Submitted',
      body: `Thanks for listing "${listing.title}". It's awaiting admin approval — we'll notify you once it's approved.`,
      data: { listingId: listing.id },
    },
  });
```

The function block should now read:

```ts
  const listing = await prisma.listing.create({
    data: listingData,
    include: listingIncludeOwner,
  });

  // Acknowledge the seller's submission with an in-app notification
  await prisma.notification.create({
    data: {
      userId,
      type: 'LISTING_SUBMITTED',
      channel: 'PUSH',
      title: 'Listing Submitted',
      body: `Thanks for listing "${listing.title}". It's awaiting admin approval — we'll notify you once it's approved.`,
      data: { listingId: listing.id },
    },
  });

  // Trigger request matching in background (non-blocking)
  checkRequestMatches(listing.id).catch(console.error);

  return listing;
```

- [ ] **Step 2: Start the backend dev server**

In a terminal (from `backend/`):

```bash
npm run dev
```

Expected: TypeScript compiles cleanly. Server logs `Server running on port 3000` (or similar). Leave running.

- [ ] **Step 3: Verify by creating a listing via the API**

In a second terminal, get an access token by logging in (use any existing user with a known email). Then:

```bash
curl -X POST http://localhost:3000/api/listings \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Smoke Listing","category":"BOOK","board":"CBSE","class":5,"city":"Bangalore","sellingPrice":200,"buyingPrice":400,"condition":"WELL_MAINTAINED","pickupLocation":"HOME"}'
```

Expected: 200/201 response with a listing object.

Then:

```bash
curl http://localhost:3000/api/notifications -H "Authorization: Bearer <ACCESS_TOKEN>"
```

Expected: response includes a notification with `"type": "LISTING_SUBMITTED"` and `"title": "Listing Submitted"`, `data.listingId` matching the listing just created.

- [ ] **Step 4: Verify the existing approval flow still works (regression check)**

Approve the test listing as admin:

```bash
curl -X POST http://localhost:3000/api/admin/listings/<LISTING_ID>/approve \
  -H "Authorization: Bearer <ADMIN_ACCESS_TOKEN>"
```

Re-fetch notifications for the seller:

```bash
curl http://localhost:3000/api/notifications -H "Authorization: Bearer <SELLER_ACCESS_TOKEN>"
```

Expected: now contains BOTH `LISTING_SUBMITTED` AND `LISTING_APPROVED` notifications for that listing.

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/listings/listings.service.ts
git commit -m "Notify seller when listing is submitted"
```

---

## Task 3: Frontend — notification link helper

**Files:**
- Create: `web/src/lib/notificationLinks.ts`

- [ ] **Step 1: Create the helper file**

Write `web/src/lib/notificationLinks.ts`:

```ts
type NotificationLike = {
  type: string;
  data?: Record<string, any> | null;
};

export function getNotificationLink(n: NotificationLike): string {
  const listingId = n.data?.listingId;
  switch (n.type) {
    case 'LISTING_SUBMITTED':
    case 'LISTING_REJECTED':
      return '/dashboard';
    case 'LISTING_APPROVED':
    case 'NEW_MATCH_FOR_REQUEST':
      return listingId ? `/listings/${listingId}` : '/dashboard';
    case 'DEAL_REQUESTED':
    case 'DEAL_ACCEPTED':
    case 'DEAL_COMPLETED':
    case 'DEAL_CANCELLED':
      return '/dashboard';
    default:
      return '/dashboard';
  }
}

export function formatRelativeTime(isoDate: string): string {
  const ms = Date.now() - new Date(isoDate).getTime();
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(isoDate).toLocaleDateString();
}
```

- [ ] **Step 2: Commit**

```bash
git add web/src/lib/notificationLinks.ts
git commit -m "Add notification link + relative-time helpers"
```

---

## Task 4: Frontend — `useNotifications` hook

**Files:**
- Create: `web/src/hooks/useNotifications.ts`

- [ ] **Step 1: Create the hook file**

Write `web/src/hooks/useNotifications.ts`:

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface Notification {
  id: string;
  type: string;
  channel: string;
  title: string;
  body: string;
  data?: Record<string, any> | null;
  isRead: boolean;
  sentAt: string;
}

interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
}

const KEY = ['notifications'] as const;

export function useNotifications(params: { page?: number; limit?: number; enabled?: boolean } = {}) {
  const { page = 1, limit = 20, enabled = true } = params;

  return useQuery({
    queryKey: [...KEY, page, limit],
    queryFn: async () => {
      const res = await api.get('/notifications', { params: { page, limit } });
      // Backend wraps responses as { success, data, pagination }
      const payload = res.data?.data ?? res.data;
      return payload as NotificationListResponse;
    },
    enabled,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.put(`/notifications/${id}/read`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.post('/notifications/read-all');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
```

**Note on response shape:** the backend's `sendSuccess` / `sendPaginated` helpers wrap responses as `{ success: true, data: {...}, pagination?: {...} }`. The hook unwraps `res.data.data` — falling back to `res.data` if not wrapped (defensive).

- [ ] **Step 2: Commit**

```bash
git add web/src/hooks/useNotifications.ts
git commit -m "Add useNotifications React Query hook"
```

---

## Task 5: Frontend — `NotificationBell` component

**Files:**
- Create: `web/src/components/NotificationBell.tsx`

- [ ] **Step 1: Create the component**

Write `web/src/components/NotificationBell.tsx`:

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add web/src/components/NotificationBell.tsx
git commit -m "Add NotificationBell component"
```

---

## Task 6: Frontend — wire `NotificationBell` into the navbar

**Files:**
- Modify: `web/src/components/Navbar.tsx` (insert the bell into the authenticated user section)

- [ ] **Step 1: Import and render the bell**

At the top of `web/src/components/Navbar.tsx`, add the import below the existing `useAuthStore` import:

```tsx
import NotificationBell from './NotificationBell';
```

Then locate this block (around line 36-64):

```tsx
          {isAuthenticated && user ? (
            <>
              <Link href="/dashboard" className="text-xs font-bold px-4 py-2 hover:text-primary transition-colors">Dashboard</Link>
              <div className="relative group">
```

Insert `<NotificationBell />` between the Dashboard link and the avatar dropdown:

```tsx
          {isAuthenticated && user ? (
            <>
              <Link href="/dashboard" className="text-xs font-bold px-4 py-2 hover:text-primary transition-colors">Dashboard</Link>
              <NotificationBell />
              <div className="relative group">
```

No other changes to Navbar.

- [ ] **Step 2: Start the web dev server (if not already running)**

In a terminal from `web/`:

```bash
npm run dev
```

Expected: Next.js compiles, listens on port 3001 (or whatever the project default is). Leave running.

- [ ] **Step 3: Smoke test in Chrome**

Open the web app in Chrome. Log in as a user. Verify:

- The bell icon appears in the navbar between "Dashboard" and the avatar.
- Clicking the bell opens a dropdown.
- If the user already has notifications (e.g., from the Task 2 verification), they appear.
- Clicking outside closes the dropdown.

- [ ] **Step 4: Commit**

```bash
git add web/src/components/Navbar.tsx
git commit -m "Mount NotificationBell in navbar"
```

---

## Task 7: Frontend — `/notifications` full-list page

**Files:**
- Create: `web/src/app/notifications/page.tsx`

- [ ] **Step 1: Create the page**

Write `web/src/app/notifications/page.tsx`:

```tsx
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
```

- [ ] **Step 2: Smoke test the page in Chrome**

Visit `http://localhost:3001/notifications` while logged in. Verify:

- Logged-out users get redirected to `/login`.
- Logged-in users see their notification list (or empty state).
- "Mark all as read" works — badge in navbar drops to 0.
- Pagination buttons appear if `total > limit`; clicking Next/Previous changes the page.

- [ ] **Step 3: Commit**

```bash
git add web/src/app/notifications/page.tsx
git commit -m "Add /notifications full-list page"
```

---

## Task 8: End-to-end manual verification

This is verification only — no code changes. Run with both `backend` and `web` dev servers running.

- [ ] **Step 1: Login as a regular (non-admin) user in Chrome**

Verify: bell appears in navbar; badge reflects current unread count.

- [ ] **Step 2: Create a listing**

Visit `/sell`, fill in the form, submit. Within ~60 seconds the bell badge should increment by 1.

Open dropdown → see "Listing Submitted" with the title of the listing just created. Click it → navigates to `/dashboard`. The badge clears (or decrements).

- [ ] **Step 3: Approve the listing as admin**

Open a separate Chrome window (or incognito) and log in as the admin (`kapil1304@gmail.com`). Visit `/admin/dashboard`, find the pending listing, approve it.

- [ ] **Step 4: Switch back to the seller window**

Within ~60 seconds the bell shows badge "1" again. Open dropdown → see "Listing Approved" with the listing title. Click it → navigates to `/listings/<id>`.

- [ ] **Step 5: Visit `/notifications`**

Verify the full-list page shows the seller's full history (Submitted + Approved at minimum). "Mark all as read" zeroes the badge.

- [ ] **Step 6: (Optional) Reject another listing as admin**

Confirm `LISTING_REJECTED` notification appears for the seller. Existing flow — should already work.

- [ ] **Step 7: Final commit if any tweaks were made**

If small UI fixes were needed during smoke test, commit them:

```bash
git add <files>
git commit -m "Polish notification UI based on smoke test"
```

Otherwise, this task ends here.
