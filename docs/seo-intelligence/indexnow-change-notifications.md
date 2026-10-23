# IndexNow Change Notifications

Owner: Codex. Delivery and review: DOL-226. Status: implementation under review;
subscription activation and production receipts must be recorded on the ticket.

## Scope

- Reuse the existing public key file; `data/indexnow.json` supplies the same key
  to runtime and the manual operator tool. No key rotation or secret exposure.
- The product-only Shopify callback accepts raw-body HMAC-authenticated
  `products/create` and `products/update` from the configured shop. Register it
  through the same Shopify app whose client secret verifies its signatures,
  not a manually created Admin webhook with a different signing secret.
- A first observed public product, changed variant price, rename or unpublishing
  of a previously notified product triggers canonical URL notification.
  First observation bootstraps state; it is not proof of a historical price
  change. Metadata-only updates after that do not trigger another notification.
- Draft, future, held, test, hidden-brand and system-charge listings are excluded.
  Deleted products without a retained source record cannot be reconstructed by
  this callback; the manual changed-URL tool remains the explicit fallback.
- App-owned JSON product metafields store only canonical URLs, fingerprints and
  timestamps. Conditional compare-digest writes claim each change; a 90-second
  lease lets failed deliveries retry. No customer, supplier-cost or order data.
- Previews authenticate but never call Admin or IndexNow. No order webhook,
  purchase tracking, commercial price or catalog publication is changed.

## Guarantees And Limits

Shopify delivery is retryable, not exactly once. Active claims return HTTP503;
success is saved only after IndexNow accepts the request. A process failure
after acceptance but before persistence can repeat a notification on retry.
No claim of exactly-once delivery, guaranteed crawling, indexing or rankings.
Shopify's delivery deadline also means a slow Admin/IndexNow request may retry;
the persistent claim prevents simultaneous requests from notifying twice.
Products exceeding the verified 250-variant read fail closed for review.

HTTP200 means IndexNow received the notification; HTTP202 means received with
key validation pending. Neither proves indexing, and an agent-authenticated key
check does not establish anonymous crawler access through Cloudflare. Actual
Shopify ingress must work without the operator-only agent header; never put
that header or secret in the callback URL or IndexNow payload. A WAF block is
a separate dependency requiring a narrowly reviewed access decision.

Existing llms.txt and agent-index.json already use the shared visible-learning
article predicate, including scheduled publication dates, and point to the
canonical sitemap/product feed for complete catalog discovery. Preserve that
automatic synchronization instead of copying all products into these maps.
New code-driven guide or collection releases still need an explicit changed-URL
IndexNow submission in their approved release receipt; these are not Shopify
product events. No recurring job is activated by this change.

## Release Checklist

1. Run the focused IndexNow, webhook, persistence, feed-sync and analytics
   isolation tests; typecheck, lint and build. Confirm protected preview key
   bytes match the existing file and invalid callback signatures fail closed.
2. Release the exact reviewed commit under DOL-226's low-risk authorization.
   Verify the key file and signature rejection on production.
3. Inspect existing app subscriptions, create only missing PRODUCTS_CREATE /
   PRODUCTS_UPDATE callbacks at `/api/webhooks/shopify/products`, and preserve
   unrelated subscriptions. Record IDs privately; no signing secrets in Linear.
4. Send one valid, authenticated notification for a recently published public
   product, checking accepted200/202 and persisted fingerprint. Repeat the same
   notification and confirm unchanged/no extra outbound call. Do not change a
   real product price just to demonstrate a test.
5. Verify real Shopify ingress through delivery evidence; do not infer this from
   an operator request carrying the agent header. If blocked, record exactly
   which step remains rather than calling automatic notifications live.
6. Use the existing verified Bing property to record all current sitemap
   submissions, or state the exact account-access blocker. Do not resubmit
   repeatedly or re-verify an already verified property without a prompt.
7. Append the actual production event to the DOL-224 release ledger once accepted;
   retain access gaps and avoid attributing organic growth to this infrastructure.

Rollback: remove only this feature's app subscriptions (capture IDs at activation),
then revert its code if necessary. Leave the existing public key and unrelated
webhooks intact. Retained app-owned fingerprints are inert without deliveries.

## Primary References

- https://www.indexnow.org/documentation
- https://shopify.dev/docs/apps/build/webhooks/verify-deliveries
- https://shopify.dev/docs/api/admin-graphql/latest/mutations/metafieldsset
- https://shopify.dev/docs/api/admin-graphql/2026-04/enums/MetafieldsSetUserErrorCode
