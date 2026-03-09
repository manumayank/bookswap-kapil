# BookSwap vs Antigravity13 (BookLink) — Comparison Review

## 1. Architecture Overview

| Aspect | **BookSwap (Ours)** | **Antigravity13 (BookLink)** |
|---|---|---|
| Structure | Monorepo with 3 apps: `backend/`, `web/`, `mobile/` | Single Next.js fullstack app |
| Backend | Separate Express.js API server | No separate backend — uses Next.js Server Actions (`"use server"`) |
| Database | Self-hosted PostgreSQL via Docker | Supabase (hosted PostgreSQL with pgBouncer pooling) |
| ORM | Prisma 5 | Prisma 7 |
| Next.js | v14 | v16 (latest) |
| React | v18 | v19 |

---

## 2. Data Model

| Aspect | **BookSwap (Ours)** | **Antigravity13** |
|---|---|---|
| Models | 10 models (User, Child, School, Listing, ListingItem, ListingImage, Request, Match, Notification, Otp) | 4 models (User, Listing, Message, SupportTicket) |
| Core concept | **Exchange/donation** — givers list free books, receivers request, system auto-matches | **Marketplace/selling** — sellers list with prices (INR), buyers chat and buy |
| Pricing | No pricing — books are exchanged for free | Has `price` field (Float), shows MRP savings % |
| Matching | Automated 3-tier algorithm (school > city+board > city) | No matching — manual browse + direct chat between buyer/seller |
| Messaging | No in-app messaging | Has a `Message` model for buyer-seller communication |
| Children | Tracks children per parent with class/school | No children concept |
| Schools | Dedicated `School` model (verified master data) | School is just a string field on User |
| Listing types | SET or INDIVIDUAL, with sub-items (ListingItem) | Flat listings — also includes Stationery, Exam Prep, Uniforms (broader scope) |
| Moderation | Listings go straight to ACTIVE | Listings start as `PENDING_APPROVAL` (admin review required) |
| Enums | Prisma enums (Board, BookCondition, etc.) | Plain strings for everything (role, condition, type, status) |

---

## 3. Authentication

| Aspect | **BookSwap (Ours)** | **Antigravity13** |
|---|---|---|
| Method | Email OTP + JWT with full implementation (Otp model, nodemailer, rate limiting) | Not implemented — uses a hardcoded "Test Seller" for the MVP |
| User identity | Email-based | Phone-based (schema has `phone` as unique) |
| Admin access | `isAdmin` boolean on User + dedicated `adminAuth` middleware | `role` string field ("USER" or "ADMIN") — not enforced anywhere |

---

## 4. Frontend & UI

| Aspect | **BookSwap (Ours)** | **Antigravity13** |
|---|---|---|
| UI maturity | Functional but basic — scaffolded pages, API-connected | Highly polished — custom design system with glassmorphism, animations, gradients, spring transitions |
| CSS approach | Tailwind utility classes | Tailwind + extensive custom CSS design system (CSS variables, `.card-premium`, `.glass`, `.badge`, `.btn` classes, dark mode) |
| Pages built | Home, Browse, Login, Register, Dashboard, Admin suite | Home (hero + stats + CTA), Search (with filters sidebar), Sell form, Listing detail, 404 page |
| Data source | Connected to real API via axios | Mostly mock/hardcoded data (MOCK_LISTINGS arrays) |
| State management | React Query + Zustand | None (no client state library) |
| Dark mode | No | Yes (via `prefers-color-scheme` media query) |

---

## 5. What Antigravity13 Does Better

1. **UI/UX polish** — The design system is significantly more refined. Glassmorphism effects, spring animations, gradient buttons, and a cohesive visual identity. The homepage features a proper hero section, social proof stats, category cards, and a strong CTA section.

2. **Sell flow UX** — The 3-step sell form (Photos > Details > Pricing) is well-designed with numbered sections, image upload placeholders, and helpful tips like "Items with 3+ photos sell 2x faster".

3. **Listing detail page** — Rich layout showing seller profile with trust score, MRP comparison with savings percentage, a safety banner, and multiple action buttons (Chat, Save, Make Offer).

4. **Broader product scope** — Covers stationery, exam prep materials, and school uniforms in addition to textbooks.

5. **Dark mode** — Built-in support via CSS custom properties and `prefers-color-scheme` media query.

6. **Admin moderation workflow** — `PENDING_APPROVAL` status on listings means content is reviewed before going live, which adds a trust layer.

---

## 6. What BookSwap (Ours) Does Better

1. **Full working backend** — 7 complete API modules (auth, users, schools, listings, requests, matches, admin) with controllers, services, DTOs, and Zod validation. Antigravity13 has essentially no backend logic.

2. **Real authentication system** — Email OTP + JWT + rate limiting + token refresh, compared to a hardcoded test user.

3. **Matching algorithm** — Automated 3-tier matching (same school > same city+board > same city) is the core product differentiator. Antigravity13 requires users to manually browse and reach out.

4. **Rich data model** — Children tracking, schools as verified entities, listing sub-items, image management, notifications, and full match lifecycle (pending > accepted > scheduled > completed).

5. **Multi-platform** — Web app + React Native mobile app. Antigravity13 is web-only.

6. **API-connected frontend** — Our web app communicates with a real backend via axios with auth interceptors. Theirs renders mock data.

7. **Data integrity** — Prisma enums enforce valid values for boards, conditions, and statuses. Antigravity13 uses free-form strings which are prone to inconsistency.

---

## 7. Key Differences in Product Vision

| | **BookSwap (Ours)** | **Antigravity13** |
|---|---|---|
| Business model | Free exchange platform | Commercial marketplace with pricing |
| User flow | List > Auto-match > Accept > Schedule exchange | List > Browse > Chat > Buy/Sell |
| Target interaction | System-driven (matching algorithm connects users) | User-driven (manual search and outreach) |
| Scope | Textbooks only | Textbooks + stationery + exam prep + uniforms |
| Platform | Web + Mobile | Web only |

---

## 8. Recommendations — What We Can Adopt

1. **Design system approach** — Adopt CSS custom properties and reusable component classes (`.card-premium`, `.glass`, `.btn-*`, `.badge-*`) for a more polished, consistent UI across pages.

2. **Dark mode** — Implement using CSS variables with `prefers-color-scheme` media query, similar to their approach.

3. **Sell/List form UX** — Adopt the numbered step-by-step form layout with image upload placeholders and contextual tips.

4. **Listing detail page** — Add seller trust indicators, book condition badges, and a safety information banner.

5. **Listing moderation** — Consider adding a `PENDING_APPROVAL` status so admin can review listings before they become visible, adding a trust layer for parents.

6. **Broader categories** — Evaluate expanding beyond textbooks to include stationery and exam prep materials.

7. **In-app messaging** — Consider adding a `Message` model for direct communication between matched users, rather than relying solely on phone/external contact.

---

## 9. Summary

**Antigravity13 is a UI prototype** — a beautifully designed frontend with no real backend, treating the problem as a traditional buy/sell marketplace.

**BookSwap is a working platform** — with a complete backend, real authentication, and an automated matching system, but the frontend needs visual refinement.

The two projects solve the same problem with fundamentally different approaches: ours focuses on **automated free exchange** (matching algorithm), theirs on **manual paid marketplace** (browse and chat). Our backend and matching logic are substantially ahead; their frontend design and UX polish are substantially ahead.
