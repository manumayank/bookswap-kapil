# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BookSwap is a **paid marketplace** for parents to buy and sell used school textbooks and stationery. Sellers list items with a buying price and selling price. Buyers browse, filter, and purchase. The platform follows the Antigravity13/BookLink UI and flow as the reference design.

**Scope for v1 (launch in 2-3 days):** Web + Mobile app. Both consume the same backend API.

**v2 (future, ~3 months):** Platform fee/commission on deals.

## Product Decisions

- **Marketplace model** — Sellers set a selling price. No free exchange, no auto-matching algorithm.
- **Browse + Filter** — Buyers find books by filtering (board, class, city, school, condition) and sorting results. No auto-match or recommendation engine.
- **Matching only for requested books** — If a buyer requests a book that doesn't exist in listings, the system saves the request and notifies when a matching listing appears.
- **No identity exchange before deal accepted** — Seller identity (phone, address) is hidden until the buyer's deal/offer is accepted. No in-app messaging required.
- **Listing moderation** — Listings start as `PENDING_APPROVAL`, admin reviews before going live.
- **Pricing** — Each listing has `buyingPrice` (what seller paid originally) and `sellingPrice` (what seller wants now). Savings percentage/amount can be shown but is not mandatory.
- **Book condition** — Seller-described text options: hardly used, well maintained, marker used, stains, etc. No badge system needed.
- **Categories** — Textbooks and stationery only. No uniforms.
- **Data integrity** — Use Prisma enums, not free-form strings. PostgreSQL as database.
- **Frontend** — Adopt Antigravity13's design system: glassmorphism, CSS custom properties, `.card-premium`, `.glass`, `.btn-*` classes, dark mode, spring animations, polished sell form UX.

## Commands

### Backend (`/backend`)
```bash
npm run dev           # Start dev server (tsx watch, port 3000)
npm run build         # TypeScript compile to dist/
npm run db:push       # Sync Prisma schema to database (no migrations)
npm run db:migrate    # Create and apply Prisma migration
npm run db:generate   # Regenerate Prisma client
npm run db:studio     # Open Prisma Studio GUI
npm run db:seed       # Run seed script (tsx prisma/seed.ts)
```

### Web (`/web`)
```bash
npm run dev           # Start Next.js dev server
npm run build         # Production build
npm run lint          # ESLint
```

### Mobile (`/mobile`)
```bash
npm start             # Start Expo dev server
npm run android       # Start on Android
npm run ios           # Start on iOS
```

### Infrastructure
```bash
docker-compose up -d  # Start PostgreSQL (port 5432) and Redis (port 6379)
```

## Architecture

### Backend — Modular Express API
- **Entry:** `backend/src/index.ts` — mounts all route modules under `/api/*`
- **Module pattern:** Each feature in `backend/src/modules/{name}/` has:
  - `{name}.routes.ts` — Express router with route definitions
  - `{name}.controller.ts` — Request handlers (thin, delegates to service)
  - `{name}.service.ts` — Business logic and Prisma queries
  - `{name}.dto.ts` — Zod schemas for request validation
- **Modules:** auth, users, schools, listings, requests, admin
- **Middleware:** `src/middleware/auth.ts` (JWT Bearer), `adminAuth.ts` (JWT + isAdmin DB check), `validate.ts` (Zod), `upload.ts` (multer), `rateLimiter.ts`
- **Shared libs:** `src/lib/prisma.ts` (client singleton), `response.ts` (sendSuccess/sendError/sendPaginated helpers), `jwt.ts`, `email.ts`

### Database — PostgreSQL + Prisma
- Schema at `backend/prisma/schema.prisma`
- Key models: User, Child, School, Listing, ListingItem, ListingImage, Request, Notification, Otp
- Listing must include: `buyingPrice`, `sellingPrice`, `status` (PENDING_APPROVAL → ACTIVE → SOLD/CANCELLED)
- Key enums: Board, BookCondition, ListingType, ListingStatus, RequestStatus
- UUIDs as primary keys throughout
- Use Prisma enums for all status/type/condition fields — no free-form strings

### Search & Filtering (replaces old matching algorithm)
- Buyers browse listings with filters: board, class, city, school, condition, listing type (Book/Stationery)
- Sorting: price low-high, price high-low, recently added, condition
- No auto-matching between listings and requests
- Matching only triggers for **unfulfilled book requests** — when a new listing is created, check if any open requests match (same board + class + city) and notify the requester

### Web — Next.js App Router
- **Design reference:** Antigravity13/BookLink UI (see `/Antigravity13/` folder)
- Adopt their CSS design system: custom properties, `.card-premium`, `.glass`, `.btn-*`, `.badge-*`, dark mode via `prefers-color-scheme`
- Public pages: `/` (home with hero, stats, categories, CTA), `/search` (browse with filter sidebar), `/listing/[id]` (detail page with seller info hidden until deal accepted), `/sell` (3-step listing form)
- Auth pages: `/login`, `/register`
- Admin pages: `/admin/*` with sidebar layout
- API client: `web/src/lib/api.ts` — axios with Bearer token from localStorage, auto-redirect on 401
- Auth state: `web/src/stores/authStore.ts` (Zustand)

### Mobile — React Native + Expo
- **Entry:** `mobile/App.tsx` with React Navigation (native-stack + bottom-tabs)
- **UI:** React Native Paper (Material Design components out of the box)
- **State:** Zustand (auth/global) + React Query (server state) — same pattern as web
- **API client:** `mobile/src/services/api.ts` — axios, same endpoints as web
- **Auth token:** stored in AsyncStorage
- **Screens:** Login/Register, Home (stats + quick actions), Browse (list + filters), Listing Detail, Sell Form, Profile
- All screens are standard CRUD consuming the shared backend API — no extra backend work needed

## API Conventions

- All responses: `{ success: true, data: {...} }` or `{ success: false, error: "message" }`
- Paginated responses add: `{ pagination: { total, page, limit, totalPages } }`
- Auth: Bearer JWT in Authorization header
- File uploads served from `/uploads` static path
- Validation via Zod schemas in `.dto.ts` files, applied with `validate` middleware
- **Seller identity (phone, address) is NOT included in listing API responses** — only revealed after a deal is accepted

## Environment

Backend requires `.env` (copy from `.env.example`): DATABASE_URL, JWT_SECRET, SMTP credentials. Web uses `NEXT_PUBLIC_API_URL` to point at the backend.
