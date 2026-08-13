# WM catalog and customization audit — 2026-08-13

## Scope

- Current Rosemary WM collection and product forms
- Existing DollWOW WM source mappings and live-product duplicate audit
- YourDoll current WM extra-head offer for independent dealer-price guidance
- Current WM manufacturer-shop silicone-head price

## Catalog decision

- Existing products were matched by exact source URL before any creation.
- Regional ready-to-ship rows were excluded from the custom catalog import and remain owned by the stock-sync workflow.
- Only duplicate-review records marked `likely_safe_new_listing`, with a usable gallery, base price, and option form, qualify for draft creation.
- New records are created as Shopify drafts only. Nothing in this batch is published automatically.
- Ambiguous identity or image-overlap records remain held for manual review.

## Result

- 365 current normalized Rosemary listings reviewed.
- 322 exact source URLs already mapped to DollWOW products.
- 31 ready-to-ship rows routed to the separate stock workflow.
- 2 ambiguous rows held for manual review.
- 10 safe custom-order products created as **Shopify drafts**: 1 hybrid, 1 silicone, and 8 TPE/PVC-head anime builds.
- 0 products published by this batch.
- 472 existing WM option records rechecked against their exact source pages: 9 refreshed, 0 unmatched, 0 failed, and 0 without source price data.

## Checkout model

- Standard female TPE builds use the current image-backed 22-head dealer catalog.
- `Choose a Head` is single-select; switching among those compatible TPE heads is included.
- `Add Extra Head` is multi-select; each selected TPE head is charged **$299**.
- Silicone, silicone-head/TPE-body, PVC/anime, male, torso, and hips products do not inherit the standard TPE library.
- A silicone extra head has verified external guidance of **$650**, but it is not exposed without a clean, comprehensive, identity-matched silicone-head image library.
- Product-bound special heads remain product-bound. Unknown extra-head prices are not guessed.
- Appearance choices with current image evidence are Visualizer-ready. Head switching stays non-Visualizer until the later head-identity Visualizer project.
- Single-choice appearance groups remain single-select. Paid add-on/accessory groups can remain multi-select.
- An option without verified incremental pricing remains in the internal factory record but is removed from checkout, so it cannot create an “ask our team” conversion stop.

## Evidence

- Rosemary WM collection: <https://www.rosemarydoll.com/sex-doll-brands/wm-sex-dolls/>
- YourDoll extra WM TPE heads: <https://www.yourdoll.com/product/wm-doll-extra-doll-heads/>
- WM manufacturer shop accessories: <https://wmdollshop.com/accessories/>

## Deferred

- Build a comprehensive, clean, image-backed silicone head identity catalog before exposing silicone head switching/additional heads sitewide.
- Validate PVC/anime and male head compatibility and prices separately.
- Implement nested per-extra-head appearance customization only after each paid extra head can retain its own option record.
- Make verified switch-head choices Visualizer-eligible after the cross-brand head sweep.
