---
name: WhatsApp Integration — Pinnacle (basiqcrm)
description: Pinnacle is a Laravel BSP. Send endpoint POST /api/send-message confirmed. Payload format unknown — apikey lookup likely failing. Template 236037 is the only known approved one (OTP, not deal/listing notifs). lib/whatsapp.ts is wrong, needs rewrite.
type: project
originSessionId: 13d106b8-c6cb-4c3c-982f-1ef0e8b320c8
---
## Pinnacle WhatsApp — Current State (2026-05-19)

**Provider:** Pinnacle by Abacus Desk IT Solutions at `https://wa.basiqcrm.com/`. It's a **Laravel/PHP BSP wrapper**, NOT raw Meta Cloud API. The PDF at repo root is callback-only spec, not send.

### What works
- Production env wired: `/opt/bookswap/.env` has `PINNACLE_*` keys; `docker-compose.prod.yml` passes them into backend container. Verified.
- Webhook receiver live: `POST https://sybrary.com/api/webhooks/whatsapp`. Format matches Meta Cloud callback spec from the PDF.
- Backend integration points in `deals.service.ts` and `admin.service.ts`.

### Send endpoint — confirmed
- `POST https://wa.basiqcrm.com/api/send-message`
- JSON only (form-encoded → 406).

### Send payload — UNKNOWN (blocker)
Probed many shapes; all return PHP errors. Most telling: `Illegal string offset 'templateid'` happens regardless of whether templateid is in the body — meaning the apikey lookup is returning a string error before the templateid check, and the next line of PHP crashes reading 'templateid' off a string. Possible root cause: API key not active for account, template doesn't belong to this account, or API access not provisioned.

### Approved templates
Only one found: id `236037`, name `registra`, body `Dear {{1}}, your registration code is {{2}} kindly enter the code on registration form`. This is OTP/registration, not deal/listing notifs.

### lib/whatsapp.ts is wrong
Wrong endpoint (`/api/v1/sendMessage`), wrong format (Meta Cloud free-text JSON). Real API is `/api/send-message` and template-based only. Code needs full rewrite once payload format is known.

### Recommended next moves (handed off to Kapil 2026-05-19)
1. Capture exact send payload from Pinnacle dashboard's network tab (login: credentials with Manu).
2. Pivot strategy: use template `236037` for OTP login (replace email OTP), submit additional templates for approval later.
3. Rewrite `lib/whatsapp.ts` around the real format.

**Why:** Parent engagement feature for the marketplace.
**How to apply:** Don't trust current `lib/whatsapp.ts`. Solve payload format first via dashboard or basiqcrm support.

### Handoff status
Manu handed BookSwap off to Kapil on 2026-05-19. See `project_handoff_kapil.md`.
