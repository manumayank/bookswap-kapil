# Email Notifications + Request Approval + Transaction IDs + Grievances — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add transactional email notifications for every listing/request/deal event, give buyer requests an admin-approval workflow, stamp every deal with a human-readable transaction code, and ship a basic grievance reporting form.

**Architecture:** Backend extends the existing `nodemailer` setup (`backend/src/lib/email.ts`) with a typed `sendEventEmail` helper and templates per event. A small `Counter` model issues monotonic per-deal sequence numbers used to build codes like `SY-2026-000142`. Buyer requests get the same `PENDING_APPROVAL → OPEN/REJECTED` lifecycle that listings already have. A new `Grievance` model + module powers a public "Report a Problem" page and an admin inbox.

**Tech Stack:** Prisma + PostgreSQL (db:push, no migrations), Express + TypeScript, nodemailer, Next.js 14 App Router + React Query + Zustand.

**Spec:** `docs/superpowers/specs/2026-05-24-email-notifications-and-grievances-design.md`

**Verification:** No automated test framework in this repo. Verification is manual via dev servers + Chrome, matching the existing convention.

---

## Task 1: Schema changes

**Files:**
- Modify: `backend/prisma/schema.prisma`

- [ ] **Step 1: Add `code` field to the Deal model**

In `backend/prisma/schema.prisma`, locate the `Deal` model and add a `code` field. Place it near the top of the model:

```prisma
model Deal {
  id          String     @id @default(uuid())
  code        String?    @unique
  // ... existing fields
}
```

(Keep `code` nullable initially so existing deals don't fail validation. Task 2 backfills them.)

- [ ] **Step 2: Extend RequestStatus enum**

Find `enum RequestStatus` and add two values:

```prisma
enum RequestStatus {
  PENDING_APPROVAL
  REJECTED
  OPEN
  MATCHED
  FULFILLED
  CANCELLED
}
```

- [ ] **Step 3: Extend NotificationType enum**

Find `enum NotificationType` and add three values:

```prisma
enum NotificationType {
  LISTING_SUBMITTED
  LISTING_APPROVED
  LISTING_REJECTED
  REQUEST_SUBMITTED
  REQUEST_APPROVED
  REQUEST_REJECTED
  NEW_MATCH_FOR_REQUEST
  DEAL_REQUESTED
  DEAL_ACCEPTED
  DEAL_COMPLETED
  DEAL_CANCELLED
}
```

- [ ] **Step 4: Add Counter model**

Append to the schema:

```prisma
model Counter {
  name  String @id
  value Int    @default(0)
}
```

- [ ] **Step 5: Add Grievance model + status enum**

Append to the schema:

```prisma
model Grievance {
  id              String          @id @default(uuid())
  userId          String
  user            User            @relation(fields: [userId], references: [id])
  transactionCode String?
  subject         String
  description     String
  status          GrievanceStatus @default(OPEN)
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  @@index([status])
  @@index([userId])
}

enum GrievanceStatus {
  OPEN
  RESOLVED
  DISMISSED
}
```

Then add a back-relation on `User`:

```prisma
model User {
  // ... existing fields
  grievances Grievance[]
}
```

- [ ] **Step 6: Apply with db:push**

From `backend/`:

```bash
npm run db:push
```

Expected: Prisma syncs the schema, regenerates the client, exits cleanly. If you see warnings about default values for new required fields, accept them (RequestStatus default change in Task 5 is intentional but doesn't affect existing rows).

- [ ] **Step 7: Verify the new types in the generated client**

From `backend/`:

```bash
node -e "const c = require('./node_modules/.prisma/client'); console.log(c.RequestStatus.PENDING_APPROVAL, c.NotificationType.REQUEST_SUBMITTED, c.GrievanceStatus.OPEN);"
```

Expected output: `PENDING_APPROVAL REQUEST_SUBMITTED OPEN`

- [ ] **Step 8: Commit**

```bash
git add backend/prisma/schema.prisma
git commit -m "Add transaction-code, request-approval, grievance schema"
```

---

## Task 2: Transaction code generation

**Files:**
- Create: `backend/src/lib/transactionCode.ts`
- Modify: `backend/src/modules/deals/deals.service.ts`

- [ ] **Step 1: Create the code generator**

Write `backend/src/lib/transactionCode.ts`:

```ts
import prisma from './prisma';

const COUNTER_NAME = 'deal_code';

/**
 * Atomically increment the deal counter and format a human-readable code.
 * Format: SY-<year>-<6-digit-zero-padded-sequence>, e.g. SY-2026-000142.
 */
export async function nextDealCode(): Promise<string> {
  const counter = await prisma.counter.upsert({
    where: { name: COUNTER_NAME },
    update: { value: { increment: 1 } },
    create: { name: COUNTER_NAME, value: 1 },
  });
  const year = new Date().getFullYear();
  const seq = String(counter.value).padStart(6, '0');
  return `SY-${year}-${seq}`;
}
```

- [ ] **Step 2: Use the generator in createDeal**

In `backend/src/modules/deals/deals.service.ts`, add the import near the top:

```ts
import { nextDealCode } from '../../lib/transactionCode';
```

Find the `prisma.deal.create({ data: { ... } })` call inside `createDeal` and add `code: await nextDealCode()` to the data block:

```ts
  const created = await prisma.deal.create({
    data: {
      code: await nextDealCode(),
      listingId: data.listingId,
      sellerId: listing.userId,
      buyerId,
      agreedPrice: listing.sellingPrice,
      status: 'PENDING',
    },
    include: dealInclude,
  });
```

- [ ] **Step 3: Backfill any existing deals with codes**

From `backend/`:

```bash
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const deals = await prisma.deal.findMany({ where: { code: null }, orderBy: { createdAt: 'asc' }, select: { id: true, createdAt: true } });
  for (const d of deals) {
    const c = await prisma.counter.upsert({ where: { name: 'deal_code' }, update: { value: { increment: 1 } }, create: { name: 'deal_code', value: 1 } });
    const year = new Date(d.createdAt).getFullYear();
    const code = 'SY-' + year + '-' + String(c.value).padStart(6, '0');
    await prisma.deal.update({ where: { id: d.id }, data: { code } });
    console.log(d.id, '->', code);
  }
  await prisma.\$disconnect();
})();
"
```

Expected: any pre-existing deals get a code; output lists each.

- [ ] **Step 4: TypeScript compile check**

From `backend/`:

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add backend/src/lib/transactionCode.ts backend/src/modules/deals/deals.service.ts
git commit -m "Generate per-deal transaction codes (SY-YYYY-NNNNNN)"
```

---

## Task 3: Email helper + templates

**Files:**
- Modify: `backend/src/lib/email.ts`
- Modify: `backend/.env.example`

- [ ] **Step 1: Add env var documentation**

In `backend/.env.example`, append:

```
# Admin notification recipients (comma-separated; empty = no admin emails)
ADMIN_NOTIFICATION_EMAILS=

# Public base URL for image hosting + links inside emails
PUBLIC_BASE_URL=http://localhost:3001
```

- [ ] **Step 2: Replace email.ts with the expanded version**

Overwrite `backend/src/lib/email.ts` with:

```ts
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = `"BookSwap" <${process.env.SMTP_USER}>`;
const BASE = process.env.PUBLIC_BASE_URL || 'http://localhost:3001';

/** Comma-separated list of admin emails from env, with empty entries dropped. */
export function getAdminEmails(): string[] {
  return (process.env.ADMIN_NOTIFICATION_EMAILS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function sendOtpEmail(email: string, otp: string) {
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: 'Your BookSwap OTP',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>BookSwap - Email Verification</h2>
        <p>Your OTP code is:</p>
        <h1 style="color: #4CAF50; letter-spacing: 8px;">${otp}</h1>
        <p>This code expires in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `,
  });
}

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

type Vars = Record<string, any>;

function wrap(title: string, body: string): string {
  return `<div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #111;">
    <h2 style="color: #4F46E5; margin-top: 0;">${title}</h2>
    ${body}
    <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0 12px;">
    <p style="color: #888; font-size: 12px;">BookSwap — making used school books accessible.</p>
  </div>`;
}

function imageTag(path?: string | null): string {
  if (!path) return '';
  const url = path.startsWith('http') ? path : `${BASE}${path}`;
  return `<img src="${url}" alt="" style="max-width: 100%; border-radius: 8px; margin: 12px 0;">`;
}

function link(href: string, label: string): string {
  const full = href.startsWith('http') ? href : `${BASE}${href}`;
  return `<a href="${full}" style="display: inline-block; background: #4F46E5; color: #fff; padding: 12px 18px; border-radius: 8px; text-decoration: none; font-weight: bold;">${label}</a>`;
}

const TEMPLATES: Record<EmailType, (v: Vars) => { subject: string; html: string }> = {
  LISTING_SUBMITTED_ADMIN: (v) => ({
    subject: `[Admin] New listing pending approval — ${v.title}`,
    html: wrap('New listing pending approval', `
      <p><strong>${v.sellerName}</strong> just submitted a listing.</p>
      ${imageTag(v.imageUrl)}
      <p><strong>${v.title}</strong><br>${v.board || ''} ${v.class ? `Class ${v.class}` : ''}<br>City: ${v.city}<br>Price: ₹${v.sellingPrice}</p>
      <p>${link(`/admin/listings`, 'Review in admin panel')}</p>
    `),
  }),
  LISTING_SUBMITTED_SELLER: (v) => ({
    subject: `Listing submitted — awaiting approval`,
    html: wrap('Thanks for listing on BookSwap!', `
      <p>Your listing "<strong>${v.title}</strong>" has been submitted and is awaiting admin approval. We'll email you again as soon as it's approved.</p>
      ${imageTag(v.imageUrl)}
      <p>${link('/dashboard', 'View your dashboard')}</p>
    `),
  }),
  LISTING_APPROVED: (v) => ({
    subject: `Your listing is live: ${v.title}`,
    html: wrap('Listing approved!', `
      <p>Your listing "<strong>${v.title}</strong>" is now visible to buyers.</p>
      ${imageTag(v.imageUrl)}
      <p>${link(`/listings/${v.listingId}`, 'View your listing')}</p>
    `),
  }),
  LISTING_REJECTED: (v) => ({
    subject: `Listing not approved: ${v.title}`,
    html: wrap('Listing rejected', `
      <p>Your listing "<strong>${v.title}</strong>" wasn't approved.</p>
      ${v.reason ? `<p><em>Reason:</em> ${v.reason}</p>` : ''}
      <p>You can edit and resubmit from your dashboard.</p>
      <p>${link('/dashboard', 'Go to dashboard')}</p>
    `),
  }),
  REQUEST_SUBMITTED_ADMIN: (v) => ({
    subject: `[Admin] New request pending approval — ${v.requesterName}`,
    html: wrap('New request pending approval', `
      <p><strong>${v.requesterName}</strong> just submitted a book request.</p>
      <p>Board: ${v.board || '—'}<br>Class: ${v.class || '—'}<br>City: ${v.city || '—'}<br>Max price: ${v.maxPrice ? `₹${v.maxPrice}` : '—'}</p>
      <p>${link('/admin/requests', 'Review in admin panel')}</p>
    `),
  }),
  REQUEST_SUBMITTED_REQUESTER: (v) => ({
    subject: `Request submitted — awaiting approval`,
    html: wrap('Thanks for posting your request!', `
      <p>We've received your request and it's awaiting admin approval. As soon as it's approved we'll start matching it against new listings.</p>
      <p>${link('/dashboard', 'View your dashboard')}</p>
    `),
  }),
  REQUEST_APPROVED: () => ({
    subject: `Your request is live`,
    html: wrap('Request approved!', `
      <p>Your book request is now live. We'll email you as soon as a matching listing appears.</p>
      <p>${link('/dashboard', 'View your dashboard')}</p>
    `),
  }),
  REQUEST_REJECTED: (v) => ({
    subject: `Request not approved`,
    html: wrap('Request rejected', `
      <p>Your request wasn't approved.</p>
      ${v.reason ? `<p><em>Reason:</em> ${v.reason}</p>` : ''}
      <p>You can post a new request from your dashboard.</p>
    `),
  }),
  DEAL_REQUESTED: (v) => ({
    subject: `New interest in your listing (${v.code})`,
    html: wrap('Someone is interested!', `
      <p>Transaction reference: <strong>${v.code}</strong></p>
      <p>A buyer is interested in your listing "<strong>${v.title}</strong>".</p>
      ${imageTag(v.imageUrl)}
      <p>${link('/dashboard', 'Open your dashboard to respond')}</p>
    `),
  }),
  DEAL_ACCEPTED: (v) => ({
    subject: `Deal accepted! (${v.code})`,
    html: wrap('Your deal was accepted', `
      <p>Transaction reference: <strong>${v.code}</strong></p>
      <p>The seller has accepted your interest in "<strong>${v.title}</strong>". Here are their contact details:</p>
      <p><strong>${v.sellerName}</strong><br>Phone: ${v.sellerPhone}<br>Pickup: ${v.pickupLocation}${v.sellerAddress ? `<br>Address: ${v.sellerAddress}` : ''}</p>
      ${imageTag(v.imageUrl)}
      <p>${link('/dashboard', 'View deal details')}</p>
    `),
  }),
  DEAL_COMPLETED: (v) => ({
    subject: `Deal completed (${v.code})`,
    html: wrap('Deal completed', `
      <p>Transaction reference: <strong>${v.code}</strong></p>
      <p>The deal for "<strong>${v.title}</strong>" has been marked complete. Thank you for using BookSwap!</p>
    `),
  }),
  DEAL_CANCELLED: (v) => ({
    subject: `Deal cancelled (${v.code})`,
    html: wrap('Deal cancelled', `
      <p>Transaction reference: <strong>${v.code}</strong></p>
      <p>The deal for "<strong>${v.title}</strong>" has been cancelled. The listing is available again.</p>
    `),
  }),
  NEW_MATCH_FOR_REQUEST: (v) => ({
    subject: `New book matches your request: ${v.title}`,
    html: wrap('A book matching your request is available', `
      <p>"<strong>${v.title}</strong>" was just listed and matches your open request.</p>
      ${imageTag(v.imageUrl)}
      <p>${link(`/listings/${v.listingId}`, 'View listing')}</p>
    `),
  }),
  GRIEVANCE_FILED: (v) => ({
    subject: `[Admin] New grievance filed — ${v.subject}`,
    html: wrap('New grievance filed', `
      <p><strong>From:</strong> ${v.submitterName} (${v.submitterEmail})</p>
      ${v.transactionCode ? `<p><strong>Transaction reference:</strong> ${v.transactionCode}</p>` : ''}
      <p><strong>Subject:</strong> ${v.subject}</p>
      <p><strong>Description:</strong><br>${v.description.replace(/\n/g, '<br>')}</p>
      <p>${link('/admin/grievances', 'Open admin inbox')}</p>
    `),
  }),
};

/**
 * Send a transactional email for an event. Fire-and-forget — failures
 * are logged but never thrown. Returns immediately if `to` is empty.
 */
export async function sendEventEmail(params: {
  to: string | string[];
  type: EmailType;
  vars: Record<string, any>;
}): Promise<void> {
  const { type, vars } = params;
  const recipients = Array.isArray(params.to) ? params.to : [params.to];
  const cleaned = recipients.filter(Boolean);
  if (cleaned.length === 0) return;

  const { subject, html } = TEMPLATES[type](vars);

  try {
    await transporter.sendMail({
      from: FROM,
      to: cleaned.join(','),
      subject,
      html,
    });
    console.log(`[email] ${type} → ${cleaned.join(', ')}`);
  } catch (err) {
    console.error(`[email] failed to send ${type}:`, err);
  }
}
```

- [ ] **Step 3: TypeScript compile check**

From `backend/`:

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Smoke-test by sending one email**

Set `ADMIN_NOTIFICATION_EMAILS=kapil1304@gmail.com` in `backend/.env` and set `PUBLIC_BASE_URL=http://localhost:3001`. Touch `backend/src/index.ts` to force tsx watch reload, then from `backend/`:

```bash
node -e "
require('dotenv').config();
const { sendEventEmail } = require('./dist/lib/email');
sendEventEmail({ to: process.env.ADMIN_NOTIFICATION_EMAILS, type: 'GRIEVANCE_FILED', vars: { submitterName: 'Smoke Test', submitterEmail: 'test@example.com', transactionCode: 'SY-2026-000001', subject: 'Test', description: 'Email helper smoke test.' } }).then(() => process.exit(0));
"
```

If `dist/` doesn't exist, run `npm run build` first. Expected: console logs `[email] GRIEVANCE_FILED → kapil1304@gmail.com`. Check the inbox.

If SMTP credentials aren't configured locally, the send will fail with a logged error but the test still completes — that's acceptable for this step; the real verification is at the end-to-end smoke test.

- [ ] **Step 5: Commit**

```bash
git add backend/src/lib/email.ts backend/.env.example
git commit -m "Add sendEventEmail with templates for all 14 event types"
```

---

## Task 4: Wire emails into listing submission

**Files:**
- Modify: `backend/src/modules/listings/listings.service.ts`

- [ ] **Step 1: Import the helpers**

At the top of `backend/src/modules/listings/listings.service.ts`, add:

```ts
import { sendEventEmail, getAdminEmails } from '../../lib/email';
```

- [ ] **Step 2: Send emails on listing creation**

In `createListing`, after the existing `prisma.notification.create({ ... LISTING_SUBMITTED ... })` block and before `checkRequestMatches(listing.id).catch(console.error)`, add:

```ts
  // Email the seller a confirmation, and notify admins of the new listing
  const sellerEmail = listing.user?.email;
  const firstImage = listing.images?.[0]?.imageUrl;
  if (sellerEmail) {
    sendEventEmail({
      to: sellerEmail,
      type: 'LISTING_SUBMITTED_SELLER',
      vars: { title: listing.title, imageUrl: firstImage },
    }).catch(console.error);
  }
  sendEventEmail({
    to: getAdminEmails(),
    type: 'LISTING_SUBMITTED_ADMIN',
    vars: {
      sellerName: listing.user?.name,
      title: listing.title,
      board: listing.board,
      class: listing.class,
      city: listing.city,
      sellingPrice: listing.sellingPrice,
      imageUrl: firstImage,
    },
  }).catch(console.error);
```

The `listing` returned by `prisma.listing.create({ include: listingIncludeOwner })` already includes `user` (with `email`) and `images`, so no extra query needed.

- [ ] **Step 3: TypeScript compile check**

From `backend/`:

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add backend/src/modules/listings/listings.service.ts
git commit -m "Email seller + admin when a listing is submitted"
```

---

## Task 5: Backend request approval workflow

**Files:**
- Modify: `backend/src/modules/requests/requests.service.ts`
- Modify: `backend/src/modules/admin/admin.service.ts`
- Modify: `backend/src/modules/admin/admin.controller.ts`
- Modify: `backend/src/modules/admin/admin.routes.ts`

- [ ] **Step 1: Default new requests to PENDING_APPROVAL + send emails**

Open `backend/src/modules/requests/requests.service.ts`. Find the `createRequest` (or equivalent) function and its `prisma.request.create({ data: { ... } })` call. Change the default status to `'PENDING_APPROVAL'` and add the same email + PUSH-notification block used for listings.

At the top of the file, add:

```ts
import { sendEventEmail, getAdminEmails } from '../../lib/email';
```

Inside `createRequest`, where the request is created, modify the data block so it explicitly sets `status: 'PENDING_APPROVAL'`:

```ts
  const request = await prisma.request.create({
    data: {
      // ... existing fields
      status: 'PENDING_APPROVAL',
    },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
```

After the create, add:

```ts
  // Acknowledge the requester with an in-app notification
  await prisma.notification.create({
    data: {
      userId: request.userId,
      type: 'REQUEST_SUBMITTED',
      channel: 'PUSH',
      title: 'Request Submitted',
      body: `Thanks for posting your request. It's awaiting admin approval — we'll notify you once it's approved.`,
      data: { requestId: request.id },
    },
  });

  // Email the requester and notify admins
  if (request.user?.email) {
    sendEventEmail({
      to: request.user.email,
      type: 'REQUEST_SUBMITTED_REQUESTER',
      vars: {},
    }).catch(console.error);
  }
  sendEventEmail({
    to: getAdminEmails(),
    type: 'REQUEST_SUBMITTED_ADMIN',
    vars: {
      requesterName: request.user?.name,
      board: request.board,
      class: request.class,
      city: request.city,
      maxPrice: request.maxPrice,
    },
  }).catch(console.error);
```

- [ ] **Step 2: Add approveRequest + rejectRequest in admin service**

Append to `backend/src/modules/admin/admin.service.ts`:

```ts
export async function getPendingRequests(page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  const where = { status: 'PENDING_APPROVAL' as const };
  const [requests, total] = await Promise.all([
    prisma.request.findMany({
      where,
      skip,
      take: limit,
      include: { user: { select: { id: true, name: true, email: true, city: true } } },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.request.count({ where }),
  ]);
  return { requests, total, page, limit };
}

export async function approveRequest(requestId: string) {
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    include: { user: { select: { id: true, email: true, name: true } } },
  });
  if (!request) throw new Error('Request not found');
  if (request.status !== 'PENDING_APPROVAL') {
    throw new Error(`Request cannot be approved — current status is ${request.status}`);
  }
  const updated = await prisma.request.update({
    where: { id: requestId },
    data: { status: 'OPEN' },
  });
  await prisma.notification.create({
    data: {
      userId: request.userId,
      type: 'REQUEST_APPROVED',
      channel: 'PUSH',
      title: 'Request Approved',
      body: `Your book request is now live. We'll notify you when a matching listing appears.`,
      data: { requestId: request.id },
    },
  });
  if (request.user?.email) {
    sendEventEmail({
      to: request.user.email,
      type: 'REQUEST_APPROVED',
      vars: {},
    }).catch(console.error);
  }
  return updated;
}

export async function rejectRequest(requestId: string, reason?: string) {
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    include: { user: { select: { id: true, email: true, name: true } } },
  });
  if (!request) throw new Error('Request not found');
  if (request.status !== 'PENDING_APPROVAL') {
    throw new Error(`Request cannot be rejected — current status is ${request.status}`);
  }
  const updated = await prisma.request.update({
    where: { id: requestId },
    data: { status: 'REJECTED' },
  });
  await prisma.notification.create({
    data: {
      userId: request.userId,
      type: 'REQUEST_REJECTED',
      channel: 'PUSH',
      title: 'Request Rejected',
      body: reason
        ? `Your request was rejected: ${reason}`
        : `Your request was rejected. You can post a new one from your dashboard.`,
      data: { requestId: request.id, reason: reason || null },
    },
  });
  if (request.user?.email) {
    sendEventEmail({
      to: request.user.email,
      type: 'REQUEST_REJECTED',
      vars: { reason: reason || null },
    }).catch(console.error);
  }
  return updated;
}
```

Make sure the existing import block in `admin.service.ts` includes:

```ts
import { sendEventEmail } from '../../lib/email';
```

- [ ] **Step 3: Add pendingRequests to getStats**

In `admin.service.ts` modify the `getStats` function. Add `pendingRequests` to both `Promise.all` blocks:

```ts
export async function getStats() {
  const [totalUsers, activeListings, openRequests, deals, schools, pendingRequests] = await Promise.all([
    prisma.user.count(),
    prisma.listing.count({ where: { status: 'ACTIVE' } }),
    prisma.request.count({ where: { status: { in: ['OPEN', 'MATCHED'] } } }),
    prisma.deal.count(),
    prisma.school.count(),
    prisma.request.count({ where: { status: 'PENDING_APPROVAL' } }),
  ]);

  const [completedDeals, totalListings, totalRequests, pendingListings] = await Promise.all([
    prisma.deal.count({ where: { status: 'COMPLETED' } }),
    prisma.listing.count(),
    prisma.request.count(),
    prisma.listing.count({ where: { status: 'PENDING_APPROVAL' } }),
  ]);

  return {
    totalUsers,
    activeListings,
    openRequests,
    deals,
    schools,
    completedDeals,
    totalListings,
    totalRequests,
    pendingListings,
    pendingRequests,
  };
}
```

- [ ] **Step 4: Add controller handlers**

Append to `backend/src/modules/admin/admin.controller.ts`:

```ts
export async function handleGetPendingRequests(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const result = await adminService.getPendingRequests(page, limit);
    return sendPaginated(res, result.requests, result.total, result.page, result.limit);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function handleApproveRequest(req: Request, res: Response) {
  try {
    const updated = await adminService.approveRequest(req.params.id);
    return sendSuccess(res, updated);
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
}

export async function handleRejectRequest(req: Request, res: Response) {
  try {
    const { reason } = req.body || {};
    const updated = await adminService.rejectRequest(req.params.id, reason);
    return sendSuccess(res, updated);
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
}
```

If `sendPaginated` isn't imported at the top yet, add it.

- [ ] **Step 5: Register the routes**

In `backend/src/modules/admin/admin.routes.ts`, add the three routes alongside the existing listing approve/reject routes:

```ts
router.get('/requests/pending', adminController.handleGetPendingRequests);
router.put('/requests/:id/approve', adminController.handleApproveRequest);
router.put('/requests/:id/reject', adminController.handleRejectRequest);
```

- [ ] **Step 6: TypeScript compile check**

From `backend/`:

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add backend/src/modules/requests/requests.service.ts backend/src/modules/admin/admin.service.ts backend/src/modules/admin/admin.controller.ts backend/src/modules/admin/admin.routes.ts
git commit -m "Gate buyer requests behind admin approval + send emails"
```

---

## Task 6: Wire emails into listing approve/reject

**Files:**
- Modify: `backend/src/modules/admin/admin.service.ts`

- [ ] **Step 1: Add email send to approveListing**

Find the existing `approveListing` function in `backend/src/modules/admin/admin.service.ts`. Inside it, after the existing `sendWhatsAppNotification` block (or just before `return updatedListing`), add:

```ts
  // Fetch one image url for the email
  const firstImage = await prisma.listingImage.findFirst({
    where: { listingId: listing.id },
    select: { imageUrl: true },
  });
  if (updatedListing.user.email) {
    sendEventEmail({
      to: updatedListing.user.email,
      type: 'LISTING_APPROVED',
      vars: {
        title: listing.title,
        listingId: listing.id,
        imageUrl: firstImage?.imageUrl,
      },
    }).catch(console.error);
  }
```

- [ ] **Step 2: Add email send to rejectListing**

In the existing `rejectListing` function, just before `return updatedListing`, add:

```ts
  const firstImage2 = await prisma.listingImage.findFirst({
    where: { listingId: listing.id },
    select: { imageUrl: true },
  });
  if (updatedListing.user.email) {
    sendEventEmail({
      to: updatedListing.user.email,
      type: 'LISTING_REJECTED',
      vars: {
        title: listing.title,
        reason: reason || null,
        imageUrl: firstImage2?.imageUrl,
      },
    }).catch(console.error);
  }
```

- [ ] **Step 3: TypeScript compile check**

From `backend/`:

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add backend/src/modules/admin/admin.service.ts
git commit -m "Email seller when admin approves/rejects a listing"
```

---

## Task 7: Wire emails into deal events

**Files:**
- Modify: `backend/src/modules/deals/deals.service.ts`

- [ ] **Step 1: Import the email helper**

Near the top of `backend/src/modules/deals/deals.service.ts`, add:

```ts
import { sendEventEmail } from '../../lib/email';
```

- [ ] **Step 2: Email seller on deal request**

Inside `createDeal`, right after the existing `prisma.notification.create({ ... DEAL_REQUESTED ... })` and `sendWhatsAppNotification({ ... })` block, add:

```ts
  const firstImage = listing.images?.[0]?.imageUrl;
  if (listing.user?.email) {
    sendEventEmail({
      to: listing.user.email,
      type: 'DEAL_REQUESTED',
      vars: {
        code: created.code,
        title: listing.title,
        imageUrl: firstImage,
      },
    }).catch(console.error);
  }
```

If `listing` here doesn't include `images` or `user.email`, change the existing `findUnique` at the start of `createDeal` to include them. The variant that already runs there is:

```ts
const listing = await prisma.listing.findUnique({
  where: { id: data.listingId },
  include: { user: true, images: true },
});
```

(If `images: true` is missing, add it.)

- [ ] **Step 3: Email buyer when deal is accepted**

Inside `respondToDeal`, in the `if (data.status === 'ACCEPTED')` branch, after the existing PUSH and WhatsApp notification block (and after `redactContacts(updatedDeal)` is computed but before `return`), add:

```ts
  const acceptedFull = await prisma.deal.findUniqueOrThrow({
    where: { id: dealId },
    include: {
      listing: { include: { images: true } },
      seller: { select: { name: true, phone: true, address: true } },
      buyer: { select: { email: true } },
    },
  });
  if (acceptedFull.buyer?.email) {
    sendEventEmail({
      to: acceptedFull.buyer.email,
      type: 'DEAL_ACCEPTED',
      vars: {
        code: acceptedFull.code,
        title: acceptedFull.listing.title,
        sellerName: acceptedFull.seller.name,
        sellerPhone: acceptedFull.seller.phone,
        sellerAddress: acceptedFull.seller.address,
        pickupLocation: acceptedFull.listing.pickupLocation,
        imageUrl: acceptedFull.listing.images?.[0]?.imageUrl,
      },
    }).catch(console.error);
  }
```

(Place it just before the existing `return redactContacts(updatedDeal);`.)

- [ ] **Step 4: Email other party on completion / cancellation**

Inside `completeDeal`'s `if (data.status === 'CANCELLED')` branch, after the existing PUSH + WhatsApp blocks, add:

```ts
  const cancelledOther = await prisma.user.findUnique({
    where: { id: otherUserId },
    select: { email: true },
  });
  if (cancelledOther?.email) {
    sendEventEmail({
      to: cancelledOther.email,
      type: 'DEAL_CANCELLED',
      vars: { code: deal.code, title: deal.listing.title },
    }).catch(console.error);
  }
```

In `completeDeal`'s COMPLETED path (after the existing notify block, before `return`), add:

```ts
  const completedOther = await prisma.user.findUnique({
    where: { id: completionOtherUserId },
    select: { email: true },
  });
  if (completedOther?.email) {
    sendEventEmail({
      to: completedOther.email,
      type: 'DEAL_COMPLETED',
      vars: { code: deal.code, title: deal.listing.title },
    }).catch(console.error);
  }
```

In `cancelDeal` (after the existing notify block, before `return`), add:

```ts
  const cancelOther = await prisma.user.findUnique({
    where: { id: otherUserId },
    select: { email: true },
  });
  if (cancelOther?.email) {
    sendEventEmail({
      to: cancelOther.email,
      type: 'DEAL_CANCELLED',
      vars: { code: deal.code, title: deal.listing.title },
    }).catch(console.error);
  }
```

If `deal` here doesn't carry `listing.title`, change the initial `findFirst` in `cancelDeal` to `include: { listing: { select: { title: true } } }`.

- [ ] **Step 5: TypeScript compile check**

From `backend/`:

```bash
npx tsc --noEmit
```

Expected: no errors. If `deal.listing.title` is undefined, adjust the `findFirst` includes in the relevant function.

- [ ] **Step 6: Commit**

```bash
git add backend/src/modules/deals/deals.service.ts
git commit -m "Email buyer + seller at every deal state transition"
```

---

## Task 8: Wire email for new-listing-matches-open-request

**Files:**
- Modify: `backend/src/modules/listings/listings.service.ts`
- Modify: `backend/src/modules/admin/admin.service.ts`

- [ ] **Step 1: Email the requester in listings.service.ts checkRequestMatches**

In `backend/src/modules/listings/listings.service.ts`, find the `checkRequestMatches` helper. Inside the `for (const request of matchingRequests)` loop, after the existing `prisma.notification.create({ ... NEW_MATCH_FOR_REQUEST ... })` and `sendWhatsAppNotification({ ... })` block, add:

```ts
    const requesterUser = await prisma.user.findUnique({
      where: { id: request.userId },
      select: { email: true },
    });
    if (requesterUser?.email) {
      sendEventEmail({
        to: requesterUser.email,
        type: 'NEW_MATCH_FOR_REQUEST',
        vars: {
          title: listing.title,
          listingId: listing.id,
          imageUrl: listing.images?.[0]?.imageUrl,
        },
      }).catch(console.error);
    }
```

Also change the listing fetch at the top of `checkRequestMatches` to include the first image:

```ts
const listing = await prisma.listing.findUnique({
  where: { id: listingId },
  include: { images: true },
});
```

Add the email-helper import at the top of the file if not already present:

```ts
import { sendEventEmail, getAdminEmails } from '../../lib/email';
```

- [ ] **Step 2: Email requesters in admin.service.ts approveListing flow**

In `backend/src/modules/admin/admin.service.ts`, inside `approveListing` where matched requests are iterated, add the same email send after the existing PUSH + WhatsApp block:

```ts
    const reqUser = await prisma.user.findUnique({
      where: { id: request.userId },
      select: { email: true },
    });
    if (reqUser?.email) {
      sendEventEmail({
        to: reqUser.email,
        type: 'NEW_MATCH_FOR_REQUEST',
        vars: {
          title: listing.title,
          listingId: listing.id,
        },
      }).catch(console.error);
    }
```

- [ ] **Step 3: TypeScript compile check**

From `backend/`:

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add backend/src/modules/listings/listings.service.ts backend/src/modules/admin/admin.service.ts
git commit -m "Email requester when a new listing matches their open request"
```

---

## Task 9: Grievances backend module

**Files:**
- Create: `backend/src/modules/grievances/grievances.dto.ts`
- Create: `backend/src/modules/grievances/grievances.service.ts`
- Create: `backend/src/modules/grievances/grievances.controller.ts`
- Create: `backend/src/modules/grievances/grievances.routes.ts`
- Modify: `backend/src/modules/admin/admin.service.ts`
- Modify: `backend/src/modules/admin/admin.controller.ts`
- Modify: `backend/src/modules/admin/admin.routes.ts`
- Modify: `backend/src/index.ts`

- [ ] **Step 1: Create the DTO**

Write `backend/src/modules/grievances/grievances.dto.ts`:

```ts
import { z } from 'zod';

export const createGrievanceDto = z.object({
  subject: z.string().min(3).max(120),
  description: z.string().min(10).max(4000),
  transactionCode: z.string().optional(),
});
export type CreateGrievanceDto = z.infer<typeof createGrievanceDto>;

export const updateGrievanceStatusDto = z.object({
  status: z.enum(['OPEN', 'RESOLVED', 'DISMISSED']),
});
export type UpdateGrievanceStatusDto = z.infer<typeof updateGrievanceStatusDto>;
```

- [ ] **Step 2: Create the service**

Write `backend/src/modules/grievances/grievances.service.ts`:

```ts
import prisma from '../../lib/prisma';
import { sendEventEmail, getAdminEmails } from '../../lib/email';
import { CreateGrievanceDto, UpdateGrievanceStatusDto } from './grievances.dto';

export async function createGrievance(userId: string, data: CreateGrievanceDto) {
  const grievance = await prisma.grievance.create({
    data: {
      userId,
      subject: data.subject,
      description: data.description,
      transactionCode: data.transactionCode || null,
    },
    include: { user: { select: { name: true, email: true } } },
  });

  sendEventEmail({
    to: getAdminEmails(),
    type: 'GRIEVANCE_FILED',
    vars: {
      submitterName: grievance.user.name,
      submitterEmail: grievance.user.email,
      transactionCode: grievance.transactionCode,
      subject: grievance.subject,
      description: grievance.description,
    },
  }).catch(console.error);

  return grievance;
}

export async function getMyGrievances(userId: string) {
  return prisma.grievance.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function listForAdmin(page = 1, limit = 50, status?: string) {
  const skip = (page - 1) * limit;
  const where = status ? { status: status as any } : {};
  const [grievances, total] = await Promise.all([
    prisma.grievance.findMany({
      where,
      skip,
      take: limit,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.grievance.count({ where }),
  ]);
  return { grievances, total, page, limit };
}

export async function updateStatus(id: string, data: UpdateGrievanceStatusDto) {
  return prisma.grievance.update({
    where: { id },
    data: { status: data.status },
  });
}
```

- [ ] **Step 3: Create the controller**

Write `backend/src/modules/grievances/grievances.controller.ts`:

```ts
import { Request, Response } from 'express';
import { sendSuccess, sendError, sendPaginated } from '../../lib/response';
import * as grievancesService from './grievances.service';

export async function handleCreate(req: Request, res: Response) {
  try {
    const userId = (req as any).user.userId;
    const grievance = await grievancesService.createGrievance(userId, req.body);
    return sendSuccess(res, grievance, 201);
  } catch (error: any) {
    return sendError(res, error.message);
  }
}

export async function handleGetMine(req: Request, res: Response) {
  try {
    const userId = (req as any).user.userId;
    const grievances = await grievancesService.getMyGrievances(userId);
    return sendSuccess(res, grievances);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function handleAdminList(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const status = req.query.status as string | undefined;
    const result = await grievancesService.listForAdmin(page, limit, status);
    return sendPaginated(res, result.grievances, result.total, result.page, result.limit);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function handleAdminUpdateStatus(req: Request, res: Response) {
  try {
    const grievance = await grievancesService.updateStatus(req.params.id, req.body);
    return sendSuccess(res, grievance);
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
}
```

- [ ] **Step 4: Create the user-facing routes**

Write `backend/src/modules/grievances/grievances.routes.ts`:

```ts
import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createGrievanceDto } from './grievances.dto';
import * as controller from './grievances.controller';

const router = Router();

router.use(authenticate);
router.post('/', validate(createGrievanceDto), controller.handleCreate);
router.get('/my', controller.handleGetMine);

export default router;
```

- [ ] **Step 5: Add admin grievance routes**

In `backend/src/modules/admin/admin.routes.ts`, add at the top:

```ts
import { validate } from '../../middleware/validate';
import { updateGrievanceStatusDto } from '../grievances/grievances.dto';
import * as grievancesController from '../grievances/grievances.controller';
```

Then add inside the router:

```ts
router.get('/grievances', grievancesController.handleAdminList);
router.put('/grievances/:id', validate(updateGrievanceStatusDto), grievancesController.handleAdminUpdateStatus);
```

- [ ] **Step 6: Mount the user-facing module**

In `backend/src/index.ts`, add the import alongside the other route imports:

```ts
import grievancesRoutes from './modules/grievances/grievances.routes';
```

And mount it alongside other `app.use(...)` calls:

```ts
app.use('/api/grievances', grievancesRoutes);
```

- [ ] **Step 7: TypeScript compile check**

From `backend/`:

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add backend/src/modules/grievances backend/src/modules/admin/admin.routes.ts backend/src/index.ts
git commit -m "Add grievances module + admin inbox routes"
```

---

## Task 10: Admin frontend — requests approval + pending requests stat

**Files:**
- Modify: `web/src/app/admin/dashboard/page.tsx`
- Modify: `web/src/app/admin/requests/page.tsx`

- [ ] **Step 1: Add pending requests card to admin dashboard**

In `web/src/app/admin/dashboard/page.tsx`, find the `statCards` array. Add a new card after `Pending Listings`:

```tsx
    {
      label: 'Pending Requests',
      value: stats?.pendingRequests ?? '-',
      icon: ClipboardList,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
```

(`ClipboardList` should already be imported from `lucide-react`; if not, add to the import.)

- [ ] **Step 2: Add Approve / Reject buttons to admin requests page**

In `web/src/app/admin/requests/page.tsx`, locate the row rendering for each request. Add Approve and Reject buttons that fire mutations against the new endpoints.

Add hooks near the top of the component (alongside the existing `useQuery`):

```tsx
import { useQueryClient, useMutation } from '@tanstack/react-query';
// ... existing imports

  const queryClient = useQueryClient();
  const approve = useMutation({
    mutationFn: async (id: string) => api.put(`/admin/requests/${id}/approve`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-requests'] }),
  });
  const reject = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) =>
      api.put(`/admin/requests/${id}/reject`, { reason }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-requests'] }),
  });
```

In the row JSX where the request status badge is shown, add (only when `request.status === 'PENDING_APPROVAL'`):

```tsx
{request.status === 'PENDING_APPROVAL' && (
  <div style={{ display: 'flex', gap: '0.5rem' }}>
    <button
      className="btn btn-secondary"
      onClick={() => approve.mutate(request.id)}
      disabled={approve.isPending}
    >
      Approve
    </button>
    <button
      className="btn btn-outline"
      style={{ color: 'var(--accent)' }}
      onClick={() => {
        const reason = window.prompt('Reason for rejecting this request (optional):') || undefined;
        reject.mutate({ id: request.id, reason });
      }}
      disabled={reject.isPending}
    >
      Reject
    </button>
  </div>
)}
```

(If the existing admin/requests page doesn't use a row-detail layout that fits these buttons cleanly, place them in whatever container shows per-request controls.)

- [ ] **Step 3: TypeScript compile check**

From `web/`:

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add web/src/app/admin/dashboard/page.tsx web/src/app/admin/requests/page.tsx
git commit -m "Show pending requests count + approve/reject buttons in admin"
```

---

## Task 11: Grievance submit page (/contact)

**Files:**
- Create: `web/src/app/contact/page.tsx`
- Modify: `web/src/components/Footer.tsx`

- [ ] **Step 1: Create the page**

Write `web/src/app/contact/page.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

export default function ContactPage() {
  const router = useRouter();
  const { isAuthenticated, hydrate } = useAuthStore();
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [transactionCode, setTransactionCode] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('accessToken')) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  const submit = useMutation({
    mutationFn: async () =>
      api.post('/grievances', {
        subject: subject.trim(),
        description: description.trim(),
        transactionCode: transactionCode.trim() || undefined,
      }),
    onSuccess: () => setSubmitted(true),
  });

  if (submitted) {
    return (
      <div className="container max-w-2xl px-6 py-16">
        <h1 className="text-3xl font-black mb-4">Thanks — we've received your report</h1>
        <p className="text-muted">Our team has been notified and will get back to you over email. Reference: <strong>{transactionCode || '(no transaction code provided)'}</strong></p>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-black mb-2">Report a problem</h1>
      <p className="text-muted mb-8">If something went wrong with a deal, listing, or your account, tell us about it. The team checks these every day.</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!subject.trim() || !description.trim()) return;
          submit.mutate();
        }}
        className="card-premium p-6 space-y-4"
      >
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-muted mb-2">
            Transaction ID (optional)
          </label>
          <input
            type="text"
            value={transactionCode}
            onChange={(e) => setTransactionCode(e.target.value)}
            placeholder="e.g. SY-2026-000142"
            className="w-full px-4 py-3 rounded-lg border border-card-border bg-white"
          />
          <p className="text-[11px] text-muted mt-1">If your issue is about a specific deal, paste its transaction reference here.</p>
        </div>
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-muted mb-2">Subject *</label>
          <input
            type="text"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="What's going wrong?"
            className="w-full px-4 py-3 rounded-lg border border-card-border bg-white"
          />
        </div>
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-muted mb-2">Description *</label>
          <textarea
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            placeholder="Tell us what happened in detail."
            className="w-full px-4 py-3 rounded-lg border border-card-border bg-white"
          />
        </div>
        {submit.isError && (
          <p className="text-sm text-accent">Something went wrong sending your report. Please try again.</p>
        )}
        <button
          type="submit"
          disabled={submit.isPending || !subject.trim() || !description.trim()}
          className="btn btn-primary w-full"
        >
          {submit.isPending ? 'Sending…' : 'Send report'}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Add a link in the footer**

In `web/src/components/Footer.tsx`, find the "Support" column and add a "Report a problem" link to its `<ul>`:

```tsx
<li><Link href="/contact" className="hover:text-primary transition-colors">Report a problem</Link></li>
```

- [ ] **Step 3: TypeScript compile check**

From `web/`:

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add web/src/app/contact/page.tsx web/src/components/Footer.tsx
git commit -m "Add /contact page for filing grievances + footer link"
```

---

## Task 12: Admin grievance inbox

**Files:**
- Modify: `web/src/app/admin/layout.tsx`
- Create: `web/src/app/admin/grievances/page.tsx`

- [ ] **Step 1: Add sidebar entry**

In `web/src/app/admin/layout.tsx`, find the `navItems` array and add:

```tsx
import { AlertTriangle } from 'lucide-react'; // alongside existing lucide imports

// ...

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/listings', label: 'Listings', icon: BookOpen },
  { href: '/admin/requests', label: 'Requests', icon: ClipboardList },
  { href: '/admin/schools', label: 'Schools', icon: School },
  { href: '/admin/grievances', label: 'Grievances', icon: AlertTriangle },
];
```

- [ ] **Step 2: Create the admin grievances page**

Write `web/src/app/admin/grievances/page.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

const STATUS_OPTIONS = ['OPEN', 'RESOLVED', 'DISMISSED'] as const;

export default function AdminGrievancesPage() {
  const router = useRouter();
  const { user, hydrate } = useAuthStore();
  const [statusFilter, setStatusFilter] = useState<string>('OPEN');
  const queryClient = useQueryClient();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!localStorage.getItem('accessToken')) {
      router.replace('/login');
      return;
    }
    if (user && !user.isAdmin) router.replace('/login');
  }, [user, router]);

  const { data } = useQuery({
    queryKey: ['admin-grievances', statusFilter],
    queryFn: async () => {
      const params: Record<string, any> = { limit: 50 };
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get('/admin/grievances', { params });
      return data.data as Array<{
        id: string;
        subject: string;
        description: string;
        transactionCode: string | null;
        status: string;
        createdAt: string;
        user: { id: string; name: string; email: string };
      }>;
    },
    enabled: !!user?.isAdmin,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) =>
      api.put(`/admin/grievances/${id}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-grievances'] }),
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-black mb-2">Grievances</h1>
      <p className="text-muted mb-6">User-submitted reports.</p>

      <div className="mb-4 flex gap-2">
        {['', ...STATUS_OPTIONS].map((s) => (
          <button
            key={s || 'all'}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 rounded-full text-xs font-bold border ${
              statusFilter === s ? 'bg-primary text-white border-primary' : 'border-card-border'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {(data || []).map((g) => (
          <div key={g.id} className="card-premium p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-black">{g.subject}</p>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-muted-extra-light">{g.status}</span>
                </div>
                <p className="text-xs text-muted">
                  From {g.user.name} ({g.user.email}) — {new Date(g.createdAt).toLocaleString()}
                  {g.transactionCode && ` — Txn: ${g.transactionCode}`}
                </p>
                <p className="text-sm mt-3 whitespace-pre-wrap">{g.description}</p>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <button
                  className="btn btn-secondary text-xs px-3 py-1"
                  disabled={g.status === 'RESOLVED' || updateStatus.isPending}
                  onClick={() => updateStatus.mutate({ id: g.id, status: 'RESOLVED' })}
                >
                  Mark resolved
                </button>
                <button
                  className="btn btn-outline text-xs px-3 py-1"
                  disabled={g.status === 'DISMISSED' || updateStatus.isPending}
                  onClick={() => updateStatus.mutate({ id: g.id, status: 'DISMISSED' })}
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        ))}
        {(data?.length ?? 0) === 0 && (
          <p className="text-sm text-muted">No grievances in this view.</p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: TypeScript compile check**

From `web/`:

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add web/src/app/admin/layout.tsx web/src/app/admin/grievances/page.tsx
git commit -m "Add admin grievances inbox + sidebar entry"
```

---

## Task 13: Show transaction code on dashboard deal rows

**Files:**
- Modify: `web/src/app/dashboard/page.tsx`

- [ ] **Step 1: Render the code under each deal**

In `web/src/app/dashboard/page.tsx`, in the JSX where each deal row is rendered (inside the `matchesArray.map((match: any) => { ... })` block), add the code display just under the listing title:

```tsx
<p style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
  Transaction: <code>{match.code || '—'}</code>
</p>
```

Place it directly under the existing `<h3>{listingTitle}</h3>`.

- [ ] **Step 2: TypeScript compile check**

From `web/`:

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add web/src/app/dashboard/page.tsx
git commit -m "Show transaction code on dashboard deal rows"
```

---

## Task 14: End-to-end manual verification

No code changes — verification only. Run with both `backend` and `web` dev servers, `ADMIN_NOTIFICATION_EMAILS` and `PUBLIC_BASE_URL` set in `backend/.env`, and a real SMTP_USER / SMTP_PASS so emails actually deliver.

- [ ] **Step 1: Login as seller, create a listing**

Verify:
- Admin inbox receives `LISTING_SUBMITTED_ADMIN` email with the approve link to `/admin/listings`.
- Seller inbox receives `LISTING_SUBMITTED_SELLER` confirmation.
- Seller's in-app bell shows "Listing Submitted".

- [ ] **Step 2: Click admin email approve link, approve**

Verify:
- Lands on `/admin/listings` (must be logged in as admin).
- Click Approve.
- Seller receives `LISTING_APPROVED` email with photo + view link.
- Seller's in-app bell shows "Listing Approved".

- [ ] **Step 3: Login as second user (buyer), submit a request**

Verify:
- Admin receives `REQUEST_SUBMITTED_ADMIN` email.
- Requester receives `REQUEST_SUBMITTED_REQUESTER` confirmation.
- Admin dashboard "Pending Requests" card shows 1.
- Admin `/admin/requests` page shows the request with Approve / Reject buttons.

- [ ] **Step 4: Admin approves the request**

Verify:
- Requester receives `REQUEST_APPROVED` email.

- [ ] **Step 5: Buyer expresses interest in the listing (creates a deal)**

Verify:
- The new deal has a `code` like `SY-2026-000001`.
- Seller receives `DEAL_REQUESTED` email with the code + listing photo + view link.

- [ ] **Step 6: Seller accepts the deal**

Verify:
- Buyer receives `DEAL_ACCEPTED` email containing the transaction code, seller name, phone, and pickup location.

- [ ] **Step 7: One party marks the deal complete**

Verify:
- Other party receives `DEAL_COMPLETED` email with the code.

- [ ] **Step 8: Open `/contact` and file a grievance**

Use the transaction code from step 5. Verify:
- Admin inbox receives `GRIEVANCE_FILED` email with the submitter, transaction code, and description.
- `/admin/grievances` shows the grievance with Mark resolved / Dismiss buttons.
- Marking resolved updates the status.

- [ ] **Step 9: Regression check — match-on-new-listing email**

Have requester (with an OPEN approved request matching some board/class/city) wait. Have another seller create a listing matching that criteria. Admin approves. Verify:
- Requester receives `NEW_MATCH_FOR_REQUEST` email with the new listing photo and link.

- [ ] **Step 10: If small UI tweaks were needed, commit them**

```bash
git add <files>
git commit -m "Polish email/grievance UI based on smoke test"
```
