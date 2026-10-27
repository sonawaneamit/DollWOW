# DOL-212 Diagnostic Proposal

Status: investigation and preview/test code only. The missing USD 2,267 genuine
purchase remains unresolved. One approved USD 0 QA checkout completed on 27 October
at 18:39:19 UTC, then was tagged/canceled and its single-use discount deactivated.
Do not create another order, replay events or backfill GA4.

## Evidence And Limits

- Retained QA cart and order preserve the actual consented browser client/session
  identity. This does not prove Shopify's checkout pixel consent was granted.
- QA finished as a guest on checkout.dollwow.com after an initial Shop Pay redirect.
  The final pixel runtime consent and event/network trace were not captured.
- Early Realtime and processed exact-transaction lookups were empty. They were
  early observations, not mature delivery verdicts. Do not repeat rapid empty polls.
- The exact historical checkout runtime, consent decision, event host, tag load
  and delivery receipt are missing. No single historical root cause is established.
- An emitted Google callback is not independently verified GA4 delivery.

## Concrete Source Gap

`writeConsent` currently writes DollWOW local storage and Google consent state.
It does not call Shopify's Customer Privacy API. `captureCheckoutAnalytics`
transfers identifiers only; that attribute must never be treated as consent.
The checkout pixel separately requires Shopify's analyticsProcessingAllowed flag.
Thus a storefront acceptance can coexist with unregistered checkout consent.
This is a verified source integration gap and a plausible failure path, not proof
that it caused this historical order or the completed QA event.

Shopify's [Customer Privacy API](https://shopify.dev/docs/api/customer-privacy)
applies permission decisions to Shopify-managed checkout/pixel surfaces. It
requires recording choices on visitor interaction and forbids direct manipulation
of Shopify consent cookies. Its [pixel migration guidance](https://help.shopify.com/en/manual/promoting-marketing/pixels/pixel-migration)
warns that a third-party banner which does not sync consent can leave pixels silent.
The [pixel privacy API](https://shopify.dev/docs/api/web-pixels-api/pixel-privacy)
confirms the current init.customerPrivacy / visitorConsentCollected API shape.

The current headless integration must use a supported SDK/API loading and consent
transport configuration. Do not paste a private Storefront token into browser code
or add a broad GraphQL proxy. Do not migrate the Next.js app to Hydrogen as a
side effect of this investigation. A public-token or restricted proxy design and
current SDK compatibility need verification before wiring the adapter.

## Test-Only Candidate

- `registerExplicitShopifyAnalyticsChoice` tests forwarding an explicit accept or
  decline through an injected supported API. It grants analytics only, keeps
  marketing/preferences/data-sale false, never replays saved/unknown consent,
  and reports absent API, failure or timeout without a fallback grant.
- The adapter is deliberately not wired into the live banner. This is not a
  completed end-to-end consent bridge or an installed repair.
- Pixel diagnostics now distinguish host rejection, absent order, expired/malformed
  identity, deduplication, consent withdrawal, script load failure, runtime failure,
  queueing and callback. Logs contain only fixed reason codes, not URLs, hosts,
  customer/order/client/session identifiers or event payloads. Diagnostics stay
  off unless explicitly enabled. Host/TTL/stream/consent gates are unchanged.
- The shop.app rejection is a simulated allowlist observation. We do not know
  whether the real completion event was expected on that host. Do not broaden the
  allowlist on that fact alone.
- Shopify documents checkout_completed as a one-time event, often on Thank you
  or a post-purchase page; a page load failure can prevent emission. See the
  [checkout_completed contract](https://shopify.dev/docs/api/web-pixels-api/standard-events/checkout_completed).

## Needed To Resolve

1. Codex: finish supported headless consent transport in an isolated preview using
   the actual checkout domain and an approved public-token/restricted proxy design.
   Verify explicit accept, decline, reload and withdrawal without a new order.
2. Dolly / Shopify admin: retain available Pixel Helper consent/event/error evidence
   for the existing QA run; do not contact a customer or ask them to replay checkout.
   If no historical trace exists, preserve that limitation instead of inventing one.
3. Martin: separately approve the exact production consent/pixel patch after preview
   review. No production pixel, privacy or account setting changed in this work.
4. Codex: after normal GA processing maturity, read the exact QA transaction in the
   QA and production properties, checking isolation and duplicates. Do not infer a
   missing event before that window or use a canceled zero-value test as paid-sale proof.
5. Reconcile the next genuine consented paid sale in Shopify and production GA4:
   transaction ID privately, merchandise value plus separate shipping/tax, currency,
   aligned time and source/session, one purchase, Realtime and processed receipts.
   Dolly reviews. Only then can the original acceptance criteria be considered met.
