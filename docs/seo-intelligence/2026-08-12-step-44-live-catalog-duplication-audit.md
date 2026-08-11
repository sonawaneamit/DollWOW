# DollWow Live Catalog Duplication Audit

Reviewed: 2026-08-12

## Scope

- Refreshed the catalog audit directly from the live Shopify Storefront API.
- Reviewed 2,960 customer-visible products across 21 represented brands.
- Excluded 78 internal customization-charge records from public catalog findings.
- No Shopify products were merged, deleted, unpublished, redirected, or renamed during this audit.

## Main Finding

The catalog contains 125 exact public-title collision groups and 139 near-title collision groups. A total of 330 customer-visible products sit in one or both groups.

Most exact collisions are not byte-for-byte duplicate galleries. They are products with the same inferred catalog identity and public title but different photo sets. This preserves more imagery, but it also creates self-canonical pages with the same title, meta description, core specifications, and buyer intent. That can split internal authority, make products hard to distinguish, and leave search engines choosing among near-identical URLs.

The largest exact-title groups include:

| Product family | Current URLs in group | Brand |
| --- | ---: | --- |
| Piper Akira 150 cm D-Cup TPE | 8 | Piper Dolls |
| Piper Akira 150 cm C-Cup Silicone | 7 | Piper Dolls |
| Piper Ariel 150 cm K-Cup Silicone | 7 | Piper Dolls |
| Irontech Eileen 164 cm F-Cup Silicone Head S40 | 5 | Irontech Dolls |
| Piper Scarlett 160 cm B-Cup TPE | 5 | Piper Dolls |

Exact-title groups are concentrated in Irontech Dolls (30 groups), Starpery Dolls (24), Climax Doll (18), Piper Dolls (15), and SE Doll (10).

## Xue 163 Decision

Two live Starpery Xue 163 cm G-Cup silicone-head pages have the same price, inferred identity, title, meta description, specifications, and update time. Their galleries start with different images:

- `/products/starpery-xue-163cm-g-cup-silicone-head-companion-doll-1m2mk`
- `/products/starpery-xue-163cm-g-cup-silicone-head-companion-doll-1sd5a`

Both currently return `200`, self-canonicalize, and appear in the XML sitemap. The obsolete ready-to-ship handle remains a `404`. Do not redirect that old ready-to-ship URL to either custom-order page until stock identity is confirmed.

Recommended catalog review: choose one Xue URL as the permanent product, combine the useful gallery assets, redirect the retired duplicate to the retained URL, and submit both URLs through the release indexation workflow. The earlier-created `1m2mk` handle is the least surprising default if Shopify history does not reveal a stronger commercial reason to retain the other page.

## Other High-Confidence Title Fixes

Five collision groups are clearly distinguishable and should be renamed before broader consolidation:

- Avant Sophia 165 cm F-Cup Full Silicone: distinguish the Wheat and White finishes in the public titles.
- Dolls Castle Luoyi 170 cm E-Cup Silicone: distinguish Head S10 and Head SD1.
- SE Doll 103 cm J-Cup ready-to-ship products: include Nadia Voss and Sophia Lane.
- SE Doll 107 cm H-Cup ready-to-ship products: include Olivia Grant and Scarlett Reed.
- SE Doll 114 cm F-Cup ready-to-ship products: include Isla Kane and Zoe Ellis.

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

1. Resolve the five clearly distinguishable title groups with customer-useful names.
2. Review the Xue 163 pair and establish one permanent URL.
3. Triage the remaining exact-identity photo-set groups by brand, starting with Irontech, Starpery, Piper, Climax, and SE Doll.
4. Merge galleries and redirect true duplicates. Keep separate products only when a visible head, finish, stock location, material, configuration, or other buying difference can be stated accurately.
5. Backfill unique SEO titles and descriptions only after URL consolidation.
