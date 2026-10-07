# Decorative components — props reference

Props/types below are copied from the library source. In an npm-installed project, the installed package's TypeScript declarations (`dist/types/index.d.ts`) are the ground truth — prefer exploring them when in doubt.

> **Removed in v2:** `Phone` (NookPhone showcase widget) and `Wallet` (Nook-bag currency pill)
> are gone from the package, and `Footer type="sea" | "tree"` no longer exists. There is no
> drop-in replacement for any of them — see the licensing note under Footer.

## Time

```ts
type TimeProps = React.HTMLAttributes<HTMLDivElement>;
```

```tsx
<Time />
```

> A live clock card: `HH:MM` on top, refreshing every second with a blinking colon, and a
> primary-colour pill below showing the weekday and month/day, faded in on mount.
>
> `type="hud" | "game"` was removed in v2 — there is exactly one layout now. Extra props
> spread onto the root `<div>` (`className`, `style`, `id`, …). No `format`, no `value`, no
> timezone: it reads the browser's local clock.

## Footer

```ts
interface FooterProps {
    text?: string; // default 'All Rights Reserved.'
    year?: number; // default: the current year, read dynamically
    className?: string;
    style?: React.CSSProperties;
}
```

```tsx
<Footer />                                  // © 2026 All Rights Reserved.
<Footer year={2024} text="Acme Inc." />
```

> In v2 this is **plain text only**: a centred, muted, 12px line rendering `© {year} {text}`.
> The decorative sea-wave / forest-silhouette strip of v1.x (80px tall, driven by `type` and
> `seamless`) is gone, and no replacement asset ships with the package.
>
> Do not vendor the v1.x artwork to get it back: that SVG/webp was **CC BY-NC 4.0
> (non-commercial only)** while v2 is MIT. Draw your own art, or build the footer from custom
> markup plus `var(--animal-*)` tokens.
