# DOL-25 promotion index AI/GEO release gate

Run date: 2026-08-30

Status: AI/GEO validated; visual package pending

Canonical owner: `https://dollwow.com/promo`

Primary factual source: SE Doll factory mail and factory artwork supplied in `data/promotions/dol-25/`. The source states the 1–30 September 2026 dates and eligible free upgrades. DollWow's current checkout and the supplied handle manifest control PDP eligibility. Competitive search and AI responses are not factual authority for the promotion.

## Decision

Create `/promo` as the canonical index for current brand promotions and keep `/brands/se-doll` as the canonical SE Doll catalog owner. The first index item covers only the verified SE Doll TPE/STPE custom-order bonuses. Show the approved TPE factory art and repeat the dates, eligible order type, and six bonuses in server-rendered HTML. Link the brand hub as the catalog next step. Do not create a Lusandy entry without factory art, and do not expose any factory percentage offer.

The page is published beginning 30 August so customers can see the dated September offer before it starts; the promotion automatically leaves `/promo`, the brand hub, and eligible PDPs after 30 September 2026. The permanent `/promo` route then presents an explicit no-active-promotions state.

## Intelligence record

Raw artifacts and the request manifest are stored locally under `data/exports/seo-intelligence/2026-08-30/dol-25-promo-index/`.

| Layer | Endpoint | Result | Cost (USD) | Decision use |
| --- | --- | ---: | ---: | --- |
| Google demand | `/keywords_data/google_ads/search_volume/live` | 20000 | 0.090000 | `sex doll sale` has 6,600 U.S. monthly searches; exact promotion phrases were unavailable. Keep the index concise and exact rather than expanding into generic sale copy. |
| Bing demand | `/keywords_data/bing/search_volume/live` | 20000 | 0.090000 | `sex doll sale` returned 50; exact SE promotion phrases returned zero. |
| AI Keyword Data | `/ai_optimization/ai_keyword_data/keywords_search_volume/live` | 20000 | 0.010400 | No measured demand for the four-query cluster; the page exists for current-customer navigation and exact offer retrieval. |
| Labs ideas | `/dataforseo_labs/google/keyword_ideas/live` | 20000 | 0.024000 | Results were heavily polluted by unrelated adult and non-commerce terms; none were adopted. |
| Labs relevant pages | `/dataforseo_labs/google/relevant_pages/live` | 20000 | 0.012840 | Reused only as manufacturer-domain visibility context; it does not supersede the factory mail. |
| Google desktop | `/serp/google/organic/live/advanced` | 20000 | 0.005000 | Commercial sale/category pages win; an AI Overview was present. Supports an index page with a direct brand-catalog action. |
| Google mobile | `/serp/google/organic/live/advanced` | 20000 | 0.005000 | Same commercial page type and AI Overview presence as desktop. |
| Bing SERP | `/serp/bing/organic/live/advanced` | 20000 | 0.003500 | `SE Doll sale` was interpreted as unrelated SE entities. Use the full `SE Doll` identity plus material and dates in headings. |
| Google AI Mode | `/serp/google/ai_mode/live/advanced` | 20000 | 0.004000 | Could not establish the supplied September facts from indexed sources; no claim was adopted. |
| ChatGPT scraper | `/ai_optimization/chat_gpt/llm_scraper/live/advanced` | 20000 | 0.004000 | Returned prior August offers and competitor claims; all discounts and stale dates were rejected. |
| Claude response | `/ai_optimization/claude/llm_responses/live` | 20000 | 0.023978 | Reported insufficient current evidence and recommended primary confirmation; the supplied factory mail provides that authority. |
| Gemini response | `/ai_optimization/gemini/llm_responses/live` | 20000 | 0.035784 | Returned coupon and competitor discount pollution; none was adopted. |
| Perplexity response | `/ai_optimization/perplexity/llm_responses/live` | 20000 | 0.006027 | Competitive evidence only; no offer claim was adopted. |
| LLM Mentions, Google | `/ai_optimization/llm_mentions/target_metrics/live` | 20000 | 0.101000 | Establishes the pre-release brand/domain mention baseline. |
| LLM Mentions, ChatGPT | `/ai_optimization/llm_mentions/target_metrics/live` | 20000 | 0.101000 | Establishes the pre-release brand/domain mention baseline. |
| Content Analysis | `/content_analysis/search/live` | 20000 | 0.024720 | Severe `SE` and `doll` ambiguity produced unrelated content; all results were rejected. |
| OnPage pre-release | `/on_page/instant_pages` | 20000 | 0.000150 | Confirmed `/promo` was a 404 before release. Run a focused post-release check on the deployed canonical. |
| Backlinks / Domain Analytics | `/backlinks/summary/live` | 20000 | 0.024036 | Records the DollWow domain baseline; no backlink claim appears on the page. |
| Merchant | `/merchant/google/products/task_post` and task result | 20100 then 20000 | 0.002000 | Forty shopping results were returned for the broad query; merchant listings do not establish DollWow or factory promotion terms. |

Release research total: `$0.567435`. Claude, Gemini, and Perplexity used 11,550 input tokens and 1,190 output tokens in aggregate. The ChatGPT scraper and Google AI Mode endpoints do not expose comparable token totals in their responses.

## Adopted findings

- Use one permanent promotion index instead of creating a campaign-specific competing canonical.
- State the full brand identity, TPE/STPE eligibility, exact dates, and six factory bonuses near the top and in ordinary HTML.
- Use the 800×600 factory asset on the index and the 1920×750 factory asset on the SE brand hub; preserve descriptive alt text and equivalent visible copy.
- Link `/promo` from the footer, sitemap, `llms.txt`, agent index, brand hub, and Markdown alternate allowlist.
- Keep PDP eligibility deterministic from the supplied handle manifest. Shopify's sampled SE custom namespace contains no body-code metafield, so use the supplied 26-handle T155/T165 proxy for soft belly.

## Rejected or polluted evidence

- Rejected every competitor banner, coupon, percentage, price, older monthly promotion, factory-stock discount, and general coupon-site claim returned by search or AI systems.
- Rejected unrelated `SE`, music, toy, fashion, and generic adult terms from Bing, Labs, and Content Analysis.
- Rejected calling realistic oral structure `ROS`; the PDP copy uses the full factory phrase.
- Rejected creating a Lusandy card or route without the required factory asset.

## Conditional layers

Business Data, App Data, and Amazon Labs do not answer a temporary direct-store promotion-index decision and were not called. Current Shopify catalog data, the factory source pack, and the authoritative handle manifest are the controlling commerce evidence. GSC/Bing should be checked after release, and the focused OnPage scan must be repeated against the deployed canonical.
