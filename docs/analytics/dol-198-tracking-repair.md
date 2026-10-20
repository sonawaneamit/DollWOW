# DOL-198: consent-aware purchase tracking repair

## Authority and boundary

Martin approved the repair on 20 October 2026 at 17:06 Lisbon in DOL-198.
Due 21 October; Dolly reviews the observable receipt and closes the issue.
No product, price, fulfillment, advertising or payment-method changes belong to this repair.

## One purchase source

The Shopify Customer events custom pixel, subscribed to `checkout_completed`,
is the only GA4 purchase emitter. The unused orders webhook returns 410 and
never parses, stores or forwards order data. The server analytics helper also
rejects purchases even if someone subsequently adds Measurement Protocol secrets.
Do not install a second Google/Shopify/GTM purchase emitter without revisiting this decision.

The pixel requires Shopify analytics permission AND a recent consented browser
context. Storefront `gtag('get')` supplies the actual client/session identifiers;
we never create `order.<id>` identities. The short-lived cookie is shared only
across the DollWOW domain, expires after 30 minutes and is cleared on withdrawal.
All current checkout entry points refresh it with a maximum 200ms wait; tracking
errors must never prevent checkout. First-load capture retries after the GA script loads.
The server validates and mirrors only those identifiers into a checkout attribute
when creating the cart. The pixel prefers that attribute, which survives Shopify
moving its order-status/customer-account page to `shopify.com`. The attribute
update preserves existing cart attributes, is bounded to two seconds in total,
and fails open for checkout. A missing/stale
attribute on an old saved checkout is a known attribution-coverage limitation;
the first-party cookie remains a fallback where available.

If an identifier is absent, stale, blocked, or consent is withdrawn at checkout,
the pixel does not send a purchase. Consequently GA4 is not a complete accounting
ledger. Reconcile to Shopify, with consent and blocker coverage disclosed.

Purchase `value` uses the checkout merchandise subtotal excluding shipping/tax;
those are separate parameters. Items use discounted line total divided by quantity.
No customer email, address, phone, customer ID, checkout token, free-text properties
or order notes are sent. `page_location` is a fixed full checkout URL without tokens.

In-flight and browser-persisted transaction markers reduce replays; the same
stable GA transaction ID supports GA's additional deduplication. A script callback
or collection HTTP 2xx is NOT proof of GA ingestion. The pixel is browser-based:
blocked scripts, failure to load the completion page and consent denial can prevent
delivery. Exactly-once delivery or complete organic attribution is not claimed.

## Deployment and consent isolation

- Production stream: `G-4V999366W5`, property `549359657`.
- Production GA requires Vercel production deployment and exactly `dollwow.com`
  or `www.dollwow.com`. No default production tag on local or preview builds.
- QA property: `559822344`; stream `16168351641`, `G-W8QNFJPX32`.
  This is a separate property, not just another stream inside business reporting.
- Non-production builds require both `GA_TEST_MEASUREMENT_ID` and exact
  `GA_TEST_ALLOWED_HOSTS`; the production ID is rejected for QA configuration.
- A production deployment may set the distinct `GA_TEST_MEASUREMENT_ID` to allow
  an explicitly opted-in QA browser (`dollwow_analytics_qa=1`) to use only the QA
  stream. Clear this short-lived cookie after validation. Normal visitors keep
  the production stream. Do not set a QA cookie for customers.
- Google library loading and client events require analytics consent. Advertising
  consent remains denied. Canonical page addresses omit query strings/fragments;
  safe campaign values are retained separately. DollVue no longer overrides its
  event location with a relative path.
- On the Shopify pixel: Analytics required; Marketing/Preferences not required;
  data sale disabled. Keep `productionEnabled:false` until isolated validation passes.

## Validation and release gates

1. Unit tests: deployment + hostname combinations; default/denied/granted consent;
   separate QA ID; no raw query/checkout tokens; one purchase emitter; withdrawal;
   duplicate callback; malformed money/currency/identity and no PII.
2. Browser checks: no production GA request from localhost, preview or test flows;
   consented QA page event, one route page event, cookie continuity to checkout;
   no request without consent; full DollVue page URL; checkout never blocked by GA.
3. Labelled zero-cost, non-shipping custom-item checkout only. No real inventory,
   payment credentials or invoice email. Tag `DOLLWOW_TRACKING_QA` and
   `DO_NOT_FULFILL`; exclude from business order counts as well as revenue.
   A zero-value tagged order is not a native Shopify `test:true` order. Disclose
   that distinction rather than silently relying on Shopify's default test filter.
4. Match its actual Shopify amount/currency/time and transaction identifier to
   QA GA ingestion. Revisit/replay and check the same transaction is not counted twice.
   Compare identifiers privately; keep public/Linear receipts aggregated/redacted.
5. Only then enable the canonical production pixel and release the site fix.
   Verify deployed hostname isolation, consent and sanitized page addresses.
6. Reconcile the next legitimate consented paid order separately. Do not backfill
   past orders as current purchases or call zero-dollar QA a revenue-attribution proof.

## Production-only reports

Use `production-report-request.json` with the existing Data API report command,
setting real start/end dates. Include only the three verified public storefront/
checkout hosts, on production property `549359657` only. QA events go to the
separate property; no unregistered custom dimension is needed. Historical dev and blank-host
rows are not deleted. An unfiltered property report still contains historical
contamination. Do not enable irreversible GA data filters just to hide it.

Shopify business aggregates must exclude `test:true`, cancelled test artifacts,
and `DOLLWOW_TRACKING_QA` tags. GA uses New York time, Shopify timestamps UTC, and
the QA property's creation default is Los Angeles: compare ISO UTC instants,
not merely calendar labels.

## Primary references

- https://shopify.dev/docs/api/web-pixels-api/standard-events/checkout_completed
- https://shopify.dev/docs/api/web-pixels-api/pixel-privacy
- https://shopify.dev/docs/api/web-pixels-api/standard-api/browser
- https://developers.google.com/analytics/devguides/collection/ga4/ecommerce
- https://shopify.dev/docs/api/admin-graphql/2026-04/mutations/draftOrderCreate

## Current receipt

Implementation, tests and isolated QA setup are not proof of a completed live
tracking repair. The DOL-198 comments and private dated validation evidence record
the current rollout state, failures, and remaining gates. Do not mark Done before
the end-to-end receipt or a precise unresolved-gap handoff is reviewed by Dolly.

20 October isolated result: standard Storefront checkout emitted one QA purchase
at 18:16:21 UTC, matching the tagged $0 USD Shopify order created at 18:16:21 UTC.
GA4 Realtime independently shows one purchase in property 559822344. The earlier
two draft-invoice tests did not emit and are retained as failed tests, not counted
as evidence of success. All three are non-native-test, zero-dollar QA artifacts
and must be explicitly excluded from business order counts. The temporary
one-use QA code targets only the existing non-shipping, non-inventory $1 system
charge variant; it is not a change to advertised doll prices or promotions.

61 focused assertions pass. The full suite has the same 11 failing assertions
and two node:test/Vitest suite errors reproduced on unchanged main; it is not
claimed green. The private validation folder retains browser, Shopify, GA and
failed-attempt receipts. Production release is a separate verification step.
