# DollWow SEO Execution Brief For Codex

Use this file as a working brief for a Codex thread while the main storefront/PDP work continues.

Repository: `https://github.com/sonawaneamit/DollWOW`
Local project: `/Users/amitsonawane/Desktop/DollWOW`
Production domain: `https://dollwow.com`
Preview domain: `https://doll-wow.vercel.app/`

## Goal

Start executing the on-page SEO/GEO program before the final site launch. The main website implementation can continue separately; this task should prepare content, collection data, Shopify backend structures, and indexable page definitions so the launch can move fast once page templates are ready.

Target: prepare the site to scale toward 50,000-100,000 monthly organic sessions in 3-4 months through on-page/content only, excluding link-building.

## Important Boundaries

- DollWow is adult commerce, but content should stay premium, practical, and non-explicit.
- Do not use underage-coded, school-themed, deceptive, fake-review, or invented-buyer content.
- Do not invent product availability, accessories, shipping state, material, measurements, brand authorization, or supplier image provenance.
- Do not scrape/spin competitor copy.
- Do not create fake reviews, fake testimonials, hidden text, cloaking, doorway spam, or misleading schema.
- AI-generated images/illustrations are allowed for educational option visuals, but they must be clearly distinct from actual product photos and must not misrepresent the product.

## What Can Start Now

These tasks can run before the website feature work is complete:

1. Build a canonical SEO taxonomy map.
2. Generate collection/page briefs from DataForSEO and real catalog inventory.
3. Create Shopify Admin API smart/custom collections for backend organization.
4. Add collection-level metafields for SEO briefs, intro copy, FAQs, and canonical target keywords.
5. Generate first-pass guide drafts as Markdown/MDX files or JSON content records.
6. Generate AI image/infographic briefs, not final product-misrepresenting images.
7. Prepare internal linking rules from product facts to taxonomy pages.
8. Prepare sitemap/robots requirements and URL inventory.
9. Prepare product-page content expansion inputs.
10. Prepare competitor comparison briefs using factual, visible comparison criteria.
11. Run DataForSEO SERP competitor audits for priority US keywords and use the output to decide whether each target needs a collection page, guide, comparison page, or PDP enhancement.

## What Should Wait For The Main Website Thread

These depend on page templates or PDP implementation:

- Final visual page layout.
- Final route components for taxonomy/guide pages.
- PDP UI sections.
- Frontend schema rendering.
- Sitemap implementation if the main thread is already editing routing.
- Navigation/header changes if the main thread is touching `components/Header.tsx`.

## Existing App Behavior To Respect

The current app:

- Uses Shopify as the backend source of truth.
- Uses a headless Next.js frontend.
- Reads product data through `lib/shopify/storefront.ts`.
- Maps product metafields through `lib/shopify/mappers.ts`.
- Uses local collection presets in `lib/catalog/filters.ts`.
- Currently filters product grids with Shopify product queries and local filtering, not Shopify collection handles.
- Has product metadata and Product/FAQ structured data in `lib/catalog/pdpSeo.ts`.
- Does not currently expose `/sitemap.xml` or `/robots.txt` on the preview.

This means Shopify collections are useful for backend merchandising, admin organization, and future Storefront collection queries, but the headless frontend still needs canonical route definitions and SEO metadata in the repo.

## Shopify API Work

### Admin API Can Do

Use Shopify Admin GraphQL for:

- Creating smart collections/custom collections.
- Updating collection titles/descriptions.
- Adding collection metafields.
- Tagging products if needed.
- Reading products and product metafields for inventory counts.
- Writing SEO helper metafields if approved.

### Storefront API Can Do

Use Shopify Storefront GraphQL for:

- Reading product handles, titles, tags, variants, price, images, and public metafields.
- Reading collections by handle once collection queries are added.
- Verifying that created Shopify collections are visible to the storefront channel.

### Do Not Use Admin API For

- Publishing Next.js routes.
- Writing local source files.
- Creating final page templates.
- Auto-publishing unreviewed product copy.
- Changing live product data without a dry run and review.

## Recommended Backend Collection Model

Create Shopify collections only for durable, high-value SEO and merchandising groups. Do not create thousands of low-value combinations in Shopify.

Use this collection metafield namespace:

`seo`

Recommended collection metafields:

| Key | Type | Purpose |
| --- | --- | --- |
| `primary_keyword` | single_line_text_field | Main target keyword |
| `secondary_keywords` | json | Supporting keywords |
| `seo_brief` | multi_line_text_field | Internal content brief |
| `intro_copy` | multi_line_text_field | Draft collection intro |
| `faq_items` | json | Draft FAQ array |
| `content_status` | single_line_text_field | `draft`, `reviewed`, `approved` |
| `provenance_notes` | multi_line_text_field | Notes about product/image/content source |
| `last_reviewed_at` | date_time | Review timestamp |

Recommended collection creation approach:

1. Dry-run all collection definitions to `data/exports/seo-collections-preview.json`.
2. Review handles, titles, rules, and target keywords.
3. Create/update collections with Admin API only after review.
4. Do not delete existing Shopify collections automatically.
5. Preserve existing product tags unless explicitly changing taxonomy.

## Priority Shopify Collections

Create these first as backend collections and matching headless page definitions.

| Handle | Title | Primary Keyword | Suggested Rule |
| --- | --- | --- | --- |
| `sex-dolls` | Sex Dolls | `sex dolls` | all active DollWow catalog products |
| `realistic-sex-dolls` | Realistic Sex Dolls | `realistic sex dolls` | all realistic companion dolls; likely all core catalog |
| `silicone-sex-dolls` | Silicone Sex Dolls | `silicone sex dolls` | tag/material includes silicone, excluding silicone-head if using separate page |
| `tpe-sex-dolls` | TPE Sex Dolls | `tpe sex doll` | tag/material includes TPE |
| `silicone-head-sex-dolls` | Silicone Head Sex Dolls | `silicone head sex doll` | material equals silicone head |
| `male-sex-dolls` | Male Sex Dolls | `male sex doll` | body type male |
| `mini-sex-dolls` | Mini Sex Dolls | `mini sex dolls` | height under 155 cm or existing mini/petite tags |
| `petite-sex-dolls` | Petite Sex Dolls | `petite sex doll` | height under 155 cm |
| `torso-sex-dolls` | Torso Sex Dolls | `torso sex dolls` | product type/tag torso if inventory exists |
| `ready-to-ship-sex-dolls` | Ready To Ship Sex Dolls | `ready to ship sex dolls` | stock status ready_to_ship |
| `custom-sex-dolls` | Custom Sex Dolls | `custom sex doll` | custom_available true or factory order |
| `cheap-sex-dolls` | Cheap Sex Dolls | `sex doll cheap` | price under chosen threshold, likely under $1,500 or sale tag |
| `best-sex-dolls` | Best Sex Dolls | `best sex dolls` | curated manual collection |
| `wm-dolls` | WM Dolls | `wm doll` | brand WM |
| `zelex-dolls` | Zelex Dolls | `zelex doll` | brand Zelex |
| `se-doll` | SE Doll | `se doll` | brand SE Doll |
| `starpery-dolls` | Starpery Dolls | `starpery doll` | brand Starpery |
| `irontech-dolls` | Irontech Dolls | `irontech doll` | brand Irontech |
| `6ye-dolls` | 6YE Dolls | `6ye doll` | brand 6YE |
| `yl-dolls` | YL Dolls | `yl doll` | brand YL |
| `piper-dolls` | Piper Dolls | `piper doll` | brand Piper |
| `tantaly-dolls` | Tantaly Dolls | `tantaly doll` | brand Tantaly |

## Priority Headless Page Definitions

Add or prepare a local SEO collection registry such as:

`lib/seo/collections.ts`

Each definition should include:

```ts
export type SeoCollectionDefinition = {
  handle: string;
  title: string;
  h1: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  description: string;
  canonicalPath: string;
  filters: CatalogFilters;
  intro: string;
  faq: Array<{ question: string; answer: string }>;
  internalLinks: Array<{ label: string; href: string }>;
  schemaType: "CollectionPage";
  indexable: boolean;
};
```

Start with the priority collection table above.

Do not index filter URLs like `/shop?material=tpe&height=160-164` unless they are promoted to a canonical static route.

## Content Generation Work To Start Now

Create content briefs first. Store them in:

`content/seo/briefs/`

Also read `docs/blog-strategy.md` and `docs/editorial-voice-and-bylines.md` for the dedicated Learning Center/blog plan, voice, and privacy-safe byline rules. Use the blog strategy for long-tail informational questions, comparison posts, care/privacy topics, and AI-answer/GEO content. Use this execution brief for collection, Shopify, and technical SEO work.

Before creating a new batch, run:

```bash
npm run seo:serp-competitors -- --execute --env ../ColorMine-Website/.env
```

Use the DataForSEO output to identify the top 10 competing domains and the exact URLs ranking for commercial keywords such as `sex dolls`, `tpe dolls`, `silicone sex dolls`, `male sex doll`, `mini sex dolls`, and `best sex dolls`. If ranking pages are collections, prioritize a DollWow collection route and Shopify collection/metafield work. If ranking pages are guides, prioritize a Learning Center article with comparison tables, FAQs, author policy links, and relevant catalog links.

Recommended format:

```md
---
title:
slug:
primaryKeyword:
secondaryKeywords:
intent:
pageType:
targetUrl:
status: draft
reviewOwner: catalog
---

# Search Intent

# Required Facts

# Page Outline

# Internal Links

# Product Data Needed

# Image/Infographic Ideas

# Schema

# Compliance Notes
```

## First 25 Briefs To Generate

Create these immediately:

1. `best-sex-dolls.md`
2. `realistic-sex-dolls.md`
3. `tpe-vs-silicone-sex-dolls.md`
4. `silicone-sex-dolls.md`
5. `tpe-sex-dolls.md`
6. `male-sex-doll-buying-guide.md`
7. `mini-sex-dolls.md`
8. `petite-sex-dolls.md`
9. `torso-sex-dolls.md`
10. `ready-to-ship-sex-dolls.md`
11. `custom-sex-dolls.md`
12. `sex-doll-cost.md`
13. `how-to-customize-a-sex-doll.md`
14. `discreet-sex-doll-shipping.md`
15. `avoid-sex-doll-scams.md`
16. `how-to-clean-a-sex-doll.md`
17. `sex-doll-storage.md`
18. `sex-doll-reviews.md`
19. `wm-dolls-buying-guide.md`
20. `zelex-dolls-buying-guide.md`
21. `se-doll-buying-guide.md`
22. `starpery-dolls-buying-guide.md`
23. `irontech-dolls-buying-guide.md`
24. `implanted-hair-vs-wig.md`
25. `standing-feet-sex-doll-guide.md`

## Draft Guide Template

Use this structure for every guide:

```md
---
title:
slug:
primaryKeyword:
secondaryKeywords:
description:
lastReviewed:
---

# [H1]

## Quick Answer

Answer the primary keyword directly in 40-80 words.

## What To Compare

Use a table. Include price, material, height/weight fit, customization, shipping, and support implications where relevant.

## DollWow Picks Or Matching Catalog

List products only from real catalog data. Include product handles and why they match.

## Buyer Checklist

Practical checklist, not explicit fantasy content.

## Common Mistakes

Focus on measurement mismatch, shipping assumptions, option incompatibility, fake seller claims, and unclear photos.

## FAQs

6-10 useful questions.

## Internal Links

Add target links to products, collections, customization pages, compare, support, shipping, and buyer protection.
```

## AI Drafting Instructions

Use OpenAI or Claude for drafting, but facts must come from catalog data.

Prompt:

```text
Write a DollWow SEO guide for [keyword].
Audience: adult buyer comparing premium dolls, privacy-conscious, wants factual specs and support.
Tone: premium ecommerce, practical, discreet, non-explicit.
Use docs/editorial-voice-and-bylines.md for the DollWow voice and privacy-safe byline rules.
Use only supplied product/policy facts. Do not invent reviews, shipping guarantees, included accessories, or supplier authorization.
Include: quick answer, comparison table, buyer checklist, DollWow support angle, FAQs, image/infographic ideas, internal link targets, schema suggestions.
Facts:
[paste catalog facts, policy facts, DataForSEO keyword facts]
```

## Product Content Expansion To Start Now

Generate product-page expansion inputs, not final UI.

Create:

`data/exports/pdp-seo-expansion-preview.json`

Each product entry should include:

```json
{
  "handle": "",
  "title": "",
  "brand": "",
  "material": "",
  "heightCm": 0,
  "weightLb": 0,
  "cupSize": "",
  "stockStatus": "",
  "primaryKeyword": "",
  "taxonomyLinks": [],
  "bestFor": "",
  "measurementNotes": "",
  "customizationNotes": "",
  "shippingNotes": "",
  "faq": [],
  "similarProductHandles": []
}
```

Rules:

- Generate from Shopify/catalog facts only.
- No invented reviews.
- No unsupported option claims.
- Similar products should match by brand, material, height range, cup, or price.

## Internal Linking Rules

Prepare a function or data map that links products to:

- Brand page.
- Material page.
- Height page.
- Cup/profile page.
- Ready-to-ship or custom page.
- Compare/price-match page.
- Relevant customization guides.

Example:

```ts
if (product.extended.material?.toLowerCase().includes("silicone")) link("/silicone-sex-dolls");
if (product.extended.stockStatus === "ready_to_ship") link("/ready-to-ship-sex-dolls");
if (product.extended.heightCm && product.extended.heightCm < 155) link("/petite-sex-dolls");
```

## Competitor Alternative Briefs

Create briefs only, not published claims yet:

- `rosemarydoll-alternatives.md`
- `yourdoll-alternatives.md`
- `joylovedolls-alternatives.md`
- `siliconwives-alternatives.md`
- `spartandolls-alternatives.md`

Comparison criteria:

- Product range.
- Price transparency.
- Shipping clarity.
- Discreet delivery messaging.
- Customization support.
- Factory photo approval.
- Price-match workflow.
- Support responsiveness.
- Catalog filtering/comparison UX.

Do not make unverifiable claims. Use visible policy/page evidence only.

## Image And Infographic Briefs

Generate briefs for:

- TPE vs silicone comparison.
- Size/height comparison.
- Storage checklist.
- Cleaning checklist.
- Custom order timeline.
- Discreet shipping timeline.
- Implanted hair vs wig.
- Standing feet pros/cons.
- Body heating pros/cons.
- Factory photo approval workflow.

Store briefs in:

`content/seo/image-briefs/`

Each brief should state:

- Purpose.
- Page target.
- Visual elements.
- Text labels.
- Compliance notes.
- Whether it is educational illustration or product-specific image.

## Technical SEO Prep

Prepare implementation tickets for:

1. `app/robots.ts`
2. `app/sitemap.ts`
3. Product sitemap split if product count is high.
4. Collection sitemap.
5. Guide sitemap.
6. Image sitemap or image entries in regular sitemap.
7. Canonical URL helper.
8. Noindex rules for faceted/search pages.
9. Breadcrumb schema.
10. Collection `ItemList` schema.
11. `llms.txt`.
12. Public product feed JSON.

## Validation Commands

Before finishing any code changes:

```bash
npm run typecheck
npm run lint
npm test
```

If Shopify scripts are added, include:

```bash
node scripts/[script-name].mjs --dry-run
```

Do not run `--execute` against Shopify without explicit approval.

## First Codex Task Prompt

Paste this to Codex when ready:

```text
Read docs/post-website-completion-items.md and docs/editorial-voice-and-bylines.md and implement phase 1 only.

Phase 1:
1. Create a local SEO collection registry for the priority collections.
2. Generate content briefs for the first 25 guide topics under content/seo/briefs/.
3. Generate image/infographic briefs under content/seo/image-briefs/.
4. Add a dry-run script that reads Shopify/catalog products and outputs data/exports/seo-collections-preview.json with inventory counts and proposed Shopify collection definitions.
5. Do not call Shopify Admin API with execute mode.
6. Do not modify PDP UI or header/navigation.
7. Run typecheck/lint/tests if code changes are made.
8. Use Jesse and Alex only as real DollWow editorial contributor bylines; do not invent founder identities, fake reviews, or unsubstantiated experience claims.
```

## Second Codex Task Prompt

Use this after phase 1 is reviewed:

```text
Read docs/post-website-completion-items.md and implement phase 2.

Phase 2:
1. Add app/robots.ts and app/sitemap.ts.
2. Add collection metadata generation for app/(store)/shop/[collection]/page.tsx using the SEO collection registry.
3. Add BreadcrumbList and ItemList schema to collection pages.
4. Add canonical/noindex handling so filter query URLs are not accidentally indexed.
5. Keep changes scoped to technical SEO and collection pages.
6. Run typecheck/lint/tests.
```

## Third Codex Task Prompt

Use this after collection templates are live:

```text
Read docs/post-website-completion-items.md and implement phase 3.

Phase 3:
1. Add approved guide pages or MDX rendering.
2. Wire guide pages into sitemap.
3. Add internal links from collection pages to relevant guides.
4. Add product-to-taxonomy internal links using product facts.
5. Generate pdp-seo-expansion-preview.json for review, but do not auto-publish PDP copy.
6. Run typecheck/lint/tests.
```
