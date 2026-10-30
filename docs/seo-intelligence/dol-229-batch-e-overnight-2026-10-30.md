# DOL-229 Batch E Private Buyer Pass

## Scope And Preservation

Continue existing PR163 / `codex/dol-229-batch-e` in `/Volumes/Extreme Pro/Projects/DollWOW-dol229-batch-e`. Before-edit rollback: `38708e2caa0e2821a87ea15e1b9ec939dd77091e`. Runtime buyer pass: `88c67684`. This is an old staged stack, not current production parity. Do not merge or release without separate approval and integration checks.

Only Angelkiss, Hips, Redhead and Slim receive the new buyer pass under `DOL229_BATCH_E_BUYER_SUMMARY=1` AND `VERCEL_ENV=preview`. Dedicated DollVue route, eligibility, membership, readiness and its previously deferred ItemList remain unchanged. No generation, access, session, credit or model calls. Slim's qualified introduction is preserved. No source catalog, product price, options, image, certificate, ordering or filter changes.

The private summary quotes current visible-page starting prices, not catalog-wide minima or landed costs. Invalid/zero/mixed-currency/empty prices omit the summary. Checkout qualification matches the existing cart. Private source reads are strict; failed reads do not substitute sample products. The exact visible paginated card order supplies ItemList only for these four private paths; default 24-item builder behavior is retained elsewhere. Private metadata explicitly says noindex/nofollow; production canonicals remain unchanged.

## Competitor Scorecard

Actual 30 October reads, not search-volume or ranking evidence:

| Page | Useful Evidence | Our Specific Improvement | Still Missing | Confidence |
| --- | --- | --- | --- | --- |
| Angelkiss | Rosemary's older brand introduction explains head-specific mechanisms. | Short head-versus-body construction qualification, actual linked cards and current-page prices. | Current matching competitor catalog audit, exact manufacturer head/body coverage and provider evidence. No universal mechanism claims adopted. | Source/UI medium; overall competitive win low. |
| Hips | 18Doll's Hips page has lower-body explanation and useful shape/material filters. | Distinguishes hips from full torsos; asks buyers to compare dimensions and included construction. | Competitor filtering remains a strength; no whole-market superiority or foreign stock/price adoption. | Source/UI medium; overall competitive win low. |
| Redhead | Leeloo public visible editorial explains shades. Its age gate was not attested or bypassed. | Model-specific included-hair qualification instead of a blanket wig entitlement. | Gated catalog/card comparison was not performed; no full-page competitor acceptance. | Source/UI medium; competitor low. |
| Slim | Leeloo public visible editorial links body shapes; age gate not attested. | Keeps existing material/weight qualifications rather than promising universal lightness or handling. | No new weight thresholds or filtering; full current competitor card comparison incomplete. | Source/UI medium; competitor low. |

Sources: https://www.rosemarydoll.com/introduction-to-angelkiss-dolls/ ; https://18doll.com/collections/sex-doll-hips/ ; https://leeloodolls.co.uk/shop/hair-colour-redhead ; https://leeloodolls.com/shop/body-type-skinny . Public editorial only where gated. No copied media, testimonials, unsupported customization or medical claims. Known YourDoll403, DataForSEO40207 and Treg authentication holds were not retried. No GSC metrics invented; no exhaustive AI/GEO claim.

## Local Verification

- 45 focused tests pass, one explicit live-HTML opt-in skipped normally. Separately enabled actual built-source HTML test passes seven routes: four first pages plus three collection second pages. It verifies cards/images/links, exact ItemList, visible/schema FAQ equality, noindex/nofollow, canonical and checkout line.
- Actual local native browser 1319/390/320, four routes each: 12 cases, no document overflow and correct summary. Angelkiss 320 copy visually reviewed. This alone is not hosted or complete-media acceptance.
- Local first pages each have 36 linked image cards. Starting price ranges USD: Angelkiss2112-2167; Hips294-2599; Redhead1299-2819; Slim1384-1795. Hips page2 has12 cards269-949; other second pages36. These are page-specific values, not warehouse installation, delivery or landed quotes.
- Scoped ESLint and diff whitespace checks pass. Configured local build and both4950 owned-option-asset gates pass. Existing broad localVisualIndex/static dynamic warnings remain.
- Full `npx tsc --noEmit` is NOT green: unchanged `tests/privateDraftPreview.test.ts:18`, TS18048, optional `o.priceDelta`. An in-memory compiler-host overlay of the exact rollback independently returns the same sole diagnostic, with incremental disabled. No source reset or unrelated fixture fix; configured Next build passing is not full test-typecheck passing.

## Next Checkpoint

Exact flagged READY private deployment: https://doll-lzr34vwen-sonawaneamits-projects.vercel.app/brands/angelkiss-dolls , deployment `dpl_Hxe2rbDX9LMvs1MppjhzTjws6Ae2`, runtime `88c67684dfa26495537b46e8e61a9e36d882a7dc`. Same host serves the other three paths. Remote configured build and both4950 asset gates passed; specific remote Node version not independently asserted. Automatic unflagged PR previews do not prove the buyer pass.

Actual authenticated native hosted browser: four first pages at1319/390/320 plus three collection page2 at390, 15 cases total. All exact visible ItemLists, linked image cards, noindex/nofollow, production canonicals and no document overflow. Hips page2 has12 cards, other checked pages36. Four representative first images actually decoded: Angelkiss/Hips/Slim640x960, Redhead639x960; not a full media/identity audit. Angelkiss FAQ actually opened and schema matched visible text. Optional old-stack cookie prompt declined normally; inherited seasonal styling is not a production307 regression or clean-current-production parity claim. Clean390 Angelkiss and320 Redhead screenshots retained privately. Viewport reset, tab closed, all local servers stopped.

Whole DOL229 stays In Progress; this is a bounded private milestone, not complete competitive acceptance. Next staged scope is existing PR164 / `codex/dol-229-batch-f`: read current source/checkpoint/ownership first. Fair Skin, height160-164, Under155, Real Lady and Realistic have narrow qualified scope; no new imagery/membership clearance inferred. No151-held IDO/MD hubs or157/238-held TopFire records. No production/settings/Shopify/cart/order/email writes. No unchanged redeployment required. Later documentation CI is separate from runtime proof.
