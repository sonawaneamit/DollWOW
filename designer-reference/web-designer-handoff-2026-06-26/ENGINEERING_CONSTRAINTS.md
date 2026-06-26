# Engineering Constraints

This is a headless Shopify storefront built in Next.js. Design updates will be implemented by the engineering team.

## Important Functional Constraints

- Shopify remains source of truth for products, variants, carts, checkout, and orders.
- Custom options that are not Shopify variants are passed as cart line-item properties.
- Paid custom options are charged through hidden Shopify custom-option charge products.
- The UI must make it obvious when paid options change the total.
- The final Shopify checkout price must match the customizer total.
- Mobile PDP checkout behavior is sticky and should remain easy to use.

## Product Images

- Product-page images should show the actual product photos.
- AI-generated marketing images can be used on homepage/editorial surfaces, but must not replace product inspection images.
- Do not imply accessories, clothing, or shipping state are included unless stated.

## Adult Commerce Constraints

- No underage-coded styling, school themes, fake buyer photos, or fake reviews.
- Do not make the site look like a porn site; it is a premium commerce store.
- Keep privacy and discreet delivery easy to find.

## Deliverable Preferences

If providing HTML/CSS, keep it standalone and readable. Do not include production secrets, API keys, backend code, or scraped-source references.

If providing Figma, please include:

- desktop homepage
- mobile homepage
- desktop PDP
- mobile PDP
- cart/saved checkout
- shop filters
- style tokens/components

Design changes can be bold visually, but they should not require rebuilding checkout, product import, or Shopify cart architecture.
