# Agentic release checklist - 9 November 2026

Approved implementation is verified for the scoped work below. Independent review remains open; this is not a claim that all products are eligible for Shopify Catalog or appear in external AI answers.

## Six buckets

| Bucket | Released or verified result | Evidence and remaining scope |
| --- | --- | --- |
| 1. Policies (DOL-348) | Approved Refund, Shipping and Terms saved natively; public Returns/Shipping aligned. Final native read matches approved copy. Contact uses 855-922-DOLL. | Done. RTS four-hour cancellation/modification rule preserved; custom cancellation bands and destination qualifications preserved. Internal review notes excluded. |
| 2. Knowledge Base (DOL-349) | Nine approved business answers published; final Shopify UI shows 16 of 16 facts published, including native sources. | Done. No internal review notes or references to Martin in published answers. No second-hand products, gift wrapping or registry. |
| 3. Catalog data (DOL-350) | Ten FunWest category changes plus 3,405 additional changes; independent census finds 3,477 accurately classified customer products. | In Review. Of 3,554 customer records, 77 existing holds remain (15 identity controls and 62 catalog-review holds). No drafts published; prices, stock, options and publications preserved. |
| 4. Checkout-only items (DOL-351) | Approved $1 pilot plus 156 approved helpers hidden with seo.hidden=1. None of those 157 appear in 76 complete title-scoped Storefront search queries. | In Review. Internal census: 2,005 hidden / 96 unhidden held. All 1,944 records outside the 157 scope retain their visibility values. All 156 US direct variant responses preserved. Pilot's one approved real US cart passed and was emptied; no rollout carts, orders or payments. Native Catalog membership is not exhaustively enumerated. |
| 5. Search-quality pilot (DOL-352) | Category pilot read back; six comparable US native query observations saved. Native mapping already uses Product title / Product description; no unsupported copy/media changes warranted. | In Review. No speculative variant renames, invented reviews or held PR143 merge. Internal query results are not external AI ranks and do not prove causal uplift. |
| 6. Release/discovery/measurement (DOL-224 / DOL-226) | Production d0eb8ef5 serves /agents.md; anonymous GET and HEAD return 200 on apex and www after the approved exact Cloudflare exception. Guide body matches /llms.txt. Final policies/facts/channel readback and evidence manifest saved. | DOL-226 remains In Review for independent sign-off. Existing DOL-224 ledger and PR178 review hold preserved. Separate native observation cohort has 28/56/84-day comparison dates. External DOL-228 answer panel not yet run. |

Final read-only verification completed at 2026-11-09 09:51:27 UTC (Lisbon). Shopify UI reloaded during this verification: all five channel controls Active, 16/16 published facts, 199 products shown in Catalog. These are separate signals, not universal product eligibility proof. No channel toggle changed.

## Previous approach recovered from Linear

DOL-315's 30 October plan proposed accurate doll categories, factual brand/model/material/dimension titles, readable customization openers, native policies and removal of internal checkout items from discovery. It suggested leading with companion-doll language where accurate; that was a copy approach, not a confirmed exemption from Mature eligibility rules. The early zero-inventory hypothesis was not established as the cause of exclusion, and no placeholder stock was introduced. Subsequent 30 October and 9 November checkpoints explicitly preserve accurate adult classification.

References: [DOL-315 history](https://linear.app/dollwow/issue/DOL-315) (30 October 08:50 plan; 12:12 approval; 19:46 category preview), [DOL-350](https://linear.app/dollwow/issue/DOL-350), [DOL-352](https://linear.app/dollwow/issue/DOL-352).

## Platform restriction and observed feed baseline

Shopify permits a store to operate under its applicable platform rules separately from inclusion in its Catalog. Its current [Catalog requirements](https://help.shopify.com/en/manual/shopify-catalog/requirements) exclude Mature products, including sex toys, and services/product add-ons. Shopify's classification can differ from the merchant's selected category. Accurate merchant classification therefore neither creates this rule nor establishes an exemption from it.

The observed 199 count and internal query matches do not explain the inclusion decisions for those products. Do not infer an exemption, a guaranteed count increase, removal of all restricted products, or a reason for every excluded product from those signals. [Shopify distinguishes Catalog distribution from open-web crawling and indexing](https://help.shopify.com/en/manual/online-sales-channels/agentic-storefronts/products); a Catalog restriction does not by itself establish absence from every AI answer. Each destination's own policies still apply.

## Measurement handoff

- Retain 199 as the observed Catalog-count baseline. At a later comparable read, record the date, count and any native eligibility explanation. A count difference alone does not identify new products or prove why they entered or left.
- Retain the six exact US native queries and returned identities in the private observation cohort. Record identities, ordering, market and timestamp; keep external answers/citations separate.
- Review the native query cohort on 7 December 2026, 4 January 2027 and 1 February 2027 at each saved observation time. These are ledger dates, not newly scheduled automations. Martin paused recurring Linear polling until explicit resume.
- Keep GSC clicks/positions, GA4 consented visits, Shopify orders and native Catalog observations distinct. The Nov9 consent repair changes measurement coverage. Missing rows are unknown, not zero.
- DOL-228 is the separate approved external AI-answer panel, including searched pages versus cited pages; no result has been invented or substituted with native tests.

| Exact native query (United States) | Earlier top-10 section count | Post-category count |
| --- | ---: | ---: |
| custom silicone companion doll | 4 | 10 |
| custom TPE companion doll | 6 | 8 |
| customizable companion doll | 0 | 0 |
| adult companion doll | 10 | 10 |
| silicone sex dolls | 3 | 5 |
| sexdoll | 4 | 4 |

Baseline captured 08:08-08:14 UTC; comparison 09:00-09:02 UTC on 9 November. Same-day movement does not establish completed ingestion or category-change causality.

## Private receipts and preserved gates

Private raw receipts remain in `data/exports/agentic-2026-11-09/` of the agentic Nov9 worktree. The final manifest `agentic-release-checklist-final.json` binds 11 source artifacts by SHA256; the sanitized companion manifest in this directory includes only filenames, byte sizes and hashes. It contains no credentials, cart links, raw admin snapshots or customer data.

Receipt groups include approved policy payload/readback, published Knowledge Base readback, complete category census and batch equality receipts, $1 pilot cart/cleanup, 156-item mutation/protected-field/direct-variant readbacks, 76 scoped discovery queries, anonymous guide checks and native query baseline/comparison.

Preserve 96 internal-charge holds, 77 customer-product holds, DOL-177/PR143 identity review, DOL-284 Markets restrictions, DOL-226 independent review and DOL-224/PR178 historical-ledger review. No new checkout/order tests, IndexNow replay, fake conversion, stock adjustment, draft publication or broader Cloudflare exception was made in finalization.
