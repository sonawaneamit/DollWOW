# DOL-200 Silicone Collection First Pass

Date: 20 October 2026. Status: preview for independent Dolly review and Martin's release approval. No production change.

## Intent And Baseline

`/shop/silicone` remains the commercial collection. `/learn/silicone-sex-doll-guide` remains the informational buying guide; no new competing URL is created. DOL-194's accepted baseline covers final GSC web data for 18 September-15 October: collection 1 click / 47 impressions, guide 5 / 34. These small observations are not a growth forecast or proof of a ranking bottleneck.

The fresh live collection audit returns HTTP 200, one H1, a matching self-canonical and no reported issues/recommendations. Existing product-first mobile presentation, qualified material advice, comparison content, FAQs, buyer protection and guide links are retained.

## Established Inventory Finding

A strict current public catalog snapshot contains 3,521 listings. Production material filtering returns 1,288 silicone listings and zero hybrid matches under that predicate. Product-form checks identify 1,023 full-body, 232 torso and 32 hips listings, plus one standalone head accessory:

- `lusandy-sex-doll-heads`
- Current Shopify product type: `Silicone doll head`.
- Price at snapshot: USD 599. This price is not changed.

The current opening promises silicone bodies, so that head-only accessory does not belong in this collection. Counts are listings, not distinct models, warehouse units or a factory-wide specification certification. Material exclusion reflects current catalog facts; it is not independent verification of every manufacturer's formulation.

## Exact Preview Changes

1. Exclude positively identified standalone head accessories from `/shop/silicone` before filtering, pagination and structured data. Recognize only explicit head-only tags or product types. Do not mistake a complete silicone-head doll or a headless body requiring a head selection for a loose head.
2. Replace the blanket opening with: "Compare full-body silicone dolls, torsos, and hips. Match the product form before comparing height, weight, or starting price." Keep the existing hybrid boundary and model-specific qualifications.
3. Add the existing `/learn/silicone-sex-doll-guide` to the compact related-guides row.

No full-body-only restriction is introduced. All 1,287 retained body listings remain in the same order with identical product records/prices; the full catalog, brand pages and the standalone head's own page remain available. No Shopify writes, product publication changes, metadata title/description changes, new pages, scheduled-post changes, promotions or analytics settings are included.

## Observable QA

- 39 focused assertions pass, including private full-inventory identity/price/order comparison.
- Typecheck and scoped lint pass; production webpack build passes.
- Owned asset gate: 4,950 assets checked, zero failures.
- Full suite: 2,489 passed / the same 11 pre-existing assertion failures and two pre-existing node:test/Vitest collection errors. Not fully green.
- Browser checks at 390, 320 and 1440px: no full-page overflow; all three supporting disclosures initially closed below the grid.
- At 390px, first product starts at approximately 741px; guides remain a single 50px-high horizontally scrollable row. Current first-page 36 product links and prices match live exactly.
- Interactive torso filtering returns 232 listings, retains the collection canonical and sets `noindex, follow`. Tests wait for navigation metadata to settle, rather than treating the brief streaming transition as the final state.
- All eight guide destinations return HTTP 200 on the live site.
- Complete opening text and native disclosure content remain available with JavaScript disabled.
- Analytics/third-party tracking requests are blocked during tests. The owner-provided request header is applied only to DollWOW origins and stripped before third-party requests.

Private reproducible evidence: `data/exports/dol-200-silicone-2026-10-20/` in this worktree (`live-page.json`, `inventory.test.ts`, `inventory.json`, `verify.mjs`, `qa.json`, viewport screenshots and build/test logs). DOL-194 raw baseline is retained in the main worktree's `data/exports/sprint-baselines-2026-10-20/`.

No new material/medical, factory-function, keyword-demand or AI-visibility claim is added. This is a narrow inventory/first-sentence/internal-link correction, not a new content family or a full materials research refresh. No paid provider calls or new external research spend were initiated. Existing retained SEO research is not represented as fresh DataForSEO/AI observations.

## Release Gate And Measurement

Dolly independently checks the exact preview. Martin must approve its exact commit before release. After approval: merge, read back the actual live collection/count/canonical/guide row, record a 24-72-hour health-check window and the exact 28-day GSC review date on DOL-200. No automation is activated by this document. Genuine purchase reconciliation remains DOL-212; no conversion or revenue effect is claimed here.
