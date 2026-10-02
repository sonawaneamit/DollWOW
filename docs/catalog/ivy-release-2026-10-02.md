# Ivy release checks

Owner authorized editorial completion and publication on 2 October 2026.

## Scope

Only Ivy (product 10630580240568, variant 54234105643192) receives the new checkout binding. Existing Erovenus menus and other product bindings remain unchanged. Ivy is a torso and is intentionally excluded from the three full-body presets.

Source: factory Ivy release, manufacturer LN-T46-H6B-1 / H6B, and the exact Rosemary Ivy listing (112.5 cm, D-cup) for the owner-authorized price and menu fallback. USD 1,659 is a competitor fallback, not a verified 30-35% margin. Delivered factory cost remains unknown and is not represented as verified.

## Verified locally

- Exact 112.5 cm measurement, 32.7 kg weight and six factory images.
- Existing editorial layout with original product-specific copy and factory imagery, checked at 390px and 1440px.
- Five option groups, five source-selected free inclusions, no random extra-head selection.
- Named optional head plus hair is one removable choice; 23 identities at USD 275/425.
- All 53 paid menu choices resolve to nine exact named charge records. No denomination splitting.
- Brave selection/removal: USD 1,659 -> USD 2,084 -> USD 1,659.
- 160 focused tests and TypeScript passed before final release-registry addition.

## Release state

Published after PR #89 deployed. The product and all nine named add-ons are available in US, PT, GB and DE storefront contexts (10/10 each). The live page passed 390px and 1440px gallery/editorial loading, overflow and JavaScript-error checks.

Actual production checkout passed base build (USD 1,659), selected Blair implanted-hair additional head (USD 2,084), and head removed (USD 1,659). The selected head is visibly named in Shopify checkout, linked to its parent, and charged USD 425 before the existing discount. No payment or order was submitted. These checks do not verify every shipping destination or a completed order.

The first paid checkout check detected a missing `exact-upgrade-pilot` system tag on the new records. It was added to all nine without changing prices, then all three checkout cases passed. Include this tag in future named-charge creation checks.

Parent is ACTIVE and classified custom/made-to-order; no RTS stock, warehouse location or dispatch timing was invented. No unrelated October promotion changes are included in this release.

Evidence is retained under the main repository `data/exports/catalog-ops-five-2026-10-02/`, including `ivy-editorial-applied.json`, `ivy-named-charge-candidate.json`, `ivy-current-market-availability.json`, `ivy-charge-tag-repair.json`, `ivy-live-checkout.json`, `ivy-preview-browser-check.json`, and the checkout screenshot/text. Checkout artifacts contain private cart identifiers and must not be committed.
