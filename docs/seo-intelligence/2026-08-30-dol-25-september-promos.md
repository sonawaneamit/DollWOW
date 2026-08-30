# DOL-25 September Promotions AI/GEO Release Record

- Run date: 2026-08-30
- Canonical owner: `https://dollwow.com/promo`
- Winning page type: maintained commercial promotion index
- Status: released; monitoring pending

## Decision

`/promo` is the canonical index for currently published DollWOW brand promotions. The SE Doll brand hub remains the canonical catalog owner at `/brands/se-doll`, and eligible PDPs remain the source of product-specific bonus eligibility. `/shop/*` does not own brand promotions.

The public page uses a direct, server-rendered answer: the promotion identity, exact dates, eligible custom-order type, six TPE/STPE bonuses, checkout treatment, RTS exclusion, and canonical SE Doll shopping path. The supplied factory mail, live-safe factory banner, and authoritative DollWOW handle export control all public facts.

## Evidence Run

- Focused raw artifacts: `data/exports/seo-intelligence/2026-08-30/dol-25-september-promos/` (local review artifacts, ignored by git)
- Committed request manifest: `docs/promotions/dol-25-september-2026/seo-request-manifest.json`
- Supplier evidence: `docs/promotions/dol-25-september-2026/source-pack-readme.md`, `source-facts.json`, and `se-pdp-frees.md`
- Handle evidence: `data/promotions/se-doll-september-2026-handles.json`

- Requests: 21
- Failed requests: 0
- Recorded cost: `$0.534775`
- Merchant result: task `08300810-1783-0179-0000-356228dad4c4`, status `20000 Ok`, 38 results
- Reused baseline: Step 74 Tier 1 brand-hub completeness, run 2026-08-12, 70 successful calls and `$1.2301666` incremental cost. This already covered prior Google demand/Labs/SERP evidence, SE Doll Content Analysis and backlinks, AI Mode, ChatGPT, Claude, Gemini, Perplexity, LLM Mentions, Merchant, and OnPage for `/brands/se-doll`.

| Layer | Endpoint | Status | Cost |
| --- | --- | --- | ---: |
| Google Keyword Data | `/dataforseo_labs/google/keyword_overview/live` | 20000 Ok | $0.012000 |
| Bing Keyword Data | `/keywords_data/bing/search_volume/live` | 20000 Ok | $0.090000 |
| AI Keyword Data | `/ai_optimization/ai_keyword_data/keywords_search_volume/live` | 20000 Ok | $0.010500 |
| Labs ranked keywords | `/dataforseo_labs/google/ranked_keywords/live` | 20000 Ok | $0.014280 |
| Labs domain gap | `/dataforseo_labs/google/domain_intersection/live` | 20000 Ok | $0.014280 |
| Google desktop SERP | `/serp/google/organic/live/advanced` | 20000 Ok | $0.008000 |
| Google mobile SERP | `/serp/google/organic/live/advanced` | 20000 Ok | $0.008000 |
| Bing desktop SERP | `/serp/bing/organic/live/advanced` | 20000 Ok | $0.003500 |
| Google AI Mode | `/serp/google/ai_mode/live/advanced` | 20000 Ok | $0.004000 |
| ChatGPT LLM Scraper | `/ai_optimization/chat_gpt/llm_scraper/live/advanced` | 20000 Ok | $0.004000 |
| ChatGPT response | `/ai_optimization/chat_gpt/llm_responses/live` | 20000 Ok | $0.023688 |
| Claude response | `/ai_optimization/claude/llm_responses/live` | 20000 Ok | $0.023457 |
| Gemini response | `/ai_optimization/gemini/llm_responses/live` | 20000 Ok | $0.035728 |
| Perplexity response | `/ai_optimization/perplexity/llm_responses/live` | 20000 Ok | $0.006400 |
| Content summary | `/content_analysis/summary/live` | 20000 Ok | $0.024036 |
| Content search | `/content_analysis/search/live` | 20000 Ok | $0.024720 |
| Backlink baseline | `/backlinks/summary/live` | 20000 Ok | $0.024036 |
| Pre-release OnPage | `/on_page/instant_pages` | 20000 Ok; canonical returned 404 as expected | $0.000150 |
| Google LLM Mentions | `/ai_optimization/llm_mentions/target_metrics/live` | 20000 Ok; zero baseline | $0.101000 |
| ChatGPT LLM Mentions | `/ai_optimization/llm_mentions/target_metrics/live` | 20000 Ok; zero baseline | $0.101000 |
| Google Merchant | `/merchant/google/products/task_post` + `/merchant/google/products/task_get/advanced/{id}` | 20100 created; 20000 result | $0.002000 |

## Post-Release Verification

- Production deployment completed from merge commit `47056860efc3b26596e01465b12a673322b939fe`.
- `https://dollwow.com/promo`, `/brands/se-doll`, a listed TPE PDP, and a listed Silicone Pro PDP returned HTTP 200.
- Production `/promo` source contains one H1, the self-referencing canonical, exact dates, all six TPE/STPE bonuses, RTS exclusion, checkout treatment, and visible-content-backed JSON-LD.
- `Accept: text/markdown` returned the equivalent promotion identity, dates, bonuses, and checkout facts.
- The approved 1920×750 banner rendered in source on `/brands/se-doll`; an eligible TPE PDP and a soft-belly proxy Silicone Pro PDP rendered the correct blocks. RTS and Sophie Lane exclusion checks remained clean.
- Focused post-release OnPage call: `/on_page/instant_pages`, task `08300821-1783-0275-0000-a4b450d62088`, status `20000 Ok`, cost `$0.000150`.
- OnPage confirmed HTTP 200, HTTPS, no redirect, one H1, canonical `https://dollwow.com/promo`, relevant title and description, 32 internal links, and no 4xx/5xx or broken-page flag.
- Total recorded DOL-25 DataForSEO cost including post-release verification: `$0.534925`.

## Adopted Findings

1. All five focused Google, Bing, and AI demand phrases returned zero measured volume. The page therefore serves a maintained customer-navigation need and exact campaign lookup rather than claiming broad demand.
2. Google interpreted `se doll promotion` ambiguously and suggested `sea doo promotion`; Bing was dominated by unrelated `SE` entities. Public metadata and the H1 explicitly say “sex doll brand promotions,” while the card uses the full “SE Doll” identity.
3. Desktop and mobile Google results were dominated by coupon aggregators, stale retailer pages, and a demo manufacturer promotions page. The page answers dates, eligible order type, included bonuses, RTS exclusion, and checkout treatment directly instead of imitating coupon-page language.
4. Answer engines could not independently verify the private September factory mail. This supports prominent exact dates and eligibility from DollWOW’s supplier evidence, without using AI answers as factual authority.
5. The canonical index links to `/brands/se-doll`; the brand banner links back to `/promo`; qualifying PDPs render their exact bonus set. The footer, sitemap, `llms.txt`, agent index, Markdown alternate, and content negotiation expose the index consistently.

## Rejected Polluted Evidence

- Coupon-aggregator percentages and retailer discount claims were rejected because they are not the supplied SE Doll factory terms and would violate the parked-percentage rule.
- Google AI Mode, Gemini, and Perplexity responses contained unsupported or stale retailer offers. None were adopted.
- Content Analysis was heavily polluted by unrelated historical newspapers, animal-doll stories, and generic adult pages. None of its copy or claims were adopted.
- Bing results for `SE` were dominated by bicycles, Schneider Electric, Sea Limited, microphones, and iPhone SE. Those entities were rejected.
- Merchant results mixed valid SE Doll products with children’s toys and underage-coded doll listings. No Merchant image, price, title, popularity inference, or product claim was adopted.
- Manufacturer-domain Labs results were dominated by misspellings and unrelated queries. They did not change the page architecture or public facts.
- Domain Analytics, Business Data, App Data, and Amazon Labs were rejected as irrelevant to a dated first-party promotion index and its supplied catalog eligibility list.

## Release Gates

- Self-referencing canonical and one H1 on `/promo`.
- Promotion identity, dates, eligible order type, bonuses, RTS exclusion, and checkout fact present in server HTML.
- Visible-content-backed `CollectionPage` and `ItemList` schema only.
- Factory banner has descriptive alt text; all important banner facts are repeated in HTML.
- No Silicone-doll, Silicone-torso, US-EU-stock, Rosemary, Your Doll, Lusandy, video, GIF, extra factory percentage, price change, or care-kit content in the live UI implementation.
- Production 200, canonical, HTML direct answer, Markdown alternate, sitemap discovery, and focused OnPage checks are complete. No browser screenshot review was requested for this release.

## Monitoring

The release baseline is recorded above. Review GSC and Bing weekly through the promotion, and recheck AI mentions/citations if the page earns impressions. The promotion automatically leaves public surfaces after 30 September 2026; do not extend it without new supplier evidence.
