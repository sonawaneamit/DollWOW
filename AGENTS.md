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
- Option availability, pricing, visual references, and incompatibility rules can vary by brand and sometimes by body/head model.
- Some options are conditional or mutually exclusive. Example: electronic head functions may be incompatible with implanted hair because implanted hair can interfere with wiring.
- Product pages should present options visually where possible, using supplier images, DollWow-owned illustrations, or clearly labeled AI-generated visual aids.
- When no supplier image exists, GPT Image 2 or another approved image workflow can generate tasteful, brand-consistent option illustrations, but generated visuals must not misrepresent the final product.
- Custom selections that map cleanly to Shopify variants can use variants; custom details that do not map cleanly should be stored as line-item properties/cart attributes and mirrored into Supabase/order support records where useful.
- The admin workflow should support brand-wide updates such as "all WM dolls add this option" or "all Zelex dolls replace the tan skin reference image."
- The product page configuration UI should expose price impacts, conflicts, missing required choices, and production-time implications before checkout.

Product-page work should therefore start with a reusable configuration schema and rule engine, then render a premium configurator from that schema.
