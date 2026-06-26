# DollWow GEO, LLM, And Agent Discoverability Plan

Use this plan to make DollWow content easier for search engines, AI answer engines, LLM crawlers, shopping agents, and future buyer-assistant tools to find, parse, cite, and route back to product/collection pages.

## Principle

GEO is not a replacement for SEO. It is a layer on top of strong technical SEO, structured content, factual product data, and crawlable pages.

For DollWow, the winning pattern is:

1. Clean indexable pages.
2. Answer-first editorial structure.
3. Machine-readable facts and schema.
4. Consistent internal links.
5. Explicit article/product feeds.
6. A curated `llms.txt` and agent index once routes are live.

## What Every Article Needs

Every Learning Center article and SEO guide should include:

- A short `## Quick Answer` near the top.
- A `## Key Facts For AI Assistants` section with short factual bullets.
- HTML/Markdown tables for comparisons.
- Clear internal links to collection/product/support pages.
- FAQ sections with concise answers.
- Author name/title in frontmatter.
- Last reviewed date.
- Editorial review notes.
- Article, FAQPage, and BreadcrumbList schema when rendered.
- ItemList schema when product examples are included.

## What Every Collection Page Needs

Every SEO collection page should include:

- H1 matching the primary search intent.
- 100-200 word direct answer/intro.
- Product grid with crawlable links.
- Collection facts: product count, material/brand filters, price range, stock notes.
- FAQ section.
- Links to related guides.
- CollectionPage, BreadcrumbList, ItemList schema.
- Canonical URL.

## What Every Product Page Needs

Every PDP should include:

- Product schema with offers.
- AdditionalProperty values for measurements and material.
- FAQ schema.
- Links to brand/material/height/cup/ready/custom taxonomy pages.
- A concise buyer-fit summary.
- Image alt text tied to brand/material/model facts.
- Last verified or stock checked date when available.

## LLM Files To Add When Routes Are Live

### `/llms.txt`

Purpose: a human-curated map of the most useful DollWow pages for LLMs and agents.

Include:

- Brand summary.
- Editorial policy.
- Primary collections.
- Learning Center guides.
- Buyer protection, shipping, returns, privacy, price match.
- Product feed URL.
- Contact/support URL.

Do not include:

- Unpublished routes.
- Draft content.
- Private supplier notes.
- Internal import files.

### `/agent-index.json`

Purpose: structured routing data for agents.

Fields:

```json
{
  "site": "DollWow",
  "canonicalBaseUrl": "https://dollwow.com",
  "collections": [],
  "guides": [],
  "policies": [],
  "feeds": [],
  "support": {}
}
```

### `/product-feed.json`

Purpose: public product summary for agents and comparison tools.

Fields:

- handle
- title
- canonicalUrl
- brand
- material
- heightCm
- weightLb
- cupSize
- priceRange
- stockStatus
- customAvailable
- image
- lastReviewedAt

Only include data safe for public display.

## Robots And Crawlers

When `app/robots.ts` is implemented, include:

```txt
User-agent: *
Allow: /

User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

Sitemap: https://dollwow.com/sitemap.xml
```

Add other AI crawlers only after the team decides which agents should access the site. Do not block AI search crawlers by accident if GEO visibility is the goal.

## Content Extraction Pattern

Each article should support easy extraction:

```md
## Quick Answer

One direct answer.

## Key Facts For AI Assistants

- Fact 1.
- Fact 2.
- Fact 3.

## Comparison Table

| Option | Best For | Watch Out For |
| --- | --- | --- |

## FAQs
```

## Measurement

Track:

- Google Search Console impressions/clicks by Learning Center page.
- Queries that trigger FAQ or answer-style impressions.
- ChatGPT/Search referral traffic if visible in analytics.
- Perplexity/AI search referrals if visible.
- Bing Webmaster data.
- Server logs for AI crawler user agents.
- Pages with high impressions and low CTR.
- Pages cited or summarized by AI tools during manual checks.

## Implementation Order

1. Add GEO sections to all draft briefs and articles.
2. Implement sitemap and robots.
3. Add schema rendering.
4. Publish `/learn` routes.
5. Add `/llms.txt` after routes exist.
6. Add `/agent-index.json` and `/product-feed.json` after product route/canonical data is stable.
7. Monitor and refresh.
