---
name: BookSwap handed off to Kapil
description: On 2026-05-19 Manu handed BookSwap development off to Kapil. HANDOFF.md in repo root + handoff/ folder bundle the context. Manu retains secrets/credentials.
type: project
originSessionId: 13d106b8-c6cb-4c3c-982f-1ef0e8b320c8
---
## Handoff on 2026-05-19

Manu handed BookSwap to Kapil. Kapil takes over as primary developer.

### What was bundled
- `HANDOFF.md` at repo root — comprehensive transfer doc
- `handoff/memory/*.md` — memory files for Kapil's Claude instance
- `handoff/README.md` — install instructions for the memory files
- `docker-compose.prod.yml`, `nginx/nginx.conf`, `nginx/default.conf` pulled from VPS into git for the first time
- `.gitignore` updated to exclude `nginx/ssl/`, `backups/`, `*.bak.*`, `Antigravity13/`

### What Manu still owns (NOT in git)
- VPS SSH private key (`bookswap_vps`)
- Pinnacle WhatsApp dashboard login + API credentials
- Production `.env` file
- Domain/DNS access for sybrary.com

Kapil needs these from Manu directly.

### Credentials bundle status
Generated 2026-05-19 as encrypted archive `D:\bookswap-handoff\bookswap-handoff-2026-05-19.tar.gpg` (AES-256). Passphrase at `D:\bookswap-handoff\.passphrase.txt` on Manu's old machine. **Send confirmation pending** — verify Kapil received it.

### Active blocker at handoff
WhatsApp send-message API payload format unknown — see `project_whatsapp_integration.md`. Recommended next move is for Kapil (or Manu) to capture the real format from the Pinnacle dashboard's network tab.

**Why:** Manu is stepping back from active development.
**How to apply:** Refer questions about credentials/dashboard access to Manu (`manu@netkarma.ca`). For everything else (code, deploy, product decisions) Kapil is now the owner.
