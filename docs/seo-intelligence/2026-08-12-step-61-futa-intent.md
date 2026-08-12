# Step 3: Live US Keyword Metrics And SERPs

Generated: 2026-08-12T07:41:22.504Z

Mode: production

## Completion Gate

Status: Passed

Fresh US metrics exist and at least 95% of selected keywords have successful desktop and mobile live SERPs.

## Coverage

- Raw Step 2 universe: 4745
- Prequalified for fresh metrics: 3
- Fresh metric rows returned: 3
- Keywords selected for live SERPs: 3
- Desktop and mobile SERPs requested: 6
- Successful SERPs: 6
- Keywords with both devices: 3
- Normalized organic result rows: 82
- Recorded DataForSEO cost: $0.1065

## Battlefield Coverage

| Battlefield | Keywords |
| --- | ---: |
| audiences | 2 |
| core | 1 |

## Top Live US Competitors

| Domain | Keywords | Appearances | Top 10 | Best rank | Page types |
| --- | ---: | ---: | ---: | ---: | --- |
| amazon.com | 3 | 10 | 8 | 1 | other: 10 |
| pornhub.com | 3 | 6 | 4 | 3 | other: 6 |
| bestrealdoll.com | 3 | 4 | 4 | 5 | collection: 4 |
| yourdoll.com | 2 | 3 | 3 | 4 | other: 2, homepage: 1 |
| rosemarydoll.com | 2 | 3 | 3 | 2 | other: 3 |
| realdoll.com | 2 | 3 | 3 | 3 | guide: 3 |
| sexyrealsexdolls.com | 2 | 3 | 3 | 2 | collection: 3 |
| naughtyharbor.com | 2 | 3 | 3 | 5 | other: 3 |
| hisexdolls.com | 2 | 3 | 3 | 4 | collection: 3 |
| ebay.com | 3 | 3 | 2 | 7 | other: 3 |
| youtube.com | 2 | 4 | 2 | 9 | other: 4 |
| kanadoll.com | 1 | 2 | 2 | 2 | other: 2 |
| uloversdoll.com | 1 | 2 | 2 | 5 | other: 2 |
| futadoll.com | 1 | 2 | 2 | 7 | homepage: 2 |
| xvideos.com | 1 | 2 | 2 | 6 | other: 2 |
| mrlsexdoll.com | 1 | 2 | 2 | 9 | other: 2 |
| bigshocked.com | 2 | 3 | 1 | 10 | collection: 3 |
| foxnews.com | 1 | 1 | 1 | 1 | other: 1 |
| ibtimes.co.uk | 1 | 1 | 1 | 2 | other: 1 |
| realsexdoll.com | 1 | 1 | 1 | 8 | homepage: 1 |

## SERP Composition

- other: 45
- collection: 18
- guide: 8
- product: 7
- homepage: 4

## Notes

- Search-volume reporting for adult queries may be incomplete even with adult keywords enabled. SERP activity, competitor coverage, CPC, catalog fit, and first-party impressions remain part of later scoring.
- Step 4 performs final normalization and rejected-term logging. Paid SERP collection excludes obvious malformed terms but preserves the untouched Step 2 universe.
- The normalized desktop and mobile result sets become the evidence for weighted SERP-overlap clustering in Step 5.

## Decision And Implementation

- `futa sex doll` has 5,400 monthly US searches in the fresh metrics pull. `transgender sex dolls` has 4,400. `trans sex dolls` returned no reported volume in this pull.
- Collection and product pages form a meaningful commercial layer in both desktop and mobile results, so DollWow should use a transactional collection rather than force this intent into a general guide.
- Canonical owner: `/shop/futa-sex-dolls`.
- Aliases: `/shop/transgender-sex-dolls` and `/shop/trans-sex-dolls` permanently resolve to the canonical collection.
- The public explanation distinguishes the adult fantasy and product-search term from transgender identity. Products are categorized by confirmed physical configuration, not by assigning a human identity.

## Catalog Qualification

- Shopify products scanned: 3,266.
- Products with a selectable `Insertable Penis Add-On` customization group: 1,444.
- Active eligible products: 1,441.
- The collection also requires a feminine body classification and a complete full-doll format. Partial-body products and masculine bodies remain in their existing collections.
- A public boolean Shopify capability field is derived from the complete customization data. This keeps the collection current without guessing from product names.
- The capability sync is review-first, rerunnable, and idempotent. A final dry run reported zero remaining updates.

## Claim Controls

- Collection membership confirms that the option is selectable on the current product configuration data.
- It does not claim that the add-on is included in the starting price or standard build.
- Size, price, material, compatibility, care, and production details remain product-specific and should be confirmed before production when they affect the decision.

## Customer-Language Correction

- The page title and H1 now read `Futa sex dolls by brand`, preserving the measured generic query while making the mixed-brand catalog structure explicit.
- The opening explains that futa is short for the adult fantasy term futanari and that FutaDoll is separately used as a commercial name.
- DollWow does not currently list FutaDoll products. A future authorized assortment should receive a dedicated `/brands/futadoll` hub rather than being mixed into this capability collection.
- The copy tells buyers that every product comes from the actual manufacturer named on its card, with examples including Irontech, Real Lady, WM Dolls, SE Doll, and Angelkiss.
- Operating rule: when a generic query also overlaps a commercial name, state the distinction clearly and keep the product manufacturer visible.
