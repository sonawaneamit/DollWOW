# DOL-229 Batch A: Review Checkpoint

Status: preview implementation in progress; research gate incomplete. No release.

## Scope And Existing Evidence

Production sitemap inventory: 64 canonical hub/collection candidates, 10 previously
completed or accepted unchanged, 54 remaining candidates. The full inventory and
measurement caveats are in the DOL-229 Linear document. Sitemap inclusion is not
a catalog eligibility audit.

Working order is exact canonical GSC impressions for final web data, all devices
and countries, 22 September through 19 October 2026. Exposure is not market
volume or profit. Historical aliases remain separate.

| Page | Impressions | Clicks | Proposed First-Pass Disposition |
| --- | ---: | ---: | --- |
| `/shop/black-dolls` | 154 | 0 | Keep existing identity and schema; validate source claims before proposing copy changes. |
| `/shop/futa-sex-dolls` | 129 | 6 | Clarify custom-made options versus fixed warehouse builds; preview corrected intro, meta and matching FAQ. |
| `/brands/dolls-castle` | 100 | 2 | Preview the existing product-first layout pattern; retain current factual copy and schema. |
| `/shop/petite-dolls` | 76 | 4 | Keep adult-product scope; no demand-driven expansion from inappropriate query evidence. |
| `/shop/custom` | 42 | 4 | Keep made-to-order owner, not a new competing customization page. |

All five individually returned 200, self-canonical HTML without noindex. Recursive
JSON-LD inspection already finds CollectionPage, ItemList, BreadcrumbList and
FAQPage. No missing-schema claim or blanket rewrite is justified by that check.

## Query Evidence And Rejections

An additional exact-page GSC query request on 22 October returned 19 page/query
rows for the same final date window. Page/query totals are privacy-filtered and
cannot substitute for page totals above. Two reported clicks appear on petite
queries; the absence of other clicked query rows does not contradict page totals.

- Castle includes manufacturer-name variants and a domain-navigation query.
  These do not establish broad category demand or warrant a competing brand URL.
- Black-page reported queries include character/likeness and ambiguous handle
  terms. They do not justify copying character names into commercial copy.
- Petite results include one explicitly underage-coded query. Reject it from
  keyword targeting, content generation and product selection. It provides no
  basis for changing eligibility or removing a hold.
- Custom and futa rows are too sparse to support a new intent taxonomy or claims
  about total market demand. Preserve their distinct existing page ownership.

Reproduction: the ignored `data/exports/dol-229-2026-10-22/` directory contains
`collect-batch-queries.mjs` and `gsc-batch-queries.json`, including request fields,
run time, status and returned rows. Existing inventory and baseline requests are
retained alongside them. No credentials or customer records are included here.

## Preview Change

The Castle route currently places expanded comparison and seller authorization
before products. `usesCompactBrandLayout` stages Castle only when `VERCEL_ENV`
is `preview`, reusing the four released Sprint1 hubs' exact layout:

- A single swipeable mobile guide row above products.
- Comparison, buyer notes, FAQ and authorization in native disclosures below the
  product grid; all copy and links remain server-rendered.
- Short mobile introduction retains its existing expansion behavior.

Production and all other previously unreviewed brands are unchanged. There is no
catalog, pricing, image, option, checkout or publication write. The subsequent
Futa copy/meta clarification below is a code-only draft, not a Shopify write or
release. This does not roll out DOL-225's separately gated internal-link pattern.

## Catalog And Runtime Source Audit

A strict read-only public Shopify snapshot at 19:00 UTC on 22 October contained
3,526 records (not the sample fallback). Applying the actual shared filters gives:

| Page | Matching Records | Source Findings And Limits |
| --- | ---: | --- |
| Black | 7 | All have positive height and weight; four brands; TPE, silicone and silicone-head constructions. No public hold tags. |
| Futa | 1,462 | All capability flags true; seven brands; six warehouse records and 1,456 custom records. No public hold tags. Flags are not a full factory/configuration audit. |
| Petite | 359 | Positive recorded heights 125-154 cm, within the declared 121-154 cm boundary. No partial/loose-head matches under the existing classifier, no public hold tags. Not an imagery clearance. |
| Custom | 3,057 | Fifty Top Fire records carry `catalog-review-hold`; six records have zero/unknown height, including an IronAI head name that warrants product-form review. Escalated to Dolly; no records or holds changed. |
| Castle | 177 | Three classified partial products; material mix supports checking exact body/head construction. No public hold tags. The compact format of any individual item is not a safety/eligibility clearance. |

Positive measurements exclude zero; missing values are not genuine zero-height
products. Counts are dated observations, not static claims to add to page copy.
No private metafield holds, supplier documents, imagery or warehouse inventory
were cleared by this public metadata audit.

Runtime follow-up checked all six Futa warehouse matches and one custom example
per represented brand (13 products total). Each has an add-on group in the
configuration data. However, all six warehouse records have
`customAvailable: false`, and `ProductOptions` renders a fixed-warehouse inclusion
view instead of the custom configurator. The old page's assertion that *every*
result has an add-on the buyer must select is therefore not justified by a true
capability flag or an unused configuration group.

The draft preserves the collection filter/owner and respectful product
definition, but distinguishes custom choices from fixed warehouse builds in the
intro, meta and visible FAQ (and therefore its shared FAQ schema). Membership no
longer claims to prove inclusion or current selectability. It does not invent a
warehouse accessory fulfillment policy, remove any listing or change prices.
Factory/warehouse confirmation is still needed to settle those six records'
commercial eligibility; source copy is not a substitute for that decision.

The existing Care 365 wording is supported by the current controlling
`lib/care/careForLife.ts` commitments, subject to published terms. The 4-6-hour
missing-model service claim appears in old SEO notes but has not been independently
confirmed as a current operating commitment. Retain it pending owner confirmation;
do not present old SEO notes as supplier or operational proof.

Private reproducible evidence: `catalog-facts.test.ts`, `catalog-facts.json`,
`capability-facts.test.ts`, `capability-facts.json` in the dated export directory.
The complete exception list is attached to DOL-229 as the Linear document
"DOL-229: Custom collection catalog exceptions for Dolly (22 Oct)". A hold tag's
reason is unknown, not automatically an imagery/safety classification.

## Validation And Remaining Gates

- 33 focused tests passed across brand layout, collection disclosure, brand SEO
  and collection SEO. Scoped lint passed.
- Full local typecheck failed on stale generated `.next` route references from
  the earlier DOL-226 branch and a pre-existing optional `priceDelta` assertion in
  `tests/privateDraftPreview.test.ts`. Neither is a runtime layout failure; this
  is still a failed full check, not a green claim.
- Castle layout commit `50b1b8b2` passed its protected hosted build, asset CI,
  five-page metadata/schema preservation checks, six before/after captures at
  320/390/1440 px, three keyboard/expanded-table checks and a JavaScript-disabled
  390 px disclosure check. All after layouts have no document overflow. First
  product Y changed from 1933 to 653, 1804 to 640 and 1252 to 592 respectively;
  the old 320 px overflow was absent in preview. All six first-card images decoded.
- The Futa copy update requires a new hosted check. Do not attribute the earlier
  unchanged-meta check to the subsequently changed description or FAQ.
- DataForSEO's existing credential returned task 40207 (IP not whitelisted),
  despite HTTP 200, at zero cost. Fresh required SERP/AI evidence is pending the
  explicit Martin/Dolly access request. Drafting may proceed; final AI/GEO gate
  cannot pass while required evidence is missing.
- Five-page source validation, exact preview links and Martin's batch approval
  remain outstanding. No growth impact or release-ledger deployment event exists.

Do not mark DOL-229 complete or publish this branch from this checkpoint.

## Existing Related-Link Audit (19:17 UTC)

Checked the five current production guide rows and their 20 distinct destinations
with scoped operator access. All 20 returned 200 without redirects or noindex;
16 declare matching canonical URLs. Four utility/policy destinations do not declare
a canonical: `/how-ordering-works`, `/care-for-life`, `/buyer-protection` and
`/price-match`. This is missing metadata, not a detected conflicting canonical or
a broken link. Keep useful policy links; flag utility metadata ownership to Dolly
instead of broadening this batch into a policy-page rewrite.

The Petite row renders `/shop/torsos` twice (same React key and caption), matching
its source array. Remove only the second occurrence in preview. Six distinct
destinations remain, with the size comparison, torso, mini, storage, shipping and
cost paths preserved. No new linking pattern, additional destination or DOL-225
rollout is introduced. A focused regression checks uniqueness and retained routes.

Private production evidence: `links-audit.test.ts` / `links-audit.json` in the
dated export directory. The production snapshot intentionally retains the old
seven-link state; subsequent preview receipts must show six and must not overwrite
that before evidence. This audit clears only the existing related-guide targets,
not every site link, linked page's full accuracy or catalog imagery eligibility.
