# Listing Submitted Notification + In-App Notification UI

**Date:** 2026-04-27 (revised 2026-05-04 — WhatsApp dropped; full notification UI added)
**Status:** Approved

## Summary

When a seller creates a listing, immediately create a `LISTING_SUBMITTED` notification in the database. Add a notification UI to the web app — bell icon in the navbar, dropdown with recent notifications, dedicated `/notifications` page — so the seller (and every user) can actually see notifications. This also activates the existing `LISTING_APPROVED`, `LISTING_REJECTED`, `NEW_MATCH_FOR_REQUEST`, and `DEAL_*` notifications, which are already being written to the DB but have no surface in the UI today.

WhatsApp delivery and mobile-app updates are **out of scope**.

---

## Backend changes

### Schema

Add `LISTING_SUBMITTED` to the `NotificationType` enum in `backend/prisma/schema.prisma`:

```prisma
enum NotificationType {
  LISTING_SUBMITTED  // new
  LISTING_APPROVED
  LISTING_REJECTED
  NEW_MATCH_FOR_REQUEST
  DEAL_REQUESTED
  DEAL_ACCEPTED
  DEAL_COMPLETED
  DEAL_CANCELLED
}
```

Apply via `npm run db:migrate`.

### Service wiring

In `createListing` in `backend/src/modules/listings/listings.service.ts`, immediately after `prisma.listing.create(...)` and before the `checkRequestMatches` call:

```ts
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

No new endpoints. The existing `/api/notifications` routes (`GET /`, `PUT /:id/read`, `POST /read-all`) already cover everything the UI needs.

---

## Frontend changes (web)

### Files

- Create `web/src/components/NotificationBell.tsx` — bell button + dropdown.
- Create `web/src/hooks/useNotifications.ts` — React Query hook for list + unread count, with refetch interval.
- Create `web/src/lib/notificationLinks.ts` — small map from `NotificationType` to a target URL.
- Create `web/src/app/notifications/page.tsx` — dedicated full-list page.
- Modify `web/src/components/Navbar.tsx` — render `<NotificationBell />` for authenticated users (placed left of the avatar dropdown).

### Bell + dropdown behavior

- Bell icon visible only when `isAuthenticated`.
- Unread count badge: red dot + numeric count if `unreadCount > 0`. Caps display at "9+".
- Click bell → opens dropdown panel (matching the navbar's existing dropdown style — `card-premium` / `glass`).
- Dropdown shows the latest 5 notifications. Each row:
  - Bold title, smaller body, relative time ("2m ago").
  - Unread rows have a subtle background tint and a left dot indicator.
  - Click row → mark that notification as read (optimistic), navigate to its target URL.
- Footer of dropdown: "Mark all as read" button (only when `unreadCount > 0`) and "View all" link → `/notifications`.
- Closes on outside click and on navigation.

### Polling

Use React Query with `refetchInterval: 60_000` and `refetchOnWindowFocus: true` for the bell's unread-count query. Cheap, predictable, no websocket infra needed.

### Target URL mapping (`notificationLinks.ts`)

```ts
export function getNotificationLink(n: { type: string; data?: any }): string {
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
```

### `/notifications` page

- Auth-gated (redirect to `/login` if not authenticated, matching the existing `/dashboard` pattern).
- Paginated list using `GET /api/notifications?page=N&limit=20`.
- Each row matches the dropdown row style but full-width.
- "Mark all as read" button at the top.
- Empty state: "No notifications yet."

---

## Out of scope

- Mobile app changes (React Native screen updates can be added later — backend is identical).
- WhatsApp delivery for any notification type.
- Real-time push (websockets / SSE).
- Notification preferences / muting.
- Click-action routing more granular than what `notificationLinks.ts` covers (e.g., deep-linking to a specific deal row).

---

## Testing (manual, in Chrome)

After implementation, smoke test:

1. **Login** as a regular user. Bell icon appears in navbar; badge reflects current unread count (likely 0 for a clean account).
2. **Create a listing** at `/sell`. Within ~60s the bell shows badge "1". Open dropdown → see "Listing Submitted" with the listing title. Click → navigates to `/dashboard`. Badge clears.
3. **Login as admin**, approve the listing from `/admin/dashboard`.
4. **Switch back to seller account**. Within ~60s the bell shows badge "1" again. Open dropdown → see "Listing Approved". Click → navigates to `/listings/:id`. Badge clears.
5. **Reject another listing** as admin → seller sees "Listing Rejected" notification.
6. **"Mark all as read"** with multiple unread → badge goes to 0.
7. **Visit `/notifications`** → full paginated list visible.

---

## Files touched

**Backend:**
- `backend/prisma/schema.prisma` — `LISTING_SUBMITTED` enum value
- `backend/src/modules/listings/listings.service.ts` — write notification in `createListing`

**Web:**
- `web/src/components/NotificationBell.tsx` (new)
- `web/src/hooks/useNotifications.ts` (new)
- `web/src/lib/notificationLinks.ts` (new)
- `web/src/app/notifications/page.tsx` (new)
- `web/src/components/Navbar.tsx` — mount the bell
