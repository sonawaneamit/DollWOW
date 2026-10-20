# DOL-177 Product Identity Repair

Date: 20 October 2026. Status: partial repair for review, not release-ready and not a zero-duplicate result.

## Scope And Approval

Repair the shared product H1 and repeated metadata titles using existing product facts. Preserve unique authored SEO titles, editorial copy, descriptions, pricing, availability, region coverage and draft status. No Shopify writes, redirects, canonical changes, product merges or publication changes are included. Martin must approve the exact hosted preview before merge; Dolly independently reviews the receipt.

## Current Catalog Evidence

Read-only strict Storefront extraction at 19:08 UTC: 3,521 public products, joined to all active Admin SEO records. The modeled baseline reproduces the production naming functions, not Google's selected titles or a full HTTP crawl.

| Exact repeated values | Before groups / listings | Preview model groups / listings |
| --- | --- | --- |
| Metadata title | 194 / 508 | 143 / 335 |
| H1 identity text | 463 / 3,194 | 149 / 349 |

508 metadata titles and 3,518 H1 identities change. Badge tooltip text is not used to claim a distinct product identity. Full Shopify product records were also fetched for all 363 candidates remaining after the first identity pass; the lightweight audit and complete records produce the same repaired titles/headings. No fallback sample records are accepted.

Every original collision group has an explicit disposition in the private receipt: 409 fixed groups, 81 partially separated groups, 167 deferred groups. These are title/H1 groups, not unique products. The current remaining title/H1 inventories overlap and must not be added together as a product count.

## What Changes

- Put the actual brand/model identity inside the H1 rather than leaving the name in a separate paragraph. Retain the existing H1 typography.
- Preserve full head references such as 036SJ versus 036S; do not extract a stray number from an arbitrary named head.
- Distinguish actual US, UK, Canada, Australia and EU warehouse offers from factory-order listings. Warehouse location does not imply delivery coverage or a new stock guarantee.
- Retain explicit MD skin/fitted-function qualifiers, Irontech ROS/body-generation labels and existing SY look labels from current catalog records.
- Avoid repeating specifications when a reviewed display name already contains the full product identity.
- Retain a fractional height only when current title and measurement independently agree and the integer metafield is its rounded value. Do not mutate Shopify specifications.
- Preserve unique authored metadata. Only the 194 audited repeated title values use the current identity generator; search and social titles share that output. The JSON contains public title strings only, not provenance, source URLs or supplier notes.

## What Is Not Resolved

All initially remaining 156 H1 groups had different gallery URL lists. That does not prove different physical products, but it rules out claiming exact gallery equivalence from these records. 107 groups had identical option records; other groups also have menu/spec differences. Neither condition justifies an automatic merge. The previous August identity review likewise found separate photo sets and no safe automatic merges.

The 149 current H1 groups / 143 metadata groups need gallery-grounded look naming or individually approved canonical decisions. No artificial adjective, handle suffix, sequence number or changed weight is added just to make a counter reach zero. Full records and before/after values are retained for every member.

The ticket's primary strategy document (`1Qkk_fc36Cu80yL10RjAwfCVmltvBAFOcxxkTVo3QkBI`) returns 404 through the connected Drive account. Its referenced per-group canonical/merge instructions have therefore not been verified. Dolly must supply the current accessible specification before that part is implemented; retained local guidance says not to bulk-merge alternate galleries.

**Decision owner: Dolly, with Martin approving customer-facing naming/canonical outcomes.** Confirm gallery-led naming as a scoped continuation of DOL-177, or assign the exact follow-up. DOL-177 must not be marked Done while these remain or before its full HTTP acceptance and release approval.

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

The public repeated-value list can be reproduced mechanically from the retained baseline with `node scripts/prepare-duplicate-title-review.mjs <snapshot.json>`; review the resulting diff before committing. It is not an automatic live catalog update. New uploads need the same full-catalog collision check; the retained list is not a permanent guarantee against future duplicates.

No new search intent, content claim or landing page is introduced. Current Shopify identity and rendered HTML are controlling evidence here; retained DataForSEO long-tail/OnPage research is described in `2026-08-13-pdp-identity-baseline.md`. Fresh keyword/AI answers are not substitutes for missing model or gallery facts. No new ranking or growth claim is made.

## Primary Guidance

- [Google: descriptive, distinct titles and clear main headings](https://developers.google.com/search/docs/appearance/title-link).
- [Google: canonical choices should consolidate genuinely duplicate or very similar pages](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls).

Before release: finish the remaining decisions, run the complete preview crawl, obtain Dolly's independent review and Martin's approval, then merge and perform live readback. Keep all warehouse pages and unpublished brands intact unless separately approved.
