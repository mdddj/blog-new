# Ads Module Implementation Plan

**Goal:** Administrators can CRUD self-serve image+copy ads; article pages show one weighted-random enabled ad after the body.

**Approach:** Clone the friend-link stack (`migration → model → repo → handler → route` + admin page). Public `GET /ads?slot=` returns the enabled list; the article client picks one by weight. No stats, MCP, import/export, or extra slots in the UI.

**Verification:** `cd backend && cargo test ads:: && cargo clippy --all-targets -- -D warnings` for new ads code (fix only ads-related clippy); `cd frontend && npx oxlint` on touched files; `npx tsc --noEmit` if practical.

**Design:** `docs/plans/2026-09-02-ads-module-design.md`

---

### Task 1: Database migration and cache key

**Files:**
- Create: `backend/migrations/010_ads.sql`
- Modify: `backend/src/utils/migration.rs` (`MIGRATIONS` array)
- Modify: `backend/src/services/cache_service.rs` (`cache_keys`)

**Changes:**
1. Create `ads` table matching the design (title, intro, image_url, target_url, cta_text default `了解更多`, slot default `article_end`, weight default 1 CHECK >= 1, enabled default true, sort_order default 0, timestamps). Index `(slot, enabled)`. Attach `update_updated_at_column` trigger like `009_resume.sql`.
2. Register `010_ads` in `MIGRATIONS` immediately after `009_resume`.
3. Add `cache_keys::ad_list(slot: &str) -> String` as `ads:list:{slot}`.

**Verification:**
- Run: `rg "010_ads" backend/src/utils/migration.rs backend/migrations/010_ads.sql`
- Expect: migration name registered and SQL file present

**Done when:** Migration file exists, is listed in `MIGRATIONS`, and cache key helper exists.

---

### Task 2: Model, repository, handler, routes

**Files:**
- Create: `backend/src/models/ad.rs`
- Create: `backend/src/repositories/ad_repo.rs`
- Create: `backend/src/handlers/ad.rs`
- Create: `backend/src/routes/ad.rs`
- Modify: `backend/src/models/mod.rs`
- Modify: `backend/src/repositories/mod.rs`
- Modify: `backend/src/handlers/mod.rs`
- Modify: `backend/src/routes/mod.rs`

**Template:** Copy structure from `friend_link` (`models/friend_link.rs`, `repositories/friend_link_repo.rs`, `handlers/friend_link.rs`, `routes/friend_link.rs`). Validation tests follow `handlers/resume.rs`.

**Changes:**
1. Models: `Ad`, `CreateAdRequest`, `UpdateAdRequest`, `AdResponse`, `AdQueryParams { slot: String }`. Constant `SLOT_ARTICLE_END = "article_end"`. Helpers `is_valid_slot`, `is_http_url` (only `http://` / `https://`, trim, no whitespace).
2. Repo: `find_all` (ORDER BY sort_order, id), `find_enabled_by_slot`, `find_by_id`, `create`, `update` (COALESCE like friend links), `delete`.
3. Handler public `list_ads`: require slot; reject unknown slot with `ValidationError`; cache 10 minutes; only enabled rows.
4. Handler admin: list all; get; create; update; delete. On write, `cache.delete` for the affected slot (`ad_list`). On update/delete, invalidate the existing row's slot (and the new slot if it changed).
5. Validation (create + update when field present): title non-empty max 100; intro max 200; image_url and target_url required http(s); cta_text max 30, empty → `了解更多`; weight >= 1; slot in known set. Unit tests on the pure validate function.
6. Routes: public `GET /ads`; admin `GET/POST /ads`, `GET/PUT/DELETE /ads/{id}`.
7. Wire into `create_routes` and `create_admin_routes` next to friend links.

**Verification:**
- Run: `cd backend && cargo test ads::`
- Expect: validation tests pass; project compiles

**Done when:** Public list and admin CRUD compile; invalid URL/weight/slot fail validation tests; unknown slot is rejected.

---

### Task 3: Frontend types, API client, weight picker

**Files:**
- Modify: `frontend/src/types/index.ts`
- Modify: `frontend/src/lib/api.ts`
- Create: `frontend/src/lib/ads.ts`

**Changes:**
1. Types: `AdSlot = "article_end"`, `Ad`, `CreateAdRequest`, `UpdateAdRequest`.
2. `adApi.list(slot)` → `GET /ads?slot=` with `next: { revalidate: 300 }` like friend links. Admin `listAll/create/update/delete`.
3. `pickAdByWeight(ads)`: ignore weight < 1 or non-finite; empty → `null`; otherwise weighted random. Export `ARTICLE_END_SLOT = "article_end"`.

**Verification:**
- Run: `cd frontend && npx oxlint src/lib/ads.ts src/lib/api.ts src/types/index.ts`
- Expect: no new lint errors

**Done when:** Types and `adApi` match backend JSON field names (`snake_case` as the rest of the API).

---

### Task 4: Public article-end card

**Files:**
- Create: `frontend/src/components/blog/article-end-ad.tsx`
- Modify: `frontend/src/app/(blog)/blog/[slug]/page.tsx`
- Modify: `frontend/src/app/(blog)/blog/[slug]/blog-detail-client.tsx`

**Changes:**
1. Fetch ads in the server page with `adApi.list("article_end")` inside try/catch; on failure pass `[]`. Pass `ads` into `BlogDetailClient`.
2. Client calls `pickAdByWeight(ads)` once (useState initializer). If null, render nothing.
3. Place `ArticleEndAd` after the article grid, before the prev/next section.
4. Card uses `PublicCard` + `animal-island-ui` `Tag`/`Button`/`Icon` only from package root. Tokens `var(--animal-*)`. Cover image via `next/image`. Title/intro as text. CTA is `Button type="primary"` with `onClick` opening `target_url` (Button has no `href` prop — do not invent one). Also wrap title/image in `<a target="_blank" rel="noopener noreferrer sponsored">`. Fixed 「广告」 tag. Image `onError` hides the img, keeps the card.
5. Follow `.agents/skills/animal-island-ui-style/SKILL.md` hard rules: no emoji, no pure black, no className overrides of library colors/radii/shadows, no native `<button>`.

**Verification:**
- Run: `cd frontend && npx oxlint src/components/blog/article-end-ad.tsx src/app/\(blog\)/blog/\[slug\]/`
- Expect: no new lint errors

**Done when:** Empty ads hide the slot; a selected ad renders between article body and prev/next.

---

### Task 5: Admin ads page and nav

**Files:**
- Create: `frontend/src/app/admin/ads/page.tsx`
- Modify: `frontend/src/components/admin/sidebar.tsx`
- Modify: `frontend/src/app/admin/page.tsx` (quick action next to 友链)

**Template:** `frontend/src/app/admin/friend-links/page.tsx` and `frontend/src/app/admin/projects/page.tsx`.

**Changes:**
1. Table: thumbnail, title, slot, weight, enabled switch, actions (edit/delete).
2. Dialog fields: title, intro, image_url, target_url, cta_text, weight, sort_order, enabled, slot (fixed `article_end` for v1; can be a disabled select with one option).
3. Sidebar item 「广告管理」 with `Megaphone` icon, href `/admin/ads`, after 友链管理.
4. Dashboard quick action for 广告管理.

**Verification:**
- Run: `cd frontend && npx oxlint src/app/admin/ads src/components/admin/sidebar.tsx src/app/admin/page.tsx`
- Expect: no new lint errors

**Done when:** `/admin/ads` can list/create/edit/toggle/delete; sidebar link is visible.

---

### Out of scope

MCP tools, data import/export, click tracking, scheduling, category targeting, homepage/sidebar slots UI, dedicated image uploader, frontend test runner.

**Do not commit.** Leave the working tree for the parent session to review.
