# DOL-201 TPE Collection First Pass

Date: 20 October 2026. Status: preview for Dolly review and Martin approval; not released.

## Audit And Decision

The existing `/shop/tpe` commercial owner remains appropriate. DOL-194 returned no exact-page GSC row for it in the fixed 18 September-15 October window; that is not zero search demand. The separate informational guide `/learn/best-tpe-sex-dolls` returned 4 clicks / 69 impressions and remains its own intent owner.

Fresh read-only Storefront capture at 19:59 UTC: 3,521 public listings, of which 1,462 match the existing full-body TPE collection. Production rules return no hybrid or partial-body matches within that default result; no matched record has a conflicting non-TPE material metafield. These are current catalog checks, not independent factory certification or warehouse-unit counts.

23 matching listings lack a usable catalog weight. Preserve the existing "listed weight" qualifications and do not invent numbers or modify product data here. Dolly owns routing that data gap to the appropriate catalog-data follow-up; private inventory evidence is retained.

Live HTTP audit: 200, one H1, self-canonical and no returned issues/recommendations. Existing intro, formulation qualifications, buying notes, FAQ and below-grid pilot remain suitable for this first pass. Do not rewrite or duplicate PILOT-TPE-01, alter supported LSTPE body claims, or duplicate scheduled posts.

One narrowly established navigation gap: the live page has no link to the existing TPE buying-guide owner. **Only change:** add `/learn/best-tpe-sex-dolls` to the already-horizontal related-guides row. No new page, copy claim, product/filter change, price, publication state, canonical, metadata title/description, promotion or tracking change.

## QA Receipts

- 17 focused collection SEO/disclosure assertions pass; read-only current-inventory and retained-snapshot filter checks also pass.
- Typecheck/scoped lint and production webpack build pass. Local ignored version-specific audit imports are isolated from other branches; no production compiler settings were relaxed.
- Owned assets: 4,950 checked, zero failures.
- Full suite: 2,485 passed / the same 11 pre-existing failing assertions and two existing node:test/Vitest collection errors. Not fully green.
- 390/320/1440px browser checks: no full-page overflow; nine guide links in a 50px mobile horizontal row; supporting disclosures remain closed below the grid.
- First product at about 701px on 390px, 694px on 320px and 677px on desktop. First 36 rendered product links and prices match live; total count remains 1,462.
- Actual product-form selection returns 49 TPE torso listings, with collection canonical and `noindex, follow`; initial default full-body boundary is unchanged.
- All nine guide URLs return 200. Complete intro/pilot/disclosure text is retained without JavaScript; keyboard disclosure interaction passes.
- Source diff confirms no change to the pilot component, shared disclosure component or filters.
- Analytics are blocked during QA; the owner request header is restricted to DollWOW origins and stripped from third-party requests.

Private reproducible evidence: `data/exports/dol-201-tpe-2026-10-20/` (`inventory.test.ts`, catalog snapshot, inventory/filter counts, live-page audit, QA JSON/screenshots and logs). Browser runner: `data/exports/dol-200-silicone-2026-10-20/verify.mjs`, parameterized with `COLLECTION_KEY=tpe`, count 1462, filtered count 49, guide `/learn/best-tpe-sex-dolls`, expected intro `Shop full-body TPE sex dolls`, and the TPE output directory. DOL-200's original receipts remain separate.

## Research And Release Boundary

Retained 19 October TPE SERP/AI observations and the 20 October SE primary-source review remain documented in `2026-10-20-tpe-pilot-integration.md`. This one existing-guide link introduces no new intent or factory/material claim and does not require duplicating the approved research. No fresh paid API run or AI visibility result is claimed.

Dolly independently reviews the exact preview; Martin must approve the exact commit before merge. After approval, record live readback, 24-72-hour health-check timing and the exact 28-day GSC review date on DOL-201. No automation or growth claim is included.
