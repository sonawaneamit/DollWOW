# DollWow Search Indexation Baseline

Reviewed: 2026-08-12

## Google Search Console

- Property: `sc-domain:dollwow.com`
- Current performance window: 3 clicks, 49 impressions, 6.1% click-through rate, and average position 12.3.
- The available chart currently contains one complete search day, August 9, 2026, so it is a launch baseline rather than a trend.
- Seven visible queries are led by Erovenus product and brand searches. `the most realistic sex doll in the world` also produced one impression.
- Thirty-four landing pages received impressions, including product pages, brand hubs, collections, guides, comparison tools, and the price guarantee.
- `https://dollwow.com/sitemap.xml` was submitted August 10, read successfully August 11, and reported 3,128 discovered pages.
- Page-indexing reporting is still processing. Core Web Vitals has no field data yet. HTTPS reports 35 valid and zero non-HTTPS URLs; Product snippets and Merchant listings each report 19 valid and zero invalid items.

## Bing Webmaster Tools

- The verified property initially had no sitemap on file and no recorded clicks or impressions.
- Submitted `https://dollwow.com/sitemap.xml` on August 12, 2026.
- Bing accepted the sitemap for processing, reported zero errors and warnings, and initially discovered approximately 2,400 URLs.
- Added a repository-owned IndexNow workflow so newly published, materially changed, redirected, or deleted DollWow URLs can be submitted after deployment.

## URL Findings

- Google surfaced an obsolete Cecilia Lynd product handle that currently returns `404`. A current equivalent product handle is unambiguous, so a permanent redirect was added from the old handle to the active canonical product.
- Google surfaced an obsolete Starpery Xue 163 cm handle that returns `404`. The current feed contains two apparently duplicate Xue 163 cm handles with matching visible facts. No redirect or canonical choice was made until the Shopify catalog identity is reviewed.
- Google surfaced the intentionally withdrawn Zelex guide. It correctly remains unavailable because DollWow has no validated public Zelex inventory. No misleading redirect was added.

## Release Decisions

- Keep Google and Bing XML sitemap reporting as the complete discovery baseline.
- Use IndexNow only for URLs changed from the integration date forward rather than resubmitting the complete catalog repeatedly.
- Request manual Google indexing for a small number of highest-value canonical pages after the technical release is live.
- Recheck Google page-indexing reasons and Bing sitemap processing after their reports finish processing.
