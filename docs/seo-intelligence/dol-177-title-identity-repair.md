# DOL-177 Product Identity Repair

Date: 21 October 2026. Status: partial repair for review, not release-ready and not a zero-duplicate result.

## 22 October Approved Gallery Subset

Martin approved Dolly's 07:22 UTC labels for preview only at 07:40 UTC
(Linear comment `b9ae053b-aa1c-4760-96cb-9759a52b5ccd`). Applied 42 exact
records: 40 new gallery labels and two revised FunWest labels. Each uses the
existing product ID, handle and current image fingerprint guard. No helper,
photo, price, option, canonical, Shopify data or publication state changed.
The labels describe galleries, not included clothing. All 15 explicitly
flagged records are excluded and retain their exact previous identities.

Fresh strict catalog model: 3,521 public records, 73 complete-record controls.
Actual modeled title/H1 collisions are eight groups / 16 listings raw, or
four groups / eight listings after the four approved canonical aliases.
The remaining groups contain only flagged records: FunWest Giselle, SE Hinata,
two Piper Akira D records, and WM Matt Billy. No hold is cleared because another
member of a group now has a unique title. Zero-duplicate acceptance remains false.

Verification: 58 focused assertions; a separate whole-manifest comparison proving
only the 42 approved identities changed and all 15 flagged identities stayed
exact; typecheck; scoped lint; optimized webpack build; both 4,950-asset gates.
Rendered HTTP checks pass on all 42 approved pages, 15 untouched flagged controls
and three earlier identity controls (60 pages total), including title, one H1,
canonical, Open Graph URL and Product/Offer URLs. Nine heading-only browser checks
at 320/390/1440 pixels pass; product images and external requests are blocked in
those layout tests. All 326 private fingerprints are absent from 115 public JS
chunks. The only tracked runtime change is the server-only gallery registry.

This is a fresh whole-catalog model plus complete affected-page HTTP coverage,
not a newly repeated 3,521-page HTTP crawl. The earlier complete HTTP receipt is
retained under its original build signature. Private current receipts are
`dolly-decisions-2026-10-22.json`, `approved-current-2026-10-22.json`,
`approved-staged-model-2026-10-22.json`, `approved-decision-qa-2026-10-22.test.ts`,
`approved-http-qa-2026-10-22.json` and `approved-browser-qa-2026-10-22.json`.
The exact new hosted URL and its separate readback belong on DOL-177 after the
deployment completes. PR143 remains draft, pending the remaining flagged-record
decisions and Martin's later release approval. Do not act on DOL-139 separately.

## 22 October Decision Reconciliation

Dolly's 21 October 22:53 UTC comment supplies 23 approved identities. All 23
remaining collision groups are mapped to that comment's approved, unsure or held
inventory; none is uncovered. The live-store and preview baselines differ because
the preview already separates some head codes and named finishes.

Staged those 23 exact records: 19 gallery-only labels and four explicit identity
titles (two Avant finishes and the two named SE warehouse torsos). Each requires
the current product ID, handle and image fingerprint. Explicit identity titles
also expire on supplier title changes; the SE RTS wording expires when stock
status changes. Warehouse qualifiers remain visible. The Lily label does not
introduce a fitted ROS claim from a gallery description. Original photos,
prices, options, authored descriptions and publication state remain unchanged.

Fresh strict model: 3,521 public records, 31 full records checked. After the four
approved canonical exceptions, titles and H1s each retain 17 groups / 53 listings.
The remaining unsure/held records stay unchanged. Thera needs exact supported
gallery labels or reconciliation with the separate DOL-139 duplicate request;
Dolly is tagged. No automatic unlisting or canonical change is included here.

The earlier-build HTTP crawl was deliberately superseded after 1,600+ records
when these approvals arrived. Its partial receipts remain separate. It found
one lightweight-model omission: Ivy's actual heading correctly preserves its
112.5cm height, verified against the full product record. That is not a changed
storefront fact. The final build requires its own full HTTP receipt; the older
partial run must not be described as complete acceptance.

Private receipts: `dolly-decisions-2253.json`, `dolly-current-records.json`,
`dolly-staged-model-2026-10-22.json`, and the separately versioned `full-http-*`
and `dolly-final-http-*` files in the existing audit folder. Focused tests:
58 assertions in five files; typecheck and scoped lint pass. Final build and
HTTP results are recorded below only after execution.

The optimized build and both 4,950-asset gates pass. Nine heading/layout checks
at 320, 390 and 1440 pixels pass; those deliberately block images and external
requests and are not a new product-image review. All 23 approved pages pass
hosted title/H1/canonical readback at the exact deployment:
`https://doll-7j6yklulr-sonawaneamits-projects.vercel.app` (code `d2aa52e4`).
The hosted readback uses ordinary same-origin GETs in an already authenticated
Brave tab. Anonymous HTTP receives Vercel's SSO redirect; no authentication
settings, tokens or cookies were extracted or changed. Next can stream its
HTML title outside the initial head, so readback checks the complete response
for a non-SVG title instead of assuming `head > title` is present immediately.
All 286 private registry fingerprints are absent from 115 public JS chunks.

Final local HTTP crawl: all 3,521 public product pages return 200 and match the
expected title, exactly one H1, canonical, Open Graph URL and Product/Offer URLs.
The versioned receipt is `dolly-final-http-summary-2026-10-21.json`; elapsed
time was 803 seconds. Actual raw title/H1 collisions are 21 groups / 61 listings;
excluding only the four approved aliases leaves 17 groups / 53 listings for
each field. Complete technical coverage is true; zero-duplicate acceptance is
false. This is not permission to merge or a completed DOL-177. Dolly retains the
remaining decisions and Martin must approve the final releasable preview.

## 21 October Evening Decisions

Staged Dolly's four 10:20 decisions and Martin's 10:25 gallery instruction,
preview only. Latest production main is merged without changing live data.

- The generic Irontech record now has a source/image-bound 166cm C-cup silicone
  identity and the dealer-backed measurements. No fitted ROS state is inferred;
  original options, prices, descriptions and commerce fields stay unchanged.
  This is a reviewed read-model repair, not a Shopify write or factory claim.
- Vanora's legacy WM copy points to its YL twin in canonical, Open Graph,
  schema and sitemap handling. Vera remains two self-canonical offers.
- The actual $699 flight-case choice belongs to YL Vera, not the WM copy.
  Its distinct Name: Variant wording is present only while the current full
  option record supports that exact price. No price or option is invented.
- Amy's exact rejected first image is filtered from featured, gallery and media
  sources. The retained second source becomes the first, with an image cache
  revision. Featured-only card/SEO reads use the same reviewed safe source.
  Future empty galleries are not repopulated. Thera has no photo changes.
- DollVue's visible badge remains, but its helper text is outside the H1.
- The Zelex guide redirect still reaches an intentionally hidden brand. No
  authorization or visibility policy is changed here; Dolly owns that decision.

Fresh strict public catalog model at 18:20 UTC: 3,521 customer-visible records;
27 raw title groups / 73 listings and 27 raw H1 groups / 73 listings. Excluding
only the four explicitly approved canonical aliases leaves 23 groups / 65
listings for each field. These are modeled counts, not a full HTTP crawl and
not a zero-duplicate result. The remaining imagery review stays with Dolly;
do not invent labels or clear it wholesale.

Private receipts: `decision-review.test.ts` / `decision-review.json` and
`decision-http.mjs` / `decision-http-qa.json` under the existing audit folder.
The older sections below are retained checkpoint history.

## Scope And Approval

Repair the shared product H1 and repeated metadata titles using existing product facts. Preserve unique authored SEO titles, editorial copy, descriptions, pricing, availability, region coverage and draft status. On 21 October Martin approved staging exactly three individually reviewed legacy-copy canonicals through Dolly's comment on DOL-177. No other canonical decisions, Shopify writes, redirects, product merges or publication changes are included. Martin must approve the exact hosted preview before merge; Dolly independently reviews the receipt.

## Current Catalog Evidence

Read-only strict Storefront extraction at 19:08 UTC: 3,521 public products, joined to all active Admin SEO records. The modeled baseline reproduces the production naming functions, not Google's selected titles or a full HTTP crawl.

| Exact repeated values | Before groups / listings | Preview model groups / listings |
| --- | --- | --- |
| Metadata title | 194 / 508 | 28 / 75 |
| H1 identity text | 463 / 3,194 | 29 / 77 |

508 metadata titles and 3,518 H1 identities change. Badge tooltip text is not used to claim a distinct product identity. Full Shopify product records were also fetched for all 363 candidates remaining after the first identity pass; the lightweight audit and complete records produce the same repaired titles/headings. No fallback sample records are accepted.

Every original collision group has an explicit disposition in the private receipt: 604 fixed groups, 18 partially separated groups, 35 deferred groups. These are title/H1 groups, not unique products. The current remaining title/H1 inventories overlap and must not be added together as a product count.

## What Changes

- Put the actual brand/model identity inside the H1 rather than leaving the name in a separate paragraph. Retain the existing H1 typography.
- Preserve full head references such as 036SJ versus 036S; do not extract a stray number from an arbitrary named head.
- Distinguish actual US, UK, Canada, Australia and EU warehouse offers from factory-order listings. Warehouse location does not imply delivery coverage or a new stock guarantee.
- Retain explicit MD skin/fitted-function qualifiers, Irontech ROS/body-generation labels and existing SY look labels from current catalog records.
- Avoid repeating specifications when a reviewed display name already contains the full product identity.
- Retain a fractional height only when current title and measurement independently agree and the integer metafield is its rounded value. Do not mutate Shopify specifications.
- Preserve unique authored metadata. Only the 194 audited repeated title values use the current identity generator; search and social titles share that output. The JSON contains public title strings only, not provenance, source URLs or supplier notes.
- 263 inspected photo sets across Irontech, WM, Starpery, Climax, SE, FunWest, Jarliet, YL, AngelKiss, Dolls Castle and Piper have descriptive gallery labels, explicitly naming the gallery rather than implying photographed clothing is included. The server-only registry checks product ID, handle and an exact image fingerprint; a replacement photo drops the old label pending re-review. The original image URL is not stored in the registry or exposed through it. Metadata uses the raw product for that match and separately protects the public social-image URL. Shared card naming is unchanged.

## What Is Not Resolved

All initially remaining 156 H1 groups had different gallery URL lists. That does not prove different physical products, but it rules out claiming exact gallery equivalence from these records. 107 groups had identical option records; other groups also have menu/spec differences. Neither condition justifies an automatic merge. The previous August identity review likewise found separate photo sets and no safe automatic merges.

The 29 current H1 groups / 28 metadata groups have specific unresolved decisions. No artificial adjective, handle suffix, sequence number or changed weight is added just to make a counter reach zero. Full records and before/after values are retained for every member. A fresh Admin read of the earlier 349 candidates found no additional body-code values to resolve these collisions; no unavailable identity fields are inferred.

Two legacy Irontech records lack usable body/material identity and one is a head incorrectly classified as a full doll; Dolly has the exact private handles and the request for source identity. Seventy-four individual image candidates are excluded from new promotional labels for ambiguous/youthful presentation, school styling, a child figure in a nude composition or sexualized injury/horror presentation. The private contact-sheet records preserve each excluded handle; no affected listing or gallery is changed in Shopify. Some excluded records no longer collide after another member receives a supported label; that does not clear their imagery.

The complete current remainder is classified in `remaining-classified.json`: five copy/offer-review H1 groups (10 listings), one missing-product-identity group (two listings), and 23 imagery-review groups (65 listings). All 29 groups are accounted for; there is no unclassified review backlog. These categories concern the remaining collisions, not the larger original safety-hold inventory.

Byte-level read-only gallery comparison found three legacy copies with identical complete gallery bytes, normalized specifications, stock, prices and option contracts: YL Joanna / WM Joanna, YL Frantiska / WM Frantiska, and Irontech Alessia / WM Alessia. Martin's 21 October staging approval is recorded in Linear comment `bc881a2b-3570-4cf5-9beb-ef1648854ac6` (the authoritative comment ID is retained on DOL-177). Their exact legacy WM handles now point to the main YL/Irontech URLs in canonical, Open Graph and Product/Offer URL fields. Both pages remain reachable; titles, headings, prices and options are unchanged by this follow-up. Product sitemaps omit only those three aliases when the main record is customer-visible, so discovery signals do not advertise the noncanonical copies. No brand-prefix or shared-body inference is used. Vera has identical gallery bytes and basic facts but one $699 flight-case option only on the WM copy; Vanora shares seven of eight exact image bytes, with matching basic facts and option contract. Those two require separate offer/near-copy review, not invented gallery distinctions. Full evidence is in `yl-copy-review.json`; different URLs alone do not prove different photos, correcting the earlier URL-list-only observation.

The ticket's primary strategy document (`1Qkk_fc36Cu80yL10RjAwfCVmltvBAFOcxxkTVo3QkBI`) is now accessible natively and was reconciled in place under DOL-176 on 21 October. The current reconciliation controls; the original proposal and its tables remain historical evidence. It does not authorize additional automatic merges or canonical choices.

Acceptance was clarified by Dolly with Martin's decision at 20:08 UTC on 20 October: explicitly reviewed copies canonicalized to a main version are exempt. Every other product URL must have a distinct title and H1; different photo sets get distinct identities. No automatic merges or canonicals are authorized. This dependency is resolved, not a current blocker.

**Review owner: Dolly, with Martin approving release of the exact customer-facing version.** Finish and review per-group outcomes under the recorded decision. DOL-177 remains In Progress while these remain; it must not be represented as complete before its full HTTP acceptance and release approval.

## Verification And Reproduction

Private local evidence: `data/exports/title-audit-2026-10-20/` in this worktree. Do not commit full catalog exports or publish this folder.

- `snapshot.test.ts` / `snapshot.json`: read-only public catalog and Admin SEO baseline; opt in with `DOL177_READONLY=1`.
- `details.test.ts` / `full-products.json`: complete records for unresolved identities, opt-in read-only.
- `review.test.ts`, `review.json`, `review.html`: complete before/after inventory, every original-group disposition and every current unresolved group; fails on missing full records or lightweight/full-record naming disagreement.
- `verify.mjs`, `http-visual-qa.json`: representative HTTP and browser checks, including warehouse regions, head suffixes, fixed configurations, long headings, 1 H1, preserved canonical URLs, 320/390/1440px layout and no-JavaScript identity. This is a sample, not a full-catalog HTTP crawl.
- `seo-live-evidence.json`: live Ellen Australia pre-change audit. Zero returned fix/review findings; two non-HTTP link exclusions noted. This supports only that sample, not a sitewide all-clear.
- Focused identity/metadata tests, typecheck, scoped lint and production webpack build. Turbopack cannot resolve this worktree's external dependency symlink; use `npm run build -- --webpack` locally.
- Full suite has the same 11 pre-existing failing assertions as the DOL-198 baseline. Do not describe it as fully green.
- Final focused run: 58 assertions passed, including the private inventory consistency check. Final full suite: 2,501 passed / the same 11 pre-existing assertion failures (and the same two pre-existing node:test/Vitest collection errors).
- Local production-build QA passed 12 HTTP samples, six desktop/mobile viewport checks, and one no-JavaScript sample. A detected long-heading overflow was repaired with minimum-width/wrapping constraints, without changing typography. Final owned-asset build gate: 4,950 checked, zero failures.
- Gallery continuation: 41 focused metadata/identity/inventory assertions pass; typecheck, scoped lint and production webpack build pass. All ten newly labelled pages plus twelve prior samples pass HTTP title/H1/canonical checks. Nine 320/390/1440px checks, including a gallery heading, and the no-JavaScript sample pass. The private registry has zero matches in 115 public JavaScript chunks. Full suite: 2,512 passed, the same 11 existing assertion failures and two existing collection errors. This is still sample HTTP coverage, not the final full-catalog crawl.
- Second gallery checkpoint: 74 inspected labels total; all 74 labelled pages plus 12 prior samples pass HTTP title/H1/self-canonical checks (86 HTTP pages), with nine 320/390/1440px checks and one no-JavaScript sample. The same 41 focused checks, typecheck, scoped lint, webpack production build and 4,950-asset gate pass. Latest approved production collection changes were merged into this draft branch; no live code is reverted. Full-suite and public-JavaScript privacy rechecks are recorded separately when run, not inferred from earlier results.
- Third gallery checkpoint: 131 labels, 143 HTTP pages, nine viewport checks and no-JavaScript sample passed. Full suite: 2,526 passed, same 11 existing assertion failures and two existing node:test collection errors. This receipt is preserved as `http-visual-qa-gallery-131.json`. The later 263-label checkpoint requires its own build/readback receipt and is not inferred from that earlier run.
- Final supported-gallery checkpoint: 263 labels and all 275 HTTP samples (every labelled page plus 12 earlier identity cases) pass exact modeled title/H1 and production self-canonical checks. Twenty-one browser checks across 320/390/1440px and seven representative page identities, plus one no-JavaScript sample, pass without horizontal overflow or browser exceptions. WM and Climax mobile heading captures were visually inspected. Webpack build, typecheck, scoped lint and both 4,950-asset gates pass. All 263 registry fingerprints and gallery labels are absent from all 115 public JavaScript chunks. Full suite: 2,526 passed, same 11 pre-existing assertion failures and two existing collection errors. This is comprehensive HTTP coverage of the staged gallery labels, not a complete 3,521-product HTTP crawl or a complete-ticket release approval.
- 21 October canonical follow-up: 28 focused assertions pass, including three aliases, self-canonical main records, preserved authored titles/prices, no guessed aliases for regional offers or near-copies, and sitemap consistency. Typecheck, scoped lint, webpack build and both 4,950-asset gates pass. Actual production-build readback passes six alias/main pages and four unchanged AU/CA/EU/US warehouse controls, including canonical, title/H1 and Product/Offer URL agreement; `canonical-http-qa.json` records the ten-page scope. This is not a fresh full-suite or complete-catalog HTTP all-clear.

The public repeated-value list can be reproduced mechanically from the retained baseline with `node scripts/prepare-duplicate-title-review.mjs <snapshot.json>`; review the resulting diff before committing. It is not an automatic live catalog update. New uploads need the same full-catalog collision check; the retained list is not a permanent guarantee against future duplicates.

No new search intent, content claim or landing page is introduced. Current Shopify identity and rendered HTML are controlling evidence here; retained DataForSEO long-tail/OnPage research is described in `2026-08-13-pdp-identity-baseline.md`. Fresh keyword/AI answers are not substitutes for missing model or gallery facts. No new ranking or growth claim is made.

## Primary Guidance

- [Google: descriptive, distinct titles and clear main headings](https://developers.google.com/search/docs/appearance/title-link).
- [Google: canonical choices should consolidate genuinely duplicate or very similar pages](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls).

Before release: finish the remaining decisions, run the complete preview crawl, obtain Dolly's independent review and Martin's approval, then merge and perform live readback. Keep all warehouse pages and unpublished brands intact unless separately approved.
