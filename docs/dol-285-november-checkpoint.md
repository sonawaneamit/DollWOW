# DOL-285: Full November Preview Preparation

Status: In Progress. Commercial comparison independently verified in draft PR227; full campaign/PDP/cart acceptance remains unfinished. No production change.

Verified preview: https://doll-4u1xctr8z-sonawaneamits-projects.vercel.app/review/se-november (`dpl_3JNnbRjAutyaCzEeGBG6cA8rQFwc`, runtime `4c9b2587`). Six desktop1319/mobile390 before/November/expired states passed with 78 exact sample row comparisons, three decoded original catalog images, no document overflow, noindex/nofollow and no main purchase controls. Mobile table scroll is bounded (430px table / 358px container). Production route independently showed 404. Viewport reset. This is not a live checkout or full campaign-release proof.

## Authority

- Martin's 29 October 09:14 instruction (`6d67d437-d1e6-4dab-9b6b-956f5cd81604`) covers TPE custom, Silicone Pro custom, silicone torsos and US/EU stock, not only skin colour.
- DollWOW dates are 1 November 00:00 through 30 November 23:59 store time. The 29 October Admin read independently returned `America/New_York`, not the operator's Lisbon timezone. Boundaries are `2026-11-01T04:00Z` and exclusive `2026-12-01T05:00Z`; DST changes during the month.
- Supplier artwork's 7 December end does not override Martin. No date question or supplier contact is needed.
- Reseller skin cost $100 to $50 does not establish DollWOW retail. New eye listings are a later task.

## Completed Preparation

- Preserved an immutable read-only Admin census: 498 tagged records, 395 active. Active raw facts: 388 custom, 7 ready-to-ship; 272 TPE, 122 Silicone, one generic material. These are not approved eligibility counts.
- Preserved complete raw menus and variant retail/compare-at/unit-cost facts privately. Derived exact choice facts retain missing deltas as unknown, never zero. All 395 active records have menus; 391 lack explicit body codes and four lack body identities. Existing semantic identities and reviewed supplier manifests need reconciliation, not invented body codes or blanket exclusion.
- Materialized eight original JPEGs from the approved November folder, checked byte sizes/hashes and visually inspected all desktop/mobile variants. Original bytes remain private and unchanged.
- Prepared isolated reviewed-term data and store-time boundary tests. Neither module is imported into live promotion pricing, checkout or routes.
- Added a separately flagged `/review/se-november` commercial comparison route, absent from production. It shows all four supplier offer groups, three visually reviewed original catalog-image samples, catalog versus proposed deltas, seven unchanged warehouse prices and explicit outstanding gates. It is not a working PDP configuration or a claim that the full campaign is ready for release.
- Exact current-census mapping: 272 TPE custom (268 reviewed historical handles plus the four existing Elves), 101 historically reviewed Silicone Pro custom, 14 canonical torso candidates, seven warehouse candidates and one unmatched record. Generated 2,405 exact option comparisons privately; only three samples and seven warehouse rows are exported through a public-field allowlist. The generic-material warehouse records are not approved as Silicone Pro.
- Preserved current zero deltas, unknown deltas, combined options, named/extra-head restrictions, conditional groups and body exceptions. Custom Color's observed $250 catalog delta compares to $125, not the reseller $50. No cart or charge binding consumes these quotes.
- All 395 active Admin inventory unit-cost fields are absent. This is a limitation of this census, not proof no supplier pricing exists. Original 29 October supplier email was independently read and corroborates the full terms, but contains no complete landed-cost matrix. Reconcile existing authorized supplier cost/freight evidence next; do not declare margins passed.
- 48 focused/new and existing SE preview tests pass, full TSC/scoped lint pass, configured local build and both 4,950-owned-asset gates pass. Initial shared-node_modules symlink was rejected by Turbopack; replaced only this worktree's link with isolated `npm ci`, no lockfile changes. Local Homebrew Node22 cannot start because of a missing simdjson dylib; no system fix was attempted. Local build used Node26 with env loaded in the parent before spawning Next; remote deployment uses the configured Node22 runtime. No unsupported local-runtime claim.

## Artwork Decisions

- Hold the torso desktop/mobile originals: school-uniform presentation (tie and pleated skirt). This is a narrow artwork hold, not a torso-product or campaign hold. Keep private evidence and use an independently reviewed suitable existing product photo or text treatment instead; do not request a waiver.
- Every original carries the supplier's 7 December date. None is customer-ready with that uncorrected claim. Do not silently adopt it or edit explicit imagery. A separate factual presentation can use approved November dates and suitable unchanged assets.
- Stock originals also advertise global 3-7-day delivery. That claim is not independently verified and must not become a DollWOW promise.

## Next Checkpoint

### 29 October Source-Cost Follow-Up

- Retrieved the approved original TPE factory workbook (`1Z8tzvr1pZcplmoc9b6-dZQSsndTnWTLu`), 2,670,080 bytes, SHA256 `6e305365b02796da6330427238fc80ec7f3d34dace50aa5321ca3f69e4a69283`. `scripts/read-se-november-costs.py` reads BIFF using pinned xlrd2.0.2 in `/tmp/dol285-xls-reader`; bundled reader packages lacked BIFF support. Bundled dependencies and the workbook were not modified. Exact referenced cells and qualification are saved in `tpe-cost-evidence-private.json`, not a public/client fixture.
- The custom-skin-only proposal yields 60% contribution before incremental freight, fees and taxes, using observed catalog250/proposal125 and supplier-confirmed reseller50. This is not whole-order landed margin, net profit or a November MAP clearance. The factory quotation's generic height-level unit costs do not establish an exact construction match; A76 explicitly calls freight reference-only.
- Supplier US/EU stock sheets are accessible and currently still headed October. Do not apply November percentages again to existing discounted columns or treat these as fresh November prices. EU bounded reads `A3:H300,J3:Q300` returned only populated rows; six relevant candidate rows are preserved with formulas/values privately. Annika.F has separate regular/textured rows and quantities. Targeted Admin read of seven existing warehouse IDs confirms the two114cm US listings are torsos via their original source URLs/titles. No stock/price/publication writes.
- Supplier-authorized Silicone Pro and torso folders from the July approval email return authenticated connector404. One NEEDS MARTIN question is posted in comment `ef233704-7c68-4929-9042-2475c146cb0b`: accessible current wholesale/option quotation copies in internal Drive. Wait for a new answer/access before unchanged retries; do not contact the supplier or repeat the question. This blocks remaining cost verification, not all safe internal preparation.
- Exact four Elf Product IDs plus body codes now replace suffix matching in the read-only preparation script. Comparison output and public fixture remain unchanged. Additional internal LSTPE comparison rejects153A, unverified choices, regular TPE, unknown head material, silicone Red/Black, already discounted amounts and combined head prices. It quotes100 to90 only for157H/161F/163E with STPE and existing Light Tan-only silicone compatibility. It is not wired into public PDPs/cart or the hosted comparison.
- Latest local focused suite:59 tests/5files, fullTSC and scopedlint pass. The previously pushed docs0cfa5edd CI is independently green; new follow-up commit CI must be checked separately. No new manual deployment is needed for unchanged hosted comparison.

1. Reconcile exact full-body, torso, hybrid and stock identities with reviewed manifests; distinguish Silicone Pro and STPE evidence from generic material labels.
2. Map exact option/group IDs and compatibility, paid/zero/unknown deltas, extra-head limitations and body exceptions. Show current versus proposed without granting unsupported entitlements.
3. Audit available supplier option costs, freight and base margins privately. Inventory unit cost alone is not landed or net profit proof; missing costs remain qualified.
4. Build private noindex, disabled-checkout review across all four cohorts, with date-correct suitable assets; verify desktop/mobile, boundary states and totals before reporting ready.
5. Post exact review link and evidence for Dolly, then Martin's explicit preview approval before release. No automatic stock repricing, discount writes, production flags or release approval is inferred.

The existing October SE end is a separate historical boundary. Do not change it to hide a gap when adding November's explicitly approved store-time schedule. Paid DOL-306 remains paused behind this queue.

Private artifacts: `data/exports/dol-285-2026-10-29/`; do not publish raw costs, source dumps or held artwork. No Shopify mutations, supplier emails, orders or generation calls have occurred.
