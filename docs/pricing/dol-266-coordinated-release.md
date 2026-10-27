# DOL-266 Coordinated Price Release

Martin approved the exact prices in Linear comment
`59737b00-bde9-447b-a617-d508ba337667`; the ticket explicitly requests live
application and was assigned in queue #6 on 27 October. This approval is distinct
from DOL-257's newer preview-first hold. No Freya change is authorized until
Dolly confirms actual supply.

## Exact Scope

| Product | Variant | Before USD | After USD |
| --- | --- | ---: | ---: |
| Luoyi 178P | 53881274859704 | 2199 | 2499 |
| Lyla 178P | 53881277513912 | 2199 | 2499 |
| Kirishima Eira 178P | 53881277579448 | 2199 | 2499 |
| Jarliet Kate 148E | 53880072372408 | 1699 | 1799 |

Read-only Admin and Storefront preflight confirms exact handles/IDs, one variant
per product, ACTIVE status, current prices and null compare-at values. Similar
170cm/168cm Castle products and other Kate listings are outside scope.

## Preset And Checkout Evidence

All four existing preset runtime hashes include base price. A price-only Shopify
write would invalidate those exact preset bindings. This release therefore
updates only the four runtime hashes, keeping every recipe, option, named-charge
mapping and unrelated product entry unchanged. The entire approved payload hash
is recomputed; approval text explicitly describes this four-product delta and
retention of prior unchanged scope, not a new review of the entire catalog.

The private fresh-source preflight confirms the previous runtime hashes match
live products, all existing recipes are available, every priced option has an
exact named-charge binding, and DollVue appearance fingerprints remain identical.
All 76 unique named-charge variants were read back from Admin: ACTIVE and exact
released amounts. No real cart, checkout, order or payment is needed or performed.

Expected preset totals after the price delta:

- Castle Starter / Enthusiast / Collector: USD 2559 / 2768 / 2998 (all three models).
- Jarliet Kate: USD 1859 / 2157 / 2307.

Presets include their existing selected add-ons; they are not the bare base price.
No promotion or compare-at logic changes. The existing live promo continues to
apply under its current eligibility rules. No net-margin claim is made.

## Coordinated Rollout

1. Validate the exact four-record registry delta, full typecheck, focused tests,
   owned-asset gates and hosted build.
2. Build a production candidate without assigning live domains. No code from
   other preview worktrees is included.
3. Fresh-read all four variants and compare with the retained before snapshot.
   Abort before writes on any identity, price, compare-at or menu drift.
4. Write only each exact variant's `price`; never submit compare-at, cost, options,
   tags, inventory, availability or publication fields.
5. Immediately promote the ready coordinated registry candidate, then verify all
   four live PDP prices, customizer/preset totals and unchanged option deltas.
6. Preserve raw before/after and deployment receipts privately and report the
   completed four-product subset to Dolly. Freya remains BLOCKED for supply.

During the brief price/domain handoff the fail-closed selector may hide preset
shortcuts on a fresh request; manual configuration and server repricing remain
available. Do not bypass the selector or publish a generic brand-wide fallback.
If promotion fails, stop and restore only these exact prices after verifying
they still equal this run's after-values; retain the existing live registry.

Private evidence and operational scripts:
`data/exports/dol-266-2026-10-27/`. This document describes the reviewed release
plan; actual write/promotion/live verification status is recorded in Linear and
the durable checkpoint, not inferred from this file's presence.
