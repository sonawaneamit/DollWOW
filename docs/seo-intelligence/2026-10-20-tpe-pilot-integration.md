# TPE label pilot: preview integration

Linear: DOL-195. Parent sprint: DOL-192. Release requires Martin's approval of the exact preview; nothing under this change authorizes a production merge.

## Expected outcome

The existing /shop/tpe page has the reviewed PILOT-TPE-01 explanation inside its below-grid How to compare section. It distinguishes a material family, an SE branded range and a supported construction option. A real anchor returns shoppers to the product grid. The existing SE guide remains the owner of body-specific support and weight tables.

No metadata, product facts, product membership, options, price, promotion, filter rules, images, schema, scheduled posts or new indexable URLs are changed. An anchor ID is added to the existing grid wrapper. The explanation renders only for the TPE collection; no separate campaign layout or landing page is introduced.

## Mobile review revision

Martin's 20 October review and Dolly's DOL-195 comment supersede the initial placement-only scope: guide links become one horizontally scrollable row on mobile; the comparison table, ownership support, buying advice (including the TPE labels) and FAQs sit below the product grid in native, initially closed disclosures. The intro's existing Read more behavior is unchanged. The shared collection route carries this layout to the other collection-page first passes; brand hubs use a different template and must receive the same mobile acceptance check in their own first-pass tickets.

All content and all original guide links remain in the initial server-rendered HTML. Native details/summary works without JavaScript; opening a panel does not fetch its copy. Closed panels are available on desktop too. The grid, filters, metadata, inventory and schema remain unchanged.

Google explicitly permits equivalent mobile content in accordions/tabs, while warning not to load primary content only after interaction: https://developers.google.com/search/docs/crawling-indexing/mobile/mobile-sites-mobile-first-indexing . That supports this accessible layout, not a claim that all placements have identical ranking weight or that text will necessarily be indexed. A short topic introduction remains above the products; there is no established SEO requirement to put this whole supporting table and link list first.

Acceptance: at 390px width the first product starts no farther than approximately one viewport of scrolling below the header; guide links occupy one row without whole-page horizontal overflow; all eight TPE links are reachable; each disclosure opens and closes with keyboard and pointer; expanded comparison tables scroll internally; full answers/labels remain in HTML with JavaScript disabled. Apply that same product-first check during subsequent sprint page passes, rather than adding more pre-grid copy by default.

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
