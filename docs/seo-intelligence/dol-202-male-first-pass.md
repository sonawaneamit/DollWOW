# DOL-202 Male-Bodied Collection First Pass

20 October 2026. Outcome: **no website change proposed; ready for independent review**.

## Scope

Audit the existing `/shop/male-dolls` commercial collection, its factual boundaries, public inventory, intent ownership and buyer usefulness. Preserve existing products, filters, metadata, prices, unpublished brands and the 48-post schedule. Dolly reviews and closes the ticket. This audit does not authorize publishing or settings changes.

## Evidence And Decision

Strict read-only Storefront capture at 20:34 UTC: 3,521 public products. The existing male-bodied predicate matches 44 listings:

| Classification | Listings |
| --- | ---: |
| Full body | 42 |
| Torso | 2 |
| TPE | 12 |
| Full silicone | 26 |
| Hybrid | 4 |
| Current warehouse offers | 0 |

No matched listing has a conflicting female body classification/tag, positively identified standalone-head type, or missing listed weight. These are checks of current catalog records, not independent factory reconfirmation of all specifications or photographic age/identity review.

The existing opening already distinguishes full-body and compact products, qualifies anatomy and supported options by exact build, and accurately describes made-to-order status. Buyer notes advise comparing forms before weight or price. Existing disclosures preserve access to detailed information without delaying the grid.

The page owns **shopping for male-bodied dolls**, not every doll purchased by men. Its existing linked `/learn/male-sex-doll-buying-guide` owns informational guidance. No new overlapping "for men" landing page, generic rewrite or added article is warranted by this first-pass evidence. The retained DOL-194 GSC baseline is 0 clicks / 15 impressions for this URL, 18 September-15 October; that is not zero demand or a growth forecast. No new paid keyword/AI research or fresh AI-visibility result is claimed.

## Observable Checks

- Fresh live audit: HTTP 200, one H1, self-canonical, no returned issues or recommendations. Two non-HTTP links were excluded from link evidence. One raw response took 15.6 seconds: a latency observation, not a measured Core Web Vitals diagnosis or reason to rewrite copy.
- Live 390px, 320px and 1440px browser checks: no page overflow or browser exceptions; 44 items and 36 unique first-page links. Mobile guide row remains a single 50px-high scrolling row.
- First product begins at approximately 701px at 390px viewport width, 694px at 320px and 677px on desktop.
- All eight guide links return HTTP 200, including the male buying guide, material comparison, ordering comparison and cleaning guidance.
- All three detail sections are collapsed by default and follow the product grid. Keyboard and no-JavaScript disclosure checks pass.
- Selecting torso form returns exactly two products; the filtered page retains the collection canonical and `noindex, follow` behavior.
- Automated browser checks block analytics, third-party telemetry and write requests. The owner-authorized access header is limited to DollWOW origins, including no-JavaScript sessions.

The browser comparison against the same live URL is a consistency smoke test, not evidence of an experimental uplift or a before/after change. There is no new website build to approve, and no deployment is needed for this no-change decision.

## Reproduction And Handoff

Private evidence on the external SSD in this worktree: `data/exports/dol-202-male-2026-10-20/`.

- `inventory.test.ts`: opt-in `DOL202_READONLY=1` current public-catalog extraction. Writes only local evidence, not Shopify.
- `inventory.json` / `catalog-snapshot.json`: full membership counts and controlling source records.
- `live-page.json`: complete SEO audit, warnings and fetch diagnostics.
- `qa.json`, `preview-390.png`, `preview-320.png`, `preview-1440.png`: actual production browser receipts; despite screenshot filenames, these are live-site checks, not a new preview.
- Reusable browser verifier: `data/exports/dol-200-silicone-2026-10-20/verify.mjs`, parameterized with `COLLECTION_KEY=male-dolls`, `EXPECT_COUNT=44`, `EXPECT_FILTERED_COUNT=2`, `EXPECT_GUIDE=/learn/male-sex-doll-buying-guide`, `EXPECT_COPY='Shop adult male sex dolls'`, production base and the DOL-202 output directory.

Review the no-change outcome in Linear rather than manufacturing an edit to show activity. No release health clock starts because nothing changed. Retain this URL in the existing weekly observation cadence; a 17 November baseline comparison can inform the broader sprint review, but is not an attribution test of this unchanged page. Reopen for demonstrated inventory, performance, intent or buyer-experience defects.
