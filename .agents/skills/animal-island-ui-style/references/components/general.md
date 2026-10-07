# General components — props reference

Props/types below are copied from the library source. In an npm-installed project, the installed package's TypeScript declarations (`dist/types/index.d.ts`) are the ground truth — prefer exploring them when in doubt.

## Button

```ts
type ButtonType = 'primary' | 'default' | 'dashed' | 'text' | 'link';
type ButtonSize = 'small' | 'middle' | 'large';
type ButtonHTMLType = 'submit' | 'reset' | 'button';

interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
    type?: ButtonType; // default 'default'
    size?: ButtonSize; // default 'middle'
    danger?: boolean; // default false
    ghost?: boolean; // default false
    block?: boolean; // default false
    loading?: boolean; // default false — renders diagonal-stripe animation
    disabled?: boolean; // default false
    icon?: React.ReactNode;
    htmlType?: ButtonHTMLType; // default 'button'
    children?: React.ReactNode;
}
```

```tsx
<Button type="primary" onClick={save}>Save</Button>
<Button type="primary" danger loading>Deleting…</Button>
<Button type="dashed" icon={<PlusIcon />} size="large" block>Add</Button>
<Button type="text">Cancel</Button>
```

## Icons — `naive-icons` (not part of this library)

v2 removed `Icon` / `ICON_LIST`. The library now depends on the MIT-licensed
[`naive-icons`](https://github.com/guokaigdg/naive-icons) package for icon art, and ships no
icons of its own. `naive-icons` is only a transitive dependency of `animal-island-ui`, so it
is not resolvable from application code — add it directly first: `pnpm add naive-icons`.

```ts
interface IconProps extends React.SVGProps<SVGSVGElement> {
    size?: number | string | null; // default 24 — equal width & height; null keeps natural size
    color?: string; // stroke colour, default ink '#2A2A2A'; pass 'currentColor' to follow text
    strokeWidth?: number | string; // default 3.5 on a 48×48 canvas; scales inner strokes too
    fill?: string; // default 'none'
    title?: string; // accessible title
}

// 159 named icon components, plus these exports:
type IconName = 'AirplaneIcon' | 'AlertCircleIcon' | … | 'ZoomOutIcon';
type IconComponent = React.FC<IconProps>;
declare const NAIVE_PALETTE: Record<string, string>;
type PaletteColor = string;
```

```tsx
import { CameraIcon, ChatIcon, ShoppingBagIcon } from 'naive-icons';

<CameraIcon size={32} />
<ChatIcon size={20} color="currentColor" />
<ShoppingBagIcon size={24} strokeWidth={5} title="Shop" />
```

Every icon is drawn on a 48×48 grid with a 3.5 stroke and rounded caps. Icons are
stroke-based and support `currentColor`, so inherit colour from the surrounding text rather
than hard-coding hex values. Set `size` — do NOT wrap the icon in a sized div.

Substitutes for the removed v1.x island icons (match by meaning, not by pixel shape):

| v1.x | nearest `naive-icons` |
| --- | --- |
| `icon-camera` | `CameraIcon` |
| `icon-chat` | `ChatIcon` |
| `icon-map` | `MapIcon` |
| `icon-shopping` | `ShoppingBagIcon` |
| `icon-miles` | `GiftIcon` / `StarIcon` / `CreditCardIcon` |
| `icon-critterpedia` | `BookIcon` / `LadybugIcon` |
| `icon-design` | `PaintbrushIcon` |
| `icon-diy` | `PencilIcon` (no toolbox or hammer icon exists) |
| `icon-variant` | `GridIcon`, or `SlidersIcon` on ≥1.5 |
| `icon-helicopter` | `AirplaneIcon` |

**Never restore `<Icon name="icon-…" />`.** No published version ships those SVGs any more,
and the v1.x artwork is CC BY-NC 4.0 (non-commercial only) while v2 is MIT.

> **Version floor for React 19:** `naive-icons` ≤ 1.5.0 emits hyphenated SVG attributes
> (`"stroke-width"`) as React props, so React logs ``Invalid DOM property `stroke-width`. Did
> you mean `strokeWidth`?`` once per page in dev. The SVG itself still renders correctly.
> **Fixed in 1.5.3** — use 1.5.3 or newer; do not patch the package or pin it backwards.

## Typewriter

```ts
interface TypewriterProps {
    children?: React.ReactNode; // ANY ReactNode — preserves element structure, classNames, inline styles
    speed?: number; // ms per char, default 90
    trigger?: unknown; // change this value to restart animation (e.g. modal openCount)
    autoPlay?: boolean; // default true (false = show full immediately)
    onDone?: () => void;
}
```

```tsx
<Typewriter speed={60} onDone={() => setStep(2)}>
  <p>Hello, <strong>traveler</strong>.</p>
  <p>Welcome to the island.</p>
</Typewriter>

// Restart on modal open:
<Typewriter trigger={openCount}>{dialogueText}</Typewriter>
```

Renders NO wrapper element; zero layout impact. Recursively truncates the ReactNode by char count while preserving tree structure.

## Cursor

```ts
interface CursorProps {
    children?: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    type?: 'default' | 'raindrop'; // default 'default' — finger arrow; 'raindrop' = blue droplet (new in 2.1)
    forceAll?: boolean; // default true — force the custom cursor on every descendant
}
```

Wrap the region where you want a game-style finger cursor:

```tsx
<Cursor>
    <App />
</Cursor>
```

With `forceAll` (default `true`) every descendant gets `cursor: url(...) 4 0 !important`. Set `forceAll={false}` for scoped mode: only the container shows the custom cursor while links/buttons keep `pointer`, text inputs keep `text`, and disabled elements keep `not-allowed`. Do NOT nest multiple `<Cursor>`. `style` is for layout only — do not try to override the cursor URL via inline style.
