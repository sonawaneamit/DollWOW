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
| **Total** | **691** |

6YE's complete 121-product report was already current and required no catalog writes. Angelkiss's fresh source pass was blocked on 19 pages by Rosemary's anti-bot response, so that partial report was not applied.

## Storefront behavior added

The source data for SE Doll, 6YE, Angelkiss, YL, Erovenus, Piper, and Tantaly now passes through a shared brand-aware normalizer:

- A compatible replacement-head library is presented as **Choose a Head**, required and single-select.
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
| Angelkiss | Included standard replacement head; no generic paid extra-head price published | No sufficiently broad, current source evidence found |
| YL | Exact source-priced extra heads only | Product-specific source options |
| Erovenus | Exact source-priced extra heads only; current imported choices include $275 heads | Product-specific source options |
| Piper | No head library was present in the reviewed source data | — |
| Tantaly | No head library was present in the reviewed source data | — |

These policies are temporary dealer guidance until manufacturer price lists replace them. They must not be generalized to unsupported materials or product families.

## Visualizer readiness

The post-update Shopify audit is stored in `docs/catalog/customization-coverage-audit-2026-08-13.md`. Across the active option-bearing catalog, 97% of stored choices have image swatches. Image presence alone is not approval for the Visualizer: only supported appearance categories with accurate source images are exposed.

## Deliberately gated

- Angelkiss paid extra heads until a broad compatible price is verified.
- The seven Tantaly products whose old Rosemary source URLs return 404.
- Head swaps in Doll Visualizer™ until identity preservation and option-to-head compatibility pass QA.
- Product-specific options whose current source does not prove a numeric price.
- Any source page blocked during the fresh 2026-08-13 anti-bot response.

## Next brand order

Continue with brands that have large active option records and unresolved prices: HR Dolls, Jarliet Dolls, Climax Doll, Dolls Castle, Real Lady, IL Doll, and Ai-Tech. Use manufacturer sources first, then current Rosemary, then YourDoll as temporary dealer evidence. Apply only exact label/price/photo matches and keep product-specific option groups ahead of brand defaults.
