# Concept Carry-overs — Kept from the Earlier Explorations

Before the V2 readable-friendly direction, we explored two bolder concepts ("Gallery" and "Marble"). Three of those upgrades **survive into V2** because they help orientation and accessibility instead of decorating. The rest are deferred to Phase 3 (homepage/catalog), which is **not yet approved**.

This document is the spec for the three keepers. Everything in `README.md` §4 (hard constraints) and the brand guardrails applies here unchanged — these features change color, motion, and wayfinding only, never copy, claims, or behavior contracts.

---

## 1. After Dark mode (keep — Phase 1)

**What:** a user-controlled dark theme for the whole storefront, toggled from the header.

**Why it stays:** many buyers browse at night, and light-sensitive older buyers benefit. It is also a memorable, ownable touch ("After dark / Lights on") that costs very little. It is a calm, high-contrast dark — not the old boudoir theme.

### Toggle spec

- Placement: header utility row, immediately left of Search. Labeled button, never icon-only: moon icon + "After dark" in light mode; sun icon + "Lights on" in dark mode. Minimum height 44px.
- Also present in the mobile menu sheet as a full-width 56px row.
- Behavior: toggles `data-theme="dark"` on `<html>`; persists via `localStorage` (`"dollwow-theme"`: `"light" | "dark"`); on first visit (nothing stored), fall back to `prefers-color-scheme`. The user's explicit choice always wins thereafter.
- **No flash of wrong theme:** inline a tiny script in `<head>` that reads storage / media query and sets the attribute before first paint.
- Must not interfere with the cart badge, search dialog, or any frozen behavior.

### Dark token set

Add alongside the light tokens (see `design-tokens.md`); apply on `:root[data-theme="dark"]`. The accent **fill** does not change — only accent-colored text/light borders get the lighter variant.

| Token | Light | Dark | Notes |
|---|---|---|---|
| `bg` | `#FAF6F2` | `#1C1714` | page background |
| `surface` | `#FFFFFF` | `#262019` | cards, header, panels |
| `surface-tint` | `#F4ECE5` | `#30271F` | subtle tinted areas |
| `text` | `#29201B` | `#F3ECE5` | body/headings |
| `text-dim` | `#5C524B` | `#CBBEB2` | secondary text |
| `text-faint` | `#7A6E66` | `#A39689` | captions |
| `accent` (text/links) | `#B5471F` | `#E07B4E` | lighter on dark for AA contrast |
| `accent-fill` | `#B5471F` | `#B5471F` | button fill unchanged (white text, 5.4:1) |
| `accent-tint` | `#F8E8E0` | `#3A2A20` | selected backgrounds |
| `border` | `#E3D9CF` | `#3D342B` | standard borders |
| `border-strong` | `#C9BBB0` | `#5A4E41` | emphasis borders |
| `stock` badge | `#1F7A5C` on `#E3F1EB` | `#8FD4B4` on `#17382D` | in-stock states |
| `danger` text | `#B3261E` | `#E8A19B` | conflict/error text |
| shadows | soft brown | darker/black | e.g. `0 6px 24px rgba(0,0,0,.40)` card |

### Rules

- Product imagery is never inverted, dimmed, or filtered — media cards keep their natural look in both themes.
- Focus rings stay visible in both themes (use the theme's accent-text color).
- Both themes must pass the same WCAG AA bar: 4.5:1 body text, 3:1 large text/UI states. Spot-check the tile selected state, conflict message, stock badge, and prices in dark mode.
- Themes change color only — never copy, layout, or claims.

---

## 2. Scroll thread (keep — Phase 2, PDP only)

**What:** a slim fixed "thread" on the left edge of the PDP that fills with accent color as you scroll, with ticks labeling the major sections.

**Why it stays:** the PDP is long; the thread tells the buyer where they are and how much is left. Wayfinding, not decoration. Tested well in the preview.

### Spec

- Fixed left rail, vertically centered; 2px track, height `min(46vh, 420px)`. **Hidden below 1240px viewport width** — mobile/tablet get nothing, and there must be no layout gap where it would have been.
- Fill height = page scroll progress (0–100%).
- One tick per major PDP section (e.g. "Meet <name>", "Customize", and any reviews/details section — use the actual rendered sections). Tick position derives from the section's offset: `(section.offsetTop − 0.35 × viewport height) / scrollable max`.
- The active tick (last one passed) shows its text label beside the rail; labels use `text-dim`, active label uses accent + semibold.
- Ticks are anchor links: clicking scrolls to the section (respecting the reduced-motion rule below).
- Purely additive: absolutely positioned, no document-flow changes; if JS fails, the rail simply does not render and the page is unaffected.
- **PDP only.** Never on cart, checkout, account, or policy pages. (Homepage reuse is a Phase 3 decision.)

---

## 3. Calm reveals (keep — global)

**What:** sections and cards fade up ~14px with a short stagger as they enter the viewport.

### Rules

- IntersectionObserver adds a class; no scroll-linked transforms, no parallax, no pinning.
- Entirely skipped under `prefers-reduced-motion: reduce` — content fully visible with no animation.
- Duration ≤ 300ms, ease-out; stagger ≤ 45ms per item, max 4 items per group.
- Never gate critical content (price, CTAs, option tiles, totals) behind animation — they must be readable instantly even if JS is slow.

---

## Motion & accessibility bar (applies to all three)

- `prefers-reduced-motion: reduce`: no reveals, no smooth scrolling (jump instantly), thread still renders but its fill snaps instead of transitioning.
- All additions are keyboard reachable and labeled: thread ticks are links; the theme toggle is a button with `aria-pressed`.
- No flashing, no autoplaying animation loops, no video backgrounds anywhere.

## Deferred — NOT approved (Phase 3 homepage/catalog conversation)

Deliberately left out of Phases 1–2:

- Card-stack / scroll-pinned hero theater
- Giant statement display type (200px+)
- Marquee / ribbon strips
- Second-mood hover swaps on cards
- Editorial alternating-mood homepage sections

Rationale: they fight readability on a PDP and optimize for aesthetics over orientation. Revisit only for the homepage, where theater belongs.

---

## Acceptance criteria

- [ ] Theme toggle switches the full storefront without reload; choice persists across sessions; first visit respects OS preference; no flash of wrong theme on load.
- [ ] Both themes pass AA contrast on text and UI states (spot-check: tile selected state, conflict message, stock badge, prices, totals).
- [ ] Product imagery is never filtered or dimmed in dark mode.
- [ ] Thread appears on the PDP at ≥ 1240px, fills with scroll, active tick label updates, ticks navigate; absent below 1240px with no layout gap.
- [ ] With `prefers-reduced-motion: reduce`, the page is fully static and readable (no reveals, no smooth scroll, thread fill snaps).
- [ ] Header utility row stays on one line at 1280px with the toggle present; no wrapping at any supported desktop width.
- [ ] No guardrail regressions: these features add color/motion/wayfinding only — no urgency tricks, no invented content, no behavior-contract changes.
