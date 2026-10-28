# Weekly Release Measurement: 26 October 2026

Catch-up captured 2026-10-27T18:56:44.724Z (27 October). Original ledger: 3957 rows, byte-preserved. Final GSC dates verified: 12-25 October.

## Site GSC

| Window | Clicks | Impressions | CTR | Weighted position |
|---|---:|---:|---:|---:|
| prior | 57 | 956 | 5.96% | 8.25 |
| current | 108 | 1284 | 8.41% | 8.33 |

Prior:12-18Oct; current:19-25Oct. Site totals use date rows, not sums of overlapping cohorts.

## Per-Release Observations

C/I = returned clicks/impressions; GA = all-channel production-host landing sessions. Missing page rows remain unknown. URL counts deduplicated within each cohort.

| Ticket / commit | URLs | Prior C/I | Current C/I | Prior / current GA | Current GSC URLs returned | Inspected / PASS / post-release crawl |
|---|---:|---:|---:|---:|---:|---:|
| DOL-195 / af9697af | 6 | 10 / 214 | 7 / 197 | 6 / 2 | 4 | 6 / 6 / 2 |
| DOL-200 / 281d9343 | 1 | 1 / 11 | 1 / 22 | 2 / unknown | 1 | 1 / 1 / 1 |
| DOL-201 / aa8627e0 | 1 | unknown / unknown | unknown / unknown | 1 / unknown | 0 | 1 / 1 / 0 |
| DOL-203 / 07b108ee | 1 | unknown / unknown | unknown / unknown | unknown / unknown | 0 | 1 / 1 / 1 |
| DOL-206 / 292772ba | 1 | unknown / unknown | 1 / 5 | unknown / unknown | 1 | 1 / 1 / 1 |
| DOL-207 / 292772ba | 1 | 0 / 3 | 2 / 8 | unknown / 2 | 1 | 1 / 1 / 0 |
| DOL-208 / 292772ba | 1 | 0 / 3 | 0 / 3 | unknown / unknown | 1 | 1 / 1 / 0 |
| DOL-209 / 292772ba | 1 | unknown / unknown | unknown / unknown | unknown / unknown | 0 | 1 / 1 / 0 |
| DOL-202 / no-change audit | 1 | 0 / 7 | 0 / 3 | unknown / unknown | 1 | 1 / 1 / 0 |
| DOL-204 / no-change audit | 1 | 0 / 3 | 0 / 9 | unknown / unknown | 1 | 1 / 1 / 0 |
| DOL-205 / no-change audit | 1 | 9 / 193 | 6 / 163 | 3 / 2 | 1 | 1 / 1 / 0 |
| DOL-225 / a4e88e15 | 3522 | 34 / 684 | 72 / 891 | 45 / 67 | 223 | 10 / 10 / 3 |
| DOL-227 / b9e86504 | 11 | 1 / 12 | 4 / 72 | 2 / 1 | 8 | 0 / 0 / 0 |
| DOL-243 / e1f35496 | 393 | 0 / 16 | 0 / 9 | 5 / 4 | 6 | 1 / 1 / 0 |
| DOL-229 / 26bd7ff4 | 5 | 3 / 122 | 20 / 205 | 3 / 9 | 5 | 0 / 0 / 0 |
| DOL-229 / f96475f9 | 5 | 2 / 56 | 3 / 54 | 2 / 4 | 5 | 0 / 0 / 0 |
| DOL-229 / 959a757a | 1 | 1 / 18 | 1 / 8 | unknown / 1 | 1 | 0 / 0 / 0 |
| DOL-231 / cb421b99 | 2 | 1 / 7 | 1 / 14 | 2 / unknown | 2 | 0 / 0 / 0 |
| DOL-230 / 87bc0877 | 1 | unknown / unknown | unknown / unknown | unknown / unknown | 0 | 0 / 0 / 0 |
| DOL-232 / 9dcbe720 | 1 | unknown / unknown | unknown / unknown | unknown / unknown | 0 | 0 / 0 / 0 |

Full cohort CTR, position, missing-row counts and inspection timestamps: [structured report](weekly-release-measurement-2026-10-26.json).

## Limits And Remaining Work

- Catch-up run on27Oct, not an on-time26Oct run.
- Complete final GSC dates12-25Oct verified; page-grouped data can be suppressed. Missing returned URL rows are unknown, not zero.
- Weeks include pre-release days. Too early for causal lift;28/56/84-day anchors unchanged.
- Cohorts overlap; never sum them to site totals. CTR weighted from clicks/impressions; position impression-weighted.
- GA4 production-host landing sessions, all channels, America/New_York; GSC Pacific dates. Not sales attribution or a click/session reconciliation. DOL-212 coverage unresolved.
- Only ten Sprint1 URLs inspected via stored URL Inspection results; not a full rollout scan or live Google fetch. Crawl timestamp must postdate each release to confirm revised content.
- Bing comparable indexed count not captured; missing is not zero. No indexing submissions, site changes, checkout or settings writes.
- Pending scheduled-guide publication discovery and recurring scheduler verification are not completed by this measurement receipt.

Raw read-only request/response artifacts: `data/exports/dol-224-weekly-2026-10-27/` (ignored local evidence). No customer, purchase or user-identity rows requested.
