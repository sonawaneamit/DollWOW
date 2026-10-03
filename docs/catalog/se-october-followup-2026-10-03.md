# SE October follow-up

## Eyelid release candidate: 3 October

- Owner authorized publishing the two remaining upgrades. This candidate covers the ROS eyelid promotion only; no unverified silicone-head/body combination has been added.
- 98 reviewed parents have both exact named eyelid prices: 62.30 October / 89 regular. Discount requires explicit ROS in the primary `head-silicone-type` group. Duplicate extra-head function groups do not qualify the main head. Unknown/default/non-ROS selections keep their existing price.
- No menu/default/preset changes. No additional Shopify products or discount codes created.
- Twelve real Shopify cart checks passed through the local checkout handler, including October and November eyelid prices. No orders placed. Focused tests cover absent/default/non-ROS selections, extra-head isolation, unavailable choices, unreviewed parents, conditional menus and expiry.
- Silicone-head upgrade remains unverified: the official factory article explicitly says "selected silicone heads" and confirms only Light Tan cross-material matching. The linked general head catalogue does not identify which faces qualify for STPE/LSTPE. Do not equate a general silicone-head catalogue with a compatibility list.
- Factory sources checked: https://www.sedoll.com/stpe-series-introduces-a-new-custom-option-lstpe-lightweight-upgrade/ and https://www.sedoll.com/product/single-silicone-head/.
- Hosted candidate and production checks pending. Keep the associated SE launch email unread.

## Production checkpoint: 3 October

PR96 merged at `14f10f67147f8ae0e8d53d5c0032cb114a4aa9c8`; deployment `dpl_AwRhmwpGkuN1hBNE8THEvrPgLxoW` READY and aliased to dollwow.com. This supersedes the local/not-deployed notes below for the verified subset only.

- LIVE: LSTPE optional upgrade on115 reviewed157H/161F/163E TPE products, October90/normal100, requiring STPE. Existing three presets preserved on all115 with unchanged preset totals/default weight.
- LIVE: reviewed master makeup150->135 and real skin texture250->125 during October, with normal named-charge mappings restored after expiry.
- Five authenticated hosted-preview carts and five production-domain carts passed; ten controlled-date real Shopify carts passed for October/November.24/24 charge availability checks across US/PT/GB/DE and four international carts also passed. No orders placed.
- Evidence: main workspace `data/exports/se-october-production-cart-evidence.json` and `se-lightweight-preset-refresh.json`.59 focused regressions and TypeScript passed. Full suite previously940passed with one unrelated Fanreal wording assertion failure.
- Fixed branch-preview configuration by enabling `DOLLWOW_TEMPLATE_RELEASE=1` only for this preview branch. No production environment setting changed.
- Still withheld: separate silicone-head selection and ROS-dependent eyelid promotion, pending exact face/colour/head compatibility. Unsupported gel-butt choices were not invented. Do not mark the whole SE supplier request complete or its outstanding message read.
- Lusandy was already live: fresh factory media audit and12 production carts passed for Sophia170, Nadia159 and Belle165. Gallery-QA drafts remain unpublished; no duplicate uploads or price changes.
- No new visual browser QA performed; authenticated CLI/API verification only.

## Confirmed by owner

3 October: LSTPE lightweight and silicone-head upgrades are independent choices, each +$100 retail; selecting both is +$200 before applicable discounts. Do not merge them into one upgrade.

Owner subsequently clarified that supplier emails are dealer communications and authorized passing the supplier percentage to customers through scheduled option-price reductions, not codes. Lightweight dealer surcharge is $72 during the 10% promotion; approved retail surcharge is $90. Silicone-head retail surcharge stays $100, so both retail upgrades total $190 during October before any separately eligible store discount. The dealer-versus-retail clarification hold is resolved. This policy is saved in the main onboarding handbook.

## Fresh catalog audit

- Read all 369 active SE parent variants in the named-checkout release registry. Raw catalog menu audit saved in main workspace `data/exports/se-october-price-audit-2026-10-03.json`.
- 98 menus contain master makeup at $150 with only a $135 checkout binding.
- 97 menus contain skin texture at $250 with only a $125 checkout binding; three additional menus have no numeric source price and remain excluded.
- 98 menus contain primary-head movable eyelids at $89 with only a $62.30 binding. Corresponding extra-head groups have no direct binding; runtime normalization/ROS compatibility must be checked before treating these as available offers.
- This resolves the suspected double-discount issue for the numeric menus: the catalog amounts are not discounted, while existing charge records are. It also exposes missing regular-price bindings after expiry. Do not enable discounted prices without checking expiry behavior.

## Local changes, not deployed

- October series detection now recognizes existing verified Silicone Pro handles when material is simply Silicone, such as Lita. Current brand, material, form, fulfillment and October dates still govern eligibility. No unreviewed generic silicone product is included merely by brand.
- Added an optional LSTPE body-weight group to 115 reviewed TPE listings across 157H, 161F and 163E. Standard weight remains the default; LSTPE requires STPE. Existing head selection remains unchanged. This does not yet implement the separate silicone-head upgrade.
- Released local exact-price mappings for reviewed master makeup ($135 October / $150 normal) and skin texture ($125 / $250). Other partial discounts remain held pending compatibility checks.
- Created six hidden, non-shipping customization charge records in Shopify for missing regular prices and LSTPE. These are active on Online Store and Headless; the new public option-menu integration is NOT deployed.
- LSTPE costs $90 during October. After October it costs $100 plus the existing $100 STPE material upgrade when starting from regular TPE. Do not confuse the STPE material charge with the separate silicone-head upgrade.

## Verification

- Follow-up: refreshed all 115 existing preset runtime bindings for the added body-weight group. Verified three presets per product, unchanged preset totals, standard weight retained, and no selection conflicts. No new preset recipes or automatic lightweight selection. Evidence: main workspace `data/exports/se-lightweight-preset-refresh.json`.
- Authenticated Vercel CLI HTTP access works for the candidate (product request HTTP 200); this resolves the earlier preview sign-in obstacle, not visual browser QA.

- 111 promotion regression tests passed; 12 focused identity, lightweight and charge-gate tests passed. TypeScript check passed.
- Ten real Shopify cart checks passed using the local checkout handler: makeup and texture during/after October, plus each of the three lightweight body sizes during/after October. No orders placed. Evidence: main workspace `data/exports/se-october-live-cart-evidence.json`.
- Read-only international checks at 09:42 UTC: all six records passed in US, PT, GB and DE (24/24). Earlier missing international results have cleared without additional writes. This verifies availability, not a completed international checkout or visual browser test.
- Recheck without mutating Shopify using `scripts/check-se-october-charge-availability.mjs` with the main workspace `data/exports/se-october-charges.json` path.
- No visual browser QA performed in this follow-up.
- Full suite: 940 passed, 12 skipped, one existing Fanreal September wording assertion failed (expects `sitewide 10%`; component uses eligible-custom wording). Neither the test nor that component is changed by this release. `git diff --check` passed.

## Remaining

1. Verify the hosted candidate, including international carts, before deploying the tested subset.
2. Finish ROS-dependent movable-eyelid compatibility and the separate silicone-head upgrade using verified head choices. Do not invent a face library or enable unsupported gel-butt options.
3. Keep the two SE supplier emails unread until all associated work is complete.
