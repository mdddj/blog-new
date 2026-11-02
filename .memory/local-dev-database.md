---
name: local-dev-database
description: Local backend dev needs the compose postgres on port 5433 (blog-postgres); backend/.env points at credentials that do not work
type: gotcha
---

**Why**

`backend/.env` sets `DATABASE_URL=postgres://postgres:<pw>@localhost:5432/blog`, but the machine's `localhost:5432` is the unrelated `dd-server-postgres` container whose `postgres` password is different, and it has no `blog` database. Starting the backend with the checked-in `.env` fails with `PgDatabaseError 28P01 password authentication failed for user "postgres"`.

Compose maps `${POSTGRES_PORT:-5432}`, so the project's own db can be brought up on 5433 without touching the shared instance.

**How to apply**

```bash
cd /Users/ldd/ai-projects/blog-new
docker compose up -d redis                       # blog-redis on 6379
POSTGRES_PORT=5433 docker compose up -d postgres # blog-postgres on 5433
DATABASE_URL='postgres://bloguser:<pw>@localhost:5433/blog' \
  cargo run --bin blog-backend                   # migrations run at startup
```

- The compose db is `bloguser` / `blogpassword` / db `blog` (compose defaults).
- Admin user is not seeded by migrations. Insert the hash from `dev.sh` (`create_admin` block, password `admin123`) via `docker exec -i blog-postgres psql -U bloguser -d blog`.
- The MCP token is not seeded either: log in through `POST /api/v1/auth/login`, then `POST /api/v1/admin/mcp/token/rotate` and use the returned token as `Authorization: Bearer`.
- rmcp answers `/mcp` with `text/event-stream` even when the client asks for JSON, so curl tests must strip `data: ` lines and keep the last one.

**Related**

[[mcp-remote-client-config]]
[[ads-mcp-tools]]
