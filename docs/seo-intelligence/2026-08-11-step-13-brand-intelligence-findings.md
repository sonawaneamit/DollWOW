# Tier 1 Brand Intelligence Findings

Generated: 2026-08-11

## Pilot Scope

This pilot tested Content Analysis, Backlinks, AI Optimization, and OnPage data for the Starpery, Tantaly, and SE Doll brand hubs. Keyword demand, intent, and ranking-page evidence from DataForSEO Labs and SERP remain the foundation.

- Requests: 17
- Successful requests: 17
- Pilot cost: $0.494986
- Brands: Starpery, Tantaly, and SE Doll
- Public URLs scanned: 3

Raw responses, request payloads, task IDs, and exact costs are stored in `data/exports/seo-intelligence/2026-08-11/step-13-brand-intelligence/`.

## What Changed

### Starpery

Backlink-winning manufacturer pages concentrate on authenticity, AI development, weight-reduction technology, and product innovation. The commercial hub now gives buyers clearer guidance on:

- Full-silicone versus silicone-head construction
- Hard, soft, and selected ROS-style head paths
- Model-specific weight-reduction systems
- Finished handling weight rather than height alone
- Missing-model requests through DollWow support

### Tantaly

The manufacturer backlink profile is dominated by the home page and affiliate URLs rather than durable educational resources. Search and catalog evidence still show strong torso and compact-format intent. The commercial hub now emphasizes:

- Product form and included body areas before appearance
- Height, width, depth, weight, base, and storage position
- Female and male torso formats
- Product-specific material and removable-part care
- Missing-model requests through DollWow support

### SE Doll

Manufacturer pages attracting links include authenticity checks, Silicone Pro information, product pages, and newer head-option developments. The commercial hub now explains:

- Established TPE versus full-silicone Silicone Pro paths
- Standard, Body Makeup 2.0, and Master Makeup distinctions
- Body and head compatibility
- Product-specific options rather than brand-wide assumptions
- Missing-model requests through DollWow support

## Technical Findings

All three public brand URLs returned HTTP 200, self-referencing canonicals, one H1, relevant titles and descriptions, substantial crawlable copy, and strong internal-link counts.

DataForSEO reported missing image alt text because the decorative header logo uses an intentionally empty alt attribute. Catalog product images and authorization images already use descriptive alt text. No change is required for the decorative image.

The lightweight scan did not recognize the page's JSON-LD as micromarkup. The application renders CollectionPage, ItemList, BreadcrumbList, and FAQPage JSON-LD in the HTML, so this scanner flag is not treated as evidence that schema is absent. Structured-data validation remains a separate release check.

## API Utility

| API | Pilot value | Future use |
| --- | --- | --- |
| DataForSEO Labs | High | Discover demand, related terms, ranking difficulty, and cluster size. |
| SERP | High | Confirm intent, ranking page types, competitors, features, and query overlap. |
| Backlinks | High when linkable formats matter | Identify source pages and formats that earn links, authenticity interest, tools, research, and outreach targets. |
| OnPage | High and inexpensive | Scan every important URL before and after material changes. Escalate to heavier rendering only when needed. |
| Content Analysis | Conditional | Use for unambiguous phrases and source discovery. Avoid broad names such as `SE Doll`, where unrelated content creates substantial noise. |
| AI Optimization | Baseline and monitoring | Track mentions and source domains over time. The pilot recorded no Google or ChatGPT LLM Mentions results for the supplied targets. |
| Domain Analytics | Conditional | Use when technology, domain, or infrastructure intelligence can change a decision. It is not a default content call. |
| Merchant | Conditional | Use for shopping-result, assortment, and price context. Shopify remains the product and price source of truth. |
| App Data / Business Data | Not applicable here | Do not call unless a future local-business or app-store question requires it. |

## Efficient Backfill Rule

Existing pages do not receive a wholesale rewrite because a new API is available. Reopen a page only when at least one of these conditions is true:

1. Labs or SERP evidence shows the wrong primary intent or page type.
2. Backlink data reveals a useful format or buyer concern missing from DollWow's page.
3. AI source data reveals a recurring cited fact, comparison, or source pattern DollWow can support accurately.
4. Content Analysis reveals a material question not already answered, using an unambiguous query.
5. OnPage identifies a real crawl, metadata, canonical, content, or structured-data defect.
6. Search Console shows impressions without competitive clicks, a query mismatch, or cannibalization.

When none of those conditions applies, retain the page and continue monitoring. When a condition applies, update the smallest relevant section, internal link, visual, schema block, or factual citation rather than regenerating the whole article.

## Backfill Priority

1. Tier 1 money pages and guides with impressions or ranking movement
2. Pages tied to high-demand clusters or conversion paths
3. Pages whose source facts, prices, catalog examples, or supported options have changed
4. Tier 2 content after Tier 1 gaps are closed

This framework makes the three-brand pilot the template for future research while keeping spend and editorial churn proportional to the opportunity.
