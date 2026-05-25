# Manu's Memory (backup)

These are Manu's personal Claude memory files, mirrored from `~/.claude/projects/<encoded-path>/memory/` on his local machine and pushed here as a portable backup (for machine moves, context loss, etc.).

**This folder is NOT for Kapil.** Kapil should use `../handoff/memory/` instead (designed as a clean drop-in for his Claude instance).

## To restore on a fresh machine

1. `git clone` this repo
2. Run `claude` once inside the repo so it creates the per-project memory folder at `~/.claude/projects/<encoded-path>/memory/`
3. Copy all `.md` files from this directory into that folder
4. Next `claude` session will load them automatically via `MEMORY.md`

## Keeping in sync

After meaningful changes to local memory, copy them here and push:
```bash
cp ~/.claude/projects/D--bookswap-kapil-main-bookswap-kapil-new/memory/*.md manu-memory/
# Run a secret scan before committing
grep -rEi '(password|key|secret|token)' manu-memory/
git add manu-memory/ && git commit -m "Sync local memory" && git push
```
