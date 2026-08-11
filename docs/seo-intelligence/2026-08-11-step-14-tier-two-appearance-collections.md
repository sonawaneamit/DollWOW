# Tier 2 Appearance Collection Upgrade

Generated: 2026-08-11

## Decision

Strengthen the existing canonical collection owners:

- `asian sex dolls` -> `/shop/asian-dolls`
- `black sex dolls` -> `/shop/black-dolls`

Do not create `/shop/asian-sex-dolls`, `/shop/black-sex-dolls`, or separate general guides that compete with these commercial pages.

## Data Basis

DataForSEO previously measured approximately 2,900 US monthly searches for each head term. Both opportunities are Tier 2 and transactional with a collection recommendation.

A fresh US desktop depth-20 SERP pull on August 11 returned:

- `asian sex dolls`: 20 organic results, including nine collection pages, one product page, two guides, and eight other page formats.
- `black sex dolls`: 20 organic results, including nine collection pages, one product page, two guides, and eight other page formats.
- DollWow did not appear in the top 20 for either query.

The run completed successfully. Exact API cost was not retained by the older collector response shape; the collector now records task IDs, per-task cost, and total cost for every future run. No duplicate request was purchased solely to recover this small historical cost.

## Live Catalog Check

The August 11 live storefront returned:

- 419 Asian-style matches before the upgrade.
- Seven exact Black-doll matches before the upgrade.

The older opportunity snapshot estimated 470 and 241 metadata-supported candidates respectively. The Black estimate is not used in public copy or current implementation decisions because the live canonical filter is substantially narrower. The Black collection remains valid for the confirmed query but uses current exact matches plus proactive sourcing instead of implying catalog breadth that is not present.

## Match And Exceed Decisions

### Asian collection

- Replace the inherited `Asian look` H1 with `Asian sex dolls`.
- Explain that Asian appearance is a visual category, not one nationality, face, body type, or specification.
- Compare head, body, material, measurements, listed weight, tone, styling, availability, and supported options.
- Link to realism, material, custom-build, cost, shipping, and broad buying guidance.
- Add a direct missing-model sourcing path.

### Black collection

- Replace the broad `Black dolls` H1 with `Black sex dolls`.
- Define the collection around current products shown with deep or dark skin tones and Black-inspired styling.
- Avoid stereotypes about face, proportions, hair, material, or features.
- Distinguish pictured current products from skin tones that may be configurable on another supported model.
- Add a direct missing-model sourcing path to offset the narrower live grid honestly.

## Validation

- Customer-copy audit passed across 120 code files and 41 Learning Center articles.
- TypeScript passed.
- All 160 tests passed, including a new canonical-title and look-filter regression test.
- Production build passed with 109 generated static pages.
- Mobile QA passed at 390 x 844 and desktop QA passed at 1280 x 720.
- Both pages rendered the researched H1, five FAQs, live product cards, sourcing language, and zero horizontal overflow.
