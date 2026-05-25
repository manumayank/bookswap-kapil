---
name: Session continuity — Manu moving machines 2026-05-25
description: Active state snapshot from session ending 2026-05-25. Bookmarks: handoff to Kapil generated but not yet confirmed sent; WhatsApp send-API still blocked; credentials bundle exists encrypted on old machine.
type: project
originSessionId: 13d106b8-c6cb-4c3c-982f-1ef0e8b320c8
---
## State as of 2026-05-25 (session ending — Manu moving to new machine)

### Repo (https://github.com/manumayank/bookswap-kapil)
- Last commit relevant to handoff: `f7fd10c` — "Add handoff bundle for Kapil + commit prod stack files"
- All handoff docs and memory bundle are in git: `HANDOFF.md` at root, `handoff/memory/*`, `handoff/README.md`
- Production stack files now in git for the first time: `docker-compose.prod.yml`, `nginx/nginx.conf`, `nginx/default.conf`
- `.gitignore` updated to exclude `nginx/ssl/`, `backups/`, `*.bak.*`, `Antigravity13/`

### Credentials bundle for Kapil
Generated 2026-05-19. Location on OLD machine:
- Archive: `D:\bookswap-handoff\bookswap-handoff-2026-05-19.tar.gpg` (AES-256, ~2 KB)
- Passphrase: `D:\bookswap-handoff\.passphrase.txt`

Status: Generated but unclear whether sent to Kapil yet. Verify with Manu next session.

If the file is gone from the new machine and needs regenerating, the procedure is in the last messages of session `13d106b8-c6cb-4c3c-982f-1ef0e8b320c8` — but easier to just re-run:
1. SCP `/opt/bookswap/.env` from VPS
2. Copy `~/.ssh/bookswap_vps` and `.pub`
3. Make a `dashboard-credentials.txt` with Pinnacle login (creds in env file)
4. Make a `READ-ME-FIRST.md`
5. `tar | gpg -c --cipher-algo AES256`

### WhatsApp Pinnacle integration — still blocked
Same as `project_whatsapp_integration.md`. Quick recap:
- Send endpoint confirmed `POST https://wa.basiqcrm.com/api/send-message` (JSON only)
- Payload format unknown — all probes return `Illegal string offset 'templateid'`
- Only known approved template: id `236037` (OTP, name `registra`)
- Next move: capture send-message format from Pinnacle dashboard network tab OR escalate to basiqcrm support

### Production stack — fine
Containers running on `148.230.67.164` (sybrary.com). Last touched 2026-04-26 when backend was recreated with Pinnacle env vars. Nothing has changed since per Manu (assumption — verify with `docker ps` and recent logs if needed).

### Files on OLD machine that may need to come over
- Local Claude memory: `C:\Users\mayan\.claude\projects\D--bookswap-kapil-main-bookswap-kapil-new\memory\` (this directory)
- SSH key: `C:\Users\mayan\.ssh\bookswap_vps` and `bookswap_vps.pub`
- Credentials bundle (if not yet sent): `D:\bookswap-handoff\`
- Local clone of repo at `D:\bookswap-kapil-main\bookswap-kapil-new\bookswap-kapil-main\` — but this can just be re-cloned from GitHub

### How to bring memory to new machine
The Claude memory folder path is derived from the project directory. If the project lives at the same path on the new machine, the encoded folder name will be the same. If different, copy the contents into the new project's memory folder once Claude has created it (after running `claude` in the project for the first time).

Easiest: just `git clone` and the `handoff/memory/*` files are already in the repo as a portable copy.

**Why:** Manu changing dev machines mid-handoff. Want zero-loss context for the next session.
**How to apply:** Verify with Manu: did Kapil receive the bundle? Is the WhatsApp blocker still where we left it?
