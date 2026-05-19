---
name: WhatsApp Integration — Pinnacle (basiqcrm)
description: Active work. Send-message API format is the blocker. Endpoint and template ID known. Code in lib/whatsapp.ts is currently wrong — needs rewrite around templates.
type: project
---

## Pinnacle WhatsApp — Current State (2026-05-19)

**Provider:** Pinnacle by Abacus Desk IT Solutions, hosted at `https://wa.basiqcrm.com/` (Laravel/PHP app, NOT Meta's WhatsApp Cloud API directly — it's a BSP wrapper).

### What works
- **Production env wiring done.** `/opt/bookswap/.env` has `PINNACLE_*` keys (get values from Manu). `docker-compose.prod.yml` `backend.environment:` passes them through. Verified `docker exec bookswap-backend env | grep PINNACLE` shows all 5.
- **Webhook receiver live:** `POST https://sybrary.com/api/webhooks/whatsapp` — handles delivery status + inbound messages in Meta Cloud API callback format (per the PDF at repo root `Pinnacle WhatsApp Solution Cloud Callback API V2 June2024.pdf`).
- **Backend integration points wired** (fire-and-forget) in `backend/src/modules/deals/deals.service.ts` (deal events) and `backend/src/modules/admin/admin.service.ts` (listing approval/rejection + request matches). Notification record created either way.

### Send endpoint — confirmed
- `POST https://wa.basiqcrm.com/api/send-message`
- JSON only (`Content-Type: application/json`). Form-encoded returns `406 Only JSON requests are allowed`.

### Send payload — NOT YET KNOWN
Blackbox probed many shapes; all return opaque PHP errors:
- Empty body → `Trying to access array offset on value of type null`
- With apikey/mobile/to/message → `Illegal string offset 'templateid'`
- Various param shapes (`params`, `variables`, `var1`/`var2`, Meta-style `template` object) → same error

The persistent `Illegal string offset 'templateid'` regardless of payload **strongly suggests the apikey lookup is returning a string error instead of an account record**, so the next `$result['templateid']` access crashes. Possible causes: API key not enabled for the account, template 236037 doesn't belong to this account, or API access not provisioned at all.

### Approved templates (as of 2026-05-19)
Only one found in the dashboard so far:

| id | name | body | variables |
|---|---|---|---|
| `236037` | `registra` | `Dear {{1}}, your registration code is {{2}} kindly enter the code on registration form` | `{{1}}`=name, `{{2}}`=OTP code |

This template is **not aligned** with the 7 notification types the current code targets (deal/listing events). It's an OTP/registration template.

### Current `lib/whatsapp.ts` is wrong
The implementation guesses:
- Endpoint: `/api/v1/sendMessage` (real is `/api/send-message`)
- Auth: `Authorization: Bearer <apikey>` + body fields (format unclear, likely just `apikey` in JSON body)
- Body: Meta Cloud API JSON shape with free-form text (real API is template-only — Pinnacle won't send free text)

**Do NOT trust the existing code as a starting point.** Rewrite it once the real payload format is known.

### Recommended next moves
1. **Best path — capture from dashboard:** log into `https://wa.basiqcrm.com/` (get credentials from Manu), find any "Send Test Message" / "Test API" button on a template page, open DevTools Network tab, click send, capture the POST request to `/api/send-message`. That request body IS the answer.
2. **Verify api key is active** in dashboard "Settings → API" or similar — may need regeneration.
3. **Strategic pivot — OTP first:** instead of trying to wire 7 different notification templates (which would need submitting for Meta approval anyway), integrate template `236037` into the existing auth/OTP flow. Replace email OTP with WhatsApp OTP — big UX win, immediate value with the one template we have. Then submit more templates over time.
4. **Submit additional templates** for approval via the dashboard for: deal requested, deal accepted, deal completed, deal cancelled, listing approved, listing rejected, new request match. Suggested wording can come from the existing `TEMPLATES` const in `backend/src/lib/whatsapp.ts`.

### Files involved
- `backend/src/lib/whatsapp.ts` — sending client + templates (needs rewrite)
- `backend/src/modules/webhooks/whatsapp.routes.ts` — callback receiver (looks fine, matches PDF spec)
- `backend/src/modules/deals/deals.service.ts` — sends WhatsApp on deal events
- `backend/src/modules/admin/admin.service.ts` — sends WhatsApp on listing approval/rejection + matches
- `docker-compose.prod.yml` — backend env block has `PINNACLE_*: ${PINNACLE_*}` references

**Why:** Core feature for parent engagement on a marketplace where buyers don't have the platform always open.

**How to apply:** Don't deploy the current `lib/whatsapp.ts` expecting it to work. Solve the payload format first (path #1 above), then rewrite. Pivot to OTP-via-WhatsApp first for an immediate win.
