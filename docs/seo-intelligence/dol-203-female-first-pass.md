# DOL-203 Female-Bodied Collection First Pass

20 October 2026. Status: tested change for independent review, not approved for release.

## Exact Change

Only `/shop/female-dolls` gets three explicit copy values in the existing collection SEO configuration:

- Title: `Female Sex Dolls for Sale`, replacing generic `Female dolls`.
- A compact introduction identifies full-body, torso and hips forms, advises form-first comparison, and qualifies measurements/options by exact model.
- A complete matching meta description replaces the generic generated description, whose live ending was the fragment `Use filters to.`.

No H1, membership, order, prices, product data, filters, canonical, robots, guide links, layout, scheduled articles or unpublished brands change. No new landing page or scientific/material-performance claim is introduced. Martin must approve the exact hosted version after Dolly's independent review.

## Controlling Evidence

Same-session strict public catalog retained at 20:34 UTC: 3,521 listings. Applying the production female-bodied predicate yields 3,066 listings: 2,778 full-body, 252 torsos and 36 hips; 184 warehouse offers. No conflicting male classification or positively identified standalone heads in that matched set. 106 records lack listed weight; copy says **listed weight**, does not invent it, and these are a separate catalog-data follow-up for Dolly. This is catalog classification evidence, not new factory reconfirmation of every SKU or a photographic safety review.

The page owns female-bodied shopping intent. The three existing links to general buying, material comparison and discreet shipping guides retain informational ownership; no overlapping new article or "for men" page is created. DOL-194's retained 18 September-15 October baseline is 1 click / 9 impressions on this exact URL, not a demand estimate or growth forecast. This first pass uses current catalog and HTML facts; it does not claim new paid DataForSEO/AI visibility observations.

The live page audit returned HTTP 200, one H1, self-canonical and no reported issues/recommendations. Its actual title, description and opening still established the above copy gap. Two non-HTTP links were excluded; one page audit cannot prove sitewide quality or Google's indexing state.

## Verification

19 focused collection/compact-disclosure/inventory checks pass. Scoped lint and production webpack build pass, including 4,950 owned assets with zero failures. Full suite: 2,493 passed, the same 11 existing assertion failures and two existing node:test/Vitest collection errors; not fully green. Local audit files from other branches are opt-in so they cannot contaminate this branch's source checks.

Production-build browser checks at 390px, 320px and 1440px: 3,066 items and 36 unique first-page links; first-page product links/prices match live. First product starts around 701px on 390px mobile. Guide row is 50px high, one horizontal row on mobile; all three guide URLs return 200. All three detail sections start collapsed below the grid. The 252-item torso filter preserves the canonical and `noindex, follow`. Keyboard/no-JavaScript checks pass; no overflow or browser exceptions.

| Local audit observation | Disposition | Verification |
| --- | --- | --- |
| Initial longer draft title exceeded the report's estimated width reference | Changed: use the concise commercial title | Recheck exact final title in local/hosted HTML; width is an estimator, not a Google limit |
| Localhost final URL differs from production canonical | No change: intentional preview canonical | Canonical stays `https://dollwow.com/shop/female-dolls`; do not make localhost indexable |
| Non-HTTP link exclusions | Retained limitation | No HTTP error is inferred from excluded links |

## Receipts And Review

Private evidence: `data/exports/dol-203-female-2026-10-20/` on the external SSD, not committed/public. `inventory.test.ts` reads the explicitly dated DOL-202 same-session snapshot; it does not silently imply a newer factory verification. `live-page.json` and `preview-page.json` retain complete report fields and caveats. `qa.json`, screenshots, `build.log` and `suite.json` retain the verification receipts. The parameterized DOL-200 browser verifier uses `COLLECTION_KEY=female-dolls`, count 3066, torso count 252 and expected guide `/learn/best-sex-dolls`.

Next: Dolly reviews the exact PR/hosted version, Martin decides release, then live readback and a 24-72h health check. Set the 28-day observation date only when actually released. No current ranking or sales impact is claimed.
