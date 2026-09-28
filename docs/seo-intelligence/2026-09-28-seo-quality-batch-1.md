# SEO Quality Batch 1 - September 28, 2026

Status: first metadata/canonical commit hosted-preview verified; follow-up guide and customization-copy changes locally verified. Not deployed to production or globally SEO/GEO release-validated.

## Scope

Based on the September 28 authenticated GSC/Vercel/DataForSEO audit and five recent-upload samples. The audit and raw evidence remain in the original workspace under `data/exports/seo-intelligence/2026-09-28/` (ignored local artifacts).

Changes are based on current `origin/main` at `3ecb5e4`, in an isolated checkout. The older original workspace contains unrelated changes and was not used as a release base.

- Support query variants declare `https://dollwow.com/support` as canonical without removing the product context supplied to the support form.
- Shared title handling removes repeated trailing DollWow suffixes before Next's existing title template applies. Other brand/look names remain unchanged.
- Generated descriptions select complete sentences instead of cutting at a character boundary. Existing incomplete imported tails are removed from storefront metadata and its matching Product description. Complete authored storefront descriptions are preserved.
- Generated product descriptions avoid the old `silicone head female body` sentence construction. An explicit hybrid product title can supply the Hybrid label without inventing the body material.
- Recognize both `silicone-head` and `silicone head` as head construction, rather than classifying the former as full silicone.
- Round generated description weight to one decimal place without changing source measurements. Unknown ordering status is not labeled made-to-order by default.
- Apply the shared sentence/title helpers to the documented Rosemary preparation and Shopify create/update import paths. This does not prove every external uploader uses them.

The follow-up adds a collapsed chapter list and four tracked shopping links after the buying guide's complete quick answer. Article text, sources and publication dates are unchanged. The shared Markdown insertion supports placement after an entire section while preserving existing immediate-after-heading behavior.

For custom-order products without confirmed customization availability, shared visible copy and schema now ask customers to confirm available choices instead of calling them fixed warehouse builds. Elena's Shopify record was read-only checked: `custom_available=false`, `stock_status=custom`, and no product-specific groups. The Rosretty fallback menu does not prove supplier compatibility; disabled/unverified options remain disabled. The underlying capability still requires confirmation.

No Shopify writes, price changes, preset changes, checkout changes, global layout redesign or production deployment.

## Verification

- Follow-up full test suite: 99 files passed, 1 skipped; 681 tests passed, 2 skipped.
- TypeScript check passed.
- Targeted tests cover title suffixes, authored descriptions, old truncated descriptions, decimals, long sentences, hybrid builds, unknown status, RTS and schema-description parity.
- Local Next server with current catalog reads returned the support canonical for a product-report query URL.
- Local server-rendered Lili page: one DollWow title suffix; `Hybrid`; `93.7 lb`; complete description; correct product canonical.
- Local Lexi and Vera pages: one suffix; authored descriptions preserved; correct canonicals.
- Local Elena: one suffix; incomplete `This model is ava` tail removed; correct canonical.
- Local Fanreal Carlee RTS: warehouse/fixed-configuration description retained; correct canonical. Read-only RTS verification does not change Fanreal's preset processing scope.

- Authenticated Brave hosted-preview checks of commit `6b9f5ac`: support canonical and retained report context passed; Lexi's single title suffix, complete authored description and canonical passed.
- Follow-up local Brave checks: guide's 33 chapters start collapsed and expand; shopping links follow the complete quick answer; mobile 390px viewport has no horizontal overflow and four 44px-high link targets. Temporary viewport override reset.
- Guide chooser link opened the expected destination and emitted `guide_shopping_click`. This proves local event emission, not production reporting or attribution.
- Tests cover insertion before the next section and at end of document, plus customization FAQ/schema parity without mutating product flags.

These checks do not assert that Google has recrawled or indexed a changed release. No live checkout test was needed because checkout was not edited.

## Still Pending

1. Hosted release-candidate verification and production release decision. Recheck support canonical and sampled PDP metadata after any deployment.
2. Elena's presentation mismatch is reconciled conservatively. Actual supplier customization compatibility remains unconfirmed; do not turn on unverified paid options.
3. Expand recent-upload inventory QA beyond the sample. New batches still require factual, image, collection/filter, price and option compatibility checks; metadata generation is not that complete gate.
4. Buying-guide navigation/measurement changes are locally complete, pending hosted verification. Moonvale entity/model differentiation and evidence-backed collection/guide refreshes remain follow-up batches.

## Research Boundary

This batch repairs metadata formatting and canonical plumbing, using the existing audit's first-party and live-page evidence. It makes no new manufacturer, warranty, availability or ranking claims. It is not a substitute for page-specific AI/GEO research and primary-source validation when materially rewriting indexable content. Keep those refreshes in the protocol's pending state until their relevant evidence gates pass.

## New Upload Checklist Addition

For each incoming batch, inspect the rendered output, not only the populated Shopify SEO fields:

1. Exactly one final DollWow suffix; preserve the model/look distinction.
2. Complete descriptive text; no truncated words, raw conversion decimals or ambiguous body/head material claims.
3. One correct product canonical and intentional indexability.
4. Visible product facts and structured data agree with the reviewed source record.
5. Correct collection/filter tags, authorized images/alt text and applicable preset/menu assignment.
6. Valid price, availability and RTS/custom behavior; metadata must not imply unsupported options.

This is a batch QA requirement, not a request to write a separate article or repeat brand-wide research for every SKU.
