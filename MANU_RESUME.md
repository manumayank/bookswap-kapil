# Manu — Resume Where You Left Off

This file is for Manu (or his next Claude session) to pick up state after machine moves or context loss. Last updated 2026-05-25.

If you are **Kapil**: ignore this file. Read `HANDOFF.md` instead.

---

## State as of 2026-05-25 (Manu moving machines)

### Repo
- `main` branch is current. Last meaningful commit was `f7fd10c` "Add handoff bundle for Kapil + commit prod stack files".
- All handoff docs live in `HANDOFF.md` + `handoff/` folder.
- Production stack files are in git (`docker-compose.prod.yml`, `nginx/`).

### Credentials bundle for Kapil
Generated 2026-05-19. **On Manu's old machine** at:
- Archive: `D:\bookswap-handoff\bookswap-handoff-2026-05-19.tar.gpg` (AES-256 encrypted, ~2 KB)
- Passphrase: `D:\bookswap-handoff\.passphrase.txt`

**Status as of session end:** unclear whether Kapil has received the bundle yet. Confirm with Manu.

If the bundle needs regenerating (e.g., new machine, files lost): SCP `/opt/bookswap/.env` from VPS, copy `~/.ssh/bookswap_vps[.pub]`, write a `dashboard-credentials.txt` and `READ-ME-FIRST.md` into a staging dir, then `tar | gpg -c --cipher-algo AES256`. Use a separate random 28-char passphrase, send via different channel.

### WhatsApp Pinnacle — still blocked
Same state as documented in `handoff/memory/project_whatsapp_integration.md`:
- Send endpoint `POST https://wa.basiqcrm.com/api/send-message` (JSON only) — confirmed
- Payload format unknown — all probes return `Illegal string offset 'templateid'`, strongly suggests apikey lookup failing
- Only known approved template: id `236037`, name `registra`, OTP-style body
- `backend/src/lib/whatsapp.ts` is wrong (guesses Meta Cloud API format) — needs rewrite once payload schema is known
- Next move: capture exact send payload from Pinnacle dashboard's network tab, OR ask basiqcrm support for the sending API docs

### Production stack — fine, untouched since 2026-04-26
On `148.230.67.164` (sybrary.com). The backend container has Pinnacle env vars wired in, so the moment we figure out the send format, only a code push is needed — no infra changes.

### Pending items the new session should verify
1. Did Kapil receive and decrypt the credentials bundle?
2. Is the WhatsApp blocker still where we left it, or has Manu/Kapil unblocked it via dashboard exploration?
3. Production stack still healthy? `ssh -i ~/.ssh/bookswap_vps root@148.230.67.164 "docker ps --filter name=bookswap"` — all 4 containers should be Up.

---

## Bringing memory to a new machine

The Claude auto-memory folder is at `~/.claude/projects/<encoded-project-path>/memory/`. It's local-only — it does not sync.

To carry context to a new machine, choose one:

**Option A — copy memory folder:**
1. From OLD machine, zip `C:\Users\mayan\.claude\projects\D--bookswap-kapil-main-bookswap-kapil-new\memory\`
2. On NEW machine, `cd` into the cloned repo and run `claude` once (creates the memory dir at the equivalent encoded path)
3. Extract the zip contents into that new memory dir

**Option B — point at the repo:**
1. `git clone` the repo on the new machine
2. In your first Claude conversation, say "read MANU_RESUME.md and handoff/memory/*.md and project_session_continuity.md if it exists"
3. Claude will load that context, then you can have it write proper local memory files from there

**Option C — both** (recommended): do Option B immediately, then Option A whenever you have access to the old machine.
