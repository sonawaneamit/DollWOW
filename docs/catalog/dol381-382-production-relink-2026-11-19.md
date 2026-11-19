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

## Go-live (Martin approved the previews on 19 Nov 2026 at 11:42 Lisbon: "Yes, put all 3 live")

- Before the final relink, removed the internal-only Shopify tags from all three: `dollwow-test` and `dol38x-nov18`. Also removed `catalog-review-hold` from Scarlett, because the live Irontech Luna/Betsy listings don't have it; Clara and Tessa keep it, like live Venus/Susan/Ivy. Deleted `seo.hidden`, which the live siblings don't have.
  The hashes above were then recomputed: Clara `279c0252…`, Tessa `63272f10…`, Scarlett `4b088cf1…`.
- Scarlett's parent variant (54851446276280) is registered in `lib/cart/evidence/named-upgrades-release.json`
  with the same charge family as the live Irontech Luna 171cm ROS MAX body (`5afaf369…`). Every paid Scarlett
  option maps to exactly one released charge at the same price, and ROS MAX stays $0 (tested).
- Clara and Tessa have no named-charge parents, the same as the live Top Fire siblings.
- Publication: ACTIVE on Online Store + DollWOW! Headless, the same as the live siblings. After publishing, recheck the hashes against the real Storefront product.

No carts, orders or payments were made.

## Post-publish drift fix (19 Nov, after go-live)

After publishing, the live PDPs fell back to the plain builder (no Starter / Enthusiast / Collector tiers).
The cause: the PDP merges the Admin `custom.body_code` metafield into the product (`mergeProductAdminMetafields`)
before `loadTemplateRecipe` hashes it. The Storefront API doesn't return body_code, so the earlier relink hashed
`bodyCode: undefined`. The live Top Fire siblings have no body_code, which is why the six-entry method check passed.
The relink script now applies the same Admin merge. New hashes: Clara `3261815d…`, Tessa `e096884e…`,
Scarlett `ab7e5c36…`. Tier totals are unchanged: 2416/2684/3061, 2366/2634/3011, 2679/2779/2979.
The full PDP pipeline (Storefront + Admin merge + loader) was checked against live data: it now selects the recipe
for all three products.
