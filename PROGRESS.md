# Sybrary — Project Progress

## Deployment

- **VPS:** 148.230.67.164
- **Domain:** https://sybrary.com (SSL active, HTTP → HTTPS redirect)
- **Stack:** Backend (Node/Express/TS) + Web (Next.js 14) + PostgreSQL — all running via Docker Compose
- **Compose file:** `/opt/bookswap/docker-compose.prod.yml`
- **Source on VPS:** `/opt/bookswap/`
- **GitHub:** https://github.com/manumayank/bookswap-kapil

---

## What's Done

### Core App
- User registration + OTP login (via Gmail SMTP: kapil1304@gmail.com)
- Book listings with photo upload
- Browse + filter (board, class, city, school, condition)
- "I Need" / book requests feature
- Deal system (interested → accepted → completed)
- Question papers upload + download
- Admin panel at `/admin/dashboard`

### WhatsApp Integration (Pinnacle)
- `backend/src/lib/whatsapp.ts` — sending client + 6 message templates
- `backend/src/modules/webhooks/whatsapp.routes.ts` — delivery status callback endpoint
- Notifications wired into all deal events (requested, accepted, completed, cancelled)
- Notifications wired into admin listing approval/rejection
- Notifications wired into request matching (when a new listing matches an open request)
- **Status: Code deployed, awaiting Pinnacle credentials to go live**

### Infrastructure & Bug Fixes (Session — Apr 5 2026)
- Fixed web Dockerfile: `nextjs` user now has write access to `.next` (was blocking runtime API URL injection)
- Fixed API base URL: was hardcoded to `http://148.230.67.164`, now uses `NEXT_PUBLIC_API_URL` env var
- Fixed image URLs: were hardcoded to `http://148.230.67.164/uploads/`, now use relative paths
- Fixed CORS: added `CORS_ORIGINS` env var to allow `https://sybrary.com`
- Switched `DEV_OTP_MODE` to `false` — real OTP emails now sent via Gmail SMTP
- Admin account: `kapil1304@gmail.com` set as admin in DB

---

## Admin Access

- **URL:** https://sybrary.com/admin/dashboard
- **Login:** https://sybrary.com/login
- **Admin email:** kapil1304@gmail.com (OTP sent to inbox)

---

## Environment (VPS: `/opt/bookswap/.env`)

| Variable | Status |
|----------|--------|
| DATABASE_URL | Set |
| JWT_SECRET | Set (default — should be randomized) |
| SMTP_HOST/USER/PASS | Set (kapil1304@gmail.com) |
| DEV_OTP_MODE | false (real OTP active) |
| CORS_ORIGINS | Set (sybrary.com) |
| PINNACLE_API_URL | **Missing — needed for WhatsApp** |
| PINNACLE_MOBILE_NO | **Missing — needed for WhatsApp** |
| PINNACLE_USERNAME | **Missing — needed for WhatsApp** |
| PINNACLE_PASSWORD | **Missing — needed for WhatsApp** |
| PINNACLE_API_KEY | **Missing — needed for WhatsApp** |

---

## Remaining Tasks

- [ ] Add Pinnacle credentials to `/opt/bookswap/.env` and `docker-compose.prod.yml`, restart backend
- [ ] Test WhatsApp notifications end-to-end
- [ ] Randomize JWT_SECRET for production security
- [ ] Migrate file uploads to S3 (currently stored in Docker volume — will be lost if container is recreated)
