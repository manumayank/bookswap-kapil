---
name: BookSwap VPS & Deployment
description: Production VPS 148.230.67.164, docker-compose stack at /opt/bookswap, domain sybrary.com. SSH key ~/.ssh/bookswap_vps.
type: reference
originSessionId: 13d106b8-c6cb-4c3c-982f-1ef0e8b320c8
---
## VPS access
- IP `148.230.67.164` (root@)
- SSH key `~/.ssh/bookswap_vps`
- Path `/opt/bookswap/` (git clone of `manumayank/bookswap-kapil`)
- Domain `https://sybrary.com`

## Stack — docker compose
Compose file: `/opt/bookswap/docker-compose.prod.yml` (also in git repo root as of 2026-05-19).
Env file: `/opt/bookswap/.env` (NOT in git — has secrets).

Containers: `bookswap-nginx`, `bookswap-web`, `bookswap-backend`, `bookswap-postgres`.

## Files only on VPS (not in git)
- `/opt/bookswap/.env` — secrets
- `/opt/bookswap/nginx/ssl/{fullchain,privkey}.pem` — Let's Encrypt TLS

## Deploy loop
```
ssh -i ~/.ssh/bookswap_vps root@148.230.67.164
cd /opt/bookswap && git pull
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

## Health
- `curl https://sybrary.com/api/listings` → 200
- `docker ps --filter name=bookswap` → 4 containers Up
