# Dealer brand option rollout — 2026-08-13

## Released data scope

Exact Rosemary option labels, current price deltas, and source option images were applied to Shopify for:

| Brand | Products updated |
|---|---:|
| SE Doll | 411 |
| YL Dolls | 161 |
| Erovenus | 24 |
| Piper Dolls | 65 |
| Tantaly | 30 |
| HR Dolls | 106 |
| Jarliet Dolls | 103 |
| Climax Doll | 131 |
| Dolls Castle | 156 |
| Real Lady | 36 |
| IL Doll | 19 |
| Ai-Tech | 7 |
| Irontech aliases | 18 |
| WM aliases | 3 |
| **Total catalog writes** | **1,270** |

6YE's complete 121-product report was already current and required no catalog writes. Angelkiss's Rosemary source pass was blocked on 19 pages by an anti-bot response; a fresh MyRobotDoll product form was therefore used to verify the live Angelkiss head promotion and photographed compatible head library.

## Storefront behavior added

The source data for SE Doll, 6YE, Angelkiss, YL, Erovenus, Piper, Tantaly, HR Dolls, Jarliet Dolls, Climax Doll, Dolls Castle, Real Lady, IL Doll, and Ai-Tech now passes through a shared brand-aware normalizer:

- A compatible replacement-head library is presented as **Choose a Head**, required and single-select, unless the source explicitly sells the library as an included additional-head promotion.
- A source-labelled **An Extra Free Head** promotion is preserved as one optional, single-select **Included Extra Head**. It is not silently converted into a replacement head.
- Standard replacement heads are included. A verified source surcharge on a special head remains charged.
- **Add Extra Head** is separate, optional, and multi-select. Every chosen additional head contributes its own price.
- Extra-head dependent duplicate controls are removed from the primary configuration flow.
- An ambiguous yes/no promotion is not treated as a usable head catalog.
- Image-backed appearance choices are marked Visualizer-ready only for supported appearance groups.
- Head changes remain excluded from the Visualizer until the identity-preserving head-replacement workflow passes QA.
- A choice without a verified numeric price stays in the factory record but is excluded from checkout. It must not replace Add to Cart with an "ask our team" detour.

## Temporary dealer-guided head pricing

| Brand | Current policy | Evidence |
|---|---|---|
| SE Doll | Included standard replacement head; compatible TPE extra heads $399 each | SE Doll official single TPE head listing |
| 6YE | Included standard replacement head; compatible TPE extra heads $299 each | Current dealer listing describing the extra TPE head as a $299 value |
| Angelkiss | Included standard replacement head plus one optional promotional extra head at $0 | MyRobotDoll Angelkiss product form; 19 photographed named heads in both single-select fields |
| YL | Exact source-priced extra heads only | Product-specific source options |
| Erovenus | Exact source-priced extra heads only; current imported choices include $275 heads | Product-specific source options |
| Piper | No head library was present in the reviewed source data | — |
| Tantaly | No head library was present in the reviewed source data | — |
| HR Dolls | Source free-extra promotion remains single-select; current paid extra-head choices retain exact dealer retail prices | Factory sheet validates compatible silicone heads and implant-hair distinction; current dealer form supplies retail deltas |
| Jarliet Dolls | Source free-extra promotion remains single-select; no generic paid extra-head price invented | Factory minimum-reseller sheet validates separate TPE and silicone head products; dealer form defines the active promotion |
| Climax Doll | Source free-extra promotion remains single-select; exact paid extra-head choices remain multi-select | Current dealer product forms |
| Dolls Castle | Source free-extra promotion remains single-select; no generic paid extra-head price invented | Current dealer product forms plus factory price-list archive |
| Real Lady | Source free-extra promotion remains single-select; dependent duplicate controls remain gated | Current dealer product forms |
| IL Doll | Exact dealer-priced extra heads remain multi-select at $449 each | Factory sheet validates head types/cost floor; current dealer form supplies retail price |
| Ai-Tech | Only exact priced choices are purchasable; no head price invented | Factory robot quotation validates option families but says customized pricing depends on requirements |

These policies are temporary dealer guidance until manufacturer price lists replace them. They must not be generalized to unsupported materials or product families.

## Visualizer readiness

The post-update Shopify audit is stored in `docs/catalog/customization-coverage-audit-2026-08-13.md`. Across the active option-bearing catalog, 97% of stored choices have image swatches. Image presence alone is not approval for the Visualizer: only supported appearance categories with accurate source images are exposed.

## Deliberately gated

- Angelkiss permits one free promotional extra head, not unlimited extra heads. Recheck this temporary promotion before changing its price or quantity rule.
- The seven Tantaly products whose old Rosemary source URLs return 404.
- Head swaps in Doll Visualizer™ until identity preservation and option-to-head compatibility pass QA.
- Product-specific options whose current source does not prove a numeric price.
- Any source page blocked during the fresh 2026-08-13 anti-bot response.
- Extra-head-specific eye, hair, head-type, and premium controls until the configurator can bind those choices to a particular selected extra head. Showing them as unattached global add-ons would be ambiguous and could misprice an order.
- Manufacturer wholesale figures as storefront prices. Factory sheets validate existence, compatibility, and cost floors; customer-facing deltas remain based on verified retail evidence.

## Remaining brand work

Continue with smaller/alias catalogs and brands whose factory folders are currently empty. Use manufacturer sources first, then current Rosemary, then YourDoll as temporary dealer evidence. Apply only exact label/price/photo matches and keep product-specific option groups ahead of brand defaults.
