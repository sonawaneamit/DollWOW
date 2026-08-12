# DollWow Sitewide OnPage Audit

Generated: 2026-08-12T05:24:24.581Z

- DataForSEO task: `08120037-1311-0216-0000-5c5d589670b7`
- Pages crawled: 3500
- Pages returned: 3500
- OnPage score: 91.25
- Posted cost: $0.5250
- Crawl mode: basic HTML and internal-link analysis, sitemap respected, no JavaScript or resource-loading premium

## Reported Page Checks

| Check | Pages |
| --- | ---: |
| is_https | 3500 |
| has_html_doctype | 3498 |
| canonical | 3473 |
| has_render_blocking_resources | 3473 |
| no_image_alt | 3473 |
| no_image_title | 3473 |
| seo_friendly_url_characters_check | 3473 |
| seo_friendly_url_relative_length_check | 3473 |
| low_content_rate | 3440 |
| seo_friendly_url_dynamic_check | 3139 |
| seo_friendly_url | 3128 |
| seo_friendly_url_keywords_check | 3128 |
| from_sitemap | 3121 |
| title_too_long | 2478 |
| is_orphan_page | 1337 |
| low_character_count | 335 |
| irrelevant_meta_keywords | 93 |
| title_too_short | 92 |
| is_4xx_code | 2 |
| is_broken | 2 |
| low_readability_rate | 2 |
| large_page_size | 1 |
| no_h1_tag | 1 |

## Pages Requiring Review

| Status | URL | Checks |
| ---: | --- | --- |
| 200 | https://dollwow.com/compare | from_sitemap, is_https, has_html_doctype, canonical, no_h1_tag, has_render_blocking_resources, low_content_rate, low_character_count, no_image_alt, no_image_title, seo_friendly_url, seo_friendly_url_characters_check, seo_friendly_url_dynamic_check, seo_friendly_url_keywords_check, seo_friendly_url_relative_length_check |
| 404 | https://dollwow.com/products/sedoll-carry-150cm-g-cup-tpe-companion-doll-4lkf4 | is_4xx_code, is_broken, is_https |
| 404 | https://dollwow.com/products/starpery-freya-165cm-g-cup-silicone-companion-doll-j6lra | is_4xx_code, is_broken, is_https |

## Decision Rule

Fix issues that affect indexability, canonicals, status codes, broken internal destinations, duplicate metadata, missing metadata, or important crawl paths. Treat cosmetic thresholds as diagnostics rather than automatic rewrite instructions. Re-run focused Instant Pages checks after material fixes instead of purchasing another full crawl immediately.

## Decisions And Fixes

- The crawl reached its full 3,500-page allowance with a 91.25 OnPage score, valid SSL, working robots and sitemap files, HTTP/2, no server errors, no canonical chains, no broken canonicals, no redirect chains, no missing titles, and no missing descriptions.
- Fixed the only missing H1. `/compare` now sends its buyer-facing heading in the initial HTML instead of waiting for client storage to mount.
- Replaced two stale homepage product links with their current live product handles and added permanent redirects from the previous Carry and Freya URLs.
- Consolidated 42 brand collection aliases into the richer `/brands/...` commercial owners. Both short and `-dolls` collection handles now permanently redirect, and neither appears in the generated sitemap.
- Consolidated 15 look-tag aliases plus `/shop/customizable` and `/shop/silicone-head` into their existing canonical collection owners. Unknown collection handles now return a true not-found response instead of an empty indexable page.
- Reduced product title length at the shared metadata source by using the concise public product name. This removes redundant `Customizable Companion Doll` wording while preserving brand, model, measurements, material, and head details.
- Shortened five editorial titles that crossed 70 characters without changing their validated keyword owner or page content.
- Preserved intentionally empty alt text on decorative logos, hero video posters, and the Care 365 portrait. DataForSEO reports those as missing alt text, but exposing decorative descriptions would make the site less accessible; product and collection images already have descriptive alt text.
- Treated the 1,337 orphan warning as a crawl-cap diagnostic, not proof of 1,337 disconnected URLs. Of these, 1,263 were sitemap-discovered products with inbound links recorded by the crawler; the crawl stopped at 3,500 URLs before every paginated collection path could be processed. The structural alias cleanup removes the 59 duplicate brand/look/custom collection URLs reported in this snapshot. The remaining orphan collection URLs are valid secondary collection owners reached through navigation or filters and remain available.
- The 105 non-indexable URLs are intentional account/saved pages and collection pagination or filter views. They remain followable while canonical collection owners stay indexable.
- Broad duplicate-content counts largely reflect shared product-page interface and policy text. A separate rendered-catalog audit already identified exact product title and description duplication for controlled catalog cleanup; this crawl does not justify rewriting thousands of product records indiscriminately.

## Validation Gate

Run customer-copy audit, TypeScript, the full test suite, the production build, and focused post-deployment checks for the fixed redirects, comparison H1, sitemap consolidation, unknown collection response, and representative PDP titles. Do not purchase another full crawl immediately.
