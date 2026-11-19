# BFCM restoration dry run — DOL-371

Status: preparation only; no Shopify write or scheduled production mutation is enabled.

The preview applies prices and included options from the current catalog in memory.
Production is gated out. The preview reverts to catalog values after the offer deadline.

For the approved production release, retain a journal for each exact variant and
customization metafield: original value, promotional value, source updatedAt and
release time. Restore those saved values, never reconstructed estimates. Top Fire,
Galatea, Climax and 6YE revert at 2026-12-11T04:59:00Z. IDO reverts at
2026-12-01T00:00:00Z (end of November in Lisbon, pending any more precise supplier timezone).

Schedule a server job before activation. The job must be idempotent: only restore
values that still match the promotional journal. Report any intervening edits for
review rather than overwriting them. Verify the Shopify readback for every variant
and metafield, and refresh affected cached product pages. Store completed IDs so
retries skip completed changes. Keep a fallback scheduled retry until readbacks pass.

The current per-SKU dry-run is in output/dol371/brand-promo-dry-run.json. It contains
old/new base prices, compare-at, included-option deltas, deadlines, and calculated
base-plus-code totals. It is not an executed write journal, and it is not evidence
that a production restoration job is scheduled. Production scheduling and activation
remain part of the owner-approved release, not this private preview.

The read-only decision helper is `scripts/promotions/plan-restoration.mjs`.
Its tests cover exact deadlines, original compare-at restoration, unchanged retry,
intervening edits and exact customization JSON bytes. The captured catalog simulation
in `output/dol371/restoration-qa.json` covers 383 products. It is a simulated
restoration plan, not an activated scheduler or proof of a Shopify restoration.
