# DollWow Visual Commerce Layer

Last updated: 2026-08-10

## Purpose

Turn DollWow's Shopify catalog and approved brand media into a reusable visual system for homepage campaigns, collection banners, Learning Center features, editorial illustrations, email, and social media.

The central rule is simple: when a visual represents a real product, the product must remain a real product photo. AI can extend the environment, remove distracting backgrounds, create supporting graphics, or establish campaign art direction. It must not silently redesign the doll, change included accessories, or imply a configuration that is not available.

## Source Priority

1. DollWow Shopify product galleries and videos.
2. Official manufacturer websites, media kits, and campaign pages that DollWow has permission to reuse.
3. Supplier-provided option references, certificates, and promotional materials.
4. DollWow-generated editorial backgrounds, layouts, illustrations, and infographics.

Competitor-owned campaign images may be used as internal composition references. Their logos, promotional claims, layouts, and creative assets must not be copied into DollWow materials.

## Asset Registry

Every imported visual should have an internal manifest entry with:

- Source type and original URL.
- Brand, product handle, model identity, and related collection.
- Permission or provenance note.
- Capture date and source last-modified date when available.
- Original dimensions, format, orientation, and file hash.
- Watermark presence and removal approval status.
- Product coverage: face, portrait, full body, detail, option, lifestyle, video, or campaign.
- Presentation rating: clothed, lingerie, nude, explicit detail, or neutral educational.
- Quality rating: resolution, sharpness, lighting, crop flexibility, and visual appeal.
- Recommended placements and focal point.
- Whether AI or manual editing was applied, with a short change record.
- Review status: discovered, approved, restricted, rejected, or published.

## Production Pipeline

1. Pull all Shopify product media, not only featured images.
2. Crawl approved official brand media sources and retain source URLs.
3. Hash and deduplicate files across products, suppliers, and campaign pages.
4. Score assets for resolution, orientation, watermark risk, visual quality, crop flexibility, and placement suitability.
5. Review the highest-scoring assets by brand and campaign theme.
6. Create one campaign sample and obtain approval before generating related variants.
7. Preserve exact product pixels whenever the visual is product-specific. Generate backgrounds and supporting art separately, then composite.
8. Produce responsive derivatives, alt text, and a manifest update.
9. Publish through a reusable campaign component rather than hard-coding banners into individual pages.
10. Track clicks, product views, assisted conversions, and image-search impressions by asset and placement.

## Standard Formats

| Placement | Master Format | Notes |
| --- | --- | --- |
| Homepage and collection hero | 2560 x 1200 | Art-directed landscape with responsive live text overlay. |
| Mobile campaign hero | 1080 x 1350 | Recompose rather than center-crop the desktop banner. |
| Learning Center featured image | 1536 x 1024 | Product-grounded editorial image with no embedded headline. |
| Learning Center instructional visual | 1024 x 1536 | Mobile-first infographic or illustrated steps. |
| Open Graph and link preview | 1200 x 630 | Minimal copy, strong subject, safe crop zones. |
| Inline editorial spread | 1600 x 900 | Comparison, detail, workflow, or product context. |
| Email campaign banner | 1200 x 500 | Concise composition and verified offer text. |
| Pinterest/editorial social | 1000 x 1500 | Vertical visual with approved embedded copy. |
| Square social card | 1080 x 1080 | Product, collection, or guide promotion. |

## Campaign Families

- The Silicone Edit: premium surface detail and selected silicone models.
- The TPE Edit: softer visual art direction and accessible catalog entry points.
- Ready Now: current warehouse products with stock-confirmed messaging only.
- Brand Atelier: one manufacturer, its strongest approved photography, and its actual customization strengths.
- New Arrivals: newly published products using release dates from Shopify or confirmed supplier sources.
- Collector's Selection: Alex-led editorial curation with a visible selection methodology.
- Private Buying Guides: Jesse-led care, privacy, and buyer-protection visuals.
- Seasonal campaigns: visual themes tied to verified promotions, dates, prices, and coupon rules.

## Web Rendering Rules

- Keep campaign headlines, offers, buttons, and supporting copy as HTML whenever possible.
- Use separate desktop and mobile art direction when one crop cannot preserve the product and text safely.
- Do not place unique facts only inside images.
- Show physical measurements in both US customary and metric units: `lb / kg`, `ft and in / cm`, and `F / C` where temperature is relevant. Verify the source measurement before converting it.
- Add descriptive alt text based on the product and visual purpose.
- Use responsive `srcset`/Next Image derivatives and modern formats.
- Keep the primary image lightweight enough for good Largest Contentful Paint.
- Include image URLs in the sitemap when they are important search assets.
- Never publish a coupon, discount, stock claim, delivery claim, or free upgrade until it is verified against the live campaign configuration.

## Shopify Campaign Model

Use a Shopify metaobject such as `dollwow_campaign` as the content source for banners and promotional placements. The headless storefront should render active campaigns from this model instead of hard-coding campaign copy into components.

Recommended fields:

- Internal campaign ID and review status.
- Public eyebrow, headline, supporting copy, and CTA label.
- Destination URL and optional secondary CTA.
- Desktop image, mobile image, Open Graph image, and alt text.
- Campaign family and visual theme.
- Featured product handles and collection handles.
- Start and end timestamps with timezone.
- Promotion type, coupon code, verified offer text, and terms URL when applicable.
- Stock or fulfillment dependency notes.
- Asset provenance references and approval date.
- Analytics campaign key.

The storefront should show only approved campaigns within their active date range. Expired campaigns should fall back to an evergreen collection or brand banner without requiring a deployment.

## Product Fidelity Rules

- A product-specific banner must preserve the product's recognizable face, body, finish, clothing, and configuration.
- AI-generated reinterpretations can be used only as clearly editorial imagery, never as evidence of the exact SKU.
- Background extension must not add accessories or product features that a buyer may assume are included.
- Watermarks should be avoided by sourcing an official clean original first. Removal is permitted only when DollWow has reuse permission and the result does not obscure provenance internally.
- Generated backgrounds and supporting graphics must be stored separately where practical so campaigns can be recomposed without regenerating the product.

## Initial Rollout

### Pilot

1. Build an approved shortlist of 20-30 strong assets each from WM Dolls, SE Doll, Irontech, Starpery, Zelex, and 6YE.
2. Produce one approved campaign family with desktop, mobile, Learning Center, and social crops.
3. Add one reusable website campaign component with live text and destination links.
4. Measure engagement before producing the next family.

### First Production Wave

- Six brand banners.
- Six priority collection banners.
- Ten upgraded Learning Center featured images.
- Five instructional visuals from the existing visual backlog.
- Four reusable promotional layouts with campaign data supplied separately from the image.

## Approval Gate

Every new visual family begins with one sample. Review product fidelity, crop, composition, text safety, mobile behavior, watermark status, and commercial accuracy before generating the rest of that family.
