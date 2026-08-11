# Lightweight Sex Dolls Collection

Generated: 2026-08-11

## Decision

Use `/shop/lightweight-sex-dolls` as the sole canonical owner for `lightweight sex dolls`, `light weight sex doll`, and closely related commercial variants. Permanently redirect the older `/shop/lighter` shortcut instead of maintaining two indexable collections.

The collection is limited to full dolls with a listed weight under 75 lb / 34 kg. This is a transparent DollWow shopping boundary, not a universal industry definition or a promise that every result will be easy for every buyer to lift.

## DataForSEO Evidence

Three fresh US desktop depth-20 SERPs cost $0.009 total:

- `lightweight sex dolls`
- `light weight sex doll`
- `ultra lightweight sex doll`

The result sets were mixed and relatively weak, but commercial collection pages, buyer guides, videos, product pages, and marketplace results recur. The clearest exact commercial result used a lightweight collection page. DollWow did not appear in the collected result sets.

No additional paid endpoint was used. The decision depended on intent and page ownership, and Backlinks, Content Analysis, Domain Analytics, or AI Optimization would not change the canonical URL or category boundary.

## Implemented

- Replaced the vague `/shop/lighter` owner with `/shop/lightweight-sex-dolls` and a permanent redirect.
- Updated internal Learning Center links to the canonical URL.
- Added a full-doll and under-75-lb / 34-kg filter boundary.
- Added handling-route, dimensions, material, balance, storage, and reduced-weight guidance.
- Added three comparison rows, three buyer notes, six FAQs with schema, and seven relevant internal links.
- Added proactive support for confirming model-specific reduced-weight options and sourcing missing approved models.

## Catalog Classification Correction

Visual QA exposed imported product-form leakage: compact Erovenus body-profile products passed the shared full-doll classifier because of source tags. The shared classifier now gives stronger product text, supplier-origin media signals, and structured limb measurements precedence over a misleading full-doll tag. The correction applies across lightweight, mini, custom, torso, and hips collections rather than hiding products with page-specific exclusions.

Final live catalog checks after the correction returned 661 full lightweight candidates, 171 torsos, 27 hips products, and zero verified mini full dolls. Daisy routes to hips; Jenny, Hot Kitty Aria, Tantaly Badd Angel, and Tantaly Aria route to torsos; none remain in lightweight, custom, or mini collections. The seven former mini results were all partial-body Tantaly products.

## Validation

- DataForSEO task IDs and exact costs were recorded in the ignored raw export.
- TypeScript passed after implementation.
- All 162 tests passed before the subsequent new-arrivals preset, including new weight-boundary and structural product-form regressions.
- Customer-facing copy audit passed across 120 code files and 41 Learning Center articles.
- Production build passed with 109 generated static pages.
- `/shop/lighter` returns a permanent redirect to `/shop/lightweight-sex-dolls` locally.
- Desktop and mobile screenshots confirmed responsive layout with zero visible horizontal spill.
