# Irontech catalog coverage audit — 2026-08-13

## Outcome

The Irontech review covered both current Rosemary category paths:

- `irontech-doll`
- `irontech-silicone-doll`

The reviewed source set contained 505 entries. One Rosemary-exclusive product was blocked by the existing import guardrail, leaving 504 eligible source entries for catalog comparison.

No product from this audit was published automatically.

## Catalog decisions

| Decision | Count | Action |
| --- | ---: | --- |
| Exact Rosemary source already represented live | 239 | Kept existing product |
| New, review-safe catalog candidates | 156 | Created as Shopify drafts |
| Ambiguous identity or overlapping presentation | 87 | Held for manual review; not imported |
| Warehouse inventory or head-reference pages | 10 | Excluded from the made-to-order catalog import |
| Consolidated duplicate source listings | 11 | Merged unique gallery images into the retained candidate |
| Conflicting source specifications | 1 | Held; not imported |

The 156 draft candidates consist of:

- 93 TPE products
- 59 silicone products
- 4 hybrid products
- 154 female products
- 2 male products

The source conflict is the Maelyss listing, whose public title identifies a K-cup while its specification table identifies an I-cup. It remains outside Shopify until the supplier or another authoritative source resolves the discrepancy.

## Customization status

The shared Irontech configuration is ready as a safe baseline for standard female products:

- Standard TPE products use the reviewed TPE head library.
- Standard full-silicone products use the reviewed silicone head library.
- `Choose a Head` is single-select. A standard compatible head switch is free; special material or technology upgrades keep their explicit prices.
- `Add Extra Head` is multi-select and always priced as an add-on.
- Ordinary selectable options use known checkout prices rather than an `ask the team` conversion blocker.
- IronAI eligibility remains restricted to compatible products.

Male, Oriental/ROS, robotic, and other special-series products remain on product-specific option logic. A brand default is not treated as proof that every Irontech SKU supports every option.

Validation: `tests/irontechCustomization.test.ts` passes all 7 tests.

## Review boundary

The 87 ambiguous entries were intentionally not guessed into the catalog. They include exact identity collisions, near-identical public titles, overlapping primary images, and body/head families that may be alternate galleries rather than separate products. They require an image/body/head/source comparison before any draft is created.

The generated review artifacts remain local under `data/exports/` and are intentionally excluded from version control. The reusable review builder is `scripts/build-irontech-missing-draft-review.mjs`.

## Release state

- Existing live Irontech products: unchanged by this catalog-addition pass.
- New Irontech products: 156 Shopify drafts.
- Automatically published products: 0.
- Ambiguous or conflicting products exposed to customers: 0.

