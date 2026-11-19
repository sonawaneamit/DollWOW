# DOL-381 / DOL-382 production registry relink (19 Nov 2026)

Replaces the placeholder runtime hashes from the first PR #276 commits with hashes computed by the app's own
`templateRuntimeHash` against a production Shopify Admin readback of the three draft products.

| Product | Shopify ID | Status | Base | Starter / Enthusiast / Collector | Runtime hash |
|---|---|---|---|---|---|
| Top Fire Clara T74 170cm E | 10742344941752 | DRAFT | $2,349 | $2,416 / $2,684 / $3,061 | `85d7ae14…` |
| Top Fire Tessa T75 160cm F | 10742344974520 | DRAFT | $2,299 | $2,366 / $2,634 / $3,011 | `fff82734…` |
| Irontech Scarlett S60 ROS MAX 171cm | 10742348513464 | DRAFT | $2,619 | $2,679 / $2,779 / $2,979 | `08b95677…` |

Tier totals are full price (no BFCM). ROS MAX is the default Scarlett head at $0.

## Method

- Drafts are not visible to the Storefront API, so `scripts/relink-dol381-382-from-admin.mts` reads them from the
  Admin API and maps them with `mapShopifyProduct`. It leaves out `bodyType`, `sourceTitle` and `sourceHandle`
  because the Storefront API cannot read those metafields.
- To check the method, I ran it on six live entries (Venus, Susan and Ivy on Top Fire, plus Betsy Bryce, Eileen
  Sophy and Elaine Nick on Irontech). For all six, the Admin-derived hash plus the existing price-binding chain
  equalled the registered hash. The real Storefront product also equalled it.
- Scarlett now has the `irontech-ros-max-included` handling in `lib/customization/irontech.ts`, taken from
  codex/dol381-scarlett. Without it, ROS MAX costs +$180 and the menu signature differs. Products without that tag
  keep their existing pricing, and the six live Irontech hashes above are unchanged.
- Scarlett's handle was wrong in the first PR commit (`…-s60-ros-max`). It is now the real Shopify handle
  `…-s60-ros-max-silicone-companion-doll`. Its binding uses a `sha256:` signature of the actual menu, under key
  `irontech-scarlett-s60-ros-max-0a97cd5ddad0`. The tiers are unchanged from Codex's reviewed recipe.
- Clara and Tessa reuse the existing `topfire-female-e17ed253b743` binding. Their menu signature matches it.
- `scripts/register-clara-tessa.mjs` and `scripts/register-scarlett.mjs` were removed. They wrote simplified,
  non-runtime hashes.
- `tests/dol381-382-registry.test.ts` freezes the readback (`tests/fixtures/dol381-382-admin-readback-2026-11-19.json`),
  the hashes, the signatures and the tier totals.

## Before go-live (Martin must approve the previews first)

1. Publish only after Martin approves. Right after publishing, recompute each hash from the real Storefront product.
   If it differs, relink (for example, Storefront `availableForSale`).
2. Re-run the script after any Shopify edit to these products. A changed menu stops the script on purpose.
3. Scarlett's parent variant is not in `lib/cart/evidence/named-upgrades-release.json`. Other Irontech silicone parents
   are, so Scarlett would use the legacy checkout path. Codex's review lists exact-parent named-charge registration
   as a release requirement. It needs its own reviewed change. Top Fire parents (Clara/Tessa) match their live
   siblings and are not in that file either.
4. This branch has no private draft snapshots, so these PDPs cannot render on this PR's own preview. The customer
   previews are Codex's deployments (PR #271 / #272 builds).

No Shopify writes, carts, orders or payments were made.
