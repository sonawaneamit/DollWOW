# Brand option visual reconciliation — 2026-08-13

This file supersedes any earlier informal use of “done” or “complete.” A high aggregate photo/price percentage is not proof that the visible selector on every product family is complete.

## Completion gate

A brand can be marked **visually reconciled** only after:

1. Every relevant live dealer/manufacturer product-family selector has been opened and inspected.
2. Each visible option group has a source count, price count, image count, and selection rule.
3. DollWOW’s corresponding visible groups and counts match the compatible source family.
4. Free replacement heads and paid additional heads are separate and correctly single- or multi-select.
5. Material, connector, gender/body, ROS/technology, anime/PVC, and special-series compatibility boundaries are explicit.
6. Visualizer-eligible choices have accurate source images; image presence alone is not sufficient.
7. Desktop and mobile screenshots confirm the actual storefront behavior.
8. Regression tests cover representative first, middle, last, and similarly named/variant choices.

## Current status

| Brand | Status | Verified evidence | Known gap / next action |
|---|---|---|---|
| WM Dolls | **Source data reconciled; deployment QA pending** | All 509 Rosemary-linked WM records across three historical brand spellings now match their current compatible source form. Standard female TPE exposes 161 named image-backed heads; silicone-head/S-TPE exposes 164 image-backed silicone heads. Free switch, current included-extra-head promotion, and paid multi-extra-head selectors are separate. Product-specific families retain only their verified compatible heads. | Deploy the shared runtime changes, then complete representative live PDP checks before marking the storefront released |
| Irontech Dolls | **Reopened — unverified** | Existing code/tests and prior collection audit only | Full live selector pass across TPE, silicone, ROS/Oriental, male, IronAI and special series |
| Starpery Dolls | **Reopened — unverified** | Prior price-list/source pass only | Full live selector pass including TPE/silicone, standard vs ROS/technology heads, replacement and additional head catalogs |
| Angelkiss | **Reopened — unverified** | MyRobotDoll head promotion/source images previously sampled | Reconcile all normal silicone and ROS head identities, construction choices, prices, and every non-head option group |
| SE Doll | **Reopened — unverified** | Prior source-data rollout only | Full selector pass by material/product family |
| 6YE Dolls | **Reopened — unverified** | Prior report only | Full selector pass by material/product family |
| YL Dolls | **Reopened — unverified** | Prior source-data rollout only | Full selector pass by material/product family |
| Erovenus | **Reopened — unverified** | Prior source-data rollout only | Separate full dolls, torsos, hips/body profiles and verify compatible option families |
| Piper Dolls | **Reopened — unverified** | Prior source-data rollout only | Full selector pass; confirm whether any compatible head library exists |
| Tantaly | **Reopened — unverified** | Prior source-data rollout only | Full selector pass and unresolved removed-source products |
| HR Dolls | **Reopened — unverified** | Prior dealer/factory source pass only | Full silicone/TPE/head-family visual reconciliation |
| Jarliet Dolls | **Reopened — unverified** | Prior dealer/factory source pass only | Full selector pass by material/product family |
| Climax Doll | **Reopened — unverified** | Prior source-data rollout only | Full selector pass by full doll/torso family |
| Dolls Castle | **Reopened — unverified** | Prior source-data rollout only | Full selector pass by realistic/fantasy/character/partial-body family |
| Real Lady | **Reopened — unverified** | Prior source-data rollout only | Full selector pass including parent-company technology/head compatibility |
| IL Doll | **Reopened — unverified** | Prior source-data rollout only | Full selector pass |
| Ai-Tech | **Reopened — unverified** | Prior source-data rollout only | Full selector pass and request-priced options |
| SY Dolls | **Reopened — unverified** | Factory pack/price-list import only | Full storefront selector pass against factory option pack |
| Moonvale | **Reopened — unverified** | Factory pack/price-list import only | Full storefront selector pass against factory option pack |
| Avant Doll | **Reopened — unverified** | Factory-source import only | Full storefront selector pass against factory option pack |
| Rosretty | **Reopened — unverified** | Prior reviewed import only | Full selector pass by material/product family |

## WM TPE source snapshot

- Source: <https://www.rosemarydoll.com/product/163cm5ft4-h-cup-tpe-sex-doll-addison/>
- Named TPE heads: **161**
- Source images: **161/161**
- Excluded placeholder: `Other Head`
- DollWOW `Choose a Head`: `As shown` + 161 compatible named heads, single-select, included switch
- DollWOW `Add Extra Head`: `No extra head` + the same 161 named heads, multi-select, current temporary retail delta $299 per selected head
- Status: the main TPE head library, free replacement selector, and paid multi-extra-head selector are implemented. Extra-head-specific appearance controls remain a separate future data-model project because each added head needs its own nested selections; they are not represented as ambiguous shared choices in the present configurator.
- Historical production mismatch captured on 2026-08-13: Addison exposed only **22** replacement-head choices while the inspected source exposed **161** named compatible TPE heads. Commit `e3c80db` was deployed and the production Addison PDP was rechecked afterward: it now exposes `As shown` plus **161** named heads (`162 choices` total), and a search for late-list head `432-1` returns the correct named option. This resolves the standard-female-TPE replacement-head count defect only; it does not certify WM as a whole.
- Dealer price note: YourDoll currently displays a $299 head base and a separate $100 S-TPE material choice. This is not being flattened into one universal WM head price. Current promotion and construction price components remain separate until the exact checkout rule is reconciled.

## WM silicone-head / S-TPE source snapshot

- Source: <https://www.rosemarydoll.com/product/175cm-5ft9-b-cup-silicone-head-s-tpe-body-sex-doll-weitta/>
- Named silicone heads: **164**
- Source images: **164/164**
- Excluded placeholder: `Other Head`
- Five silicone-only SS-series choices present: `SS111`, `SS167`, `SS168`, `SS174`, `SS182`
- Source form also exposes: 2 materials, 8 skin tones, 16 hairstyles, 19 eye colors, 2 enhanced-mouth choices, 3 lip finishes, 5 fingernail choices, 14 toenail choices, 3 breast choices, 5 nipple colors, 4 areola sizes, 5 vagina colors, 4 pubic-hair choices, 2 vagina choices, 2 standing choices, 2 skeleton choices, 3 insertable-penis choices, 19 premium choices, 17 lingerie choices, 15 accessories, and 3 flight-case choices.
- Source currently includes one free extra-head promotion, followed by extra-head appearance controls.
- DollWOW local normalization now separates `Choose a Head`, `Included Extra Head`, and paid `Add Extra Head` instead of collapsing those three intents.
- Extra-head-specific appearance controls are intentionally not flattened into one shared selector. The source exposes 16 hairstyles, 19 eye colors, 2 enhanced-mouth choices, 3 lip finishes, and 5 premium/head-function choices (`Head Moaning` $150, implanted synthetic hair $199, implanted human hair $299, eligible ROS $0, and eligible No Poker Face $50). Supporting different selections for each purchased extra head requires a nested per-head configurator and remains separately scoped.
- Manufacturer price evidence: WM's own accessories shop currently lists a silicone head at **$650**. This supports the silicone paid-extra-head delta, not TPE or promotional included heads.

## WM full-silicone source snapshot

- Representative source: <https://www.rosemarydoll.com/product/ultra-light-series-163cm-5ft4-d-cup-silicone-sex-doll-head201/>
- This representative body exposes only three named compatible heads (`198`, `201`, `202`) plus `Other Head`; it must **not** receive the 164-head silicone-head/S-TPE library.
- Source form also exposes: 3 head constructions, 4 skin tones, 16 hairstyles, 8 eye colors, 5 lip colors, 9 fingernail colors, 6 toenail colors, 4 nipple colors, 4 areola sizes, 5 vagina colors, 3 pubic-hair choices, 2 vagina choices, 3 standing choices, 2 skeleton choices, 3 insertable-penis choices, 17 premium choices, 17 lingerie choices, 10 accessories, and 3 flight-case choices.
- The live form currently exposes heads `198`, `201`, and `202` as an **included promotional extra head**, with separate head type, hairstyle, eye, lip, and premium controls for that extra head.
- The imported source record also retains the ordinary $399 extra-head prices. DollWOW therefore renders the current one-free-head promotion separately from the paid additional-head selector rather than converting one into the other.
- Shopify currently has at least two full-silicone form signatures, including a `Head 135` family with a different visible head set. Product-specific head libraries take precedence and remain under reconciliation.

## WM source-family inventory found in the live catalog

The current WM catalog contains multiple distinct source forms; one representative visual pass does not prove the others:

| Family | Catalog records seen | Representative visible form |
|---|---:|---|
| Standard female TPE | 390 core + 2 weight-reduction variants | 161 named TPE heads plus full appearance/body/accessory form |
| Silicone head + S-TPE body | 31 core + 1 partial older import | 164 named silicone heads plus full appearance/body/accessory form |
| Full silicone female | 16 core + 1 Head 135 variant + 5 additional silicone/anime records | Product-specific compatible head sets; 3 named heads on the Head 201 family |
| Ready-to-ship TPE | 14 | Stock-unit-specific head and option subsets; must not inherit the full custom-order form blindly |
| Ready-to-ship silicone | 6 | Small stock-unit option subset |
| PVC/anime TPE | 6 | Separate 27-style hair/eye families; no generic realistic-head injection |
| Male TPE | 4 | Male-specific skin, eyes, anatomy, standing, shoulder, accessory and case form |
| Male silicone | 1 | Male-specific head construction, anatomy and premium form |

The source data, price deltas, and option images are reconciled across these families. The final release gate is representative production rendering and interaction QA after deployment.

### Representative visual checks completed in this pass

- Standard female TPE: Addison source opened; 161 named TPE heads and all visible selector families counted.
- Silicone-head/S-TPE: Weitta source opened; 164 named silicone heads and all visible selector families counted.
- Full silicone female: Head 201 source opened; product-specific 198/201/202 head family and all visible selectors counted.
- Ready-to-ship TPE: Minana US-stock source opened; 23 stock head choices and 22 promotional extra-head choices confirmed, with the reduced stock-specific form.
- PVC/anime TPE: Y007 source opened; separate head gate, 19 other-head choices, 27 hairstyles, 27 eye choices, and anime-specific body form confirmed.
- Male TPE: Jack source opened; 7 skin tones, 10 eye choices, 2 mouth choices, 3 nail choices, 13 toenail choices, 5 nipple colors, 4 areola sizes, 3 penis choices, 2 standing choices, 2 shoulder choices, 8 accessories, and 3 cases confirmed.
- Male silicone: SN-01 source opened; 3 head constructions, 4 skin tones, 8 eye choices, 5 lip colors, 9 nail choices, 6 toenail choices, 4 nipple colors, 4 areola sizes, 2 penis lengths, 3 standing choices, 2 skeleton choices, 15 premium choices, 8 accessories, and 3 cases confirmed.

These source checks do not yet certify the DollWOW storefront. The remaining WM work is price-delta reconciliation, image verification for every selector family, stock/custom eligibility rules, and visual QA of the actual rendered configurator on desktop and mobile.

### Storefront checks completed locally

- Silicone-head/S-TPE Weitta: rendered `24` steps; `Choose a Head` contains `As shown` plus `164` named compatible silicone heads; `Included Extra Head` and `Add Extra Head` are separate steps.
- Full-silicone Head 201: rendered `22` steps; replacement choices contain `198`, `201`, and `202`; the current included-extra-head promotion contains those same three named heads at $0; the paid additional-head step remains separate.
- Ready-to-ship regression: ready stock is explicitly excluded from the generic 161/164 custom-order library and remains bound to its product-specific imported selector.
- Identity check: `wm-minana-162cm-f-cup-tpe-companion-doll-4zfit` is the custom-order Minana and correctly retains the full configurator. The distinct ready-stock Minana is `wm-minana-162cm-f-cup-tpe-companion-doll-5ftuj`; it currently returns 404 on the local storefront and therefore cannot be counted as storefront-verified. Similar model names are not sufficient evidence of the same stock/configuration record.
- Automated checks: WM customization regression suite passes `8/8`; project typecheck and whitespace validation pass.

### Production checks completed after `e3c80db`

- Standard female TPE Addison: `Choose a Head` shows `162 choices` (`As shown` plus `161` named heads). Late-list search for `432-1` succeeds.
- Silicone-head/S-TPE Weitta: `Choose a Head` shows `165 choices` (`As shown` plus `164` named heads). `Included Extra Head` and `Add Extra Head` remain distinct steps.
- Full-silicone Head 201: the product-specific replacement family remains limited to `198`, `201`, and `202`, rather than inheriting the 164-head S-TPE library.
- These production checks describe the earlier deployment. A new deployment is required for the complete source reconciliation, neutral-default normalization, and expanded Visualizer eligibility in this pass.

The remaining release work is the post-deployment production QA listed above; the underlying Rosemary-linked WM source data now passes strict coverage, price, and image checks.

### Full Rosemary-linked WM reconciliation

The strict source reconciliation now evaluates every WM catalog record that retains a Rosemary product URL. It compares complete visible source groups and choices rather than only prices already present in Shopify, then replaces stale non-head option JSON with the current source form. The storefront's compatibility rules own the comprehensive head libraries so they are not duplicated in every Shopify record.

| Result | Count |
|---|---:|
| Rosemary-linked WM records checked | 509 |
| Source fetch failures | 0 |
| Records missing a current source group or option after reconciliation | 0 |
| Source option choices without a verified checkout price after reconciliation | 0 |
| Visualizer-eligible source appearance choices checked | 35,889 |
| Visualizer-eligible source appearance choices missing an image | 0 |

The 509 records span all three historical catalog-brand spellings found in Shopify: `WM Dolls` (479), `WM Doll` (28), and `WMDOLL` (2). The earlier raw count of 452 discrepancies was a diagnostic comparison between old stored JSON and current source forms. It mixed genuine stale source data with expected differences created by shared runtime head libraries and must not be described as 452 broken products. The post-reconciliation coverage result above is the customer-relevant catalog result.

The generated local review artifact is `data/exports/shopify-rosemary-option-price-sync-wm-dolls.json`. It remains excluded from git as catalog review data.

## Evidence rule for every reopened brand

For each brand, the final audit record must include both sides of the comparison:

- the exact source URL and product family it represents;
- a screenshot of the opened source selector rather than only HTML/count output;
- the exact DollWOW PDP/collection URL used for comparison;
- visible source and DollWOW counts for each group;
- the first, a middle, and the last option checked for label, image, price and selection behavior;
- desktop and mobile storefront captures in light and dark modes;
- an explicit list of unresolved gaps.

If any one of those is missing, the brand remains `in progress` or `unverified`. It cannot be described as done.

### Standard TPE image reconciliation

- Main source groups and local option counts match for weight, material, skin, hair, eyes, mouth, lips, nails, breast/nipple/areola, intimate appearance, standing/skeleton, insertable option, premium options, lingerie, accessories, and flight case.
- Main source and DollWOW option-image filenames/order match except two care products: DollWOW currently uses custom `care-kit.svg` and `deluxe-care-kit.svg` illustrations instead of the current source photos `RosemaryDoll-Care-Kit-1-1.jpg` and `RosemaryDoll-Deluxe-Care-Kit-1.png`. These are not being counted as exact visual matches.
- `Other Head` is a non-specific fallback rather than a named visual option and remains intentionally excluded from the 161-head library.
- The 161 named source head images were counted and the first, middle, and last choices were browser-load checked. Full mobile/light-mode selector QA and the independent per-extra-head configuration model remain open.
