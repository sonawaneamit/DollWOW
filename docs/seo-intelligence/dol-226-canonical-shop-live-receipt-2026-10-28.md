# DOL-226 Canonical Shop Callback Receipt

## Release

PR203 source `2c69c8d52da70d13aae06b836be3e0fa24695e8b` merged as
`7c412b76889cbf576efc4210b667c3e11009e2ae`. Production deployment
`dpl_HsdLk4wK4bmeSudkxo6fb7myHPiu` was READY at 28 October 2026
15:01:48 UTC and independently verified behind the custom domain.
Martin's 28 October 12:56 approval and the ticket's small-change authorization
cover this correction. No environment, firewall or subscription changes.

The authenticated Admin shop's permanent myshopify host differs from its
configured API alias. Comparing callback headers to the alias rejected native
callbacks. The correction resolves the permanent identity through authenticated
Admin, caches it for five minutes and retains strict shop validation, raw-body
HMAC, topic/product checks and inert Preview behavior. Foreign shops remain
rejected; identity lookup failures return retryable 503, not permissive access.

## Genuine Verification

The already approved, genuine DOL-276 business-price batch supplied callbacks.
No fabricated edits, operator callback POSTs, replay or order activity was used.
At 15:08:00.314 UTC, independent Admin reads found all 164 expected products
with submitted current price/visibility fingerprints and exact canonical URLs;
zero pending or visible-but-unsubmitted. All acknowledgements postdate READY.
The read-only verification itself made zero writes or notifications.

Before correction, a bounded native callback log sample returned 50 POSTs,
all HTTP403. After correction, its bounded sample returned 50 POSTs, all HTTP200.
The CLI cap means neither sample is a complete 164-delivery census. Persisted
submission state is written only after upstream IndexNow HTTP200/202 acceptance;
the per-request upstream status bodies were not retained. This is genuine
accepted notification evidence, not exact-once delivery or indexing proof.

Seventy-eight focused tests across six suites, scoped typecheck, lint and diff
checks passed; the clean hosted build and 4950-asset gate passed.

## Bing And Agent Maps

Freshly reloaded Bing Sitemaps pages contain 34 distinct feeds, all Success,
zero errors/warnings. Root and learn feeds last crawled 26 October; learn has
58 discovered against 60 currently public guides. The rounded 11.0K aggregate
includes parent/child feeds and is not a unique indexed-page count. No sitemap
resubmission or settings action was performed.

At 15:10:54.097 UTC both live agent-index.json and llms.txt returned HTTP200;
all 60 current guides and today's scheduled WM guide are represented in both,
with the current sitemap and product-feed references. Retrieval-map parity is
not evidence of consumer AI citations, traffic or ranking.

## Measurement And Handoff

One infrastructure audit event is appended to DOL-224 at the actual 15:01:48
READY anchor, preserving all prior 4195 rows. GSC/GA4 content metrics, sitemap
membership and indexability are not applicable to this authenticated POST API.
The endpoint is not submitted to IndexNow or Google. Review functional health
at 28/56/84 days, not supposed ranking ROI. No purchase tracking repair or
resolution of the separate DOL-212 historical order gap is implied.

Private evidence: `/Volumes/Extreme Pro/Projects/DollWOW-dol276-prices/data/exports/dol-226-2026-10-28/`.
Final native state, bounded before/after logs, authenticated shop/subscription
readbacks, fresh Bing screenshot/rows and agent-map readback are retained there.
In Review for Dolly; never self-closed. GitHub automation moved the ticket to
Done on merge; it was restored to In Review after verification.
