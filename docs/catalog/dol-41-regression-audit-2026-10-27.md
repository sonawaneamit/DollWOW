# DOL-41 Read-Only Regression Audit

Captured 27 October 2026. Reviewer: Dolly. Source baseline: origin/main c21957c9.
This is the ticket's requested sizing/regression step, not a new migration or
catalog-wide completion receipt. No application code, assets, Shopify records,
settings, prices, carts, orders or publication states were changed.

## Finding

The September symptom was not reproduced on the three named product families in
this sample. Raw Shopify option metadata still contains Rosemary source URLs;
the current storefront remaps them to owned paths or intentional text choices.
Counting retained source strings alone would incorrectly describe this as a live
hotlink regression. Raw metadata migration was explicitly not part of the
October repair; provenance retention is not itself a shopper image request.

## Current Metadata Sample

A read-only Shopify Admin query for `handle:*flora* OR handle:*evie* OR
handle:*annika*` returned 55 candidates with hasNextPage=false. Narrowing to
Irontech Flora/Evie and SE Annika prefixes yielded 37 records: 27 ACTIVE and
10 DRAFT. This completes that name query, not the store inventory. An initial
title-only query returned no matches and was not treated as absence evidence.

Across these 37 raw records, counting image-choice occurrences rather than
unique images:

| Measure | Count |
| --- | ---: |
| Image-swatch occurrences | 7,209 |
| Rosemary URL occurrences | 7,117 |
| Resolvable owned images | 6,925 |
| Explicit manifest text-only omissions | 284 |
| Unmapped image references | 0 |

The existing `ownedOptionGroups` transformation was applied locally to the
snapshot. Assertions verified 7,448 choices retain non-image fields, including
IDs, labels, prices and rules; group fields and choice counts remain unchanged,
and the input remains byte-equivalent after transformation. This is not checkout
or compatibility certification. Shopify was queried, never mutated.

## Production DOM Sample

Production pages inspected through the browser:

- https://dollwow.com/products/irontech-flora-161cm-g-cup-hybrid-companion-doll-14dpc
- https://dollwow.com/products/irontech-evie-161cm-f-cup-silicone-t4-ros-max-companion-doll-mpyhd
- https://dollwow.com/products/sedoll-annika-163cm-e-cup-tpe-companion-doll-1eowu

At 1,319px and 390px, opened appearance disclosures without changing choices:
Flora and Evie head/skin/hairstyle/eye/nail panels, and Annika's available
head/skin panels. Evie and Annika required the existing `customize step-by-step`
link before their manual controls were visible; a hidden-control attempt was
discarded and repeated only after opening that disclosure.

24 panel states contain 752 option-image DOM occurrences, 302 distinct normalized
image URLs, zero Rosemary image URLs and zero unowned image URLs. The classifier
unwraps Next image-optimizer URLs and removes only the observed framework-added
`dpl` stamp on exact first-party paths. The application's stricter input validator
was not weakened to accept query-bearing asset inputs.

These are DOM `img` source/current-source checks, not complete network tracing,
CSS-image inspection, response-status capture, visual identity review or a test
of every conditional choice. Lazy images are not all asserted loaded. No carts,
checkout, purchase or DollVue generation was exercised. Annika's current manual
menu did not expose the other three appearance panels; they were not invented
or counted as tested.

## Local Gates

- `node scripts/check-option-assets.mjs`: 4,950 assets, zero failures.
- `vitest run tests/ownedOptionAssets.test.mjs`: four tests pass.
- The same asset gate scanning the retained DOL-246 `.next/static` build passes.
  That is a preview-build scan, not a fresh production bundle download or a new
  full build for this audit. Its manifest, asset resolver and customization config
  hashes match this baseline exactly; hashes are retained in the private receipt.
- No new app implementation means no deployment or new preview server is needed.

## Review And Approval Boundary

Recommend retaining the existing remapping while Dolly decides whether the old
ticket needs a broader full-catalog regression scope or can be accepted on the
agreed sample. This report does not clear the seven historically excluded draft
source references documented in the October audit, nor prove their present state
outside this sample. Do not reupload all assets or rewrite raw metadata merely
because source strings remain stored.

The ticket's top-level Done/out-of-scope/due fields and the 21 October scope
question remain unanswered. Whole-ticket completion is therefore blocked on
Dolly's acceptance scope; this evidence-only step is delivered for review. A
future metadata migration, if requested, needs an exact backed-up per-field
manifest, preflight, rollback plan and a separate explicit Martin approval on the
ticket before writes. No such write approval is requested or inferred here.

Private receipts in `data/exports/dol-41-2026-10-27/`: admin-candidates.json,
mapping-summary.json, browser-dom.json and summary.json. Raw Admin data is not
committed. No source-host image downloading, paid vendor calls or supplier/TDF
contact was performed. Linear agent-context lookup returned tool-not-found;
repository instructions and the existing repair implementation were read directly.
