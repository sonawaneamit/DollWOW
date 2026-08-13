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
| Duplicate schema-description groups | 115 |
| Products in duplicate schema-description groups | 267 |
| Reviewed products using title-plus-number gallery alt text only | 330 |
| Duplicate canonical groups | 0 |

The shared metadata source was corrected during this phase so no-cup products omit cup fragments and customer descriptions no longer expose internal search-language such as `Useful for ... searches`.

Structured Product descriptions currently inherit the same meta-description collisions. All 330 reviewed galleries use accessible but generic title-plus-image-number alt text. The remediation should therefore generate image-specific alt text from locked visible evidence, keeping each description concise and useful rather than repeating the same keyword phrase across every image.

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

## Pilot Search Evidence

A bounded DataForSEO pass checked six exact US product-name phrases through Google Ads Keyword Data and top-20 desktop organic results. Cost was `$0.2220`.

- None of the six exact phrases returned measurable Google Ads search volume. These are long-tail identity pages, not standalone traffic forecasts.
- Irontech Evie, Starpery Keisha, SE Doll Aryana B, Piper Lana, and Irontech Kevin all returned product-led result sets owned by manufacturers, retailers, video, or forum pages.
- DollWOW did not appear in the top 20 for any of the six sampled phrases.
- WM Lila Dane returned an unrelated, polluted result set. Her page should establish exact product identity rather than mirror current result language.
- The pilot remains strategically useful because it tests duplicate control, exact model/entity clarity, image discovery, and product-led long-tail visibility across five competitive result sets.

Search phrases must not be forced into editorial paragraphs or every image alt. Product identity belongs in the title, heading, structured data, and selected high-value image descriptions; the sensual introduction should remain natural and conversion-focused.

## Pre-Release Technical Baseline

DataForSEO Instant Pages checked all six live pilot URLs before any editorial or image-alt publication for `$0.0018`.

- All six returned HTTP 200.
- All six scored 97.07.
- All six used a canonical URL and exactly one H1.
- Current visible text ranged from 937 to 2,383 words, so this is a differentiation project rather than a thin-page rescue.
- The current titles and descriptions are relevant and technically valid, but the descriptions remain specification-led and generic.
- DataForSEO flagged missing image alt text even though the rendered gallery contains title-plus-number alt attributes. This discrepancy should be retested after the image-specific Shopify alt update rather than treated as proof that the attributes are absent.

This snapshot is the before-state for the pilot. The same six URLs should be recrawled after deployment, with title, description, schema, visible word count, image-alt extraction, and canonical behavior compared directly.

## Six-Product Visual Pilot

The pilot deliberately covers different brands, settings, materials, and customer audiences. Every gallery was fetched from the live DollWOW product-media route and reviewed as a complete set.

| Product | Verified catalog facts | Gallery-led direction |
| --- | --- | --- |
| Irontech Evie | 161 cm / 5 ft 3 in, F-cup, full silicone | Bright blue racing-editorial set with red sports styling, long brown hair, glasses, headphones, and energetic close portraits |
| WM Lila Dane | 157 cm / 5 ft 2 in, B-cup, full silicone | Blue-and-white fantasy styling in a warm library interior, with long white hair, vivid blue eyes, and composed full-length portraits |
| Starpery Keisha | 174 cm / 5 ft 9 in, D-cup, full silicone | Warm resort setting with wicker furniture, light curtains, plants, turquoise styling, and strong indoor-outdoor portraiture |
| SE Doll Aryana B | 160 cm / 5 ft 3 in, C-cup, full silicone | Dark gold fantasy set with pointed-ear styling, dramatic makeup, ornate furniture, and theatrical lighting |
| Piper Lana | 155 cm / 5 ft 1 in, F-cup, full silicone | Warm bedroom gallery with long blonde hair, lilac styling, and a clearly mature presentation; selected as Piper's publishing sample after Akira was retained only for duplicate-gallery review |
| Irontech Kevin | 176 cm / 5 ft 9 in, full silicone male doll | Dark studio and martial-arts styling with a muscular build, long dark hair, red accents, and clean full-body reference views |

Clothing, props, scenery, and accessories may inform mood and visual description, but must not be presented as included unless the live product record confirms inclusion.

## Pilot Publishing Architecture

1. Keep the factual supplier description, specifications, options, structured data, and Care 365 information intact.
2. Store the reviewed editorial introduction in a dedicated Shopify metafield rather than overwriting factual content.
3. Record product handle, body identity, head identity, gallery references, model, prompt version, generated date, review date, reviewer, status, and regeneration history.
4. Generate one 80-140-word introduction per pilot product from the verified facts and full gallery.
5. Use a customer-facing heading such as `Meet Evie`, `Meet Keisha`, or `Kevin's Look and Presence`.
6. Run factual, visual, customer-copy, and semantic-similarity checks before publication.
7. Add concise, image-specific alt text from the locked visual evidence, with one visible pose, framing, or styling distinction per image.
8. Review the six samples together before any brand-wide or catalog-wide batch.
9. Re-crawl released pilot pages with DataForSEO OnPage and monitor indexing, engagement, image discovery, and search/AI extraction before expansion.

## Release Decisions

- Do not merge or redirect from title similarity alone.
- Do not generate one generic paragraph per brand.
- Do not infer included clothing, accessories, functions, stock, or configuration options from photographs.
- Do not publish generated copy automatically.
- Do not let the editorial paragraph repeat the SEO title, meta description, image alt text, or factual specification block.
- Do not describe male products with female headings or cup fragments.

## Current Gate

The baseline and visual selection are complete. The next gate is the approved Venice text model and Shopify metafield/provenance contract. The frontend task has been asked to confirm the existing API wiring, model path, storage key, and rendered placement before implementation begins.

The first model evaluation also established a two-pass generation rule. A vision model must first extract locked visible evidence from the complete supplier gallery. A separate writer receives only that evidence and verified Shopify facts. Drafts remain unpublished until a human review removes psychological inference, unsupported material or function claims, overly clinical language, and repetitive catalog-like phrasing. The inexpensive one-pass model was rejected after it inferred advanced technology and buyer experience from a catalog configuration label. Piper Akira was removed from editorial generation because its visual presentation read too youthful for this layer; it remains valid only as an identity-collision audit case.
