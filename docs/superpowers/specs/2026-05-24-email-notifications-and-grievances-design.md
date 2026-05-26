# Email Notifications + Request Approval + Transaction IDs + Grievances

**Date:** 2026-05-24
**Status:** Approved

## Summary

Add transactional email notifications for all listing/request/deal events, gate buyer requests behind admin approval (matching how listings work), give every deal a human-readable transaction code, and introduce a basic grievance reporting form. WhatsApp delivery is parked.

---

## 1. Transaction IDs for deals

Add `code String @unique` to the `Deal` model. Format: `SY-<year>-<6-digit-zero-padded-sequence>` (e.g. `SY-2026-000142`).

- Generated server-side at deal creation time.
- Sequence is global, not per-year (simpler — the prefix gives the year).
- Implementation: a tiny sequence helper. Easiest path is a Postgres sequence (`CREATE SEQUENCE deal_code_seq`) or a counter row in a `Counter` model. Pick the simpler one at implementation time; both behave the same.
- Displayed:
  - Every deal-related email (in the subject when relevant, always in the body)
  - On the dashboard deal row (alongside the existing UUID, or replacing it)
  - As a hint / autofill suggestion in the grievance form

---

## 2. Request approval workflow

Extend the existing approval model from listings to buyer requests.

**Schema:**
- Add `PENDING_APPROVAL` and `REJECTED` to the `RequestStatus` enum (currently `OPEN`/`MATCHED`/`FULFILLED`/`CANCELLED`).
- New requests default to `PENDING_APPROVAL` instead of `OPEN`.

**Endpoints:**
- `GET /api/admin/requests/pending` — pending queue.
- `PUT /api/admin/requests/:id/approve` → flips status to `OPEN` and emails the requester.
- `PUT /api/admin/requests/:id/reject` → flips status to `REJECTED`, accepts optional reason, emails the requester.

**Match logic:** `checkRequestMatches` in `requests.service.ts` already filters by `status: { in: ['OPEN', 'MATCHED'] }` — `PENDING_APPROVAL` and `REJECTED` are excluded automatically, so no change needed there.

**Admin UI:** the existing `/admin/requests` page grows Approve / Reject buttons (and a reason input on reject). The admin dashboard `pendingListings` card gets a sibling `pendingRequests` card.

---

## 3. Email infrastructure

**New module** `backend/src/lib/email.ts` (extending the existing `sendOtpEmail`):

```ts
export type EmailType =
  | 'LISTING_SUBMITTED_ADMIN'
  | 'LISTING_SUBMITTED_SELLER'
  | 'LISTING_APPROVED'
  | 'LISTING_REJECTED'
  | 'REQUEST_SUBMITTED_ADMIN'
  | 'REQUEST_SUBMITTED_REQUESTER'
  | 'REQUEST_APPROVED'
  | 'REQUEST_REJECTED'
  | 'DEAL_REQUESTED'
  | 'DEAL_ACCEPTED'
  | 'DEAL_COMPLETED'
  | 'DEAL_CANCELLED'
  | 'NEW_MATCH_FOR_REQUEST'
  | 'GRIEVANCE_FILED';

export async function sendEventEmail(params: {
  to: string | string[];
  type: EmailType;
  vars: Record<string, unknown>;
}): Promise<void>;
```

Internally:
- One template function per `EmailType` returning `{ subject, html }`.
- Inline-styled HTML (matches `sendOtpEmail` pattern). No external CSS. Includes `<img>` tags pulling from `PUBLIC_BASE_URL` + image path when a listing image is in the vars.
- Calls `transporter.sendMail` with `to` (string or array → comma-joined). Wrapped in try/catch — logs failures, never throws to the caller.

**Recipient resolution:**
- Single-recipient (seller, buyer, requester): caller passes the user's email directly.
- Admin recipients: caller passes `getAdminEmails()` (helper that splits `process.env.ADMIN_NOTIFICATION_EMAILS`). If empty, `sendEventEmail` returns immediately (no-op).

**Wiring:** every existing `prisma.notification.create({ ... channel: 'PUSH' ... })` site gets a parallel `sendEventEmail(...).catch(console.error)` call. The notification row is the source of truth for the in-app feed; email is fire-and-forget.

**No DB row written by email** — the PUSH row already exists for each user-facing event. Admin emails (`LISTING_SUBMITTED_ADMIN`, `REQUEST_SUBMITTED_ADMIN`, `GRIEVANCE_FILED`) write no PUSH row at all (admin isn't part of the in-app feed).

---

## 4. Trigger matrix

| Event | PUSH (existing) | Email recipient | Notes |
|---|---|---|---|
| Listing submitted | seller (already) | seller + admin emails | Admin email links to `/admin/listings/<id>` |
| Listing approved | seller (already) | seller | Includes listing photo + "view your listing" link |
| Listing rejected | seller (already) | seller | Includes reason if given |
| Request submitted | (new PUSH for requester) | requester + admin emails | Admin email links to `/admin/requests` |
| Request approved | (new PUSH for requester) | requester | "Your request is live; we'll alert you when a match appears" |
| Request rejected | (new PUSH for requester) | requester | Includes reason |
| New deal request | seller (already) | seller | Includes transaction code, listing photo, "view deal" link |
| Deal accepted | buyer (already) | buyer | Includes transaction code, seller's name + phone + pickup location |
| Deal completed | other party (already) | other party | Thank-you, transaction code |
| Deal cancelled | other party (already) | other party | "Listing is back to available" |
| New listing matches an open request | requester (already) | requester | Photo + title + view link |
| Grievance filed | (no PUSH) | admin emails | Submitter, optional txn code, message |

For request approval/rejection, three new `NotificationType` enum values: `REQUEST_SUBMITTED`, `REQUEST_APPROVED`, `REQUEST_REJECTED`. New PUSH rows go in the in-app feed.

---

## 5. Grievance system

**Model:**

```prisma
model Grievance {
  id              String   @id @default(uuid())
  userId          String
  user            User     @relation(...)
  transactionCode String?
  subject         String
  description     String
  status          GrievanceStatus @default(OPEN)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

enum GrievanceStatus {
  OPEN
  RESOLVED
  DISMISSED
}
```

**Endpoints (new module `backend/src/modules/grievances/`):**
- `POST /api/grievances` — auth required. Body: `{ subject, description, transactionCode? }`. Validates `transactionCode` against existing deals if provided (warns but accepts if not found — submitter may have typed it wrong). Emails admins.
- `GET /api/grievances/my` — auth required. User sees their own grievances.
- `GET /api/admin/grievances` — admin only. Paginated list.
- `PUT /api/admin/grievances/:id` — admin only. Update status to RESOLVED / DISMISSED.

**Web pages:**
- `web/src/app/contact/page.tsx` (new) — global "Report a Problem" form. Subject + description + optional transaction code. Form is auth-gated (redirects to /login). Link from Footer "Support" column.
- `web/src/app/admin/grievances/page.tsx` (new) — admin inbox: list, filter by status, mark resolved/dismissed. Linked from admin sidebar.

---

## 6. Env vars

- `ADMIN_NOTIFICATION_EMAILS` — comma-separated, e.g. `kapil1304@gmail.com,ops@sybrary.com`. Empty → admin emails skipped silently.
- `PUBLIC_BASE_URL` — e.g. `http://localhost:3001` (dev) or `https://sybrary.com` (prod). Used in email links and image URLs.

Both added to `backend/.env.example`. `backend/.env` (gitignored) updated locally for the dev run.

---

## 7. Files touched

**Backend (~12):**
- `backend/prisma/schema.prisma` — Deal.code; RequestStatus + REJECTED; new NotificationType values; new Grievance model + GrievanceStatus enum
- `backend/src/lib/email.ts` — sendEventEmail + templates + getAdminEmails helper
- `backend/src/modules/listings/listings.service.ts` — email seller + admin on submission
- `backend/src/modules/admin/admin.service.ts` — email seller on approval/rejection (existing) + new request approve/reject + pendingRequests in stats
- `backend/src/modules/admin/admin.routes.ts` — request approve/reject + grievance admin routes
- `backend/src/modules/requests/requests.service.ts` — default PENDING_APPROVAL + email requester + admin + PUSH on submission/approval/rejection
- `backend/src/modules/deals/deals.service.ts` — generate transaction code on create + email at every transition
- `backend/src/modules/grievances/*` (new module, 4 files)
- `backend/src/index.ts` — mount grievances router

**Web (~7):**
- `web/src/app/admin/dashboard/page.tsx` — pending requests card
- `web/src/app/admin/requests/page.tsx` — approve/reject buttons + reason input
- `web/src/app/admin/grievances/page.tsx` (new)
- `web/src/app/admin/layout.tsx` — add Grievances to sidebar
- `web/src/app/contact/page.tsx` (new)
- `web/src/components/Footer.tsx` — link to /contact in Support column
- `web/src/app/dashboard/page.tsx` — show transaction code

---

## 8. Verification

Manual smoke test after implementation:

1. Login as seller, create a listing → admin receives `LISTING_SUBMITTED_ADMIN` email with approve link; seller receives `LISTING_SUBMITTED_SELLER` confirmation.
2. Admin clicks approve link → lands on `/admin/listings/<id>` → clicks Approve → seller receives `LISTING_APPROVED` email; listing goes ACTIVE.
3. Login as second user (buyer), create a request → admin receives `REQUEST_SUBMITTED_ADMIN`; requester receives `REQUEST_SUBMITTED_REQUESTER`.
4. Admin approves the request → requester gets `REQUEST_APPROVED`.
5. Buyer expresses interest in seller's listing (creates deal) → deal gets transaction code `SY-2026-000XXX`; seller gets `DEAL_REQUESTED` email with code + listing photo.
6. Seller accepts → buyer gets `DEAL_ACCEPTED` email with seller phone + pickup location.
7. Either marks complete → other party gets `DEAL_COMPLETED` email.
8. Visit `/contact` → file a grievance with the transaction code → admin emails fire; grievance appears in `/admin/grievances`.

---

## 9. Out of scope

- WhatsApp delivery (deferred until Pinnacle credentials land).
- Email unsubscribe / preference center (transactional emails — typically exempt).
- Rich brand templates / dark-mode email styles.
- Email queue / retry (synchronous fire-and-forget for v1).
- Grievance threading / message replies (just status flips).
- Per-event admin recipient channels (everyone in `ADMIN_NOTIFICATION_EMAILS` gets every admin email — can be split later).
- Public/anonymous grievances (login required).
