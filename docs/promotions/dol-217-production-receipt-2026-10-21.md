# Halloween production release: 21 October 2026

## Released

- Live page: https://dollwow.com/promo
- Approved campaign: HALLOWEEN299, one fixed USD 299 discount per order on
  eligible complete base dolls, not paid options, parts or shipping.
- Both near-cost Top Fire RTS units remain included, as Martin approved.
- Ends 8 November 2026 at 23:59 Europe/Lisbon = 23:59 UTC.
- Shopify discount: `gid://shopify/DiscountCodeNode/1819411579064`, ACTIVE,
  starts 21 October 16:19:33 UTC. All discount combinations disabled.
- Old automatic discount `1811452526776` reads EXPIRED, ended 16:25:15 UTC.
  No automatic revival after Halloween. Unrelated discounts were not changed.
- PR152 merged as `9cb3457cd33aa5c461535028c041cf56a2a419fa`.
  Runtime source tree matches release source `1dfbad7a` exactly.
- Production deployment `dpl_8VbjX4JQAzVujSMqN6Paekw4adcW` built from a clean
  source archive, first staged without live domains, then promoted successfully.
  The main-branch integration build also reports success.
- Stale-head PR151 superseded and closed; its old CI was not used as evidence.

## Eligibility

Exact readback: 3,147 products, each with one reviewed base variant, in private
manual collection `gid://shopify/Collection/664592384184`. Storefront lookup
returns null, confirming it was not published. Shopify rejected the earlier
explicit-variant approach because it permits only 100 selected variants.

Inventory also records 2,459 excluded system/option-charge/mini/partial/head
products and five unresolved form/height identities. These five are not silently
classified as full-size; their handles and reasons remain in the private audit
and the Linear review handoff. No product, draft brand, price or media changed.
Forty-eight eligible RTS products still have unknown usable USD costs; this is
not treated as zero cost or a verified profit margin.

For any new product published during the campaign: verify full-body form,
height over 120cm and a base-only variant, then add it to this collection and
test the code. Do not add draft products or option-charge products. No automatic
catalog-tagging or publication workflow was activated by this release.

## Actual Verification

- 144 tests across 11 focused suites passed, scoped lint and typecheck passed.
- Local optimized build and remote production build passed. Owned asset gate:
  4,950 verified assets, zero failures. Existing visual-index broad-glob and
  DollVue dynamic-render warnings remain, unrelated to this campaign.
- Nine browser interaction groups passed on the optimized local build:
  desktop/mobile body taps and scurry, copying, focus trap, Escape/persistence,
  underlying control priority, real 30-second fallback, reload/menu deferral,
  excluded routes and reduced motion. Real fallback was 325ms after deadline.
- Expiry simulation: campaign ended message, generic announcement, zero walkers;
  no return of 10% text.
- Authenticated Brave readback on the staged production deployment confirmed
  the actual H1/end date and absence of preview-only copy.
- Live HTTP checks: home and /promo return 200 with the new announcement and
  no old 10%/preview text; both approved desktop/mobile artwork URLs return 200
  image/webp. An automated live visual rerun received Cloudflare 403: no browser
  protection was bypassed. The earlier owner-provided agent-header secret is no
  longer at its Desktop path. Do not claim a fresh live visual screenshot pass.
- Thirteen final real Shopify cart cases passed after retiring 10%: custom,
  each approved Top Fire RTS, quantity two, two different dolls, base plus paid
  charge, torso-only, mini-only, head-only, charge-only, mixed cart, no-code and
  actual GBP context. Total discount remains 299 USD once per order; excluded
  lines receive none, and no-code cart receives no automatic 10%.
- Shopify converted the international test to GBP 226.45 at the observed rate;
  this is an observation, not a fixed GBP price promise.
- Actual checkout.dollwow.com page inspected and captured: Vivian USD 2,266 ->
  1,967; HALLOWEEN299 (-299.00); total savings 299.00. No old 10%, buyer identity,
  delivery address, payment submission or order creation.

Private receipts under `data/exports/dol-217/`: release-eligibility-readback.json,
release-current-discounts.json, release-checkout-carts.json,
release-actual-checkout.json, release-shopify-checkout.png,
release-public-http.json and v5-catch-qa.json. Checkout screenshot also attached
to DOL-217 Resources. Cart IDs/checkout tokens are not posted publicly.

## Recovery

`DOLLWOW_HALLOWEEN_ENABLED=0` in a replacement deployment disables the visual
campaign. Deactivating the exact Halloween discount stops redemption. Never
restore the old 10% without fresh authorization. Preserve the preflight and
retirement snapshots. Rolling code back alone does not revert Shopify settings;
coordinate customer-facing copy and discount state together.
