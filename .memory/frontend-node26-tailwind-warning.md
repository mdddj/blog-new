---
name: frontend-node26-tailwind-warning
description: Tailwind 4.1.18 triggers Node 26 DEP0205 during Next startup; 4.3.3 uses registerHooks.
type: gotcha
---

**Why**

With Node 26, `@tailwindcss/node` 4.1.18 calls deprecated `module.register()`, causing `[DEP0205]` during `next dev` and `next build`. The stack points to `@tailwindcss/node/dist/index.js`, not application code or Next.js.

**How to apply**

Keep `tailwindcss` and `@tailwindcss/postcss` aligned at 4.3.3 or newer. Version 4.3.3 prefers `module.registerHooks()` and removes the warning. `lucide-react` is optimized by Next.js by default, so do not add it to `experimental.optimizePackageImports`; the redundant setting only prints the experimental banner.

**Related**

- [[frontend/package.json]]
- [[frontend/next.config.ts]]
