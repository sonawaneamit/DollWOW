# Moonvale Research and Draft

Status: content ready; AI/GEO validation pending. Preview only, not a release approval.

## Decision

Keep `/brands/moonvale-dolls` as the commercial canonical owner. Improve its existing profile rather than create another guide or merge product URLs. Identify the four model families and explain how named looks, missing weights and included items affect comparison. No Shopify product, price, tag or option writes.

## Evidence

Local artifact root in the original workspace: `data/exports/seo-intelligence/2026-09-28/`.

- `research/ledger.json` records the earlier audit endpoints, statuses and costs. Desktop/mobile Google organic results for `moonvale doll` emphasize named fantasy products, retailer pages, news and social results. No standalone AI Overview was present in those sampled organic result types; a PAA answer referenced an asynchronous overview without usable text.
- Google Ads demand returned null for the term, not a proven zero. Bing returned estimated monthly volume 20, with recent monthly values higher. AI Keyword Data returned zero estimated volume. Labs suggestions returned no items. These sparse datasets do not prove absence of buyer demand; first-party GSC impressions remain relevant.
- `moonvale/ledger.json` records eight new endpoint calls, all task status 20000, costing $0.134901 total. Endpoints: Google AI Mode, ChatGPT LLM Scraper, Claude/Gemini/Perplexity LLM Responses with search, Content Analysis search, Labs keyword suggestions and page-level Backlinks summary. Exact prompts, endpoints, timestamps, costs and absolute artifact paths are stored there.
- `moonvale/catalog.json` is a read-only Shopify Storefront snapshot from September 28. All ten products were returned with no next page. Four model families: Lyora (three listings, 155 cm), Sorelle (three, 160 cm), Velara (two, 165 cm), Cerina (two, 170 cm). All list Silicone and custom ordering; all ten lack `custom.weight_lb`. Titles distinguish leopard, fox, panther and deer looks. The queried source URL field is empty, which is not proof no other provenance exists.
- Existing `research/onpage-4.json` covers the live canonical brand URL. Existing domain/link research is shared context, not direct proof of authority for this page. The new page-level backlink call returned no result; do not report that as a verified zero backlinks.

## Adopted and Rejected Findings

Adopted: make the doll entity and model names explicit; explain multiple looks per model; keep exact listing links authoritative; flag missing handling weight instead of estimating; clarify pictured versus included accessories.

Rejected as factual authority:

- Gemini's game/customization and craft-material advice is unrelated entity pollution.
- Claude's failure to find the brand is a visibility observation, not evidence the brand does not exist.
- AI Mode's platinum/heat-resistant material assertions are unsupported by the retrieved DollWow catalog. Its assertion that Sorelle details are entirely missing conflicts with current catalog data.
- ChatGPT and Perplexity provide conflicting retailer-derived weights and variants. None of those figures are adopted.
- Retailer/news content suggests fantasy intent but does not establish manufacturer ownership, all-model compatibility, warranty or material performance claims.

One prompt per model/provider is a diagnostic sample, not a citation-share benchmark or proof of ranking causation.

## Remaining Gates

1. Page/brand-specific LLM Mentions and focused competitor-page/canonical overlap evidence; existing domain-level calls are not full substitutes.
2. Merchant evidence for the shopping-led intent, with documented availability or lack of useful results.
3. Current manufacturer confirmation before adding weights, brand ownership, supported functions or other supplier claims. The present draft deliberately omits those claims.
4. Hosted verification and retrieval/discovery checks of this draft. Local Brave confirmed the new title, introduction, comparison copy and production canonical at a 1470px viewport without document overflow. A direct HTTP response returned 200 with the model names, weight warning and FAQ present outside scripts. Nine focused brand tests and TypeScript validation passed; FAQ/schema answer parity is covered. Mobile visual review remains pending.
5. Production release approval, then GSC/Bing and first-party engagement monitoring. Do not mark the page fully optimized before these gates are evaluated.

The separate guide/navigation changes at commit `3a4a09b` passed hosted Brave verification: canonical remains the production guide URL, 33 chapters start collapsed, and four links appear after the complete quick answer. That verification does not release this Moonvale draft.
