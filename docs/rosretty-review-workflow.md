# Rosretty Catalog Review Workflow

Rosretty imports use official Rosretty product pages for authorized media, manufacturer facts, and configuration references. Trusted retail listings such as YourDoll or Cloud Climax are also useful operational sources: they can reveal a newer release order, an actively sellable model, current warehouse availability, or an option set the brand storefront has not yet refreshed.

## Why this is a review gate

Multiple dolls can share height, cup size, material, or even a similar body. Those details can narrow a list of candidates, but they do not prove that two galleries show the same doll. Alternate wigs, styling, clothing, and photo sets must remain separate unless their face/head and body configuration have been checked side by side.

## Prepare the review set

1. Capture the visible, browser-accessible facts from the official Rosretty product pages:

```bash
npm run capture:rosretty-review -- --source official --limit 10
```

When a collection uses lazy loading, first save its verified product URLs into a local
JSON array and pass that explicit list to the same source parser. This keeps the batch
auditable and avoids relying on a crawler to discover product cards:

```bash
npm run capture:rosretty-review -- \
  --source official \
  --urls data/imports/rosretty-official-product-urls.json \
  --limit 12
```

2. Capture the corresponding YourDoll reference listings:

```bash
npm run capture:rosretty-review -- --source yourdoll --limit 10
```

The source capture uses the approved Apify crawler and remains limited to public, browser-visible pages. It does not attempt to bypass a site protection. Check the resulting counts before continuing.

For a larger capture, Apify can finish after the local command has returned. Finalize its completed run into the local review artifact with:

```bash
npm run finalize:rosretty-review -- --source official --run-id <apify-run-id>
```

Add `--append` when the next approved source batch should be merged into the same local review file. Finalizing a run is still only source capture; it cannot create or publish a Shopify product.

3. Run:

```bash
npm run prepare:rosretty-review -- \
  --official data/imports/rosretty-official.json \
  --reference data/imports/rosretty-yourdoll.json \
  --secondary-reference data/imports/rosretty-cloudclimax.json
```

The secondary reference is optional. Use it only where it resolves a product that has been visually reviewed against the official Rosretty gallery. The command writes a JSON review manifest and an HTML side-by-side review sheet under `data/exports/`.

## Review requirements

For each proposed pair, a reviewer must:

- compare the official and comparison galleries, including face/head shape, body proportions, and pose-independent identifying details;
- verify material, measurements, configuration, availability, and pricing basis;
- keep alternate photo sets as separate listings when they represent different marketed versions of the same body/head;
- mark the pair approved in the reviewed manifest before it can be prepared for Shopify.

`visual-review-required`, `ambiguous-review-required`, and `no-credible-candidate` are all non-importable states. Scores identify candidates only; they never publish a product.

## Source policy

Use Rosretty-authorized imagery, facts, and option data for the final listing wherever available. A vetted retailer may become the preferred source for **release order, current assortment, stock status, and visibly offered options** when its catalog is maintained more reliably than the manufacturer site.

That retailer signal can only be applied to a DollWow item after a high-confidence match: shared model identity plus compatible body details, with gallery comparison where available. A matching height alone is never enough. Keep alternate wigs, clothing, and campaign photo sets distinct unless they are confirmed to be the same sellable model.

Retail media may be used as a fallback only when it is unwatermarked, publicly supplied for the listing, and visually confirmed to be the same product; retain the official source as the preferred catalog-media record. Retail prices in GBP, EUR, or another currency are market references only and must not be copied or converted directly into DollWow prices. Preserve source URLs and review notes with each import record.
