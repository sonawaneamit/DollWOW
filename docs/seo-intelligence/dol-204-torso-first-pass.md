# DOL-204 Torso Collection First Pass

20 October 2026. Outcome: **no website change proposed; ready for independent review**.

## Scope And Decision

Audit `/shop/torsos` for current catalog boundaries, factual qualifications, shopping intent and buyer usefulness. Do not create pages, rewrite unsupported product specifications, publish draft brands or duplicate the 48-post schedule. Dolly independently reviews and closes; any later website change needs its own exact-version approval.

The existing torso-specific opening, buyer notes, comparison and FAQ already explain partial-body form, storage dimensions, listed weight, cleaning and drying, product-specific material and the separate hips path. Keep them rather than manufacture a rewrite. The commercial collection and linked informational guides have distinct jobs; the Tantaly link is explicitly brand-specific, not presented as a universal torso guide or a stock promise.

## Controlling Records

Strict public Storefront snapshot captured at 20:34 UTC, reused explicitly for this same-session audit: 3,521 public products; 306 torso matches under the production predicate.

| Evidence | Count |
| --- | ---: |
| Full-body overlap | 0 |
| Hips-form overlap | 0 |
| Positively identified standalone heads | 0 |
| Warehouse offers | 104 |
| TPE material filter matches | 49 |
| Full-silicone material filter matches | 232 |
| Hybrid material filter matches | 5 |
| Outside these three material-filter buckets | 20 |
| Missing numeric catalog weight | 39 |

The last two rows are catalog-data follow-ups for Dolly, not permission to invent values, drop offers or reclassify products. Classification checks do not independently reconfirm every factory specification or assess individual photographs. The existing introduction says **listed weight** and makes no universal lightweight promise. Material advice says to check the exact listing, not that one material rule covers every product.

DOL-194's retained exact-page baseline is 0 clicks / 3 impressions for 18 September-15 October; it neither establishes zero demand nor demonstrates an uplift. No new paid DataForSEO call, fresh AI visibility measurement, ranking forecast or growth attribution is claimed by this bounded first pass.

## Observable Validation

- Live SEO report: HTTP 200, one H1, self-canonical, no returned issues/recommendations. Two non-HTTP links excluded. This is one page, not sitewide or Google-indexing proof.
- Live 390px, 320px and 1440px browser checks pass: 306 items, 36 unique first-page links, no page overflow or browser exceptions.
- First product starts at approximately 701px at 390px width and 694px at 320px; mobile guide row is one horizontal row, 50px high.
- All six current guide/category targets return HTTP 200, including the separate hips collection. No new competing guide added.
- Native detail sections start collapsed below the grid; keyboard and no-JavaScript interaction work.
- Selecting **Full silicone** returns 232 torso listings, retains the collection canonical and `noindex, follow` for the faceted view. Product-form membership remains torso-only.
- Browser telemetry and write requests are blocked; the owner access header is restricted to DollWOW origins, including the no-JavaScript context.

The same-live-URL comparison in the reusable verifier is a consistency smoke test, not a before/after experiment. No website deployment is needed. This does not newly certify every pre-existing customer-service timing claim or replace the wider policy/claims review.

## Evidence And Handoff

Private receipts on the external SSD: `data/exports/dol-204-torso-2026-10-20/` in this worktree. `inventory.test.ts` reads the explicitly dated DOL-202 public snapshot and passes boundary assertions; `inventory.json`, `live-page.json`, `qa.json` and three screenshots retain full results and caveats.

Reproduce the browser run with the parameterized DOL-200 verifier: `COLLECTION_KEY=torsos`, `EXPECT_COUNT=306`, `EXPECT_FILTERED_COUNT=232`, `EXPECT_GUIDE=/learn/tantaly-buying-guide`, `EXPECT_COPY='Shop torso sex dolls by product form'`, production base, this output directory and material-filter parameters (`material`, `Material`, `Full silicone`, `silicone`). Defaults for earlier collection checks are unchanged.

Review the no-change decision in Linear. No release-health clock starts. Keep the existing weekly monitoring cadence and 17 November baseline comparison; neither should be described as impact attribution to an unchanged page. Reopen on demonstrated membership, intent, buyer-experience, policy or performance evidence.
