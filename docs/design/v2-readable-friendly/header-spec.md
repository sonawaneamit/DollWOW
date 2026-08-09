# Header & Footer Spec (Phase 1)

**File:** `components/Header.tsx` (rebuild in place), `components/Footer.tsx` (extend link groups)

## What is wrong today

- 8 top-level items ("Shop Dolls" dropdown + Ready to ship, Customize, Price Match, Help Me Choose, Learning Center, About Us, Certificates) at 13px (`text-[13px]`) — too many, too small.
- A mega-dropdown with 4 columns (12 brands, heights, materials, popular links, quick pills, two CTAs) — a wall of choices for someone who just wants to browse.
- Icon-only utility buttons (search, help, cart) with no text labels.
- Dark bar with hairline dividers.

## New information architecture

**Four primary destinations. Everything else moves to the footer.**

| Nav item | Destination | Notes |
|---|---|---|
| Shop all dolls | `/shop` | Plain link — **no dropdown**. |
| Ready to ship | `/warehouse` | Plain link. |
| Brands | dropdown (see below) | The only dropdown; brands are how this audience actually shops. |
| Help me choose | `/help-me-choose` | Styled as the friendly standout (see below). |

Utilities (right side): **Search** (labeled button, opens the existing search dialog), **Support** (labeled link to `/support`), **Cart** (labeled link with count badge, existing `readBrowserCartState` logic unchanged).

Removed from the header (must appear in the footer — see §5): Customize (`/customize`), Price Match (`/compare`), Learning Center (`/learn`), About Us (`/why-dollwow`), Certificates (`/authorized-vendors`), and all policy links already in `policyLinks`.

## Desktop spec (≥ 1024px)

- Height 72px, `bg-surface`, sticky top, `shadow-sticky` applied only after scroll > 8px (no permanent hairline border).
- Left: existing logo lockup image, height 48px (bigger than today's `h-14`/56px crop allows — render cleanly, no forced rounding).
- Center nav: 17px, weight 600, `text-text`; each item min-height 44px, horizontal padding 16px, `radius-sm` hover well (`bg-surface-tint`). Active section: `text-accent` + 2px bottom indicator (not a filled pill).
- **Help me choose**: same size, but rendered as an outline button — 2px `accent-border`, `text-accent`, `radius-button`, hover fills `accent-tint`. It should read as a friendly invitation, not a primary CTA competing with cart.
- **Brands dropdown:** on click (not hover) of a button with `ChevronDown`: a simple white panel, `radius-lg`, `shadow-panel`, max 420px wide, single column of brand links (from `catalogFilterOptions.brands` / `brandHubHref`, unchanged), 18px rows, 48px min row height, footer row "All brands →" linking `/brands`… if that route does not exist, link `/shop`. Close on Escape, outside pointerdown, and navigation (existing patterns in the file already do this — keep them).
- Utilities: each is an explicit labeled button 44px tall: `Search` (Search icon + "Search"), `Support` (LifeBuoy or HelpCircle + "Support"), `Cart` (ShoppingBag + "Cart" + count badge when > 0 — keep the existing badge logic, restyle badge to `bg-stock` white text… use `bg-accent` if that reads better; either is fine, no dark fills).
- Keep Cmd/Ctrl+K opening search; keep Escape closing everything; keep the existing `router.prefetch` warm-up list (drop removed routes from it and keep the rest).

## Search dialog (restyle, same behavior)

- Keep `/api/search` fetch, 180ms debounce, suggestion builder, and submit → `/shop?query=` exactly as-is.
- Restyle: white panel (`bg-surface`, `radius-lg`, `shadow-panel`), input 18px / 56px tall with `border-border` (2px `accent-border` on focus), quick-link chips 15px / 44px, result rows 56px+ with 16px titles and 14px meta. Overlay `rgba(41,32,27,0.45)` — no backdrop blur.

## Mobile spec (< 1024px)

- Bar: logo left, then cart icon-button (with badge), then a **Menu** button labeled "Menu" (hamburger icon + word), each ≥ 44px.
- Open state: full-height sheet under the bar, `bg-bg`, scrollable:
  1. Search field at top (16px, 52px) submitting to `/shop?query=`.
  2. Four big rows: Shop all dolls, Ready to ship, Help me choose, Support — 18px, 56px rows, separated by 8px gap, `bg-surface` cards with `radius-md`.
  3. **Brands** as an expandable section (existing `MobileDetails` pattern is fine): summary row 56px, links at 17px / 48px rows.
  4. **Help & information** expandable: How ordering works, FAQ, Learning Center, Price Match, About Us, Certificates, Buyer protection, Shipping, Returns, Scam alert.
- No two-column mini-grids of tiny links — single column, big rows.

## Footer additions

`components/Footer.tsx`: ensure link groups exist for — Shop (Shop all dolls, Ready to ship, Factory order/Customize, Price Match), Learn (Learning Center, Help me choose, FAQ, How ordering works), Company (About Us, Certificates/authorized vendors, Support), Policies (existing policy links). 15px links, 44px row height on mobile, `text-text-dim` on `bg-surface-tint` footer background.

## Accessibility requirements

- `aria-label` on icon-bearing buttons kept; visible text labels now accompany them anyway.
- Brands dropdown button gets `aria-expanded` / `aria-controls` (pattern already present — keep).
- Focus-visible: 3px `focus-ring` outline, 2px offset, on every interactive element.
- Header text/background pairs all pass AA (they will trivially on white — verify `text-dim` usage ≥ 14px).

## Do not change

- `catalogFilterOptions`, `brandHubHref`, `suggestedSearchRoutes` data — presentation only.
- Cart badge data flow (`readBrowserCartState`, `dollwow:cart-updated` event, storage listener).
- Search API route and response shape.
- The sticky behavior (`sticky top-0 z-[80]` or equivalent).
- The logo asset path (swap only if an identical-name light-background variant exists; otherwise keep as-is).