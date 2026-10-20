# DOL-206 Irontech Hub First Pass

20 October 2026. Status: tested preview for independent review; not released.

## Exact Outcome

Irontech alone opts into the existing compact collection browsing pattern. Its guide links scroll as one mobile row. The unchanged comparison, buyer notes, FAQ and full seller authorization appear below the grid in native collapsed disclosures. A visible authorization jump link remains above the products. The certificate is retained, opens normally and its image renders. A scoped width constraint fixes 320px product-card overflow without changing other brand pages or shared card typography.

All other brand hubs retain their existing section markup and positions. A small shared section wrapper reuses the established `CollectionDisclosure` for the opt-in hub and reproduces the prior section headers for legacy hubs. No products, ordering, prices, options, metadata, canonical, structured data, publication, promotions or homepage changes are included.

## Evidence And Intent

Current strict public catalog captured 21:36 UTC: 449 Irontech matches, all classified full-body; 81 TPE, 208 full silicone, 158 hybrid, two outside those material buckets. One warehouse offer, 29 male-bodied matches and 11 missing numeric weights. No missing values are invented or products silently reclassified. This is catalog membership evidence, not independent recertification of every SKU.

[Irontech's official company page](https://www.irontechdoll.com/about-us/) corroborates its 2015 founding. Current catalog data supports the material and male/female shopping paths. No factory prose, sales superlatives or new compatibility claim was copied. Existing option qualifications stay model-specific; this bounded pass does not newly validate every option family or service-timing promise.

The hub owns commercial Irontech browsing; its linked buying guide retains informational intent. Retained DOL-194 exact-page baseline is 3 clicks / 17 impressions, 18 September-15 October, not a brand-wide total or causal finding. No new paid keyword/AI observations or ranking/sales effect is claimed.

## Before And After

| Observed check | Live baseline | Tested preview |
| --- | ---: | ---: |
| First product, 390px width | 1,966px | 640px |
| First product, 320px width | 2,007px | 653px |
| First product, 1440px width | 1,274px | 540px |
| Guide row height, mobile | 288px | 50px |
| Page width at 320px | narrow card overflow found during QA | 320px, no overflow |

These are layout measurements, not a speed, conversion or SEO uplift experiment. Desktop also prioritizes browsing; all supporting facts remain in server-rendered HTML and native disclosures.

## Verification

- 17 focused brand/section/disclosure/inventory tests pass, plus typecheck, scoped lint and final production webpack build. Owned-asset gate: 4,950 checked, zero failures.
- Full suite: 2,499 passed, the same 11 existing assertion failures and two existing node:test/Vitest collection errors. Not an all-green result.
- Live baseline versus local preview: exact first 36 product URLs/prices, title, H1, canonical, six guide targets and complete JSON-LD match at 390/320/1440px. No product or schema count change.
- Four native disclosures start closed below the grid. Keyboard interaction, authorization jump link, full certificate link/image and no-JavaScript disclosure work. Guide targets and certificate return HTTP 200; no browser exceptions.
- Full-silicone filter remains functional with unchanged brand canonical. Existing brand-facet robots policy is not changed by this layout task.
- Screenshot capture waits for an actual product image to render; 320px and 390px screenshots visually inspected. Telemetry and write requests are blocked; the owner header is restricted to DollWOW origins.
- Local SEO rerun preserves all metadata. The only returned finding is intentional localhost/production canonical mismatch: no change, because previews must retain the production canonical. Three non-HTTP links excluded locally versus two in the live raw report; exclusions are not claimed as HTTP failures.

## Receipts And Gate

Private external-SSD evidence: `data/exports/dol-206-irontech-2026-10-20/` in this worktree. `inventory.json` explicitly names the DOL-205 capture time. `live-page.json`, `preview-page.json`, `baseline-browser.json`, `qa.json`, screenshots, `build.log` and `suite.json` retain raw observations and limitations. `probe.mjs` captures the live baseline; `verify.mjs` compares the preview without writes or analytics. Default local preview: `http://localhost:3246/brands/irontech-dolls`.

Dolly independently reviews the exact hosted PR; Martin must approve that version before release. Then perform live readback, set a 24-72h health window and a 28-day observation date. No new automation is activated. Remaining 11 weights and two material classifications belong to the catalog-data follow-up, not this layout patch.
