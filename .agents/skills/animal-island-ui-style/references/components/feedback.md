# Feedback components — props reference

Props/types below are copied from the library source. In an npm-installed project, the installed package's TypeScript declarations (`dist/types/index.d.ts`) are the ground truth — prefer exploring them when in doubt.

## Loading

```ts
interface LoadingProps extends React.HTMLAttributes<HTMLDivElement> {
    active?: boolean; // default true — false fades the scene out
    tip?: React.ReactNode; // message rendered in the centre of the scene
    delay?: number; // ms before showing, avoids a flash on fast loads; default 0 = immediate
    fadeDuration?: number; // seconds of fade-out; default 0.6
    zIndex?: number; // full-screen layer; default 3000 (above Notification's 2000)
}
```

```tsx
<Loading />                       {/* full-bleed loading scene */}
<Loading active={isLoading} />
<Loading active={isLoading} tip="正在加载岛屿…" delay={300} />
```

> Self-contained illustrated loading scene. When `active={false}`, the scene fades out via a CSS mask radius transition (`fadeDuration` seconds).
>
> **v2 added `tip`, `delay`, `fadeDuration` and `zIndex`** — v1 only had `active` / `className` / `style`.
>
> **Not supported:** no `size`, no `spinning`, no `indicator`, no `percent`, no `children` (this is NOT a generic Spin-style wrapper — do not wrap content with it). Use it as a sibling overlay element controlled via `active`.

## Progress

Horizontal bar whose fill reuses the **Button loading** stripe: a teal `-45°` ribbon (`#0ec4b6` / `#01b0a7`) scrolling infinitely right-to-left. The track uses the page background (`#f8f8f0`, same as `--animal-bg`) with a light `#e8dcc8` border + soft inner dent. The percent label sits inside the fill (default, white), to the right, or on top.

```ts
type ProgressSize = 'small' | 'middle' | 'large';
type ProgressVariant = 'sweet-corner' | 'forest-grove' | 'starry-camp' | 'coffee-break';

interface ProgressProps {
    percent: number; // REQUIRED, 0-100, clamped; non-integer rounded for aria
    size?: ProgressSize; // default 'middle' (small=14px, middle=24px, large=32px — v2 heights)
    showInfo?: boolean; // default true — label renders to the RIGHT of the bar
    variant?: ProgressVariant; // fill scene illustration; omit for the flat teal fill (#19c8b9)
    infoFormat?: (percent: number) => React.ReactNode; // default `${percent}%`
    duration?: number; // fill WIDTH transition in seconds; 0 disables; default 0.6 — does NOT affect stripe scroll
    className?: string;
    style?: React.CSSProperties;
}
```

```tsx
<Progress percent={50} size="large" />
<Progress percent={45} showInfo={false} />
<Progress percent={70} variant="starry-camp" />   {/* or forest-grove / coffee-break / sweet-corner */}
<Progress percent={50} infoFormat={(p) => `${Math.round(p / 10)} / 10`} />
<Progress percent={pct} duration={0} />           {/* no fill-width animation */}
```

Notes:

- **Always provide `percent`.** Out-of-range values are clamped to `[0, 100]`. NaN is treated as `0`. The aria value is rounded.
- **The label sits to the right of the bar** in v2. `infoPosition` (`inside` / `right` / `top`) and `ProgressInfoPosition` were removed in v2; the old "label rides inside the fill, auto-moved outside below 18%" behaviour no longer exists.
- **Bar heights changed in v2**: small 14px, middle 24px, large 32px (v1 was 12/20/28).
- **Fill is fixed** — either the flat teal `#19c8b9` or, with `variant`, one of the four scene illustrations. There is no `status` / `strokeColor` prop.
- **Two independent animations**: fill **width** transitions on `percent` change (`duration` prop, default 0.6s, `0` disables) with `cubic-bezier(0.4, 0, 0.2, 1)`; the stripe **background-position** scrolls on the flat fill and is disabled under `prefers-reduced-motion: reduce`.
- **Accessibility**: root has `role="progressbar"` with `aria-valuemin=0`, `aria-valuemax=100`, `aria-valuenow=<rounded percent>`, and `aria-valuetext` set to the rendered text when it's a string.

## Skeleton

Loading placeholder rendering gray/beige blocks with a shimmer animation. When `loading` is `false`, children are rendered directly.

```ts
type SkeletonVariant = 'text' | 'circle' | 'rect' | 'paragraph';

interface SkeletonProps {
    loading?: boolean;           // default true
    variant?: SkeletonVariant;   // default 'text'
    active?: boolean;            // shimmer animation, default true
    rows?: number;               // for 'paragraph', default 3
    width?: number | string;     // for 'text'/'circle'/'rect'
    rowWidths?: (number | string)[]; // for 'paragraph', per-line widths
    widthValue?: number | string;    // for 'circle'/'rect'
    heightValue?: number | string;   // for 'circle'/'rect'
    className?: string;
    style?: React.CSSProperties;
    children?: React.ReactNode;  // rendered when loading=false
}

// Sub-components
interface SkeletonButtonProps { size?: 'small' | 'middle' | 'large'; active?: boolean; }
interface SkeletonInputProps  { size?: 'small' | 'middle' | 'large'; active?: boolean; }
interface SkeletonAvatarProps { size?: 'small' | 'middle' | 'large'; shape?: 'circle' | 'square'; active?: boolean; }
```

```tsx
import { Skeleton, SkeletonButton, SkeletonInput, SkeletonAvatar } from 'animal-island-ui';

<Skeleton variant="text" width="80%" />
<Skeleton variant="circle" widthValue={44} />
<Skeleton variant="rect" widthValue={200} heightValue={120} />
<Skeleton variant="paragraph" rows={4} />
<SkeletonButton size="middle" />
<SkeletonInput size="large" />
<SkeletonAvatar size="small" shape="square" />
<Skeleton loading={fetching}><div>Content loaded</div></Skeleton>
```

Notes:

- **Shimmer**: a warm-ivory `linear-gradient(90deg, transparent, rgba(255,252,235,0.18), rgba(255,252,242,0.55), ...)` sweeps left-to-right over 1.6s.
- **Shapes**: `circle` is 50% rounded; `rect` uses 18px radius; `text` uses 12px radius (matching the "no sharp corners" rule).
- **All sub-components** (`SkeletonButton`, `SkeletonInput`, `SkeletonAvatar`) share the same `active` shimmer and light-beige background.
- **A11y**: the skeleton root is marked `aria-hidden` to hide it from screen readers when `loading=true`.

## BackTop

Floating back-to-top button that appears in the bottom-right corner after scrolling past a threshold. Default icon is a Nook bag PNG (base64-embedded); clicking smooth-scrolls to the top with an easeInOutQuad animation.

```ts
interface BackTopProps {
    target?: () => HTMLElement | Window; // default () => window
    visibilityHeight?: number;           // default 400 (px)
    duration?: number;                   // scroll animation ms, default 300
    onClick?: React.MouseEventHandler<HTMLDivElement>;
    className?: string;
    style?: React.CSSProperties;
}
```

```tsx
<BackTop />                                    {/* Nook bag icon, 400px threshold */}
<div ref={ref} style={{ height: 300, overflow: 'auto' }}>
    <BackTop target={() => ref.current!} visibilityHeight={200} />
</div>
<BackTop duration={800} />
```

Notes:

- **Default target is `window`** — works out of the box for page-level scrolling. Pass `target` for a custom scroll container.
- **Mobile responsive**: icon shrinks from 120px to 80px under 768px viewport.
- **A11y**: `role="button"`, `tabIndex={0}`, `aria-label="返回顶部"`. Enter/Space trigger the scroll.

## Countdown

```ts
type CountdownSize = 'small' | 'middle' | 'large';
type CountdownVariant = 'default' | 'island';
interface CountdownProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'prefix'> {
    value: number | Date; // REQUIRED — absolute deadline
    format?: string; // default 'HH:mm:ss'; DD / HH / mm / ss tokens
    prefix?: React.ReactNode;
    size?: CountdownSize; // default 'middle'
    variant?: CountdownVariant; // default 'default'
    bordered?: boolean; // default false — draws the 1.5px digit-tile borders
    onChange?: (remaining: number) => void;
    onFinish?: () => void;
}
```

```tsx
<Countdown value={Date.now() + 60_000} />
<Countdown value={deadline} format="DD 天 HH:mm:ss" prefix="活动结束还有" variant="island" />
```

The remaining time never drops below zero and `onFinish` fires once. Without a `DD` token, `HH` is total hours; with `DD`, hours are the 0–23 remainder. Each DD / HH / mm / ss token renders as its own 12px-radius digit tile; every digit inside is a vertical strip of two 0-9 cycles that always rolls downward to the current value with a 0.35s transition (odometer style — wrapping past 0 teleports to the next cycle and keeps rolling down, never reversing). Format literals such as `:` or `天` render as plain separators. The rolling strips are `aria-hidden`; a visually-hidden span carries the full formatted value. The root is `role="timer"` with `aria-live="off"`.
