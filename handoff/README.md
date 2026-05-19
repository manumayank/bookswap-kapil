# Handoff Bundle

Files that bring a new developer (and their Claude instance) up to speed on BookSwap.

## What's here

```
handoff/
├── README.md                              ← this file
└── memory/                                ← drop these into your Claude memory folder
    ├── MEMORY.md                          ← index, loaded automatically by Claude
    ├── project_handoff_context.md         ← read first — who, what, why
    ├── reference_vps_deployment.md        ← VPS info, deploy procedure
    ├── project_whatsapp_integration.md    ← active blocker, what's known
    └── user_kapil.md                      ← user profile placeholder
```

## How to install memory files into your Claude

After cloning the repo and running `claude` in it once, Claude will create a memory folder at:

- **Windows:** `C:\Users\<you>\.claude\projects\<encoded-path>\memory\`
- **macOS / Linux:** `~/.claude/projects/<encoded-path>/memory/`

The `<encoded-path>` is your repo path with `:` and `\` or `/` replaced by `-`. After running Claude once you can just `cd ~/.claude/projects/` and find the folder.

Copy everything in `handoff/memory/` into that folder. Claude reads `MEMORY.md` automatically on startup; the other files are loaded on demand.

## Alternative: don't bother with memory files

Just open `HANDOFF.md` at the repo root and paste it into your first Claude conversation, or tell Claude `read HANDOFF.md and handoff/memory/*.md before we start`. Works the same way, no setup.
