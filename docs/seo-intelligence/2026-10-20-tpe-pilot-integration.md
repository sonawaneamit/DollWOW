# TPE label pilot: preview integration

Linear: DOL-195. Parent sprint: DOL-192. Release requires Martin's approval of the exact preview; nothing under this change authorizes a production merge.

## Expected outcome

The existing /shop/tpe page has the reviewed PILOT-TPE-01 explanation inside its below-grid How to compare section. It distinguishes a material family, an SE branded range and a supported construction option. A real anchor returns shoppers to the product grid. The existing SE guide remains the owner of body-specific support and weight tables.

No metadata, product facts, product membership, options, price, promotion, filter rules, images, schema, scheduled posts or new indexable URLs are changed. An anchor ID is added to the existing grid wrapper. The explanation renders only for the TPE collection; no separate campaign layout or landing page is introduced.

## Evidence and editorial decisions

- Accepted copy: private retained `seo-validation-2026-10-19/pilot.json` and `reviewer-round-2.json` (copy passed; integration was untested).
- Reused research: retained 19 October desktop/mobile TPE SERPs, repeatable AI observations, catalog boundary and existing guide inspection. This narrow integration does not claim a new whole-category DataForSEO/AI research run. No additional provider spend was necessary for an unchanged research decision.
- Primary factual source re-read 20 October: https://www.sedoll.com/stpe-series-introduces-a-new-custom-option-lstpe-lightweight-upgrade/ . Manufacturer describes LSTPE as an internal lightweight construction option for STPE, not a new outer material. Do not import its marketing performance claims as established cross-brand facts.
- Body-specific measurements and weight examples are deliberately omitted from the module; the current source and guide own those details. No claim that any particular current listing includes the upgrade.
- The accepted copy's return-to-collection link is refined to `#collection-products`, so it actually returns to the grid rather than reloading the same page.
- The module uses H3 beneath the existing H2, preserving the page's heading hierarchy. A definition list provides extractable labels and explanations without client JavaScript. The primary source is visibly linked.

## Baseline and acceptance

The DOL-194 baseline was captured before this change on 20 October. Fixed GSC period: 18 September–15 October 2026, final web data. No exact /shop/tpe page row returned; this is not proof of zero demand. Live page exposes 1,462 listings and 36 first-page unique product links. Those are listings, not unique models or stock quantities.

- Tests: reviewed hierarchy, source/guide/anchor links, no unsupported numerical/stock promises, TPE-only condition, below-grid placement.
- Browser QA: desktop/mobile framing, unchanged title/H1/canonical and inventory count, working return-to-grid anchor, existing brand narrowing and guide navigation; silicone page must not contain the module.
- Analytics QA isolates network telemetry. A queued GA config is not a live GA receipt. DOL-193 has independently verified broken purchase configuration and development-host contamination; fixes are gated under DOL-198. This change does not alter telemetry or manufacture a test purchase.
- Independent technical review is additional evidence, not a substitute for Dolly's review or Martin's publication approval.

Private reproducible browser receipts and screenshots: `data/exports/tpe-pilot-2026-10-20/` in the main external-drive checkout. Source documents, internal evidence and credentials are not added to customer payloads.

## Release boundary

Preview only until Martin approves. Record release SHA/time only after deployment, then perform a 24–72-hour health readback. Set the 28/56/84-day observation dates from the actual release, not the preview date. No indexing, ranking, conversion or AI-citation improvement is assumed. Keep DOL-195 in review with missing acceptance checks named rather than declaring it Done on a build alone.
