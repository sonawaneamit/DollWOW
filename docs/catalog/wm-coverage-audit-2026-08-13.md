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

- Standard female TPE builds use the current image-backed dealer head selector captured from the live Rosemary Addison form on 2026-08-13: **161 named heads** in that form. The non-specific `Other Head` placeholder is excluded. This count is source-page-specific and does not prove that every WM family or every extra-head sub-control is complete.
- `Choose a Head` is single-select; switching among those compatible TPE heads is included.
- `Add Extra Head` is multi-select. Current dealer evidence separates a $299 head base from an S-TPE material increment; the exact material/promotion price composition remains open and must not be described as one universal WM price.
- Silicone products do not inherit the standard TPE library. Their product-source-verified compatible silicone heads appear as included replacement choices and separately priced extra heads. The current 163 cm and 170 cm Rosemary imports retain heads 198, 201, and 202 at **$399 each** as ordinary extras, while the live Head 201 form is also running a one-free-extra-head promotion. DollWOW keeps included promotion and paid additional heads separate.
- Silicone-head/TPE-body, PVC/anime, male, torso, and hips products do not inherit the standard TPE library.
- Silicone, PVC/anime, male, and other special head families remain explicitly **incomplete** until their complete live selectors, compatibility boundaries, prices, and image identities receive the same visual reconciliation. Product-specific imported choices remain in place in the meantime.
- Product-bound special heads remain product-bound. Unknown extra-head prices are not guessed.
- Appearance choices with current image evidence are Visualizer-ready. Head switching stays non-Visualizer until the later head-identity Visualizer project.
- Single-choice appearance groups remain single-select. Paid add-on/accessory groups can remain multi-select.
- An option without verified incremental pricing remains in the internal factory record but is removed from checkout, so it cannot create an “ask our team” conversion stop.

## Evidence

- Rosemary WM collection: <https://www.rosemarydoll.com/sex-doll-brands/wm-sex-dolls/>
- Rosemary WM Addison TPE form used for the 161-head visual reconciliation: <https://www.rosemarydoll.com/product/163cm5ft4-h-cup-tpe-sex-doll-addison/>
- YourDoll extra WM TPE heads: <https://www.yourdoll.com/product/wm-doll-extra-doll-heads/>
- WM manufacturer shop accessories: <https://wmdollshop.com/accessories/>
- WM manufacturer evidence currently lists a silicone head at **$650**.

## Open work — not complete

- Reconcile the complete silicone/ROS head catalog before exposing silicone head switching/additional heads sitewide.
- Reconcile PVC/anime and male head selectors and prices separately.
- Reconcile every non-head WM selector against at least one current live form per product family and verify storefront rendering on desktop and mobile.
- Resolve the current 404 for the separate ready-stock Minana handle (`wm-minana-162cm-f-cup-tpe-companion-doll-5ftuj`) before claiming the stock family is represented. Do not confuse it with the active custom-order Minana (`wm-minana-162cm-f-cup-tpe-companion-doll-4zfit`).
- Implement nested per-extra-head appearance customization only after each paid extra head can retain its own option record.
- The current source exposes 16 hairstyles, 19 eye colors, 2 enhanced-mouth choices, 3 lip finishes, and 5 premium/head-function choices for each extra head. These are not present in DollWOW's current flat extra-head selector and must not be described as implemented.
- Replace or explicitly approve the two custom care-kit illustrations; they are not exact matches for the current source photos.
- Make verified switch-head choices Visualizer-eligible after the cross-brand head sweep.
