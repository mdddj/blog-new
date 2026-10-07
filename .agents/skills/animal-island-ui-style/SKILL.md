---
name: animal-island-ui-style
description: >
    Build React UIs in the animal-island-ui style — an Animal Crossing-inspired component
    library (warm earth tones, pill shapes, 3D game-button depth, soft motion).
    Use when (1) building pages or components with the animal-island-ui npm package in a
    React project; (2) generating a standalone single-file HTML page in this style with no
    build step; (3) the user asks for "Animal Crossing style", "animal island style", or a
    cozy rounded game-like UI.
---

# animal-island-ui style

animal-island-ui is a React + TypeScript component library inspired by Nintendo's
"Animal Crossing: New Horizons" interface — 38 components, MIT licensed since 2.0
(v1.x was CC BY-NC 4.0, non-commercial use only — never copy v1.x assets). Runtime:
depends on `naive-icons` for icon art; peers `classnames`, `react`, `react-dom`.

Source & canonical design definition: https://github.com/guokaigdg/animal-island-ui

**Verified against animal-island-ui 2.1.1** (current `latest`). On any conflict with
`node_modules/animal-island-ui/dist/types/`, the installed declarations win.

Icons are no longer part of this library. v2 dropped `Icon` / `ICON_LIST` and depends on
[naive-icons](https://github.com/guokaigdg/naive-icons) (MIT, 159 named `<XIcon />`
exports) for icon art. Also removed in v2: `Phone`, `Wallet`, `FooterType`
(`Footer type="sea" | "tree"`), `TimeType`, `Progress.infoPosition`.

## Pick your scenario first

| Scenario | Entry |
| --- | --- |
| React project — the `animal-island-ui` npm package is (or can be) installed | [references/react-project.md](references/react-project.md) |
| Single self-contained HTML file — no npm, no bundler, React via CDN + Babel runtime | [references/standalone-html.md](references/standalone-html.md) |

Both scenarios share the component catalog and the hard rules below.

## The style in one paragraph

Warm parchment backgrounds (`--animal-bg`), earth-brown text (never pure black), mint-teal
primary accent, large-radius pill shapes (buttons and inputs are 50px pills; nothing
interactive below 12px radius), 3D "game button" stacked shadow on primary buttons only,
rounded Nunito + Noto Sans SC typography (body weight 500, headings 600–900), soft
`cubic-bezier(0.4, 0, 0.2, 1)` motion over 0.15–0.35s, and a mix of geometric shapes
(swallowtail ribbon Title, stamp-perforated Image frame) with organic ones (SVG
blob-clipped Modal).

## Design tokens

The packaged stylesheet declares runtime CSS custom properties on `:root` — prefix
`--animal-*` — mapped from the library's compile-time tokens. Groups: primary/status
colors (with hover/active/bg variants), text colors, backgrounds, borders, radii, spacing,
shadows, font family/sizes, motion durations/easing, control heights.

When to use them:

- Styling layout wrappers, custom elements, or app-specific decoration next to library
  components: use `var(--animal-*)` instead of raw hex values so custom UI stays on-palette.
- Theming: consumers may override `--animal-*` variables after importing the library style.
- Re-implementing the style without the library (standalone HTML): a complete `:root`
  template with exact values lives in the design system —
  [css-variables.md](https://github.com/guokaigdg/animal-island-ui/blob/main/docs/design-system/css-variables.md)
  (raw: https://raw.githubusercontent.com/guokaigdg/animal-island-ui/main/docs/design-system/css-variables.md).

Token values are deliberately not restated here. Exact definitions (every hex/px/ms):
[design-tokens.md](https://github.com/guokaigdg/animal-island-ui/blob/main/docs/design-system/design-tokens.md).
Pixel-exact per-component CSS (shadows, keyframes, clip-paths):
[design-system/components/](https://github.com/guokaigdg/animal-island-ui/tree/main/docs/design-system/components).

## Component catalog

Props references are grouped by category under `references/components/` (props, legal
values, defaults — copied from source):

| Category | Components | Reference |
| --- | --- | --- |
| General | Button, Typewriter, Cursor | [general.md](references/components/general.md) |
| Icons | `naive-icons` package (MIT) — `<CameraIcon />`, 159 exports | [general.md](references/components/general.md) |
| Layout | Card, Title, Divider, Collapse, Tabs, Background | [layout.md](references/components/layout.md) |
| Form controls | Input, Switch, Checkbox, Radio, Select | [form-controls.md](references/components/form-controls.md) |
| Form container | Form (+ FormItem, useForm) | [Form.md](references/components/Form.md) |
| Overlays | Modal, Drawer, Tooltip | [overlays.md](references/components/overlays.md) |
| Feedback | Loading, Progress, Skeleton, BackTop | [feedback.md](references/components/feedback.md) |
| Notification | Notification (imperative API) | [Notification.md](references/components/Notification.md) |
| Data display | Table, CodeBlock, Tag | [data-display.md](references/components/data-display.md) |
| Decorative | Time, Footer | [decorative.md](references/components/decorative.md) |

Added in 2.1 and not yet documented in the reference files — read
`node_modules/animal-island-ui/dist/types/components/<Name>/` for exact props:
`Avatar` / `AvatarGroup`, `Background`, `Badge`, `Rate`, `Upload`.

## Hard rules (violations are bugs)

1. Never invent props. Every prop must appear in the component reference (or, in an
   installed project, in the package's TypeScript declarations — the ground truth).
2. Import the stylesheet exactly once at the app entry: `import 'animal-island-ui/style'`.
   Without it components render unstyled.
3. Never use pure black (`#000`/`#111`) text or cold gray (`#fafafa`/`#f5f5f5`) backgrounds.
4. Never use cold blue focus rings. Focus colors are yellow (`#ffcc00` inputs) or the mint
   primary (buttons).
5. Never give an interactive element corners sharper than 12px radius; buttons and inputs
   are 50px pills.
6. The 3D pixel-stack shadow belongs to primary / danger-primary buttons only. Cards have
   no box-shadow. Switch has no outer shadow. Input shadow is opt-in (`shadow={true}`).
7. Modal keeps its SVG blob clip-path — never a rounded rectangle. Title always renders one
   of its three shapes (`variant="ribbon"` swallowtail default, `"layer"` double paper,
   `"tab"` folded note) — never a blob, pill, or plain block (`Card type="title"` no longer
   exists).
8. Fonts are Nunito + Noto Sans SC; weight never below 400; no monospace for UI text
   (CodeBlock excepted).
9. Motion uses `cubic-bezier(0.4, 0, 0.2, 1)` over 0.15–0.35s.
10. Icons come from `naive-icons` (MIT, 159 exports) — `import { CameraIcon } from
    'naive-icons'`, sized with `size`, coloured by `currentColor`. Never emoji, Unicode
    symbols (✓ ✕ →), hand-rolled SVG, or third-party icon fonts.
11. Select is controlled-only (`options` + `value` + `onChange` all required). Controlled
    `Input`/`Switch`/`Checkbox`/`Radio` need `onChange` too.
12. Prefer library components over raw HTML: no visible native `<button>`, `<input>`,
    `<select>`, checkbox/radio — wrap or use the library equivalents.
13. Import only from the package root and `animal-island-ui/style` — no deep imports.
14. Style custom elements with `var(--animal-*)` tokens, not hard-coded colors; never use
    `className`/`style` to override a component's colors, radii, or shadows.
15. Never vendor v1.x artwork. The v1.x `Icon` / `ICON_LIST` / `Phone` / `Wallet` / `Footer`
    assets shipped under CC BY-NC 4.0 (non-commercial only); v2 is MIT. Use `naive-icons`
    or draw new art instead of copying the old SVG/PNG files into a project.
