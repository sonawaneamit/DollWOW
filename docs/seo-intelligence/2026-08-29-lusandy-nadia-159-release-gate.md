# Lusandy Nadia 159 PDP AI/GEO release gate

Run date: 2026-08-29

Status: released; monitoring pending

Canonical owner: `https://dollwow.com/products/lusandy-nadia-159cm-g-cup-silicone-companion-doll`

Primary fact source: Amit-approved current Lusandy PDP, `https://lusandydoll.com/products/lusandy-nadia-thicc-silicone-doll-159cm`

## Decision

Publish one custom-order product PDP. Do not create or canonicalize an RTS page for this SKU. The page answers exact-product intent with the approved Nadia identity, G-cup, 159 cm body, 96 / 63 / 109 cm measurements, 35 kg Super Weight Reduction construction, silicone material, customization path, factory-photo approval step, and DollWow price. Important facts remain in server-rendered HTML and Product structured data through the existing PDP pipeline.

Search evidence supports exact-product ownership even though measured branded demand is currently zero or unavailable: Google desktop and mobile return 20–30 organic results, but no exact Nadia PDP in the first page. The manufacturer Nadia collection appears around positions 6–7 while 159 cm pages for other heads occupy the leading results. Bing likewise lacks an exact Nadia PDP in its first page. Google Merchant returned no products for the exact query. This is a catalog-identity gap, not a reason to broaden or stuff the copy.

## Intelligence record

Raw artifacts are under `data/exports/seo-intelligence/2026-08-29/lusandy-nadia-159/`.

| Layer | Endpoint / artifact | Result | Cost (USD) | Decision use |
| --- | --- | ---: | ---: | --- |
| Google demand | `/keywords_data/google_ads/search_volume/live` · `google-keywords.json` | 20000 | 0.090000 | Exact branded volume unavailable; keep exact identity rather than adding generic copy. |
| Bing demand | `/keywords_data/bing/search_volume/live` · `bing-keywords.json` | 20000 | 0.090000 | Exact and body-spec demand returned zero; no unsupported expansion. |
| AI Keyword Data | `/ai_optimization/ai_keyword_data/keywords_search_volume/live` · `ai-keywords.json` | 20000 | 0.010700 | Current AI demand zero across the seven-product cluster; retain extractable facts for future discovery. |
| Labs ideas | `/dataforseo_labs/google/keyword_ideas/live` · `labs-ideas.json` | 20000 | 0.024000 | Confirmed broader silicone/custom vocabulary; exact Nadia remains the page owner. |
| Labs ranked | `/dataforseo_labs/google/ranked_keywords/live` · `labs-manufacturer-ranked.json` | 20000 | 0.012360 | Manufacturer visibility establishes Lusandy as the primary entity/source. |
| Google desktop | `/serp/google/organic/live/advanced` · `google-serp-desktop.json` | 20000 | 0.005000 | No exact Nadia PDP in the top results; other Lusandy 159 cm heads dominate. |
| Google mobile | same endpoint · `google-serp-mobile.json` | 20000 after one retry | 0.003500 | Same page-type gap as desktop. Initial internal server failure is preserved in `request-manifest.json`; successful retry is in `request-manifest-retry-google-serp-mobile.json`. |
| Bing SERP | `/serp/bing/organic/live/advanced` · `bing-serp.json` | 20000 | 0.003500 | No exact Nadia PDP on the first result page. |
| Google AI Mode / AI Overview | `/serp/google/ai_mode/live/advanced` · `google-ai-mode.json` | 20000 | 0.004000 | Shows strong need for an exact first-party fact block; rejected inferred construction and pricing claims. |
| ChatGPT scraper | `/ai_optimization/chat_gpt/llm_scraper/live/advanced` · `chatgpt.json` | 20000 | 0.004000 | Could not locate the exact manufacturer page; reinforces explicit sourcing and exact-model verification. |
| Claude response | `/ai_optimization/claude/llm_responses/live` · `claude.json` | 20000 | 0.022836 | Returned mostly retailer analogs; none adopted as product authority. |
| Gemini response | `/ai_optimization/gemini/llm_responses/live` · `gemini.json` | 20000 | 0.000628 | Competitive evidence only; none adopted as product authority. |
| Perplexity response | `/ai_optimization/perplexity/llm_responses/live` · `perplexity.json` | 20000 | 0.006847 | Competitive evidence only; none adopted as product authority. |
| LLM mentions | `/ai_optimization/llm_mentions/target_metrics/live` · `mentions-google.json`, `mentions-chatgpt.json` | 20000 | 0.202000 | Zero current exact-product/domain mentions; establishes the release baseline. |
| Content Analysis | `/content_analysis/search/live` · `content-analysis.json` | 20000 | 0.024036 | Zero exact-query items; no content was copied or inferred from polluted results. |
| Manufacturer OnPage | `/on_page/instant_pages` · `manufacturer-onpage.json` | 20000 | 0.000150 | HTTP 200 and canonical confirmed; source page has 232 images but youth-story and source-price copy are rejected. |
| Manufacturer backlinks | `/backlinks/summary/live` · `manufacturer-backlinks.json` | 20000 | 0.024036 | Manufacturer domain rank 31 / 61 referring domains; supports manufacturer-primary sourcing. |
| DollWow domain baseline | `/backlinks/summary/live` · `dollwow-domain.json` | 20000 | 0.024036 | Pre-release baseline: rank 0 / 10 referring domains; no ranking claim made. |
| Merchant | `/merchant/google/products/task_post` + task result · `merchant-post.json`, `merchant-result.json` | task 20100; result 40102 No Search Results | 0.002000 | No exact shopping result exists; publish accurate Product data without inventing shopping demand. |
| DollWow post-release OnPage | `/on_page/instant_pages` · `dollwow-onpage.json` | 20000; canonical HTTP 200 | 0.000150 | Canonical resolves, score 97.07, no broken links/resources, relevant title/description, 1,333 server-readable words. Catalog media has descriptive alt text; sitewide decorative artwork intentionally uses empty alt text. |

Release total: $0.553779, including the successful mobile retry and focused post-release OnPage call. Request manifests preserve endpoint, run time, status, cost, and artifact paths.

## Adopted findings

- Use the exact canonical title and handle approved for DollWow, with Nadia, 159 cm, G-cup, silicone, and customizable/custom-order language.
- Put height, weight construction, BWH, underbust, feet, cavity depths, material, body construction, factory presentation skin tone, availability, and delivery estimate in server-rendered HTML.
- Keep the short direct-answer introduction and structured measurement list; the SERPs and AI answers show that exact facts are presently fragmented across other heads and retailers.
- Preserve the manufacturer as the primary specification source while making DollWow the canonical owner of its own price, checkout discount, customer support, and pre-shipment approval workflow.
- Use descriptive alt text on all 29 authorized factory stills and the approved non-nude video.

## Rejected or polluted evidence

- Rejected the source word “thicc,” the source’s dancer/fashion backstory, its youth-coded age narrative, and its $2,960 price.
- Rejected Google AI Mode’s inferred medical-grade/platinum-cure silicone, internal filler, skeleton construction, generic two-week production time, $2,960 price, and other unverified configuration claims.
- Rejected retailer results for Mizuki, Belle, Heidi, and Chloe as facts about Nadia; they are evidence of SERP ambiguity only.
- Rejected generic AI claims about warranty, customs, packaging, inserts, anatomy, articulation, and approval rights unless supported by current DollWow policy or the locked product brief.
- Rejected `bbw` / `chloe`, ready-to-ship, warehouse, and Real Skin Texture vocabulary for this product.

## Conditional layers

Business Data, App Data, and Amazon Labs are not relevant to an exact direct-store product PDP and were not called. Merchant data was relevant and returned no exact shopping results. The focused post-release DollWow OnPage call passed. GSC/Bing indexing should be checked weekly, with AI demand, exact-product mentions, citations, Merchant appearance, and SERP ownership reviewed monthly.
