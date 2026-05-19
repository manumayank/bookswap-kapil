---
name: BookSwap Handoff Context
description: Kapil is taking over BookSwap from Manu. Key context, blockers, and who-to-ask. Read this first.
type: project
---

## Handoff to Kapil — 2026-05-19

Manu handed BookSwap off to Kapil to continue development.

### What's in flight
The active piece of work is **WhatsApp integration via Pinnacle** (basiqcrm). See `project_whatsapp_integration.md` for details. It's blocked on figuring out the exact send-message API payload format — needs dashboard exploration or basiqcrm support.

### What's done and stable
Auth, listings, requests, matches, deals, papers, admin panel are all working in production at `https://sybrary.com`. See `HANDOFF.md` in the repo root for the full status table.

### Who has the secrets
**Manu (manu@netkarma.ca)** owns:
- VPS SSH key (`bookswap_vps`)
- Pinnacle WhatsApp dashboard login
- Production `.env` file
- Domain/DNS for sybrary.com

These are NOT in git. Ask Manu for them before any production-touching work.

**Why:** Clean handoff, Manu stepping back from active development. Kapil is the new primary developer.

**How to apply:**
- Don't assume credentials are anywhere — they're with Manu
- Read `HANDOFF.md` in repo root before changing production
- Production stack lives at `/opt/bookswap` on VPS `148.230.67.164` — see `reference_vps_deployment.md`
- The WhatsApp send code in `backend/src/lib/whatsapp.ts` is currently broken (wrong endpoint guess, free-text format on a template-only API). Don't deploy it expecting it to work — rewrite per `project_whatsapp_integration.md`.
