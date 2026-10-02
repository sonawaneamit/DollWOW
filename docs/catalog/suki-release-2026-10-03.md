# Suki Glow release

Owner authorized completing the pending dolls and publishing after page, preset and checkout checks. This incremental release affects product 10630580273336 / variant 54234105675960 only; existing products and October campaign rollout remain separate.

## Source and price

- Factory release: Irontech 166cm 2.0, S20 ROS MAX, Glow. Four factory photographs; clothed photograph 35 is the lead.
- Factory measurement workbook, body row A66:O66: E-cup, 166cm, bust85/underbust65.3/waist59.6/hips96cm. Body37.5kg and generic head2.5-3kg remain separate; no finished or ULW weight guarantee.
- Exact retailer fallback authorized by owner: https://www.yourdoll.com/product/sex-doll-itd911/ . Its selected configuration is 166cm2.0/S20/ROS MAX/Glow, not the older 167cm Suki listing.
- Retailer base USD2300 is below the recorded factory final-price floor2486. DollWOW2799 becomes2519.10 after the existing10%, above the floor. Delivered cost/margin remains unverified; no30-35% profit claim.
- The retailer's leg-length imperial conversion was incorrect. The factory-backed80cm was retained (31.5in), not27.2in. Conflicting carton dimensions were not presented as a verified shipping package.

## Options and presets

The 23-group source menu retains verified option prices and defaults. The selected S20/ROS MAX identity is fixed; unrelated alternate-head branches are not silently unlocked. Appearance preferences remain customer-editable and are not newly assigned by presets.

Reusable tag: `options:irontech-female-silicone-166v2-s20-ros-max`.

| Preset | Added choices | Before checkout discount |
| --- | --- | --- |
| Starter | Source-selected S+ makeup and body finish | USD2799 |
| Enthusiast | ULW body option and soft thigh | USD3097 |
| Collector | Enthusiast plus body heating and soft belly | USD3256 |

Exact retailer combinations remained selected, enabled and visible after recalculation, with no mutual exclusion for those four upgrades. This is retailer-supported evidence under the owner's fallback, not factory certification or a combined-performance claim.

Named charges reuse eight existing semantic matches and add twenty specific records. Pubic hair styles share one charge family with the selected style recorded as an order attribute; unrelated equal-price upgrades do not share generic denomination charges. All charge records require the `dollwow-system` and `exact-upgrade-pilot` tags, nonshipping/untracked/CONTINUE setup and accurate descriptions.

## Verification

- 204 focused agent tests passed; parent independently reran82 Suki/template tests. TypeScript passed.
- Actual local Brave preview at1440/768/390: all three selections and totals passed, editorial image decoded, no overflow or page errors. Tablet screenshot visually reviewed.
- All28 add-on records are available in US/PT/GB/DE. Four accurate on-doll customizations needed Shopify's suggested Product Add-Ons > Product Customization category before international review cleared. Names, descriptions and prices were not disguised or changed.
- Shopify parent remains DRAFT until code and international add-on checks complete. Source input and frozen menu revisions are retained in ignored evidence.
- This document describes incremental release preparation, not completed production checkout. Final live checks and deployment are recorded below when completed. No order or payment was placed during preparation.

Evidence: main repository `data/exports/catalog-ops-five-2026-10-02/`, especially `suki-specifications-verified.json`, `suki-retailer-tier-combinations.json`, `suki-prepared-menu.json`, `suki-named-charge-candidate.json`, `suki-menu-applied.json`, and `suki-charge-release-readback.json`.

## Production checkpoint

PR90 deployed and the parent was activated. All32 actual US cart cases passed: three presets,28 distinct named charges, and return to Starter. Shopify checkout visibly shows Collector's individual named upgrades; no order placed. Existing10% gives2519.10/2787.30/2930.40 respectively.

The first activation required refreshing the preset runtime identity from the actual Storefront response: Admin exports `2799.00`, whereas Storefront exports `2799.0`. The new registration uses the actual live mapped product rather than assuming byte-identical money strings across APIs. Its selector passed an independent live-read test. Other products' signatures are unchanged.

Final public-page and parent international checks remain required after this registry refresh. The earlier28/28 market pass covers add-ons, not the newly activated parent.
