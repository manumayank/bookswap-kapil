---
name: BookSwap VPS & Deployment
description: Production VPS info — IP, SSH access, docker-compose stack layout, domain, and standard deploy procedure
type: reference
---

## Production Environment

- **VPS:** `148.230.67.164` (root@) — SSH key: `~/.ssh/bookswap_vps` (get from Manu)
- **Domain:** `https://sybrary.com` (also `www.sybrary.com`)
- **Repo path on VPS:** `/opt/bookswap/` (git clone of `manumayank/bookswap-kapil`, branch `main`)

## Stack — Docker Compose

Compose file: `/opt/bookswap/docker-compose.prod.yml` (now also in repo root)
Env file: `/opt/bookswap/.env` (not in git — get from Manu)

Containers:
| Name | Image | Internal port |
|---|---|---|
| `bookswap-nginx` | `nginx:alpine` | exposes 80/443 |
| `bookswap-web` | built from `./web` | 3001 |
| `bookswap-backend` | built from `./backend` | 3000 |
| `bookswap-postgres` | `postgres:16-alpine` | 5432 |

## VPS-only files (not in git)

- `/opt/bookswap/.env` — production secrets
- `/opt/bookswap/nginx/ssl/fullchain.pem` and `privkey.pem` — Let's Encrypt TLS cert. Renew with `certbot` when expiring.

## Standard deploy loop

```bash
ssh -i ~/.ssh/bookswap_vps root@148.230.67.164
cd /opt/bookswap
git pull
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
docker logs --tail 50 bookswap-backend
```

To just restart one container without rebuild: `docker compose -f docker-compose.prod.yml --env-file .env up -d backend` (or `web`).

## Quick health checks

```bash
curl https://sybrary.com/api/listings   # 200 with JSON
curl -X POST https://sybrary.com/api/webhooks/whatsapp -H 'Content-Type: application/json' -d '{}'   # 200
docker ps --filter name=bookswap   # all four should be Up
```
