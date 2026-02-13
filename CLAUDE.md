# BookSwap - Claude Code Instructions

## Project Overview

BookSwap is a mobile app for parents to exchange school textbooks. Parents can list books they want to give away and request books they need. The system matches givers with receivers based on school, city, board, and class.

## Tech Stack

### Backend (`/backend`)
- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL with Prisma ORM
- **Auth:** Email OTP + JWT
- **File Storage:** Local (uploads folder) — can migrate to S3 later

### Mobile (`/mobile`)
- **Framework:** React Native with Expo
- **UI:** React Native Paper (Material Design)
- **Navigation:** React Navigation (native-stack + bottom-tabs)
- **State:** Zustand (global) + React Query (server state)
- **Forms:** React Hook Form + Zod validation

## What's Already Set Up

### Backend
- ✅ `package.json` with all dependencies
- ✅ `prisma/schema.prisma` with full database schema
- ✅ `src/index.ts` with basic Express setup
- ✅ `tsconfig.json`
- ✅ `.env.example`

### Mobile
- ✅ `package.json` with Expo and dependencies
- ✅ `App.tsx` with navigation structure
- ✅ Placeholder screens in `src/screens/`

## What Needs to Be Built

### Backend - Priority Order

1. **Auth Module** (`/backend/src/modules/auth/`)
   - `POST /api/auth/send-otp` — Send OTP to email
   - `POST /api/auth/verify-otp` — Verify OTP, return JWT
   - `POST /api/auth/refresh` — Refresh token
   - Use `nodemailer` for email, store OTP in database

2. **User Module** (`/backend/src/modules/users/`)
   - `POST /api/users/register` — Create user after OTP verification
   - `GET /api/users/me` — Get current user
   - `PUT /api/users/me` — Update profile
   - `POST /api/users/me/children` — Add child
   - `PUT /api/users/me/children/:id` — Update child
   - `DELETE /api/users/me/children/:id` — Remove child

3. **Schools Module** (`/backend/src/modules/schools/`)
   - `GET /api/schools` — Search schools (query: name, city, board)
   - `GET /api/schools/:id` — Get school details
   - `POST /api/schools/suggest` — Suggest new school
   - Seed with initial school data

4. **Listings Module** (`/backend/src/modules/listings/`)
   - `POST /api/listings` — Create listing
   - `GET /api/listings` — Search listings (filters: board, class, city, school, condition)
   - `GET /api/listings/:id` — Get listing details
   - `PUT /api/listings/:id` — Update listing
   - `DELETE /api/listings/:id` — Cancel listing
   - `POST /api/listings/:id/images` — Upload images (use multer)
   - `GET /api/listings/my` — Get my listings

5. **Requests Module** (`/backend/src/modules/requests/`)
   - `POST /api/requests` — Create book request
   - `GET /api/requests` — Get my requests
   - `PUT /api/requests/:id` — Update request
   - `DELETE /api/requests/:id` — Cancel request
   - `POST /api/requests/:id/float` — Float for future matching

6. **Matching Module** (`/backend/src/modules/matches/`)
   - Auto-match when listing/request created
   - `GET /api/matches` — Get my matches
   - `POST /api/matches/:id/accept` — Accept match
   - `POST /api/matches/:id/reject` — Reject match
   - `POST /api/matches/:id/schedule` — Schedule exchange
   - `POST /api/matches/:id/complete` — Mark complete

### Mobile - Priority Order

1. **Auth Flow**
   - Complete `LoginScreen` with real API calls
   - Add registration form after OTP verification
   - Store JWT in secure storage
   - Add auth context/store

2. **Home Screen**
   - Fetch and display user stats
   - Quick action cards

3. **Give Books Flow**
   - Form: listing type (set/individual), board, class, condition
   - Image picker for book photos
   - Exchange preference selection
   - Preview and submit

4. **Need Books Flow**
   - Search with filters
   - Results list with book cards
   - Book detail view
   - Request button
   - Float option if no matches

5. **My Activity**
   - Tabs: My Listings, My Requests, Matches
   - Status badges
   - Actions (edit, cancel, accept/reject)

6. **Profile**
   - Edit profile
   - Manage children
   - Settings
   - Logout

## API Service Setup

Create `/mobile/src/services/api.ts`:
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
});

// Add auth interceptor to attach JWT
// Add response interceptor for token refresh

export default api;
```

## Matching Algorithm

Priority order for matching:
1. Same school + same class + same board
2. Same city + same class + same board
3. Same city + same class (any board)

Condition filter: Only show books meeting minimum condition requirement.

## File Structure Convention

```
backend/src/modules/{module}/
├── {module}.controller.ts  # Route handlers
├── {module}.service.ts     # Business logic
├── {module}.routes.ts      # Express routes
├── {module}.dto.ts         # Zod schemas for validation
└── {module}.types.ts       # TypeScript types
```

## Commands

### Backend
```bash
cd backend
npm install
cp .env.example .env  # Edit with your values
npm run db:push       # Create database tables
npm run dev           # Start dev server
```

### Mobile
```bash
cd mobile
npm install
npm start             # Start Expo dev server
```

## Notes

- All API responses should follow: `{ success: true, data: {...} }` or `{ success: false, error: "message" }`
- Use Zod for request validation on backend
- Implement proper error handling with try/catch
- Add JSDoc comments for complex functions
- Keep controllers thin, put logic in services

## Don't Forget

- [ ] Add JWT middleware for protected routes
- [ ] Add rate limiting for OTP endpoint
- [ ] Validate file uploads (type, size)
- [ ] Add pagination for list endpoints
- [ ] Add proper TypeScript types everywhere
