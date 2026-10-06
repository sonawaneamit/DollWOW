# New listing release checklist

## Owned image checks (live and draft)

- Audit stored draft option groups, galleries and editorial images, not just the live crawl.
- Rehost approved image sources on DollWOW-owned storage; preserve originals and provenance privately. Do not remove watermarks or bypass access controls.
- Verify image bytes decode and every referenced local asset exists. Intentional missing thumbnails must retain an accurate text choice.
- Check rendered option groups, public payloads, built JavaScript and DollVue references for external image links and private source metadata.
- Run `npm run check:option-assets`, `npm run check:public-promotion-data`, focused tests and the production build before release.
- Keep new brands unpublished during asset-only repairs; verify draft status after deployment.

Use this before publishing a supplier upload. A populated page or passing unit test is not a completed listing.

1. Match the exact brand, body version, head, material, skin finish and supplier SKU. Search active products and drafts for duplicates before creating anything.
2. Keep original factory email, measurements, photos, price lists and offer terms with source IDs. Use owner-authorized retailer fallback only for the exact configuration, documenting its limitations.
3. Check selling price after the actual checkout discount against current factory minimums. Verify landed cost and margin when available; never label competitor pricing as verified profit.
4. Confirm custom versus ready-to-ship. Custom listings must not invent warehouse stock or next-day shipping. RTS needs current location and inventory evidence.
5. Check the complete title, display name, material, height, cup, head and measurements. Preserve decimals. Separate body weight, head weight and shipping weight; do not invent upgrade weights or copy conversion errors.
6. Verify every gallery asset loaded, the lead image is appropriate, and image provenance is recorded. Exclude childlike sexualized imagery.
7. Include the existing product-specific editorial section with accurate copy and a working factory photo. Do not invent included clothing or accessories.
8. Reuse the matching brand/body/head customization template, but compare the actual option identities, prices, conditions and defaults. Do not clone broken IDs or unrelated branches.
9. Full-body custom dolls need the reviewed Starter, Enthusiast and Collector recipes and their `options:` tag. Torso/partial products remain excluded. RTS must not inherit custom presets.
10. Register the new product against the reviewed template and named-charge release evidence. **The tag alone is not sufficient in the current storefront**: runtime identity, menu, variants and price must match the released record. Reuse compatible recipes and charge records rather than creating per-doll duplicates.
11. Preserve the manual configurator, editing and removal. Do not randomly choose an extra head, hair or eyes. Where a preset includes a subjective choice, require the customer to choose it.
12. For each paid option, verify an exact named checkout item and recorded customer choice. No generic $50/$100 splits. Include `dollwow-system` and `exact-upgrade-pilot` tags, correct price, nonshipping/untracked/CONTINUE configuration and an accurate description/category. Do not disguise products to bypass market restrictions.
13. Check the parent and every add-on in supported country contexts. Shopify publication alone does not prove international eligibility; inspect its actual reason when a record is unavailable.
14. Preview desktop, tablet and mobile. Check gallery, editorial, readable labels, overflow, three preset totals where applicable, manual editing and visible Add to Cart.
15. Test the actual deployed checkout: defaults, every distinct paid charge record, presets, a changed subjective choice, removal and return to the base build. Verify names, prices and parent relationships. Do not place a paid order without separate authorization.
16. Publish only the reviewed scope, then recheck the public page and cart. Record the URL, deployment, evidence, exceptions and inbox checkpoint in Linear. Preserve a reversible product/status snapshot.

Promotion rules need separate date/material/fulfillment tests and exact checkout support. Do not advertise a partial-price benefit while checkout still has only the old charge amount. Future benefits must not start early, and expired source promotions must not be silently extended.
