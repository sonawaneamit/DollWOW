# AI training permission and Lusandy brand discovery

## Scope and owner decision

On 20 October 2026 the owner confirmed permission for AI crawling and model
training, reporting that the Cloudflare settings had already been changed.
The shared `CONTENT_SIGNAL` now uses `ai-train=yes`. This updates both robots.txt
and the public-page/resource headers emitted by the proxy. Search and AI input
were already permitted; training permission is a separate choice, not a ranking
or indexing guarantee. The existing `use=reference` field is unchanged.

No named Allow-only crawler groups were added. The `/admin/`, `/ops/` and `/api/`
crawl exclusions and actual application authentication remain unchanged.

## Lusandy discovery repair

Canonical hub: `/brands/lusandy-dolls`.

Lusandy previously had products and product-sitemap aliases but no brand-registry
entry. Registration now supplies the normal brand directory, header navigation,
sidebar filter, collection redirect and brand sitemap entry. Existing product
records, prices, inventory, publication status and homepage eligibility policy
are not changed.

The hub uses the existing brand-page template with a dedicated title,
description, introduction, comparison guidance and visible/schema-matched FAQs.
Copy distinguishes full dolls and torsos, exact body/head configurations,
handling weight, photographed accessories and ready-to-ship warehouse regions.
It does not promise every feature on every model or invent stock counts.

Registration must not manufacture seller-approval evidence. No Lusandy
authorization record exists in the current authorization registry. The new
brand is therefore excluded from its automatic approved-seller fallback until
authorization is recorded. This does not hide the hub or its existing products.

## Research and limits

- Manufacturer: https://lusandydoll.com/ and its product collection. The official
  range supports silicone construction and model-dependent finish/weight claims;
  no blanket medical-grade, fixed weight-reduction percentage or accessory claim
  was adopted.
- Reused DataForSEO evidence:
  `data/exports/seo-geo-plan-2026-10-16/dfs-serp-lusandy.json`, US English desktop,
  `/serp/google/organic/live/advanced`, captured 16 October, successful response,
  original cost $0.002. Manufacturer and dealer results support a commercial hub
  for the brand, distinct from the scheduled buying-guide article. No new paid
  call was made, and this is not described as fresh keyword or AI visibility data.
- Cloudflare signal definitions:
  https://developers.cloudflare.com/bots/additional-configurations/managed-robots-txt/
- A live audit request received a Cloudflare challenge. That response cannot
  establish missing page metadata or whether verified crawlers can retrieve the
  production page. No challenge was bypassed and no Cloudflare settings changed.
- Broader brand-specific AI/GEO research and post-release observation remain in
  the operating-plan queue. This repair does not claim a full protocol pass,
  demonstrated rankings, indexing or attribution impact.

## Verification and release boundary

Focused unit tests cover the signal value, response headers, unchanged crawl
exclusions, Lusandy aliases/navigation, metadata/schema, sitemap discovery,
authorization fallback and existing homepage selection. The homepage test's
expected canonical-brand list also needed its existing Top Fire/FunWest
directory eligibility reflected; no homepage production policy changed.

Private read-only evidence and browser checks are stored under
`Projects/DollWOW/data/exports/ai-policy-lusandy-2026-10-20` on the external SSD.
Typecheck, lint, local source/rendered inspection and desktop/mobile screenshots
are part of review. Production readback remains required after an approved merge.
No products are published or changed by this patch.

### Audit disposition

The live `audit-page` request returned three suggestions from a challenged
response. They are retained rather than silently treated as real live defects.
No inventory rows were returned.

| Finding | Outcome | Verification |
| --- | --- | --- |
| `action-79c79bb0df99`: Add a concise, descriptive title that identifies this page. | Deferred for production verification | Local hub has the dedicated Lusandy title; live response was challenged. |
| `action-7674a3897cf4`: Add a descriptive H1 for the page's main visible topic. | Deferred for production verification | Local H1 is Lusandy Dolls; live response was challenged. |
| `action-ad28ffb8f351`: If duplicate or parameter variants exist, declare the preferred canonical URL consistently; otherwise no change is required. | Deferred for production verification | Local page declares the production Lusandy hub canonical. |
| Local `canonical_mismatch` | Not needed | Localhost intentionally declares the production canonical; do not change it to localhost to satisfy the audit. |
