# Agent Access And Observability Priority

Updated: 2026-08-14

## Decision

DollWOW will maintain a human-first visual storefront and a concise, factual machine-readable layer for search systems and AI agents. This is a priority technical GEO workstream, but not a substitute for useful content, authority, citations, schema, or conventional search fundamentals.

The immediate work is based on Benedikt Holm's June 4, 2026 article, [A reverse mullet type of internet](https://spock.is/writing/reverse-mullet). The article reports a small informal experiment on one personal website: models rarely fetched an undiscovered `llms.txt`, then consistently used it after a visible HTML link advertised it; models subsequently preferred a plain-text query endpoint over a JSON endpoint. Treat this as a useful architecture signal, not proof of a ranking or citation factor.

## Priority Implementation

1. Advertise `/llms.txt` and `/agent-index.json` with standards-based alternate links in HTML. Do not expose internal SEO or agent instructions in customer-facing page copy.
2. Offer deterministic, factual query endpoints at `/llms?query=` and `/llms/json?query=`. They search an approved internal index and never generate claims.
3. Offer a Markdown representation for every public indexable HTML page at `/markdown/{canonical-path}` and honor an explicit `Accept: text/markdown` request on the canonical URL. The representation is generated from the canonical server-rendered main content, not maintained as separate copy.
4. Keep ordinary HTML canonical. Markdown responses are `noindex, follow`, link back to canonical HTML, and vary on `Accept`.
5. Log requests from known search and AI crawler user agents on public content paths. Record only crawler family, method, path, requested representation, and timestamp. Do not record IP addresses, cookies, referrers, account paths, cart paths, checkout paths, or query strings in this event.
6. Run a source-HTML audit over representative home, collection, brand, guide, and policy pages. Essential facts must be present before JavaScript executes. Interactive tools may remain enhancements.
7. Keep the underlying Next.js proxy on a patched release because it also controls checkout routing and admin access. The August 14 implementation raised Next.js from `16.2.6` to `16.2.11`, removing the applicable proxy-bypass advisory while preserving the existing controls.

## Coverage

Sitewide Markdown includes the homepage, public collections, brand hubs, product pages, Learning Center pages, policies, buying tools, and other sitemap-owned HTML pages. Private accounts, carts, checkout, admin, operations, API, search-result, saved-item, and temporary workflow routes are excluded. JSON datasets and feeds remain machine-readable in their native format.

## Measurement

- Weekly: review agent requests to `/llms.txt`, query endpoints, Markdown guides, canonical guides, collections, brands, products, datasets, and policy pages.
- Monthly: compare logs with DataForSEO Google AI Mode, AI Overview, AI Keyword Data, LLM Responses, LLM Scraper, and LLM Mentions evidence.
- Record crawler family, requested paths, representation preference, successful retrieval, citations, referral evidence where available, and any recurring unresolved question.
- If Vercel's standard log retention is insufficient, add an approved log drain or privacy-safe event store before making longitudinal claims.

## Guardrails

- `llms.txt` is an emerging convention, not a guaranteed SEO or GEO advantage.
- Do not use hidden links, prompt injection, cloaking, or different factual claims for agents and people.
- Do not publish technical notes such as “for AI assistants,” “crawlable,” “PDP facts,” schema instructions, or keyword directives in visible customer copy.
- AI answers remain competitive evidence, not factual authority.
- Volatile product and policy facts must resolve to current canonical catalog and policy sources.
