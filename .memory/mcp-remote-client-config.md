---
name: mcp-remote-client-config
description: Remote /mcp clients must send Authorization Bearer and use headers, not header.
type: gotcha
---

**Why**

`https://api.itbug.shop/mcp` is Streamable HTTP and rejects anything that is not `Authorization: Bearer <token>`. A raw token, or a client field named `header` instead of `headers`, returns `401 Missing or invalid Authorization header` even when the service is up.

**How to apply**

- VS Code: workspace `.vscode/mcp.json` or user MCP config. Top-level key is `servers`. Use `type: "http"`, `url: https://<host>/mcp`, and `headers.Authorization: "Bearer …"`. Prefer `${input:…}` so the token is not committed.
- Cursor: same header shape, but the top-level key is `mcpServers`.
- Probe with POST `initialize` plus `Accept: application/json, text/event-stream`. No auth or missing `Bearer` → 401; correct Bearer → 200 SSE and `mcp-session-id`.
- Admin UI (`frontend/src/app/admin/settings/settings-tabs.tsx`) only shows endpoint + token; it does not generate a client snippet. Rotate the token if it ever appeared in chat or git.

**Related**

- [[backend/src/mcp/auth.rs]]
- [[frontend/src/app/admin/settings/settings-tabs.tsx]]
