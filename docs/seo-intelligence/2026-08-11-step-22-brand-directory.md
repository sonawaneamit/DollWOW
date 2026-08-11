# Step 22: Sex Doll Brand Directory Match And Exceed

Date: 2026-08-11

## Decision

Keep `/brands` as the single directory owner for `sex doll brands`, `best sex doll brands`, and `sex dolls brands`. The page should combine visual manufacturer navigation with practical comparison guidance. Individual manufacturer terms continue to belong to their existing brand hubs.

## DataForSEO Evidence

- Three fresh United States desktop SERPs at depth 20 cost $0.0090.
- `sex doll brands` and `sex dolls brands` are led by all-brand directories and manufacturer guides from YourDoll, Silicone Wives, RealSexDoll, RosemaryDoll, and other sellers.
- `best sex doll brands` is less commercially settled and includes forums, video, marketplaces, and low-authority recommendation pages. DollWow should answer the question but must not invent a universal winner or an unsupported ranking.
- Repeated result formats support a brand directory with a direct answer, visual navigation, comparison criteria, buyer checklist, current product examples, FAQs, and links into commercial brand hubs.
- Other paid endpoints were not used because backlink, Merchant, Content Analysis, and AI mention data would not change this directory structure or its catalog-grounded claims.

## Implemented

- Replaced the thin generic grid with 21 visible manufacturer cards, each using a real current catalog product image and a direct link to the brand page.
- Added a customer-facing introduction explaining that brand choice depends on the exact body, head, construction, handling needs, appearance, budget, and support.
- Added quick paths for TPE, silicone, male, lightweight, ready-to-ship, and guided-selection needs.
- Added a five-row manufacturer comparison covering material, size and handling, body/head pairing, customization, and availability plus ownership support.
- Added a three-step buyer checklist, six concise FAQs with schema, BreadcrumbList and ItemList schema, and a proactive route for requesting an approved missing brand or model.
- Preserved brand-specific facts from each existing manufacturer profile and avoided changing any manufacturer authorization claim.
- Set the page to refresh hourly so representative product imagery can follow the current Shopify catalog.

## Validation

- All 21 visible brands appear once in ItemList schema and all 21 rendered cards received a current catalog image during QA.
- The page renders the correct canonical title, one H1, six FAQ entities, and 21 directory entities.
- Mobile QA at 390 x 844 confirmed the approved expandable introduction and no horizontal overflow.
- Desktop QA at 1440 x 900 confirmed the full introduction, hidden mobile disclosure, three-column cards, and no horizontal overflow.
- TypeScript, customer-copy audit, all 168 tests across 36 files, and the 109-route production build passed.

Status: complete.
