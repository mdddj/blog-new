---
name: backend-dependency-upgrade-notes
description: What breaks when bumping argon2 0.6, sqlx 0.9, and rmcp 3.8 in this backend
type: gotcha
---

**Why**

A full backend dependency pass (2026-11) hit three APIs that changed shape. Each one is easy to re-discover the hard way.

**How to apply**

- `sqlx 0.9`: `serde_json::Value` columns need the explicit `json` feature; `default-features = false` no longer implies it. Any SQL string that is not `&'static str` (dynamically built clauses, SQL import handler) must be wrapped in `sqlx::AssertSqlSafe(...)` — the compiler enforces `SqlSafeStr`. Hand-written migrations pass `*sql` to `sqlx::raw_sql`, since the slice yields `&&'static str`.
- `argon2 0.6`: `hash_password(password)` generates its own salt; `SaltString` and `password_hash::rand_core::OsRng` are gone. `PasswordHash` lives at `argon2::password_hash::phc::PasswordHash`. Existing PHC strings still verify because parameters come from the hash itself — old admin hashes kept working.
- `rmcp 3.8`: `rmcp::model::ServerInfo` is a deprecated alias; use `ServerConfig` in `server_info()` and `get_info()`.
- `jsonwebtoken 11`, `sha2 0.11`, `tower-http 0.7`: no code changes needed for this codebase.

Verified with `cargo test` (55), `cargo clippy --all-targets -- -D warnings`, a fresh-database migration run, and HTTP CRUD that exercises JSON columns.

**Related**

[[local-dev-database]]
[[mcp-production-reliability]]
