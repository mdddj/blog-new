---
name: public-blog-footer
description: Public blog footer uses animal-island-ui Footer, not custom CSS hills
type: decision
---

**Why**

The public footer decoration must be the library `Footer` strip. A hand-rolled `.public-footer-art` radial-gradient looked like clipped mint/teal/yellow blobs at the bottom of the page.

**How to apply**

- Render `<Footer type="sea" />` from `animal-island-ui` at the bottom of `PublicFooter`.
- Do not recreate island hills with CSS gradients or extra `overflow-hidden` clipping.
- Keep `import 'animal-island-ui/style'` in the public layout so the sea SVG tiles at 80px.

**Related**

[[public-blog-pagination]]
