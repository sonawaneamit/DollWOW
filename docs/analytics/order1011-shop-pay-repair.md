# Shop Pay purchase tracking repair — 19 November 2026

Martin reported that genuine paid orders repeatedly failed to appear in GA4 and
instructed Codex to fix the integration. Read-only Shopify transaction evidence
confirms WOW#1011 and WOW#1009 both used SHOPIFY_PAY. The connected custom pixel's
saved source was read from Shopify and matched SHA-256
`7c494ec1a353014e4a59fed96bb18e2ac4b047249da051cf62b2d9a244024dc8`.
It was enabled for production, required analytics permission, and classified as
not selling data.

## Confirmed defect and repair

The installed pixel rejected `shop.app` before reading the checkout's analytics
attribute. Shopify documents `shop.app` alongside merchant domains and
`shopify.com` as checkout domains:
https://shopify.dev/docs/api/checkout-ui-extensions/2025-07/ui-components/media-and-visuals/map

Add the exact `shop.app` hostname to the existing allowlist. No wildcard domains,
consent bypass, stream change, second purchase emitter or historical replay.
The checkout attribute already carries identity across domains without needing
the merchant's first-party cookie. The existing transaction key prevents a second
emission if completion is subsequently observed on the merchant domain.

Regression coverage exercises Shop Pay with attributes and no cookie, duplicate
completion on another allowed domain, denied consent, expired/malformed identity,
disabled production and lookalike/preview host rejection. Local tests must not
send actual GA purchases or create Shopify orders.

## Evidence limits

This proves a deterministic supported-domain rejection, not the historical event
hostname of a customer whose browser trace was not retained. The historical
orders' payment method alone cannot establish the exact pixel execution host or
whether permission, blockers, page loading or other failures also contributed.
The prior failed zero-dollar guest QA checkout is not explained solely by this
Shop Pay repair.

The latest sale's analytics attribute was only about 147 seconds old at creation
and matched the production stream. It is not an expired-context explanation.
Processed reporting was still immature during initial inspection. GA uses
America/New_York; the Nov19 03:59 UTC sale belongs to Nov18 at22:59 there.

After installation, reload the saved Shopify pixel, compare its entire source to
the generated artifact, and verify the connection and analytics-only permission.
The next genuine consented purchase must be reconciled independently in GA before
claiming end-to-end paid-sale delivery. Do not manufacture this proof with a new
order, replay, or by interpreting a Google callback as a delivery receipt.
