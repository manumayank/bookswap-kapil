# BookSwap — Handoff to Kapil

This document is everything you need to take over development. Read top-to-bottom.

---

## 1. What is BookSwap?

A paid marketplace for parents to buy/sell used school textbooks and stationery. Web (Next.js) + Mobile (React Native/Expo) sharing one backend (Express + Prisma + Postgres). Full product context is in `CLAUDE.md` — read that first, then come back here.

**Live at:** `https://sybrary.com`

---

## 2. Repository

- **GitHub:** https://github.com/manumayank/bookswap-kapil
- **Default branch:** `main`
- Local clone, `npm install` in `/backend`, `/web`, `/mobile`, then follow the commands in `CLAUDE.md`.

---

## 3. Plugging into Your Claude Instance

The `handoff/memory/` folder contains memory files that bring a Claude Code instance up to speed instantly. To use them:

1. Find your Claude Code memory folder for this project. After you `cd` into the cloned repo and run `claude`, it will be at:
   ```
   ~/.claude/projects/<encoded-repo-path>/memory/
   ```
   (On Windows: `C:\Users\<you>\.claude\projects\<encoded-repo-path>\memory\`)

2. Copy everything from `handoff/memory/` into that folder. Claude will read `MEMORY.md` automatically on startup.

Alternative: in your first Claude conversation, just say "read `handoff/memory/MEMORY.md` and load the linked memories" — Claude can do it manually.

---

## 4. Production Deployment

### VPS
- **IP:** `148.230.67.164`
- **User:** `root`
- **SSH key:** Manu has it (`bookswap_vps`). Ask him for `bookswap_vps` and `bookswap_vps.pub`.
- **Path:** `/opt/bookswap/` — git clone of this repo, plus production-only files.

### Stack (running in Docker)
| Container | Image | Port |
|---|---|---|
| `bookswap-nginx` | `nginx:alpine` | 80, 443 (host) |
| `bookswap-web` | built from `./web` | 3001 (internal) |
| `bookswap-backend` | built from `./backend` | 3000 (internal) |
| `bookswap-postgres` | `postgres:16-alpine` | 5432 (internal) |

### Files that exist only on the VPS and are NOT in git
- `/opt/bookswap/.env` — production secrets (DB password, JWT, SMTP, Pinnacle credentials). Get from Manu.
- `/opt/bookswap/nginx/ssl/fullchain.pem` and `privkey.pem` — Let's Encrypt TLS cert. If they expire, renew with certbot.

### Standard deploy loop
```bash
ssh -i ~/.ssh/bookswap_vps root@148.230.67.164
cd /opt/bookswap
git pull
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
docker logs --tail 50 bookswap-backend
```

### Fresh deploy (worst case rebuild)
1. Clone repo to `/opt/bookswap`
2. Get `.env` from Manu, place at `/opt/bookswap/.env`
3. Generate TLS: `certbot certonly --standalone -d sybrary.com -d www.sybrary.com` → copy to `/opt/bookswap/nginx/ssl/`
4. `docker compose -f docker-compose.prod.yml --env-file .env up -d --build`

---

## 5. Credentials You Need From Manu

He has these — they are NOT in git for obvious reasons:

1. **VPS SSH key** (`bookswap_vps` private key)
2. **Pinnacle WhatsApp credentials** — API URL, API key, mobile, username, password
3. **Production `.env`** — full file (DB password, JWT secret, SMTP, Pinnacle keys)
4. **Domain / DNS access** for `sybrary.com` (if you need to change DNS)
5. **Pinnacle dashboard login** for `https://wa.basiqcrm.com/` (template management)

---

## 6. Current Status & Pending Work

### ✅ Complete
- Auth (OTP via email, JWT)
- User/school management with auto-school creation
- Listings (sell flow with PENDING_APPROVAL → ACTIVE)
- "I Need" requests + matching
- Question papers (public download)
- Deal flow (interested → accepted → completed)
- Admin panel (approve/reject listings)
- Live deployed on sybrary.com

### ⚠️ In Progress — WhatsApp via Pinnacle (blocked)

This is the active piece of work. Status as of handoff:

**Working:**
- Pinnacle credentials in production `.env` and wired into `docker-compose.prod.yml` env block. Confirmed inside container.
- Send endpoint discovered: `POST https://wa.basiqcrm.com/api/send-message` (JSON only)
- Webhook receiver live at `https://sybrary.com/api/webhooks/whatsapp` (handles delivery status + inbound messages, follows Meta Cloud API callback format per the PDF doc)
- Backend code structure in place: `backend/src/lib/whatsapp.ts`, `backend/src/modules/webhooks/whatsapp.routes.ts`, hooked into `deals.service.ts` and `admin.service.ts`

**Blocked on:**
- The exact JSON payload format for `/api/send-message`. Pinnacle is a Laravel app, the API is undocumented (the PDF in repo root is callback-only, not send), and blackbox probing returns opaque PHP errors (`Illegal string offset 'templateid'`) regardless of payload shape — almost certainly because the `apikey` we have isn't being recognized OR template `236037` doesn't belong to that account.
- It is **template-based** — no free-text. Only one approved template found so far:
  - **id:** `236037`, **name:** `registra`
  - **body:** `Dear {{1}}, your registration code is {{2}} kindly enter the code on registration form`
  - This is an OTP template, NOT useful for our 7 deal/listing notifications (the existing `lib/whatsapp.ts` is built around free-text — needs rewrite).

**Next steps for WhatsApp:**
1. **Use the dashboard** (`https://wa.basiqcrm.com/`, logged in) to find: (a) the API documentation page or "Test API" button, (b) the exact send-message payload format from the network tab when sending a test message, (c) verify the API key is active for the `AbacusDeskITWapp` account.
2. **Pivot strategy:** integrate template `236037` into the existing OTP login flow (currently email-based) — it's an immediate UX win.
3. **Long-term:** submit 7 templates for approval in the Pinnacle dashboard so the deal/listing notification events can work. Suggested template names + bodies are in `handoff/memory/project_whatsapp_integration.md`.
4. **Rewrite `backend/src/lib/whatsapp.ts`** — current implementation guesses at endpoint `/api/v1/sendMessage` and uses Meta Cloud API JSON format. Both are wrong. Replace with the real endpoint and the template-based payload once known.

### 📋 Other pending items (not started)
- Production SMTP (currently using dev OTP `123456` if `DEV_OTP_MODE=true`)
- File storage migration from local `uploads/` to S3 (noted as "ready for production" but local-only)
- Image optimization with Sharp
- Automated DB backups
- v2 features (platform fee/commission)

---

## 7. Architecture Cheatsheet (also in CLAUDE.md)

```
backend/src/
  index.ts                # Express entry, mounts /api/*
  middleware/
    auth.ts, adminAuth.ts, validate.ts, upload.ts, rateLimiter.ts
  modules/
    auth/ users/ schools/ listings/ requests/ matches/ deals/ papers/ admin/ webhooks/
        {name}.routes.ts        # Express router
        {name}.controller.ts    # Thin handler
        {name}.service.ts       # Business logic + Prisma
        {name}.dto.ts           # Zod validation
  lib/
    prisma.ts, response.ts, jwt.ts, email.ts, whatsapp.ts
```

- **API contract:** `{ success: true, data: {...} }` or `{ success: false, error: "..." }`
- **Auth:** Bearer JWT in `Authorization` header
- **Validation:** Zod via `validate` middleware in each `.dto.ts`
- **Seller identity (phone, address) is hidden in listing responses until a deal is accepted** — this is a product invariant, don't break it
- **Listings flow:** `PENDING_APPROVAL` → admin reviews → `ACTIVE` (or `REJECTED`)

---

## 8. Quick Sanity Checks After Setup

```bash
# 1. Local backend boots
cd backend && npm install && npm run dev
# Should see: "BookSwap API running on port 3000"

# 2. DB sync
npm run db:push

# 3. Web boots
cd ../web && npm install && npm run dev
# Should see Next.js running on 3001

# 4. VPS health
curl https://sybrary.com/api/listings   # → 200 with JSON listings
curl -X POST https://sybrary.com/api/webhooks/whatsapp -H 'Content-Type: application/json' -d '{}'   # → 200
```

---

## 9. Contact

Manu (`manu@netkarma.ca`) owns the credentials and Pinnacle dashboard access. He's available to unblock you on anything secrets-related.

Good luck.
