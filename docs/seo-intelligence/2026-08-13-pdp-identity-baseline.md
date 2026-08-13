# PDP Identity And Differentiation Baseline

**Run date:** 2026-08-13  
**Status:** Baseline complete; six-product pilot in preparation  
**Scope:** Read-only review of the public Shopify catalog and rendered DollWOW product metadata

## Executive Finding

DollWOW has 2,960 public products after excluding 78 system products. Product canonicals are healthy, but many legitimate configurations currently share rendered metadata because the manufacturer name, character name, height, material, and cup size are not always enough to distinguish alternate galleries or body-and-head combinations.

The catalog should not be bulk-merged from title similarity. Most reviewed collisions are separate photo sets or legitimate configurations that need more specific customer-facing identity, gallery-grounded metadata, and a reviewed editorial introduction.

## Catalog Baseline

| Signal | Result |
| --- | ---: |
| Public products reviewed | 2,960 |
| Excluded system products | 78 |
| Products missing a Shopify SEO title | 1,732 |
| Products missing verified weight | 96 |
| Products missing verified material | 35 |
| Products missing verified height | 5 |
| Products missing cup data | 217 |
| Custom-option sets with missing images | 26 |
| Products with thin media | 8 |
| Duplicate identity groups | 171 |
| Exact public-title groups | 125 |
| Near-duplicate public-title groups | 139 |
| Products with title warnings | 330 |
| Products with any audit warning | 1,997 |

Missing cup data is not automatically an error. Male dolls, torsos without cup labeling, and other no-cup forms must omit the field rather than rendering `N/A-Cup` or `-Cup`.

## Rendered Metadata Baseline

The 330 title-warning products were fetched from the live storefront.

| Signal | Result |
| --- | ---: |
| Product pages fetched successfully | 330 of 330 |
| Duplicate rendered title groups | 139 |
| Products in duplicate rendered title groups | 330 |
| Duplicate rendered description groups | 115 |
| Products in duplicate rendered description groups | 267 |
| Duplicate canonical groups | 0 |

The shared metadata source was corrected during this phase so no-cup products omit cup fragments and customer descriptions no longer expose internal search-language such as `Useful for ... searches`.

## Collision Interpretation

The exact-title review classified:

- 120 groups as separate photo sets that should be kept but renamed
- 2 groups as head or variant distinctions that should be renamed
- 3 groups as distinct specifications that should be renamed
- 0 groups as safe automatic merges or redirects

This is a review-first result. A shared character name does not prove duplication. Irontech and SE Doll regularly reuse a head across different bodies, heights, materials, and configurations. Piper has several galleries under the same Akira body identity. Each record must be compared using its body identity, head identity, product form, measurements, material, gallery, options, and source provenance.

## Highest Collision Concentrations

| Brand | Products in rendered-title collision review |
| --- | ---: |
| Irontech Dolls | 73 |
| Starpery Dolls | 53 |
| Piper Dolls | 52 |
| SE Doll | 44 |
| Climax Doll | 41 |
| Jarliet Dolls | 28 |
| Dolls Castle | 14 |
| Angelkiss | 13 |
| WM Dolls | 8 |
| Avant Doll | 2 |
| YL Dolls | 2 |

The first remediation batch should therefore prioritize Irontech, Starpery, Piper, and SE Doll, while keeping WM represented because it is strategically important and has the largest live DollWOW assortment.

## Six-Product Visual Pilot

The pilot deliberately covers different brands, settings, materials, and customer audiences. Every gallery was fetched from the live DollWOW product-media route and reviewed as a complete set.

| Product | Verified catalog facts | Gallery-led direction |
| --- | --- | --- |
| Irontech Evie | 161 cm / 5 ft 3 in, F-cup, full silicone | Bright blue racing-editorial set with red sports styling, long brown hair, glasses, headphones, and energetic close portraits |
| WM Lila Dane | 157 cm / 5 ft 2 in, B-cup, full silicone | Blue-and-white fantasy styling in a warm library interior, with long white hair, vivid blue eyes, and composed full-length portraits |
| Starpery Keisha | 174 cm / 5 ft 9 in, D-cup, full silicone | Warm resort setting with wicker furniture, light curtains, plants, turquoise styling, and strong indoor-outdoor portraiture |
| SE Doll Aryana B | 160 cm / 5 ft 3 in, C-cup, full silicone | Dark gold fantasy set with pointed-ear styling, dramatic makeup, ornate furniture, and theatrical lighting |
| Piper Akira | 150 cm / 4 ft 11 in, D-cup, TPE | Soft white-bedroom gallery with a short purple bob and intimate, minimal styling; selected specifically to test differentiation across repeated Akira photo sets |
| Irontech Kevin | 176 cm / 5 ft 9 in, full silicone male doll | Dark studio and martial-arts styling with a muscular build, long dark hair, red accents, and clean full-body reference views |

Clothing, props, scenery, and accessories may inform mood and visual description, but must not be presented as included unless the live product record confirms inclusion.

## Pilot Publishing Architecture

1. Keep the factual supplier description, specifications, options, structured data, and Care 365 information intact.
2. Store the reviewed editorial introduction in a dedicated Shopify metafield rather than overwriting factual content.
3. Record product handle, body identity, head identity, gallery references, model, prompt version, generated date, review date, reviewer, status, and regeneration history.
4. Generate one 80-140-word introduction per pilot product from the verified facts and full gallery.
5. Use a customer-facing heading such as `Meet Evie`, `Meet Keisha`, or `Kevin's Look and Presence`.
6. Run factual, visual, customer-copy, and semantic-similarity checks before publication.
7. Review the six samples together before any brand-wide or catalog-wide batch.
8. Re-crawl released pilot pages with DataForSEO OnPage and monitor indexing, engagement, and search/AI extraction before expansion.

## Release Decisions

- Do not merge or redirect from title similarity alone.
- Do not generate one generic paragraph per brand.
- Do not infer included clothing, accessories, functions, stock, or configuration options from photographs.
- Do not publish generated copy automatically.
- Do not let the editorial paragraph repeat the SEO title, meta description, image alt text, or factual specification block.
- Do not describe male products with female headings or cup fragments.

## Current Gate

The baseline and visual selection are complete. The next gate is the approved Venice text model and Shopify metafield/provenance contract. The frontend task has been asked to confirm the existing API wiring, model path, storage key, and rendered placement before implementation begins.
