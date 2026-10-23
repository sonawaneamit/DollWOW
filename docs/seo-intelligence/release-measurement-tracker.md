# Release Measurement Tracker

Owner: Codex. Reviewer: Dolly / Martin. DOL-224, 22 October 2026.

The authoritative ledger is [release-measurement-tracker.csv](release-measurement-tracker.csv).
Its provenance is [release-measurement-sources.json](release-measurement-sources.json).
This is measurement infrastructure, not approval to publish or activate a monitor.

## Current Coverage

- Initial cohort: ten distinct Sprint 1 canonical shopping pages; all eleven DOL-195 and
  DOL-200 through DOL-209 tickets are represented.
- Thirteen URL-level website-release events across five production commits.
  The shared DOL-195 mobile layout affected six collection URLs.
- Three accepted no-change audits (male, torso, Asian) are separate assessment
  rows, not invented deployments. Their review dates use the acceptance time.
- Repeated URLs represent successive real changes, not extra pages. Never sum
  repeated baseline values across event rows to report business totals.

The approved DOL-225 navigation rollout adds 3,522 URL-level release rows on
23 October: 3,458 products, 27 brand hubs, 36 shared collections and one dedicated
DollVue collection. The combined ledger has 3,538 rows across 3,522 distinct URLs;
the original sixteen rows and values are preserved. This is an inventory of
verified navigation rules, not a full HTTP crawl of all sources or a count of
new keyword pages or distinct physical doll models. Five live sources, including
one excluded identity-review source, were checked independently against the plan.

## Operational Context

Separate [operational context events](release-context-events.json) record the
DOL-226 IndexNow integration released on 23 October 2026 at 07:05:20.080 UTC
(production-ready timestamp, commit `24146764`). One real production notification
was accepted with HTTP200 at 07:05:50.783 UTC; an identical repeat was unchanged.
Two product-event subscriptions were read back at 07:06:16.160 UTC. The public
key and callback authentication are reachable without the operator header.
Actual Shopify-origin delivery remains to be observed independently.

This is infrastructure, not another indexable page or a price/publication change
to the test product. This event adds no content CSV row; the original sixteen
rows are preserved alongside the separate DOL-225 expansion above. No endpoint traffic or organic-sales figures are manufactured;
IndexNow acceptance does not establish crawling, indexing or growth.

Under the separate approval to submit Sprint 1 key pages, one ten-URL IndexNow
batch was accepted with HTTP200 at 07:50:55.995 UTC after production canonical,
HTTP and noindex checks. This is a Bing-participating notification, not a Google
indexing request, sitemap resubmission or notification of all 3,522 rollout URLs.

## Baseline Definitions

The shared baseline is 22 September through 19 October 2026 inclusive, the 28 complete
dates preceding the original 20 October releases. The 23 October rollout retains
that window for comparability; 20-22 October are outside it. Do not call it the
immediate 28 days preceding that later release. GSC final web page rows use Pacific
dates, all countries and devices. GA4 uses property 549359657, production-host
landing-page sessions across all channels, with America/New_York dates. These
are different measurements, not a click-to-session reconciliation or attribution
model. The separate QA property and development hosts are excluded.

For the initial ten-page request, nine GSC page rows and seven GA4 landing-page rows returned. Missing rows stay
blank with explicit status fields. They are not replaced by zero demand or zero
sales. A returned row may legitimately contain measured zero clicks. GSC
suppression and GA4 consent/coverage limitations remain. The pre-repair purchase
tracking gap and pending genuine-order reconciliation do not support sales claims.

The expanded DOL-225 request returned 475 final GSC page rows in one call and
86 production GA4 landing-page/host rows, with no cap reached. These match 451
and 83 rollout source URLs respectively. Separate production hosts are aggregated
by exact landing path for the latter. Missing/suppressed records stay blank with
explicit statuses, not invented zero demand, zero traffic or zero sales. The
source JSON retains both original and expanded requests and their distinct scopes.

GSC URL Inspection was read on 22 October. Nine current stored verdicts report
indexed; Irontech reports `Crawled - currently not indexed`. Every reported last
crawl predates the releases. A successful API read is not a fresh crawl, a live
test, or proof that revised content was indexed. Historical indexing status at
release was not captured and cannot be reconstructed from today's verdict.
That ten-page inspection snapshot is not extended to the 3,522 rollout URLs;
their release-time Google indexing state remains explicitly not captured.

## Event And Review Dates

Actual release times come from GitHub Production deployment-success statuses,
not PR creation, merge time, planned dates or comment prose. Release-ticket live
receipts and Dolly's independent acceptance are retained as corroboration.
Review dates are the event's UTC anchor plus exactly 28, 56 and 84 days.
For the 20 October cohort those dates fall on 17 November, 15 December and
12 January. Daily operational checks can start earlier; those milestones are
not instructions to wait for 28 days before looking.

DOL-225's actual production-ready anchor is 23 October 2026 at 07:40:30.694 UTC,
commit `a4e88e15`. Its 28/56/84-day review dates are 20 November, 18 December and
15 January at that same UTC time. A new release is not evidence that Google has
recrawled it; no indexing, ranking or revenue gain is inferred.

Catalog/stock changes, the 21 October switch from 10% to Halloween $299, consent,
tracking repairs and other releases confound simple before/after comparisons.
No row claims causal ranking, sales or revenue impact. Review a matched time
window and changed-page scope before deciding what to revise next.

## Update Contract

1. The ticket's release owner appends one row per changed canonical URL when a
   release is verified live. A shared deployment may legitimately add several
   rows. A no-change assessment has no release timestamp or commit.
2. Record the exact ticket, change, production success receipt, live-check result,
   baseline request dates, returned values and missing-data states. Do not
   substitute a guide's metrics for a collection or combine canonical variants.
3. For future events, capture indexing before release where possible and retain
   the stored last-crawl date. Record post-release inspection separately.
4. Calculate all three review dates from the actual event anchor. Update the
   evidence capture time, promotion/stock context and measurement caveats.
5. Post the ledger link on the release ticket. Dolly reviews the handoff; Codex
   does not self-close. No automation is created by updating this file.
6. Preserve raw source responses privately and add only privacy-safe aggregates
   and reproducible request metadata to the repository. Never commit credentials,
   customer records, order IDs or review-link capabilities.

## Verification

The initial ledger was checked for sixteen rows, ten unique URLs and eleven
ticket IDs; thirteen release events and three no-change assessments; exact
28/56/84-day offsets; blank missing values; and no release time on audit-only
rows. CSV is independently parsed and compared with the JSON evidence before
handoff. Indexing freshness remains an explicitly unresolved observation, not
a reason to rewrite these pages without evidence.

The expanded ledger is parsed with the standard CSV library and checked for
3,538 rows, 3,522 unique URLs, exact preservation of the first sixteen rows and
all original bytes, missing-value blanks, distinct event IDs and exact review
offsets. Release commit and timestamp match Vercel production metadata; five
live HTML checks include the identity-review source retaining zero new links.
Thirty-seven distinct new canonical targets returned HTTP200 without noindex;
twenty hosted source comparisons and fourteen browser cases covered the preview.
Per-brand full-detail mapper parity was sampled for 27 brands, not every PDP.

Private raw evidence and reproducible collectors are on the external project
drive in `data/exports/dol-224-2026-10-22/`. The prior DOL-194 baseline is retained
unchanged; its different 18 September–15 October window is not silently mixed
with this ledger's window.
