# Sitemap split verification - October 7, 2026

PR: https://github.com/sonawaneamit/DollWOW/pull/100

Scope remains preview-only. No Shopify writes, product publication, production deployment or GSC submission.

## Results

- Local production build and typecheck pass. Changed-file lint passes.
- 33 focused tests pass, including Lusandy aliases, exact IDs/brand grouping, excluded items, duplicate prevention, production host, dates, XML limits, unknown/empty routes and upstream failure handling.
- 3,281 ordinary sitemap URLs retained exactly: zero additions, zero removals, zero duplicates.
- 28 child files including the image sitemap: 23 product segments, pages (30), collections (37), brand hubs (22), Learn (50), images (2 page entries). Products total 3,142.
- Lusandy's 45 products now belong in products-lusandy.xml. No products-other.xml is emitted when empty. No brand hub or navigation link is created by this correction.
- Initial hosted release candidate: all 28 children parse with xmllint, return XML/200, and contain production URLs; robots unchanged and unknown route returns 404. Final hosted candidate with Lusandy mapping requires the final readback recorded in the PR.
- 115 production product spot-checks (five per segment) matched their page's Product structured-data brand. The Lusandy group was initially named other; all 45 URLs are preserved in the explicit Lusandy segment in the final local comparison.
- Full production crawl: all 3,281 URLs returned 200, no redirects or detected noindex. The JSON dataset is intentionally not subjected to HTML canonical-tag checks.
- One initial product canonical miss (SE Melody D) passed on repeat fetch. Eighteen existing static pages still lack explicit canonicals; listed below. No page metadata changed in this PR.

An initial audit-script check incorrectly rejected the existing homepage URL without a trailing slash. Corrected the checker to compare URL origins; the exact existing homepage URL is preserved. This was a validation false positive, not an XML or site-host defect.

## Existing failures, not hidden by this PR

- Full suite before the final Lusandy test: 981 passed, 13 skipped, one failure in tests/fanrealSeptemberPromotion.test.ts expecting old sitewide discount wording. Final focused suite includes the additional passing Lusandy test.
- Global lint: 32 errors and 18 warnings in existing code/tests. Touched files pass independently.
- The following existing pages return 200 but lack explicit canonical tags: `/`, `/adult-only`, `/authorized-vendors`, `/best-price-guarantee`, `/buyer-protection`, `/care-for-life`, `/how-ordering-works`, `/faq`, `/help-me-choose`, `/price-match`, `/privacy-policy`, `/returns`, `/scam-alert`, `/shipping-protection`, `/shipping`, `/supplier`, `/why-dollwow`, `/customize`.

Accordingly, the PDF's full-repository-green and every-page-canonical criteria are not fully satisfied. Do not present this as an unconditional all-green release. Keep these separate from sitemap grouping and request owner approval before merging.

## Evidence retained locally

`data/exports/sitemap-split/verification.json`: final local XML/URL-set comparison.
`data/exports/sitemap-split/production-crawl.json`: full initial production crawl.
`data/exports/sitemap-split/canonical-rechecks.json`: repeat checks for all initial canonical misses.
`data/exports/sitemap-split/brand-spot-checks.json`: 115 brand checks.
`data/exports/sitemap-split/hosted/`: initial hosted XML and headers. See PR for final hosted readback.

These are ignored local evidence artifacts. This committed summary is the durable handoff; raw files contain only public-page evidence and should be retained until release review.
