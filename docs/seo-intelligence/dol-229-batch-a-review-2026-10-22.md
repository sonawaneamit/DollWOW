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
| `/shop/futa-sex-dolls` | 129 | 6 | Keep configuration-specific definition and existing FAQ; validate actual supported products/options. |
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
catalog, pricing, image, option, metadata, checkout or publication write. This does
not roll out DOL-225's separately gated internal-link pattern.

## Validation And Remaining Gates

- 33 focused tests passed across brand layout, collection disclosure, brand SEO
  and collection SEO. Scoped lint passed.
- Full local typecheck failed on stale generated `.next` route references from
  the earlier DOL-226 branch and a pre-existing optional `priceDelta` assertion in
  `tests/privateDraftPreview.test.ts`. Neither is a runtime layout failure; this
  is still a failed full check, not a green claim.
- Hosted build, rendered before/after mobile and desktop checks, expanded-table
  and keyboard checks remain to be recorded before calling the layout reviewed.
- DataForSEO's existing credential returned task 40207 (IP not whitelisted),
  despite HTTP 200, at zero cost. Fresh required SERP/AI evidence is pending the
  explicit Martin/Dolly access request. Drafting may proceed; final AI/GEO gate
  cannot pass while required evidence is missing.
- Five-page source validation, exact preview links and Martin's batch approval
  remain outstanding. No growth impact or release-ledger deployment event exists.

Do not mark DOL-229 complete or publish this branch from this checkpoint.
