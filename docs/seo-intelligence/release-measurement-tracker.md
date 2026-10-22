# Release Measurement Tracker

Owner: Codex. Reviewer: Dolly / Martin. DOL-224, 22 October 2026.

The authoritative ledger is [release-measurement-tracker.csv](release-measurement-tracker.csv).
Its provenance is [release-measurement-sources.json](release-measurement-sources.json).
This is measurement infrastructure, not approval to publish or activate a monitor.

## Current Coverage

- Ten distinct Sprint 1 canonical shopping pages; all eleven DOL-195 and
  DOL-200 through DOL-209 tickets are represented.
- Thirteen URL-level website-release events across five production commits.
  The shared DOL-195 mobile layout affected six collection URLs.
- Three accepted no-change audits (male, torso, Asian) are separate assessment
  rows, not invented deployments. Their review dates use the acceptance time.
- Repeated URLs represent successive real changes, not extra pages. Never sum
  repeated baseline values across event rows to report business totals.

## Baseline Definitions

The baseline is 22 September through 19 October 2026 inclusive, the 28 complete
dates preceding the 20 October releases. GSC final web page rows use Pacific
dates, all countries and devices. GA4 uses property 549359657, production-host
landing-page sessions across all channels, with America/New_York dates. These
are different measurements, not a click-to-session reconciliation or attribution
model. The separate QA property and development hosts are excluded.

Nine GSC page rows and seven GA4 landing-page rows returned. Missing rows stay
blank with explicit status fields. They are not replaced by zero demand or zero
sales. A returned row may legitimately contain measured zero clicks. GSC
suppression and GA4 consent/coverage limitations remain. The pre-repair purchase
tracking gap and pending genuine-order reconciliation do not support sales claims.

GSC URL Inspection was read on 22 October. Nine current stored verdicts report
indexed; Irontech reports `Crawled - currently not indexed`. Every reported last
crawl predates the releases. A successful API read is not a fresh crawl, a live
test, or proof that revised content was indexed. Historical indexing status at
release was not captured and cannot be reconstructed from today's verdict.

## Event And Review Dates

Actual release times come from GitHub Production deployment-success statuses,
not PR creation, merge time, planned dates or comment prose. Release-ticket live
receipts and Dolly's independent acceptance are retained as corroboration.
Review dates are the event's UTC anchor plus exactly 28, 56 and 84 days.
For the 20 October cohort those dates fall on 17 November, 15 December and
12 January. Daily operational checks can start earlier; those milestones are
not instructions to wait for 28 days before looking.

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

The initial ledger is checked for sixteen rows, ten unique URLs and eleven
ticket IDs; thirteen release events and three no-change assessments; exact
28/56/84-day offsets; blank missing values; and no release time on audit-only
rows. CSV is independently parsed and compared with the JSON evidence before
handoff. Indexing freshness remains an explicitly unresolved observation, not
a reason to rewrite these pages without evidence.

Private raw evidence and reproducible collectors are on the external project
drive in `data/exports/dol-224-2026-10-22/`. The prior DOL-194 baseline is retained
unchanged; its different 18 September–15 October window is not silently mixed
with this ledger's window.
