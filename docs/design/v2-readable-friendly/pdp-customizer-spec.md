# PDP Customizer Spec (Phase 2)

**Files:** `components/ProductOptions.tsx` (rebuild the UI shell in place), `components/ProductBuyActions.tsx` (restyle + copy), minor layout edits in `app/(store)/products/[handle]/page.tsx`.

**Read `README.md` §4 first — the customization contracts are frozen. This is a presentation rebuild of an engine that already works.**

## What is wrong today

The current Build Studio is a three-pane cockpit: a 132px category rail, a center stage with a floating animated preview card, and a 420px right panel — inside a fixed 880px-tall dark box with overflow scroll traps in three directions. Text runs 11–13px. States are hard to read ("Reviewed 3/6"), conflicts hide behind tooltips, and the layout collapses awkwardly on tablet. A 55+ buyer needs the opposite: one calm column, big tiles, always-visible price, and plain language.

## Contracts to preserve exactly

- `getCustomizationConfig(product)` → groups/rules; empty `config.groups` → render the `ProductOptionsOnRequest` path (restyle it too: light surface, 56px checkout button, same copy intent).
- `getDefaultSelections`, `resolveCustomization`, `getOptionConflict`, `nextMultipleSelection`, `selectionIds` — same imports, same call patterns.
- `selectOption` semantics incl. `selectionMode: "multiple"` groups.
- `addToCart` payload: merchandiseId, attributes array (including `DollWow Reference Name` first), `customizationCharge` when `optionPriceDelta > 0`.
- `writeBrowserCartState` shape incl. `customizationSummary`.
- Variant `<select>` behavior when `product.variants.length > 1` (restyle it; keep the logic).
- Section anchor `id="build-studio"` (or update `ProductBuyActions.scrollToCustomizer`).
- Existing tests in `tests/` covering this component must pass unweakened.

## New layout

**Desktop (≥1024px):** two columns inside a white `radius-lg` `shadow-card` panel — no fixed height, no nested scroll regions.

- **Left (5/12), sticky `top: 96px`:** product image (4:5, `radius-md`, clean — no noir filter, no float), product display title (H3), brand line (15px `text-dim`), then **"Your build"** summary (below).
- **Right (7/12):** the step flow.

**Mobile/tablet:** single column — compact summary bar first (sticky bottom bar, see §5), then steps, then the full "Your build" card at the end before review.

## Step flow (the core pattern)

Render every option group as a **numbered step card** stacked vertically — no side rail, no separate stage:

1. **Collapsed/completed step:** one `bg-surface` card, 72px min height, showing `Step n`, group label (17px semibold), the current choice in plain text (15px `text-dim`, e.g. "Tan (+$45)" or "Factory default — included"), and a `Change` button (44px). Completed = the user has interacted with it OR defaults are in force — always show the resolved default as the choice so nothing looks empty.
2. **Active step:** card expands (only one open at a time; opening one collapses the others) with:
   - Header: `Step n of N` (15px, `text-dim`, sentence case) + group label (20px semibold) + group description (15px `text-dim`, full sentences).
   - Option tiles grid: 2 columns (3 for `display: "swatches"` with small option counts, your judgment), gap 12px.
   - Footer: `Back` (secondary, 48px) and `Next: <next group label>` / `Review your build` (primary `bg-accent`, 52px).
3. **Review step** (after last group): see §4.

The current "one group at a time with Next/Back" behavior already exists — this spec keeps that state machine and re-renders it as the accordion-style stack. Clicking `Change` on any collapsed step jumps to it (existing `goToGroup`).

## Option tiles

- Min height 96px, padding 16px, `radius-md`, left-aligned content (not centered), `bg-surface`, `1px border-border`.
- Content order: swatch/mark left, text right — image swatches 64px `radius-sm`; color swatches 48px circle with 2px `border-border`; letter marks 48px circle `bg-surface-tint`.
- Option label 17px semibold `text-text`; description 14px `text-dim` (full sentences, allowed to wrap 2 lines); price pill 14px: `Included` (plain `text-dim`, no pill), `+ $45` (semibold `text-text`), or `Price confirmed by our team` for undefined deltas.
- `productionNote` renders as its own 14px `text-dim` line with a small info icon — never truncated.
- **Selected:** 2px `accent-border` + `bg-accent-tint` + a 28px `bg-accent` white check badge top-right. (No teal.)
- **Conflicted (`getOptionConflict` returns a message):** tile stays visible and pressable-looking but non-activating: `bg-bg`, dashed `border-border`, and the conflict message shown **inline on the tile**, 14px `danger` — e.g. "Not available with implanted hair on this brand." Never tooltip-only.
- Focus-visible ring per tokens; tiles are real `<button type="button">`s.

## "Your build" running summary (left column)

Always visible, updates live — this is what makes the flow feel honest:

- Card `bg-surface-tint`, `radius-md`, padding 20px.
- One row per group that has a resolved selection: group label (15px `text-dim`) → option label + delta (15px semibold). Rows for untouched groups show the default ("Factory default — included") so the card is complete from the start.
- Divider, then: `Base` … `formatMoney(basePrice)`; `Options` … delta; **Total** … 20px semibold. Data from `resolveCustomization` — same as today.
- Under it: `config.leadTimeNote` as 14px `text-dim` when present, plus one plain reassurance line: "Our team reviews every configuration before anything is made or shipped." (Factual — already how the store operates; do not add other claims.)

## Review step

Replaces `BuildReviewSummary` / `ReviewSidebarSummary` visuals (data identical):

- Heading: "Review your build" (H2) + sub: "Check each choice, then continue to checkout. You can still change anything."
- The same rows as "Your build" but each row gets a `Change` button jumping to that step.
- Price block identical to summary card.
- Issues from `resolved.issues`: each in a `danger-tint` card, 15px, with the rule message verbatim (messages come from config data — do not hardcode).
- Unavailable-variant notice: same behavior as today, restyled to `danger-tint` card with the existing "Contact us" offer and a real link to `/support?product=<handle>`.
- Primary button: `Continue to secure checkout — <formatted total>`, 56px, `bg-accent`, full width. Disabled state: 45% opacity, `cursor: not-allowed`, and the reason visible (first issue text) rather than silent.
- Secondary: `Back to <last group label>` 48px.

## Sticky mobile bar

Keep the existing IntersectionObserver-driven bottom dock concept, restyle: white, `shadow-sticky` upward, product title truncated (14px `text-dim`), total 17px semibold, and a 48px `bg-accent` button labeled `Review` / `Checkout` (same handlers as today).

## Copy rewrites (exact strings)

| Current | New |
|---|---|
| "Build studio" | "Customize your doll" |
| "Now choosing" / "Final review" | "Step {n} of {N}" / "Review" |
| "{n}/{N} reviewed" pill | "{n} of {N} steps done" |
| "Reviewed" (rail state) | show the chosen option label instead |
| "Confirm your build" | "Review your build" |
| "Start with Material, then move through each group…" (empty tray) | "Work through the steps below — defaults are already selected, so change only what you care about." |
| "Defaults are included until changed." | "Defaults are included until you change them." |
| Checkout button "Checkout" | "Continue to secure checkout" |
| "Discreet Shopify checkout" assurance | "Secure checkout by Shopify" |
| "Help with options when you need it" | "Questions? Talk to a real person" linking `/support?product=<handle>` |
| `ProductOptionsOnRequest` heading "Order this doll as shown" | keep meaning; restyle only |

Delete the `SelectedTray` component and `CategoryRail` (superseded); delete `studio-float` usage; keep `ImagePreviewModal` (tap image to enlarge — restyle trigger with a visible "Enlarge" hint chip).

## ProductBuyActions (buy box above the customizer)

- Buttons 56px, side-by-side on desktop, stacked on mobile: `Buy as shown — <price>` (primary `bg-accent`) and `Customize your doll` (2px `accent-border` outline, `text-accent`). Keep `buyAsShown` and the scroll target behavior exactly.
- The explainer paragraph: 15px `text-dim`, keep both ready-to-ship and factory-order variants of the sentence as-is.
- Protection chips → one plain text line of links (15px, `text-accent`, underlined): "Buyer protection · Shipping protection · How ordering works".
- Keep `TrustLogoStrip compact` below.

## Accessibility & QA checklist

- [ ] Entire flow keyboard-completable: tab order follows visual order; `Enter`/`Space` selects; visible focus ring throughout.
- [ ] Expanded step uses `aria-expanded` + `aria-controls`; live region (`aria-live="polite"`) announces the new total when it changes.
- [ ] No nested scroll containers; page scroll only.
- [ ] No animation beyond 200ms opacity/transform on step expand; nothing at all under `prefers-reduced-motion`.
- [ ] Manual verification: Zelex product (implanted hair vs head function conflict shows inline), one imported multi-group product (all imported groups render as steps), one torso product (2 groups), one no-options product (OnRequest path).
- [ ] Cart attributes on checkout identical to production for the same selections (compare network payload).
- [ ] `npm run build` + `npm test` green.