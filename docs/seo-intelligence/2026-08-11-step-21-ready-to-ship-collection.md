# Step 21: Ready-To-Ship Collection Match And Exceed

Date: 2026-08-11

## Decision

Use `/shop/ready-to-ship` as the single canonical owner for `in stock sex dolls`, `ready to ship sex dolls`, and `fast shipping sex dolls`.

Do not create separate thin collections for the supporting phrases. Permanent redirects now consolidate `/shop/in-stock-sex-dolls` and `/shop/fast-shipping-sex-dolls` into the canonical collection. `/warehouse` remains the distinct owner for warehouse-region education and must not compete with this inventory collection.

## DataForSEO Evidence

- Three fresh United States desktop SERPs at depth 20 cost $0.0105.
- Collection and store pages dominate all three commercial result sets.
- DollWow did not rank in the top 20 for any of the three queries at review time.
- A focused live OnPage check cost $0.0015 and returned HTTP 200, a self-canonical, one relevant H1, 788 words, 69 internal links, 38 images, no broken links, and no duplicate title or description. The recorded OnPage score was 95.24.
- Total recorded Step 21 DataForSEO cost: $0.0120.
- Backlinks, Merchant, Content Analysis, and AI Optimization were not purchased because they would not change the canonical owner, inventory filter, or buyer-information requirements for this release.

## Live Catalog Boundary

The collection returned 80 currently available products during QA. Ready to ship means a product is tied to current warehouse inventory. It does not promise an arrival date. Buyers are asked to confirm the exact unit, warehouse region, dispatch status, carrier timing, included configuration, and any remaining choices before checkout.

## Implemented

- Updated the H1 to `Ready-to-ship sex dolls` and strengthened the metadata for in-stock and ready-to-ship intent.
- Added customer-facing guidance for product form, material, measurements, handling weight, price, warehouse region, included configuration, dispatch, delivery, and fixed versus custom choices.
- Added three buyer notes, three comparison rows, six FAQs with schema, and six internal links to relevant buying, cost, care, protection, and full-catalog pages.
- Removed an unsupported universal claim that made-to-order dolls usually arrive in three to four weeks.
- Added regression coverage for collection ownership, redirects, availability filtering, FAQ depth, warehouse context, and the absence of invented fixed delivery windows.

## Validation

- Both supporting URLs return permanent redirects to `/shop/ready-to-ship`.
- TypeScript, customer-copy audit, all 165 tests across 35 files, and the 109-route production build passed.
- Mobile QA at 390 x 844 confirmed the complete 512-character introduction remains server-rendered behind the approved disclosure, all related links appear near the first viewport, and no horizontal overflow occurs.
- Desktop QA at 1440 x 900 confirmed the 52 px H1, full untruncated introduction, hidden mobile disclosure, six FAQs, and no horizontal overflow.

Status: complete.
