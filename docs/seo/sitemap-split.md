# Segmented sitemap operations

Scope: group existing public URLs, preserve existing visibility rules and paths, and expose segments for Search Console diagnosis. No Shopify writes, product publishing or content rewrite.

`/sitemap.xml` lists pages, collections, brand hubs, production Learn articles, product files grouped by canonical catalog brand and the unchanged image sitemap. Only nonempty children are advertised. Unknown/empty child files return 404. The image sitemap deliberately repeats the factory-photo and review page URLs to attach images; those two overlaps with the page sitemap are expected, not duplicate product entries.

The shared manifest is `lib/seo/sitemapSegments.ts`. Product input is the public Shopify Storefront catalog. Never replace it with Admin draft exports or local preview imports. On upstream errors, fail rather than emit sample products as a valid sitemap. Product data refreshes hourly; normal stale-cache behavior means publication/unpublication is not necessarily reflected immediately.

Brand mapping uses the brand field, vendor, tags and brand-text fallback, never handle prefixes. Unknown brands use products-other.xml until registered. A public product does not automatically create a brand hub; those remain controlled by the existing brand hub registry.

Lusandy has an explicit sitemap-only alias mapping because its live products predate a brand-hub entry. They belong in products-lusandy.xml, not other. This does not create a broken /brands/lusandy link or alter navigation. When a complete brand hub is introduced, move the aliases into the shared catalog registry and remove the redundant sitemap-only mapping.

## Dates

Static, collection and brand pages omit lastmod until a meaningful content timestamp exists. Learn entries use lastReviewed. Products use Shopify updatedAt, not the inventory-check metafield. Shopify updatedAt can also change for inventory or administrative updates, so it is not a precise editorial timestamp. If production checks show frequent non-content updates, omit product lastmod or introduce a dedicated significant-content timestamp in a separately approved task. Do not claim that splitting alone fixes every date-quality issue.

## Acceptance

- XML parses; correct content type, production-only URLs, index and all nonempty children accessible.
- Ordinary URL child union matches the previous sitemap set, except documented live-catalog changes. No duplicate ordinary entries. Image sitemap overlap is expected.
- Unknown/empty children return 404; test, hidden and internal products remain excluded.
- Validate listed production URLs for status, redirects, canonical and noindex. Report existing failures separately; this task does not authorize rewriting pages to hide an audit failure. The existing JSON dataset is not an HTML page and requires different canonical/indexability checks.
- Run lint, types, tests and build. Distinguish pre-existing failures from regressions.
- Preview and PR only. Owner approves merging/deploying. No new draft-brand publication.

## After approved deployment

Keep the sitemap index submitted in Search Console. Submit each nonempty child separately, including the image sitemap. For new brands, submit the newly appearing product child once; subsequent uploads flow into it automatically. Check processing status, then compare indexing by segment as Google processes the files. Inclusion does not guarantee indexing or rankings.

Sources: [Google sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap), owner-supplied DollWOW-Sitemap-Split-for-Codex.pdf. Source dates and counts must be checked again at release.
