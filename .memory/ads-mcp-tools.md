---
name: ads-mcp-tools
description: Ad CRUD is exposed over MCP (list/create/update/delete) and shares validation with the HTTP handlers via models::ad
type: decision
---

**Why**

The ad module shipped without MCP tools even though every other admin entity (blogs, categories, tags, friend links, projects, documents) had them. The v1 design doc listed "MCP 工具" as out of scope; that gap is now closed.

Duplicating the ad rules inside the MCP server would let the two paths drift — the HTTP handler already enforced trimmed URLs, `http/https` only, weight >= 1, known slots, and the 100/200/30 character limits.

**How to apply**

- `backend/src/models/ad.rs` now owns the shared ad rules: `MAX_TITLE_LEN` / `MAX_INTRO_LEN` / `MAX_CTA_LEN`, `normalize_create_ad`, `normalize_update_ad`, `validate_create_ad`, `validate_update_ad`, `resolve_cta_text`. They return `Result<(), String>`; the HTTP handler maps failures to `ApiError::ValidationError`, MCP maps them to tool errors.
- `handlers/ad.rs` keeps only HTTP glue. Its old validation tests moved to `models/ad.rs`.
- MCP tools in `src/mcp/server.rs`: `list_ads` (all ads, optional `slot` / `enabled` filters), `create_ad`, `update_ad`, `delete_ad`. Args `ad_id` accept the `id` alias, same as `blog_id`.
- Payload builders `build_create_ad_request` / `build_update_ad_request` are free functions (not methods) so they are unit-testable without `AppState`.
- Every write deletes `cache_keys::ad_list(slot)`; update clears both the old slot and the new slot when `slot` changes, mirroring `update_ad` in the handler.
- `server_info` instructions list 广告 alongside the other resources.

Verify: `cd backend && cargo test && cargo clippy --all-targets -- -D warnings`.

**Related**

[[mcp-production-reliability]]
