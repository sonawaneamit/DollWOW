# DOL-20 Four SE Doll September Offers — AI/GEO Release Addendum

- Run date: 2026-08-31
- Canonical owner: `https://dollwow.com/promo`
- Winning page type: maintained commercial promotion index
- Status: content ready; release validation pending

## Decision and evidence reuse

This material refresh keeps the canonical and intent established by the DOL-25 release one day earlier and expands the same September 2026 SE Doll campaign from one authorized TPE block to all four factory offer blocks. The recent 21-request DataForSEO run remains directly applicable to the same canonical URL, brand, date range, and buyer intent; no public-search evidence can control the newly approved private factory percentages or SKU eligibility.

- Full findings, adopted/rejected evidence, baseline, and endpoint table: `docs/seo-intelligence/2026-08-30-dol-25-september-promos.md`
- Endpoint, task, status, and cost record: `docs/promotions/dol-25-september-2026/seo-request-manifest.json`
- Focused raw artifacts: `data/exports/seo-intelligence/2026-08-30/dol-25-september-promos/` (local review artifacts, ignored by git)
- Run result: 21 requests, 0 failures, `$0.534775`; post-release OnPage brought the recorded total to `$0.534925`
- Current catalog proof: `/Users/amitsonawane/codex-proof/dol-20-four-offers-handles.json`, generated from the 2026-08-31 live product feed and Shopify metafields
- Public runtime handle artifact: `data/promotions/se-doll-september-2026-handles.json`
- Factory proof and banner provenance: `docs/promotions/dol-25-september-2026/source-facts.json`

## Controlling update

Martin approved the previously parked SE Doll factory percentages on 2026-08-31. That approval supersedes the DOL-25 pack's historical `hold_for_martin` implementation restriction for DOL-20 only. The source facts and banner hashes remain valid; Shopify prices remain unchanged.

The server-rendered `/promo` answer now exposes four distinct offers with exact dates and exclusions:

1. Custom TPE/STPE full dolls: six free upgrades.
2. Custom Silicone Pro full dolls: seven standard free upgrades, body-code-limited soft belly, and four option discounts.
3. Custom silicone torsos: two option discounts, with the current zero-live-PDP catalog gap disclosed.
4. US/EU ready-to-ship stock: separate Silicone Pro and TPE/STPE terms, including the controlling STPE body-makeup pricing note.

Product pages use exact 2026-08-31 handle sets. Search snippets, AI responses, coupon sites, product-title inference, and factory art alone are not used to decide SKU eligibility. The four visible cards back the four-item `ItemList` schema, and every important banner fact is repeated as HTML text.

## Adopted findings

- Preserve `/promo` as the canonical campaign owner and `/brands/se-doll` as the catalog owner.
- Use explicit “SE Doll,” material, custom/warehouse order type, and exact dates because search results showed strong ambiguity and stale coupon pollution.
- Keep offer facts in headings and lists, not only in factory pixels.
- Link all blocks to the canonical SE Doll catalog and retain the sitewide checkout statement without inventing stacking language.
- Use supplier/catalog evidence—not answer engines—as factual authority for the four offers and eligibility.

## Rejected evidence

- Previously captured coupon percentages, retailer promotions, unsupported AI answers, unrelated `SE` entities, youth-coded Merchant results, and polluted Content Analysis remain rejected.
- Height/title inference is rejected for general eligibility. The supplied handle buckets control all offer types; the supplied 155/165 proxy controls soft belly only when no body-code metafield exists.
- The two live RTS products whose source titles contain “torso” remain warehouse Silicone Pro products for this campaign; they do not create a custom-torso PDP.
- Business Data, App Data, and Amazon Labs remain irrelevant to this dated first-party promotion index.

## Release gates

- Source HTML and Markdown alternate must contain four offer headings, exact dates, and the warehouse makeup note.
- All 28 TPE/STPE RTS handles must resolve to 15% plus the makeup note.
- All 26 Silicone Pro RTS handles must resolve to 10% plus free realistic skin texture and no makeup note.
- All 368 custom full-doll handles must remain free of warehouse terms; custom TPE and Silicone Pro terms must not cross.
- Representative desktop/mobile visual checks and a production OnPage baseline remain required after deployment.
