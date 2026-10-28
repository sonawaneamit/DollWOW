# DOL-257 Approved Seven-Price Release

Martin approved the reviewed PR193 price list as-is on 28 October at12:45
(Linear comment310e895d-dc46-4e80-b48f-c4e303894d21).
This production release is separate from the read-only overlay preview.

Exactly seven verified variants: four US-stock bodies1653/1686/1808/1926 to
2065/2065/2399/2399, and three102/106cm torsos1045 to1299USD.
Admin IDs, SKUs, single-variant scope, ACTIVE status and all-null compare-at
were freshly verified. Only variant ID/retail price enter the mutation.
No cost, compare-at, menu, promotion, stock, tag or publication mutation.
Made-to-order listings are excluded. Required warehouse head choices remain
required and separately charged; no invented head-included offer.

Four exact existing runtime hashes require a price-only bridge before Shopify
updates. Only the reviewed after-price runtime can reuse its original approval;
other identity, tags, variant, currency and menu changes fail closed. Three
torsos retain their absent recipes. Display and checkout use Shopify prices.
The registry payload/approvals are unchanged; no blanket re-stamp.

The release script defaults to dry-run, verifies all seven before any write,
rereads each immediately, creates an exclusive write journal and stops on
ambiguous failure. Never rerun a partial journal blindly. Deploy and verify
the binding on the production alias before executing the approved batch.
Independently reread Admin/Storefront and capture each live PDP afterwards.

COGS remains a separate source reconciliation dependency. No913-row cost load
or torso shipping-inclusive margin claim is implied by this retail release.
