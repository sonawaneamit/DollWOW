# DollWow Live Catalog Duplication Audit

Reviewed: 2026-08-12

## Scope

- Refreshed the catalog audit directly from the live Shopify Storefront API.
- Reviewed 2,960 customer-visible products across 21 represented brands.
- Excluded 78 internal customization-charge records from public catalog findings.
- No Shopify products were merged, deleted, unpublished, or redirected during this audit.

## Main Finding

The raw Shopify catalog contains 125 exact title collision groups and 139 near-title collision groups. A total of 330 customer-visible products sit in one or both raw-data groups.

The rendered-production audit fetched all 330 flagged URLs successfully. It found 121 duplicate HTML-title groups affecting 290 products and 115 duplicate meta-description groups affecting 267 products. Every URL has a distinct self-canonical, so the problem is competing content rather than accidental shared canonicals.

Most exact collisions are not byte-for-byte duplicate galleries. They are products with the same inferred catalog identity and public metadata but different photo sets. This preserves more imagery, but it can split internal authority, make products hard to distinguish, and leave search engines choosing among near-identical URLs.

The largest exact-title groups include:

| Product family | Current URLs in group | Brand |
| --- | ---: | --- |
| Piper Akira 150 cm D-Cup TPE | 8 | Piper Dolls |
| Piper Akira 150 cm C-Cup Silicone | 7 | Piper Dolls |
| Piper Ariel 150 cm K-Cup Silicone | 7 | Piper Dolls |
| Irontech Eileen 164 cm F-Cup Silicone Head S40 | 5 | Irontech Dolls |
| Piper Scarlett 160 cm B-Cup TPE | 5 | Piper Dolls |

Rendered-title groups are concentrated in Irontech Dolls (30 groups), Starpery Dolls (24), Climax Doll (18), Piper Dolls (15), and Jarliet Dolls (9).

## Xue 163 Decision

Two live Starpery Xue 163 cm G-Cup silicone-head pages have the same price, inferred identity, title, meta description, specifications, and update time. Their galleries start with different images:

- `/products/starpery-xue-163cm-g-cup-silicone-head-companion-doll-1m2mk`
- `/products/starpery-xue-163cm-g-cup-silicone-head-companion-doll-1sd5a`

Both currently return `200`, self-canonicalize, and appear in the XML sitemap. The obsolete ready-to-ship handle remains a `404`. Do not redirect that old ready-to-ship URL to either custom-order page until stock identity is confirmed.

Recommended catalog review: choose one Xue URL as the permanent product, combine the useful gallery assets, redirect the retired duplicate to the retained URL, and submit both URLs through the release indexation workflow. The earlier-created `1m2mk` handle is the least surprising default if Shopify history does not reveal a stronger commercial reason to retain the other page.

## Rendered Title Verification

Five raw Shopify-title groups were individually checked against the production HTML:

- DollWow's renderer already distinguishes the Dolls Castle Luoyi pair as Head S10 and Head D1.
- It also distinguishes the three SE Doll ready-to-ship pairs by their exact head references.
- The Avant Sophia Wheat and White products remained identical in rendered titles and descriptions. Their official Avant source folders explicitly identify those finishes, so their Shopify display names were updated to `Sophia Wheat Finish` and `Sophia White Finish`.
- A repeat dry run of the display-name override reports zero remaining actions. Production metadata will separate the pair after the normal storefront cache refresh.

## Public Copy Cleanup

The audit found 27 product records whose public description or displayed product note named a source store. Thirteen Real Lady descriptions contained pricing-source language; the remaining references were internal product notes.

- Ran a scoped Shopify Admin dry run.
- Updated only the 27 affected products.
- Removed named source-store and internal pricing-logic language while preserving customer-relevant specifications and availability guidance.
- Added a storefront guard that replaces future internal source notes with customer-facing support language.
- Added `npm run catalog:clean-source-copy` as a reusable dry-run-first cleanup command. Add `-- --execute` only after the report shows zero unresolved records.

Supplier-authorized image URLs are not treated as public-copy leakage by this rule. Asset migration and provenance remain a separate catalog-media workflow.

## SEO Field Interpretation

The Shopify API reports 1,732 products without a manually entered SEO title. This does not mean those pages have no HTML title: DollWow generates a product title and description at render time. The higher-priority issue is duplicated generated titles across distinct URLs. Custom SEO-field backfilling should follow consolidation so it does not polish pages that will later be merged or redirected.

## Priority Order

1. Review the Xue 163 pair and establish one permanent URL.
2. Triage the remaining rendered-title groups by brand, starting with Irontech, Starpery, Piper, Climax, and Jarliet.
3. Merge galleries and redirect true duplicates. Keep separate products only when a visible head, finish, stock location, material, configuration, or other buying difference can be stated accurately.
4. Re-run `npm run catalog:audit-rendered-metadata` after each consolidation batch.
5. Backfill unique Shopify SEO fields only after URL consolidation.
