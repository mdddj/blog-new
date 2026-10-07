---
name: public-blog-footer
description: PublicFooter is hand-built markup plus a vendored sea strip; year is a module constant
type: decision
---

**Why**

`PublicFooter` in `frontend/src/components/blog/public/index.tsx` is custom markup: site title, sanitized footer text, `© {CURRENT_YEAR}`, ICP / police / email links, social icon row.

The old memory claimed the library `Footer` supplied a decorative sea strip via `<Footer type="sea" />`. That prop does not exist in v2 (see [[animal-island-ui-v2-migration]]). A radial-gradient stand-in looked like clipped mint/teal blobs, and vendoring the v1.8.0 `footer-sea.svg` was reverted for licensing reasons — so there is deliberately **no** wave strip.

**How to apply**

- No decorative art at the bottom of the footer. If one is wanted, it has to be newly drawn in-house (MIT-safe) — not copied from v1.x.
- The `<footer>` spacing is `pb-10 pt-8`; the container grid is followed directly by `</footer>`.
- The year comes from module-level `const CURRENT_YEAR = new Date().getFullYear()`; the oxlint `react(purity)` rule rejects `Date` calls during render, and `useMemo`/`useState` do not exempt it.
- Keep `import 'animal-island-ui/style'` in `src/app/(blog)/layout.tsx` for the remaining v2 components' styles.

**Related**

[[animal-island-ui-v2-migration]]
