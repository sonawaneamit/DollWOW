# V2 Design Tokens

Concrete values for Phase 1. Put these in `tailwind.config.ts` and the `:root` / token section of `app/globals.css`. Delete or deprecate the dark `boudoir` tones as surfaces are migrated — do not leave both systems half-wired in the same component.

## Color palette

| Token | Value | Used for | Contrast notes |
|---|---|---|---|
| `bg` | `#FAF6F2` | Page background (warm off-white) | — |
| `surface` | `#FFFFFF` | Cards, panels, header | — |
| `surface-tint` | `#F4ECE5` | Subtle section alternation, selected-row tint | — |
| `text` | `#29201B` | Headings, body | 14.2:1 on `bg` |
| `text-dim` | `#5C524B` | Secondary text, descriptions | 7.1:1 on `bg` — safe for body |
| `text-faint` | `#7A6E66` | Captions, meta (14px min) | 4.9:1 on `bg` |
| `accent` | `#B5471F` | Primary buttons, links in body, selected states, focus ring | 5.4:1 with white text on it — AA for button labels |
| `accent-hover` | `#96401C` | Hover/active for accent | 7:1 with white text |
| `accent-tint` | `#F8E8E0` | Selected option tiles, chips, highlight rows | pair with `text` |
| `accent-border` | `#B5471F` | 2px border on selected tiles | — |
| `border` | `#E3D9CF` | Standard card/input borders (visible, not hairline) | decorative |
| `border-strong` | `#C9BBB0` | Inputs on focus, dividers that must be seen | decorative |
| `stock` | `#1F7A5C` | In-stock / success only | 4.7:1 with white text |
| `stock-tint` | `#E3F1EB` | Stock badge backgrounds | pair with `#14563F` text |
| `danger` | `#B3261E` | Errors, conflicts | 5.9:1 on white |
| `danger-tint` | `#FBEBEA` | Conflict message backgrounds | pair with `danger` text |
| `focus-ring` | `#B5471F` | 3px outline, 2px offset | — |

**Rules:** green is only stock/success; red is only errors; terracotta is the only brand accent. No gold gradients, no peach-on-dark, no glass/backdrop-blur panels.

## Typography

Keep the already-loaded families (Hanken Grotesk for UI, Schibsted Grotesk for display headings) — do not add new font files. Change the **scale**, not the faces.

| Role | Size / line-height | Weight | Notes |
|---|---|---|---|
| Display (page H1) | `clamp(2.25rem, 4vw, 3.25rem)` / 1.1 | 650 | `letter-spacing: -0.01em` (drop the current -0.035em tightness) |
| H2 | `clamp(1.6rem, 2.6vw, 2.1rem)` / 1.2 | 650 | |
| H3 / card titles | `1.25rem` / 1.3 | 650 | |
| Body | `1.0625rem` (17px) / 1.65 | 400 | Never below 16px on mobile |
| Body semibold (button labels, option names) | 17px | 600 | |
| Small (descriptions inside tiles, meta) | `0.9375rem` (15px) / 1.5 | 400 | |
| Caption (smallest allowed) | `0.875rem` (14px) / 1.4 | 500 | Legal, timestamps only |
| Form inputs | 16px minimum | 400 | Prevents iOS zoom |

**Label style replacing ALL-CAPS micro-labels:** sentence case, 15px, weight 600, color `text-dim`, `letter-spacing: 0` (e.g. "Step 2 of 6" renders as `Step 2 of 6`, not `S T E P  2  O F  6`). Reserve uppercase for nothing except single-word badges ("In stock") at 14px with `letter-spacing: 0.02em`.

## Shape, borders, shadows

| Token | Value |
|---|---|
| `radius-sm` (chips, inputs) | `12px` |
| `radius-md` (cards, tiles) | `16px` |
| `radius-lg` (panels, dialogs) | `20px` |
| `radius-button` | `14px` |
| Card border | `1px solid #E3D9CF` — used sparingly; prefer shadow separation |
| Selected border | `2px solid #B5471F` |
| `shadow-card` | `0 6px 24px rgba(41, 32, 27, 0.07)` |
| `shadow-panel` | `0 12px 40px rgba(41, 32, 27, 0.10)` |
| `shadow-sticky` | `0 4px 20px rgba(41, 32, 27, 0.08)` (sticky header/bars) |

## Spacing & targets

- Page gutter: 20px mobile / 32px desktop; content max-width stays `80rem` (`tone-inner` pattern may be kept structurally).
- Minimum interactive height: **44px** (links in lists, chips, secondary buttons).
- Primary action height: **52–56px** (Buy, Next step, Checkout).
- Option tiles: minimum height **96px**, padding 16px.
- Section vertical rhythm: 64–96px on desktop, 48px mobile.

## Global CSS cleanup (part of Phase 1)

Delete or stop-referencing in migrated components:

- The three `[data-tone]` dark token blocks (`deep`, `rose`, `blush`) once nothing renders them.
- `.home-hero::after` / `.home-band::after` / `.home-closing::after` noise-texture overlays (the inline SVG `feTurbulence` block).
- `body` background stack (four-layer radial/linear gradient) → replace with `background: #FAF6F2`.
- `.studio-float`, `@keyframes studio-float`, `.home-hero__blob`, `@keyframes home-drift`, marquee keyframes/pause behavior (homepage phase).
- `.noir-media` filters and `.noir-media-wrap` scrims (product imagery should render clean; keep a single subtle bottom scrim only where text overlays an image).
- All `shadow-glow` / `shadow-soft` usages on dark panels → replace with the new shadow tokens.

## Mapping cheat sheet (old → new)

| Old class/value pattern | Replace with |
|---|---|
| `bg-[#160c0a]`, `bg-ink-950/…`, `bg-ink-900/…` | `bg-surface` or `bg-bg` |
| `text-ivory-50`, `text-[#f6e9dd]` | `text-text` |
| `text-ivory-400/500`, `text-[#c9b3a3]` | `text-text-dim` |
| `text-ivory-600`, `text-[#98826f]` | `text-text-faint` |
| `text-gold-200/300/400`, `text-[#e8b48f]` (labels/accents) | `text-accent` (links) or `text-text-dim` (labels) |
| `border-[#d59a6f]/22`, `border-gold-500/16` | `border-border` (or remove border, add `shadow-card`) |
| `bg-[#f6e9dd]/[0.055]` (icon wells) | `bg-surface-tint` |
| CTA gradient `from-gold-200 to-gold-500` / `linear-gradient(135deg,#f3cdb0,#b97a4e)` | solid `bg-accent`, hover `bg-accent-hover` |
| Selected tile teal `#4f9c8a` | `accent` border + `accent-tint` fill (green reserved for stock/success) |
| `rounded-[30px]` mega-radius | `radius-lg` (20px) |

(Register these as Tailwind colors: `bg`, `surface`, `surface-tint`, `text`, `text-dim`, `text-faint`, `accent`, `accent-hover`, `accent-tint`, `border`, `border-strong`, `stock`, `danger`. Remove the `ink`/`gold`/`ivory` palettes once migrated.)