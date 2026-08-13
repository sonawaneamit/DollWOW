# DollWOW New Brand Onboarding Protocol

Status: Required launch gate
Owner: Catalog, content, and storefront teams
Applies to: Every manufacturer or supplier added after August 13, 2026

This protocol governs the first public release for a new DollWOW brand. It prevents empty brand hubs, unsupported claims, duplicate supplier copy, irrelevant products, and premature indexation. A brand may be prepared privately while it remains hidden, but no public URL, sitemap entry, schema entity, Learning Center guide, or navigation link may launch until every required gate passes.

## 1. Authorization And Provenance Gate

- Record the legal or trading brand name, official website, supplier contact, and authorization status.
- Store seller approval or certification evidence without implying a certificate exists when the evidence only confirms approval to sell.
- Record the source and permitted use for every product image, option image, video, technical document, and promotional asset.
- Exclude seller-exclusive products, restricted likenesses, unapproved celebrity references, youthful or school-coded presentations, and assets whose rights are unclear.
- Define the approved countries, product lines, fulfillment paths, warranty boundaries, and support contacts.

**Pass condition:** DollWOW has current evidence that it may sell the brand and use the selected commercial assets.

## 2. Catalog Reality Gate

- Import products through the review-first catalog pipeline in `AGENTS.md`.
- Keep Shopify as the production source of truth after review.
- Confirm title, brand, product form, material, body and head identity, height, weight, price, availability, shipping path, images, and customization options for each listing.
- Convert all measurements to both U.S. and metric units where they appear in customer-facing copy.
- Separate full dolls, torsos, hips, heads, compact products, and accessories before collection assignment.
- Remove source-store wording and rewrite duplicate supplier descriptions into DollWOW-specific customer copy without changing factual specifications.
- Build brand-level option defaults only as reusable starting points. Product-specific option evidence overrides every brand default.

**Pass condition:** At least one authorized product is publishable, its canonical PDP is accurate, and the public range is substantial enough that a brand hub helps a buyer rather than advertising an empty catalog.

## 3. First-Party Brand Record

Create `data/knowledge/brands/<brand>.md` before drafting public editorial copy. Record:

- verified company and brand names;
- headquarters or manufacturing location when a primary source confirms it;
- founding date or operating history when verifiable;
- signature materials, construction paths, product forms, and option systems;
- current DollWOW product and configuration evidence;
- manufacturer care, authenticity, warranty, or technical sources;
- facts that remain unknown, disputed, volatile, or unsafe to generalize.

Do not infer government backing, ownership, quality, popularity, manufacturing location, or age from ambiguous company records. Do not publish volatile listing counts as a brand advantage.

## 4. Research-Once Intelligence Gate

Run the complete pre-draft sequence in `docs/seo-intelligence/ai-geo-dataforseo-release-protocol.md`. Use only the layers that can improve page ownership, buyer usefulness, factual support, search visibility, or answer-engine discoverability, but do not omit a relevant layer because the page appears straightforward.

Required evidence normally includes:

- Google and Bing keyword data for brand, model, review, material, product-form, customization, authenticity, shipping, and comparison intent;
- DataForSEO Labs intersections, ranked keywords, competitors, and related terms;
- U.S. desktop and mobile organic SERPs for the proposed owners;
- Domain Analytics, Backlinks, and Content Analysis for the brand and useful ranking pages;
- Google AI Overview and AI Mode, AI Keyword Data, ChatGPT, Claude, Gemini, Perplexity, LLM Scraper, and LLM Mentions;
- Merchant results when the query has shopping or price intent;
- OnPage evidence after a public candidate exists;
- Business Data, App Data, or Amazon data only when the page intent genuinely requires them.

For every call, store endpoint, date, location, language, status, cost, artifact path, adopted finding, and rejected polluted evidence.

**Pass condition:** Research identifies a defensible canonical owner and records why proposed pages should exist. Search and AI responses are competitive evidence, not factual sources.

## 5. Canonical Architecture Decision

Choose the smallest useful public footprint:

- **Brand hub:** The commercial owner for the live DollWOW range, product filters, verified brand overview, support proposition, and current products.
- **Buying guide:** Create only when research shows distinct educational or comparison intent that cannot be satisfied cleanly on the brand hub.
- **Collection page:** Create only for a real product class supported by reliable catalog classification and measurable or strategically important buyer intent.
- **Comparison or alternatives page:** Create only when exact intent exists and the page can offer a distinct decision framework without duplicating another comparison.
- **Model page:** Prefer the PDP unless model-level demand and supporting inventory justify a separate canonical page.

Map one primary query family to one canonical owner. Record redirects, aliases, exclusions, and internal-link relationships before drafting. Never create a hidden duplicate merely to target a keyword variation.

## 6. Customer-First Copy Gate

Every page must help a buyer choose, verify, order, receive, or own the product.

- Open with the buyer's actual question and a direct answer.
- Explain brand history and specialist knowledge briefly, using verified facts and useful insider context.
- Compare materials, bodies, heads, options, weight, handling, fulfillment, authenticity, and ownership considerations only where relevant.
- Use persuasive, proactive support language: if a wanted model is missing, invite the shopper to live chat or `hello@dollwow.com` so the team can confirm sourcing and add eligible products quickly.
- Explain DollWOW programs only where they solve the current buyer concern.
- Avoid internal terms such as PDP, crawlable, schema, content cluster, keyword, editorial process, source trail, or AI assistant.
- Do not invent reviews, popularity, exact delivery dates, universal compatibility, material performance, warranties, or authorization claims.

Run a separate human edit for natural American English, factual restraint, conversion value, and the Jesse or Alex voice where a byline is appropriate.

## 7. Visual Enrichment Gate

Plan the visual package before publication.

- Use actual supplier-authorized products from the featured brand in that brand's guide and hub.
- Keep product identity recognizable. AI may extend a background, clean a composition, or create an explicitly conceptual explanation, but may not redesign the SKU or imply included features.
- Cast several adult-looking products across the package rather than recycling the same three dolls.
- Record product handle, source image, provenance, watermark status, material, dimensions, assigned section, and intended link in a visual manifest.
- Avoid source watermarks when a clean authorized alternative exists. Never remove a watermark merely to conceal provenance.
- Give each brand its own editorial concept while retaining DollWOW logo discipline and premium magazine quality.
- Start every new visual family with one paid sample and explicit user approval. Do not batch while feedback is outstanding.
- Prepare mobile-first and desktop-appropriate crops, descriptive alt text, a useful caption, and a relevant money-page link.
- Keep critical factual text in HTML even when it also appears inside artwork.

**Pass condition:** The approved visual package teaches, compares, demonstrates, or earns a useful click; it is not decorative filler.

## 8. Storefront And Structured Data Gate

- Publish reviewed Shopify products and confirm storefront availability.
- Build the brand hub from live catalog data and the verified brand record.
- Add only accurate approval or certification language.
- Add canonical metadata, descriptive image alt text, Breadcrumb schema, relevant Organization or Brand references, Product schema on PDPs, and Article/FAQ schema only where visible content supports it.
- Add contextual links among PDPs, the brand hub, collections, support policies, comparison tools, and the Learning Center.
- Add header, footer, sitemap, `llms.txt`, agent discovery, and navigation references only after the public owner returns HTTP 200.
- Keep unpublished brands absent from public navigation, sitemaps, schema, feeds, and indexation submissions.

## 9. Pre-Release QA Gate

- Review every public sentence for customer-facing language and current claims.
- Validate product classification, prices, links, images, option mappings, and dual units.
- Check mobile and desktop layout, image crops, contrast, overflow, disclosure behavior, and tap targets.
- Confirm self-canonical status, one H1, unique title and description, schema validity, sitemap inclusion, and no accidental duplicate owner.
- Run focused tests, TypeScript, production build, customer-copy audit, and internal-link audit.
- Run DataForSEO OnPage against the deployed candidate and resolve material technical findings.

## 10. Release And Baseline

- Release the approved pages and products.
- Submit only eligible canonical URLs through Google Search Console, Bing Webmaster Tools, and IndexNow where appropriate.
- Record launch date, URL inventory, research cost, page word count, visual inventory, OnPage result, and baseline search/AI citation status in the implementation log.
- Do not call a page complete when a required visual, source, canonical decision, or AI/GEO evidence layer remains missing.

## 11. Post-Launch Upkeep

This stage begins after the initial ranking and citation baseline exists. It is not part of the launch batch unless a defect or factual change requires immediate correction.

- Review GSC and Bing queries, impressions, positions, CTR, and indexation.
- Review DataForSEO organic and AI citation movement, LLM Mentions, merchant visibility, and new competing pages.
- Refresh product examples, availability, source dates, and material claims when the catalog or manufacturer documentation changes.
- Add new content only for a proven canonical gap, repeated customer question, meaningful ranking opportunity, or superior visual asset.
- Do not rewrite a completed page merely because another API can be called again.

## Zelex Hold

Zelex remains a prepared but hidden brand. Do not publish or index a Zelex hub, guide, collection, comparison owner, schema entity, or navigation link until all of the following are true:

1. DollWOW has current authorization and asset provenance.
2. Authorized Zelex products are reviewed and live in Shopify.
3. `/brands/zelex-dolls` returns HTTP 200 with useful inventory.
4. The first-party brand record is refreshed.
5. The complete research-once intelligence gate is rerun against the current market.
6. The manuscript is rebuilt around the actual live range.
7. A Zelex-only visual sample is approved and the required package completed.
8. Pre-release QA and indexation gates pass.
