# Moonvale Research and Draft

Status: content ready; final hosted naming verification pending. Scoped research and local validation reviewed. Preview only, not a release approval or a claim of exhaustive optimization.

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

## Completed Follow-Up Checks

- `moonvale/completion-ledger.json`: Google and ChatGPT LLM Mentions, three Labs relevant-page samples, and Merchant post/get. Additional cost $0.255; total Moonvale-specific research $0.389901. Both mentions queries returned no matching records. Do not equate this with no real-world AI visibility.
- Labs relevant-page samples returned 8 DollWow, 40 FirstLoveDoll and 77 MyRobotDoll URLs. FirstLoveDoll's Moonvale collection appeared with two indexed keywords. No Moonvale URL appeared in the other returned samples. This supports retaining the existing commercial hub, but is not a full duplicate/cannibalization audit.
- Merchant returned 40 offers. Only one title explicitly matched Moonvale (a Velara offer); other results were unrelated toy products. Reject the polluted set as pricing or demand evidence. The one offer is not proof of equivalent configuration or a reason to change DollWow prices.
- Hosted Brave verified commit `9bc0156`: correct title, production canonical, model-specific introduction and comparison copy. Mobile screenshot at 390x844 showed readable text and existing expandable introduction, with no horizontal document overflow.
- `moonvale/retrieval-checks.json`: local HTML, Markdown alternate, Accept negotiation, `/llms.txt` and `/agent-index.json` all returned 200. HTML and both Markdown responses include the model names, weight warning and distinct look labels. HTML advertises the Markdown alternate and llms discovery; llms and agent-index cross-link. Markdown is `noindex, follow`. Local Markdown headers reference the local HTML source; no preview URL is intended as a production canonical.
- Preview inspection found the generic naming formatter discarded reviewed look suffixes. A Moonvale-only adjustment preserves the catalog's existing look names on cards, headings and schema. Ten fixture cases cover the current looks and preserve explicit editorial names. No Shopify names, handles, prices, descriptions or options are modified.
- Local mobile checks confirmed all ten distinct card labels fit their containers without horizontal overflow. Temporary viewport override reset. TypeScript and focused naming/brand tests passed. Full suite: 693 passed, two skipped.

## Release Boundaries

1. Verify the final naming adjustment on the hosted preview before production approval.
2. Manufacturer confirmation is required before adding weights, brand ownership, supported functions or material-performance claims. Those claims are deliberately omitted, so missing supplier data does not require inventing placeholders or rewriting the catalog.
3. The existing authorization card, original product photographs, price feed and configurator are unchanged. No new visual asset is required for this copy/naming pass.
4. Production release approval and post-release GSC/Bing/engagement monitoring remain pending. Third-party estimates do not replace actual indexed-page or conversion results.

The separate guide/navigation changes at commit `3a4a09b` passed hosted Brave verification: canonical remains the production guide URL, 33 chapters start collapsed, and four links appear after the complete quick answer. That verification does not release this Moonvale draft.
