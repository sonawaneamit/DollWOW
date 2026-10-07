# New listing release checklist

## DollVue readiness (live and draft)

- Resolve the actual product menu before reviewing appearance choices. Jev classifications and template tags are triage, not image or supplier approval. Keep functional options, accessories and extra heads out of appearance previews.
- Read both content-hold tags and `custom.catalog_image_review_hold` through the Admin inventory. A Storefront-only crawl misses unpublished records and private hold fields.
- Distinguish the ordinary `catalog-review-hold` draft-workflow tag from a specific image/content hold. It does not prevent private DollVue preparation. Retain all tags and draft state; `dollwow-test`, hidden-brand, specific content and publication exclusions still apply. Record the actual exclusion reason rather than describing every draft as an image hold.
- Bind suitable, non-explicit source photos and reviewed option references to exact product/group/option IDs. Preserve the byte/provenance chain through legitimate image re-encoding; different JPEG/WebP hashes alone do not prove changed imagery.
- Preview sources need one unambiguous adult-presenting edit target and a clear view of the intended feature. A two-doll photograph needs a suitable single-subject alternative. Record source-only exclusions privately; do not turn them into product publication or sales holds. Attribute assistant image review to the assistant, not the owner.
- Record the current appearance policy and menu/photo fingerprint privately. A scheduled price change need not invalidate appearance review; changed meanings, compatibility, references or source photos do.
- Conditional iris support requires an exact reviewed record, a valid unconditional `head` group defaulting to `no-change`, and direct head-only visibility conditions. Preserve those factory conditions. Never enable conditional choices for recordless legacy products, infer a replacement head, or copy this exception to other conditional features.
- Check representative real generations for visible intended changes, retained product identity and unwanted additions. HTTP 200, decoded images and passing unit tests do not establish visual fidelity.
- Minor rendering differences are acceptable under the owner's 7 October 2026 review. Do not hold an otherwise passing release for pixel-identical facial detail; investigate major identity, proportion or unselected-feature changes. Reuse a passed appearance-reference family across verified compatible products, with targeted representative generation rather than a paid generation for every SKU.
- Public access requires a strict current Storefront lookup plus current readiness. Email verification must never authorize unpublished products. Keep draft review private; publication and readiness are separate states.
- Verify the PDP, card, filter, viewer, access link, generation and cart agree. Only serialize the public capability flag and approved customer choices, never private review records or evidence.
- Keep exact ready/excluded/review counts and remaining checks in the private launch tracker. Do not count prepared records as enabled products. New releases must not publish draft brands or change checkout prices.
- Batch current identity, hold, option-family and image-byte checks, then sample the hosted flow. Pace production requests and respect rate-limit responses; retain failed attempts and recheck after backoff without weakening protections.

## Sitemap checks for future uploads

- Set the correct canonical brand/vendor and content type. Sitemaps group products by brand data, not product-handle prefixes.
- Drafts and private previews must never appear in public sitemaps. After owner-approved publication, confirm the product enters its brand sitemap after cache refresh (hourly revalidation, not an instant guarantee).
- Check the canonical production URL, 200 status, no redirect and no noindex before counting an uploaded page as indexable. Keep test products, internal charge items and hidden brands excluded.
- Published Learn articles go into `learn.xml`; collections and brand hubs use their dedicated files. A new brand hub still needs its normal content/registry implementation; sitemap generation does not create a page.
- Add new brand aliases to the catalog registry. Unmapped public products appear in `products-other.xml` until mapped; review that segment rather than silently dropping products.
- Submit newly appearing child sitemaps separately in Google Search Console after deployment for segmented reporting. Existing children update automatically; never submit a draft/preview host.
- Do not stamp today's date on unchanged pages or use stock-check timestamps as content dates. See `docs/seo/sitemap-split.md` for date limitations and release checks.

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
