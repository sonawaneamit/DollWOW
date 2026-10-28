# DOL-212 Diagnostic Proposal

Status updated 28 October: Martin explicitly approved the verified public-token
Shopify consent handoff and no-PII pixel diagnostics in chat (Linear approval
`8612a9f8-3d39-4d0a-a95e-809224fa6ad9`). Diagnostics are installed and exact saved
readback verified. The consent handoff source is being released separately;
deployment and runtime verification receipts must confirm its live state.
Historical statements below describe the earlier proposal and are not blockers
for these now-approved steps. The missing USD 2,267 genuine
purchase remains unresolved. One approved USD 0 QA checkout completed on 27 October
at 18:39:19 UTC, then was tagged/canceled and its single-use discount deactivated.
Do not create another order, replay events or backfill GA4.

## Approved Implementation, 28 October

- Load the official v0.2 Shopify privacy SDK only after a visitor presses Accept
  or Decline. No saved-consent replay and no manual Shopify cookie manipulation.
- Forward only explicit analytics choice; marketing, preferences and data sale
  remain false. Send to `checkout.dollwow.com`, with storefront `dollwow.com`.
- Require dedicated `SHOPIFY_PUBLIC_CONSENT_TOKEN`, independently verified against
  Shopify's public Storefront token metadata, plus the explicit production
  `SHOPIFY_CONSENT_HANDOFF_ENABLED=1` switch. Never fall back to an Admin or private
  credential. Both production keys were added under Martin's exact approval;
  values are not in Git, logs or Linear.
- Coalesce choices superseded during SDK load, serialize actual SDK requests,
  contain load/request failures, and verify current consent through the API.
  Callback success alone is not permission or purchase-delivery proof.
- Returning visitors without a confirmed sync marker receive a fresh confirmation
  prompt. The marker contains only state/time and is not itself Shopify consent.
  A missing marker never silently registers an earlier stored choice.
- The existing connected purchase pixel retains its Analytics-only requirement,
  no-data-sale classification, exact host/TTL/stream/deduplication gates and
  purchase fields. Only fixed diagnostic reasons and script/error/callback
  observability were enabled. Saved source hash:
  `7c494ec1a353014e4a59fed96bb18e2ac4b047249da051cf62b2d9a244024dc8`.
- Official SDK bytes inspected on 28 October have SHA-256
  `3b597d5d8e66c799f844ac5bc748549bf06090bb63b0ba540c2ef958f11496c8`;
  provenance: `https://cdn.shopify.com/shopifycloud/consent-tracking-api/v0.2/consent-tracking-api.js`.
  Do not reverse-engineer or fabricate the SDK's cookies or consent requests.

Rollback: previous production deployment is
`dpl_6n9321f5zFyP6VLEMaWonnU9KG4h` (source `de9f0a1c`). Previous exact pixel source
is retained privately as `pixel-before.js`, hash
`042d0ba32797fbfe77bad291061bb994e42353485926947ae05e3ef32e900373`.
Changing an environment flag alone does not change already-built deployments.
Revert the scoped source or promote the retained deployment if rollback is needed.

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

### 28 October Reconciliation Checkpoint

The read-only collector at `scripts/analytics/collect-reconciliation.mjs` saves
dated GA requests/responses for daily, device, page, source and hostname reports
under ignored `data/exports/dol-212-reconciliation-2026-10-28/`. It neither sends
events nor changes configuration. Production dates are 28 September through
27 October in America/New_York. Do not sum users or sessions across dimensions.

- Exact main hostname: 3,009 GA page views; mobile 2,590, desktop 381, tablet 38.
- Vercel refreshed the same fixed range to 8,412 main-host views (previous capture
  was 8,335). Its displayed device shares are rounded: mobile 54%, desktop 44%,
  tablet 2%. The desktop discrepancy is disproportionately large; this is not
  proof of bots, blockers or consent denial.
- `/shop/sex-dolls` has 825 GA views versus 931 in the refreshed Vercel view.
  A single global scaling factor would hide page-level differences.
- All 30 GA days have recorded page views. No complete zero-collection day was
  found; partial collection failures remain possible.
- The Vercel CSV download could not be confirmed through the browser tooling.
  No daily Vercel series was extracted; do not invent a date-level reconciliation.
- Mature QA and production purchase reports for 27-28 October returned no rows.
  The second day remains partial; no historical root cause or repair is proven.

Local review: `http://127.0.0.1:3312/review/analytics`, enabled only with
`VERCEL_ENV=preview` and `DOL212_LOCAL_REVIEW=1`. It uses the real banner and
PageViewTracker with a separate QA stream, displaying only fixed command labels.
It does not show identity values, event payloads or network delivery receipts.
Eight observed browser cases covered unknown consent, accept, two navigations,
withdrawal/navigation, denied reload, reaccept and granted reload. Expected page
view queue behavior passed; the Shopify handoff remains unwired. This is not a
purchase test and no new order was placed. The review route is unavailable in
production; it must not be enabled there.

The unwired adapter now requires the explicit headless domain contract and an
attested public Storefront credential. Prefix checks are defense-in-depth, NOT
proof a token is public. Existing server credentials have not been exposed or
repurposed. SDK loading, checkout-domain transport and runtime permission
readback still need supported integration and verification before release.

Direct configured Google access works; the expired Treg connector does not block
these reports. Production consent/pixel changes still need exact approval.

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
