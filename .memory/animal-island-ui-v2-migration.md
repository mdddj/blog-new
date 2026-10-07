---
name: animal-island-ui-v2-migration
description: animal-island-ui v2 dropped Icon/Phone/Wallet/FooterType/TimeType; icons now come from naive-icons via a local mapping layer
type: decision
---

**Why**

`animal-island-ui` 2.1.1 (latest, and the version this repo tracks) removed v1.x exports the codebase used:

- `Icon` + `ICON_LIST` (10 island icons: miles, camera, chat, critterpedia, design, diy, helicopter, map, shopping, variant)
- `Phone`, `Wallet`, `TimeType`, `FooterType` (`Footer type="sea" | "tree"` is gone; v2 `Footer` is a plain `© YEAR All Rights Reserved.` text line)

Icons moved to the separate MIT-licensed `naive-icons` package (159 stroke-based `<XIcon />` exports). Verified with `npm view animal-island-ui dist-tags` → `latest: 2.1.1`.

**Project policy:** keep dependencies on the newest published version and adapt the code; downgrading a package is not an option.

**License (read from the tarball LICENSE files — they differ per version)**

- `animal-island-ui` 1.8.0 = **CC BY-NC 4.0**, non-commercial only.
- `animal-island-ui` 2.1.1 = **MIT** (© 2026 guokaigdg).
- `naive-icons` = **MIT**.

This site renders sponsored placements (`frontend/src/components/blog/article-end-ad.tsx`), so **no v1.x artwork may be shipped**. An earlier attempt to vendor the v1.8.0 `icon-*.svg` / `footer-sea.svg` into `frontend/public/animal-icons/` was therefore reverted and the directory deleted — do not bring it back. The sea-wave footer strip has no MIT replacement; the footer is now plain custom markup.

**Still to fix (pre-existing, v1.8.0 asset, commit 3baadea):** `frontend/public/animal-island-cursor.png` is byte-identical to v1.8.0's `dist/files/cursor-icon.1ea93a65.png` (md5 `176c0fba3cd806fe1f478b80c04b8908`). Same CC BY-NC problem; used by the `.public-shell { cursor: url(...) }` rule in `globals.css`.

**How to apply**

- `naive-icons` is a direct dependency at **1.5.3**. `pnpm add naive-icons` first resolved 1.5.0 because pnpm's supply-chain age policy rejected 1.5.3 (published the same day); the fix was to add `naive-icons@1.5.3` to `minimumReleaseAgeExclude` in `frontend/pnpm-workspace.yaml`, the same escape hatch already used for `next` and `animal-island-ui`. It is also a transitive dep of the library, but pnpm does not hoist it — it must stay a direct dependency to be resolvable from app code.
- `frontend/src/components/animal-icon.tsx` is the single mapping layer: `<AnimalIcon name="icon-miles" size={24} bounce />` renders the mapped naive-icons component. Call sites import `AnimalIcon as AIIcon`; the `icon-*` names are a legacy vocabulary, so new code should use `naive-icons` directly.
- Mapping: miles→Leaf, home→Home, camera→Camera, chat→Chat, critterpedia→Book, design→Paintbrush, diy→Pencil, helicopter→Airplane, map→Map, shopping→ShoppingBag, variant→Refresh.
- Icons take `size` (sets SVG width/height) and `color="currentColor"`; `bounce` is the `.animal-icon-bounce` hover animation in `globals.css`, disabled under `prefers-reduced-motion`.
- naive-icons ≤ 1.5.0 passes hyphenated SVG attributes (`"stroke-width"`) as React props, so React logs `Invalid DOM property 'stroke-width'` once per page in dev. **Fixed in 1.5.3** — that is why the version floor is 1.5.3; do not patch the package or pin backwards.
- The skill was updated to match: `.agents/skills/animal-island-ui-style/` now teaches `naive-icons`, the removed components, and the v1.x license restriction.

**Related**

[[public-blog-footer]]
