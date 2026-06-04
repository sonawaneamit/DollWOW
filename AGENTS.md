# Agent Notes

## Product Imagery

DollWow is an adult commerce storefront, so adult product photography is core catalog content rather than incidental NSFW decoration. It is acceptable for this repository to contain adult product images when they are part of product listings, supplier-provided assets, QA fixtures, or approved demo content.

Handle product images like commerce assets:

- Keep source/provenance clear, including supplier, brand, or demo origin when known.
- Prefer supplier-authorized or DollWow-owned assets for launch content.
- Do not use underage-coded, school-themed, deceptive, fake-review, or invented-buyer imagery.
- Distinguish reusable catalog photos from generated editorial/marketing images.
- AI-generated variants can help differentiate DollWow, but must not misrepresent the actual product, included accessories, shipping state, or supplier authorization.
- Preserve enough original product-detail imagery for customers to inspect the product accurately.

## Differentiation

Because many approved vendors receive similar factory images, DollWow should differentiate through the web app experience: comparison tooling, guided selection, customization flow, price-match support, warehouse clarity, privacy/discreet delivery messaging, and high-touch customer support.

## Customization Architecture

Avoid depending on clumsy generic Shopify option apps for the core product customization experience. DollWow needs first-party control over how configuration options are displayed, priced, validated, and attached to checkout/cart line-item properties.

Design customization around brand/supplier option sets:

- Each brand or supplier can define shared option groups that apply across many dolls, such as skin tone, eye color, lip color, wig/hair, implanted hair, head functions, body heating, standing feet, skeleton upgrades, storage/care accessories, and other add-ons.
- Option availability, pricing, visual references, and incompatibility rules can vary by brand and sometimes by body/head model, height, material, hybrid construction, and male/female body type.
- Do not assume every doll within a brand has the same customization set. Imported product-specific option groups should take precedence over brand defaults; brand-wide option sets are reusable starting points, not proof that every SKU supports every option.
- Some options are conditional or mutually exclusive. Example: electronic head functions may be incompatible with implanted hair because implanted hair can interfere with wiring.
- Product pages should present options visually where possible, using supplier images, DollWow-owned illustrations, or clearly labeled AI-generated visual aids.
- When no supplier image exists, GPT Image 2 or another approved image workflow can generate tasteful, brand-consistent option illustrations, but generated visuals must not misrepresent the final product.
- Custom selections that map cleanly to Shopify variants can use variants; custom details that do not map cleanly should be stored as line-item properties/cart attributes and mirrored into Supabase/order support records where useful.
- The admin workflow should support brand-wide updates such as "all WM dolls add this option" or "all Zelex dolls replace the tan skin reference image."
- The product page configuration UI should expose price impacts, conflicts, missing required choices, and production-time implications before checkout.

Product-page work should therefore start with a reusable configuration schema and rule engine, then render a premium configurator from that schema.

## Catalog Import Workflow

When importing products from RosemaryDoll or another owned/approved source, use a review-first pipeline:

- Scrape brand/category pages into normalized JSON using `npm run scrape:rosemary -- --brand <brand> --limit <n>`.
- Convert reviewed scrape output into import artifacts using `npm run prepare:rosemary-import -- --input <file>`.
- Treat `data/imports/` files as local review artifacts; they are ignored by git.
- Treat `data/exports/` files as local review artifacts too; they are ignored by git and can include Shopify CSVs, storefront previews, and warning reports.
- Use `npm run import:shopify-drafts -- --input <storefront-preview.json>` to dry-run Shopify draft creation. Add `--execute` only after reviewing the exact input file.
- Review source URL, title, brand, price, specs, stock status, image URLs, and customization option labels before publishing.
- Exclude anything labeled Rosemary exclusive, exclusive-only, celebrity/likeness-restricted, or otherwise authorized only for Rosemary customers. Even though Rosemary is owned/approved as a source, those products must not be advertised on DollWow without separate approval.
- Rewrite imported product names and descriptions into DollWow-specific catalog copy before Shopify import. Keep factual specs, brand, price, stock, and option data, but avoid obvious duplicate Rosemary titles, copied descriptions, and source-store wording.
- Keep Shopify as the production source of truth after import; crawlers should support updates and stock snapshots, not bypass catalog review.
- Do not auto-publish scraped items until supplier authorization, product accuracy, and image provenance are clear.
