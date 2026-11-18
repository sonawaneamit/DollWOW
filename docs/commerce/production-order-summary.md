# Production Order Summary

This read-only export is a review document, not factory approval, a packing slip,
supplier invoice, or a replacement for Shopify's order of record. No orders,
payments, emails, products, settings or notifications are changed.

## Export

Fetch a complete authenticated Admin GraphQL order snapshot into a private,
gitignored file with `{capturedAt, order}`. Request the fields declared by
`ProductionOrder` in `lib/orders/production-summary.ts`, including all line
pages, current quantities, discounted line totals, public choice attributes,
product tags and shipping flags. Do not include customer contact details or
checkout tokens. The input must not come from a browser-submitted cart or the
current catalog's defaults. Keep the snapshot and output private.

```sh
node scripts/export-production-order.mjs data/exports/private/order.json data/exports/private/summary.json
python3 scripts/render-production-order.py data/exports/private/summary.json data/exports/private/output/pdf/order-review.pdf
```

Use `--notes <private-json-list>` on the renderer to include unresolved review
questions, never to silently replace customer selections. Render the PDF to PNG
and review every page before sharing. Refresh the snapshot if the order changes.

## Accuracy Rules

- Amounts are customer-paid, not supplier costs. Discounted totals are authoritative;
  label surcharges are not added twice. Use exact integer cents for supported currencies.
- Missing pages, changed quantities, refunds, duplicate properties or unreconciled
  money stop export. Other currencies need an explicit precision policy.
- Named upgrades associate by exact build ID. Legacy lines associate only by a
  uniquely matching recorded parent reference. Prices never identify a selection.
- Split payment components with identical choice details are combined financially,
  not counted as separate heads. Distinct dependent choices remain distinct.
- Unknown properties, missing labels, ambiguous parents, unrecorded choices,
  mixed shipping flags and `As shown` references require review. No automatic
  factory release exists. Hidden metadata is not exported.
- Product titles are historical snapshots, not independent feature/stock proof.
  All-brand tests cover the shared contract, not every supplier's current menu.

## Remaining Shopify Work

This patch does not change Shopify's native admin line titles or install an email
template. Current notification Liquid and target (staff/customer) are needed for
an exact private rendering patch. Generic denomination products cannot be renamed
per order safely. Extending the existing verified named-upgrade registry needs
reviewed product mappings and separately approved Shopify changes. The requested
2-3 brand admin/notification acceptance remains pending controlled QA; no test
orders or emails are created by these commands.
