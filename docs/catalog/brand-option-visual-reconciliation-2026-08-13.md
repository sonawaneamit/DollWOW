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
| WM Dolls | **In progress — not complete** | Live standard female TPE form: 161 named image-backed heads. Live silicone-head/S-TPE form: 164 image-backed silicone heads. Standard included switch, current one-free-extra promotion, and paid additional heads are represented separately; `Other Head` excluded. Full-silicone form and all major non-head group counts captured below. | Finish source-to-storefront price/image reconciliation for every family; visually QA custom TPE, hybrid, full silicone, ready stock, anime/PVC, male TPE and male silicone on desktop/mobile before changing this status |
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
- Status: the main TPE head library, free replacement selector, and paid head-base selector are implemented locally, but this family is **not complete**. The live source also exposes per-extra-head hair, eye, mouth, lip, and premium controls that DollWOW's current flat option schema cannot attach independently to each selected extra head.
- Production storefront mismatch captured visually on 2026-08-13: the live Addison PDP exposes only **22** replacement-head choices, versus **161** named compatible TPE heads on the inspected source. Production is therefore incomplete until the expanded picker is deployed and visually verified. A passing local data test is not production evidence.
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
- DollWOW does **not** yet reproduce the source's per-extra-head controls. The source exposes 16 hairstyles, 19 eye colors, 2 enhanced-mouth choices, 3 lip finishes, and 5 premium/head-function choices (`Head Moaning` $150, implanted synthetic hair $199, implanted human hair $299, eligible ROS $0, and eligible No Poker Face $50). This is an open data-model/UI gap, not a visually reconciled state.
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

Each family remains open until its visible source form, storefront rendering, price deltas, and option images are reconciled.

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

These checks still do **not** make WM visually reconciled. Mobile screenshots, both themes, all representative special-family storefront pages, every visible option image, and the remaining price-component decisions are still open.

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
