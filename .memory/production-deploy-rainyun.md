---
name: production-deploy-rainyun
description: Production runs on rainyun-rcs-hk; compose project is blog-new whose service names differ from container names
type: decision
---

**Why**

The production blog stack lives on the `rainyun-rcs-hk` SSH host (64.90.30.70, key `~/.ssh/rainyun-rcs-hk.pem`) under 1Panel's compose directory:

- Working dir: `/opt/1panel/docker/compose/blog-new-docker/`
- Config: `docker-compose.yml`, `backend.env`, `.env`
- Compose project label: `blog-new` — **not** the directory name `blog-new-docker`. A plain `docker compose ps` in that directory returns an empty table because it derives the project name from the directory. Always pass `-p blog-new`.

Service names ≠ container names. Both `blog compose` commands must use the service name:

| service | container |
|---|---|
| `backend` | `blog-backend` |
| `frontend` | `blog-frontend` |
| `nginx` | `blog-nginx` (not running) |
| `redis` | `blog-redis` |
| `rustfs` | `blog-rustfs` (not running) |

`docker compose -p blog-new pull blog-backend` fails with `no such service: blog-backend`.

**How to apply**

Image tags are pinned per release (`v1.0.37` → `v1.0.38`), not floating `latest`. Upgrade procedure:

1. Back up: `cp docker-compose.yml docker-compose.yml.bak-<date>-<oldtag>`
2. `sed -i "s#…/blog-backend:vX#…/blog-backend:vY#; s#…/blog-frontend:vX#…/blog-frontend:vY#" docker-compose.yml`
3. `docker compose -p blog-new config -q` to validate
4. `docker compose -p blog-new pull backend frontend`
5. Backend first, then frontend, always with `--no-deps` so db/redis/rustfs are never recreated:
   - `docker compose -p blog-new up -d --no-deps backend` → wait for `healthy` (backend runs auto-migrations at startup)
   - `docker compose -p blog-new up -d --no-deps frontend`
6. Verify: `docker inspect <name> --format "{{.State.Health.Status}} {{.Config.Image}}"`, then `curl -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/` (200) and `http://127.0.0.1:8080/api/v1/health` (200)

The `blog-backend` container logs are empty even when healthy — do not read "no logs" as a failure; rely on the health status and `/api/v1/health`.

Harmless warning on every `up`: `a network with name blog-new_blog-network exists but was not created by compose` (pre-existing network).

Public endpoints: `https://itbug.shop` (frontend) and `https://api.itbug.shop` (backend).

**Related**

[[public-blog-footer]]
