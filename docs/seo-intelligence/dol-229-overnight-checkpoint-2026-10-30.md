# DOL-229: Overnight Batch C Revision

In Progress. PR161 first, PR183 next, then the remaining approved batches.
Not a completed five-page scorecard, not In Review, not live. Read the current
Linear description and29Oct22:38 brief before continuing.

## Latest Paginated Schema Correction

Runtime bbf78400 continues the SAME PR161 branch. Source inspection established
that the previous ItemList exposed only the first24 records of the whole filtered
collection while the actual page renders36 cards. On page2 those identities were
not the visible page. The four private-flagged paths now pass the actual paginated
items and opt into a complete visible-page ItemList. Count, URLs, order and local
positions match all visible cards. Existing non-flagged builder defaults retain
their24-item behavior; production activation remains excluded.

44focused tests pass, plus one separate final BUILT source-HTML test across eight
routes (four paths, pages1and2), asserting exact card/ItemList URL/order/count and
FAQ equality. TSC/scoped lint/configured local build/two4950asset gates pass.
Initial new unit tests incorrectly hardcoded the production origin although the
unit runtime uses localhost; corrected to compare URL paths. No runtime origin
or canonical change was made. All local QA servers stopped.

Private flagged deployment is being verified. Do not treat an automatic preview
without the flag as feature proof or the local source test as hosted browser QA.
Remaining competitor gaps, representative media and PR183 remain unfinished.
Private305export00:52:29.670Z matched the bounded two rows and approved four named
permissions/date/top-wrap/no-formula checks; no Sheet write or PII output.

First flagged host j21dufvrj / dpl_5r2aUB3YMoFw9P9K6BvTMoVDqmMi is READY.
Authenticated browser verified12desktop1319/mobile390/320 layout cases (no
document overflow,36cards and correct price summaries) and eight page1/page2
ItemList identity/count/order matches. Four first-image decodes640x960 were
independently observed, not all144images. Early lazy-load zeros are retained in
the raw proof and not counted as decoded. Existing old-stack seasonal decoration
and automatic consent prompt were observed; declined normally, no bypass and no
claim these represent current production's later consent release.

Unauthenticated HTTP returned Vercel login HTML with200, NOT the article. The
failed raw-HTTP schema test is not article proof or a broken article. No auth
bypass was attempted. Authenticated DOM inspection found index/follow metadata
on the private flag; Vercel login protection is not a substitute for an explicit
indexing rule. Runtime9e48ee12 adds noindex/nofollow ONLY on the four flagged
private pages, preserving production/default metadata. One new metadata guard
test covers preview and production;45focused tests pass. A corrected flagged
deployment is in progress; j21 is not final noindex acceptance proof.

FINAL corrected host is READY:
https://doll-p21u5n7y4-sonawaneamits-projects.vercel.app/brands/erovenus-dolls
Deployment dpl_8oFW9NEop3YqgcpwPso2UMT5goPM, runtime9e48ee12. Same host also serves
the Climax/Curvy/Brunette scoped paths. Actual authenticated native browser16cases:
four paths at1319/390/320, plus each page2 at390; no document overflow,36cards each,
exact ItemList identity/order/count and explicit noindex/nofollow everywhere.
Canonical owners remain production URLs. Actual Brunette FAQ expansion works and
its visible answers equal schema. Final proof is final-hosted-proof.json; raw
HTTP remains login-protected, never counted as article/source-HTML verification.
Final local built HTML separately passes eight routes/noindex/FAQ/card parity.
Remote configured build/two4950asset gates passed; specific remote Node version
is not independently asserted from the CLI's reduced inspect response.
No repeat deploy is needed for unchanged runtime. All servers stopped and
viewport reset. Whole229 is still In Progress, not a completed five-page
competitive scorecard: remaining competitor gaps and PR183 are next.

## Worktree And Rollback

- Worktree `/Volumes/Extreme Pro/Projects/DollWOW-dol229-batch-c`.
- Existing branch `codex/dol-229-batch-c`, existing PR161; do not create another.
- Before-edit source283e5ac5c3ed727f6f861a9cbd571fb71a970345 is the exact backup.
  Main7a2073aa was fetched/verified, never reset or merged. Old stacked A/B
  approvals do not authorize releasing the stack. Release later needs current
  production integration and regression proof, not a stale-branch merge.
- App worktree tool rejected the moved root because chat cwd is absent Desktop.
  Ordinary Git worktree on existing branch used. The unrelated clean
  seo-product-quality/approved-discount checkout was not switched or edited.
- Isolated npm ci, no lock change. Node26 engine warning/local build only;
  remoteNode22/hosted proof remains separate. Existing dependency audit warnings
  were not silently auto-fixed as part of a content change.

## Implemented

- Exact four-path private summary, enabled only by preview environment AND
  DOL229_BUYER_SUMMARY=1. Production, other brands, IDO/MD/Top Fire and Moonvale
  remain outside this new feature. No project/production flag setting.
- Shows starting-price range for the36 cards ON THIS PAGE, not a whole-catalog
  or landed quote. Strict current reads, no sample fallback for this private
  pass. Invalid, zero, negative, nonfinite, empty or mixed-currency data omits
  the summary instead of converting unknowns to free prices.
- Checkout qualification reuses existing CartPageClient wording: shipping,
  taxes and custom options are confirmed at checkout; links to shipping policy.
  No free-shipping, duty-paid, delivery-date or installed-stock promise.
- Removed internal "Brand hub" eyebrow only from the two flagged brand pages.
- CLM title now names its supported materials; added series-name guidance from
  the factory's visible catalog, without inventing a universal quality ladder.
  Erovenus FAQ keeps mouth/hair functions exact-model specific.
- Product cards, order, filters, canonical owners, photos, prices, options and
  certificates are unchanged. No new gallery or generated media.

## Evidence And Honest Scorecard

Current public search was observed discovery, not a controlled Google US ranking
or a complete SERP/provider audit. Initial broad queries were polluted by BJD,
Reddit, aggregators and unrelated research; rejected, not used as product proof.

| Page | What Works / Concrete Improvement | Still Missing / Cannot Claim | Confidence |
| --- | --- | --- | --- |
| Erovenus | Current named photo cards, exact-page price range and checkout line; concise source-attributed intro; model-specific mouth FAQ avoids Rosemary's Max-page body/FAQ contradiction | YourDoll/ULovers comparison incomplete; factory-copy superiority and every included head feature are not verified | Medium for source/UI facts; Low for "exceeds everyone" |
| Climax | Current photo cards and mixed-material choices; new clear title/series FAQ; FAQ/schema match in source HTML | Roshi offers stronger series/family navigation; our current grid does not yet provide equivalent series browsing. No blanket lightweight claim | Medium for source/UI facts; Low for comparative completeness |
| Curvy | Measurements instead of a universal body promise, real current cards, selection price range and checkout line | No verified best competitor collection/above-fold comparison yet; existing H1 is Curvy builds. Not a demonstrated competitive win | Low |
| Brunette | Explicit pictured-wig qualification, real current cards, price range and checkout line | Competitor category comparison incomplete; exact hair inclusion still belongs to each listing. Not a guaranteed included wig | Low |
| Moonvale | Existing PR183 source inspected, no edits in this worktree | Full current preview/schema/competitor scorecard not done. SY certificate is NOT a separate Moonvale-branded certificate | Low / pending actual pass |

Sources actually read30Oct:
- https://www.rosemarydoll.com/sex-doll-brands/erovenus/
- https://www.rosemarydoll.com/sex-doll-brands/climax-dolls/
- https://www.rosemarydoll.com/erovenus-max-series/
- https://www.rosemarydoll.com/doll-brand-authorization-certificate/
- https://roshilovedolls.com/collections/climax-doll
- https://www.erovenus.com/about-us/
- https://www.climax-doll.com/ (visible source only, no age attestation)

Rosemary has current filters/prices and brand authorization links; those are
useful strengths to meet, not proof of an identical configuration or price win.
Its Max article describes oral capability then says no oral capability in FAQ;
neither becomes a universal Erovenus fact. Roshi's series guidance is useful,
but its catalog examples are not a supplier-fit or safety approval for ours.
Supplier superlatives, physiological benefits, universal care/shipping promises,
foreign retail prices and unsupported oral claims were not adopted.

YourDoll's prior403 is not retried. Domain-specific searches for the requested
competitors did not establish accessible matching Erovenus/Climax/Brunette pages.
One ULovers curvy detail attempt failed access; no retry/bypass or claim it was
read. Known DataForSEO40207/Treg authentication holds not retried. Missing
provider evidence is not zero demand or a passed AI/GEO release gate.

## Moonvale Certificate Risk

30Oct follow-up, no repeat deployment or runtime change: a bounded fresh query
found Tangle Joy's actual Curvy collection at
https://tanglejoy.com/collections/curvy-sex-dolls . Its visible material, product
form, height and weight filters plus named cards are real strengths. DollWOW's
measurement-first guidance and explicit checkout qualification avoid adopting
its broad included-feature wording, but do not prove a price or usability win.
The search snapshot and fetched page showed different counts/prices, so neither
is a configuration-equivalent price comparison or stable catalog baseline.
Love Ai's Brunette category was found at
https://www.loveaidolls.com/product-category/all-sex-dolls/brunette-sex-dolls/ ,
but the direct read timed out. Only the search-visible filter/card excerpt is
known; no full-page comparison or retry/bypass. Rosemary genre-filter discovery
mostly returned nonmatching brand categories/translated navigation; rejected as
Brunette category proof. All-competitor confidence remains Low. Continue the
approved PR183 pass without pretending missing provider/page evidence passed.

PR183440d7520 explicitly says Moonvale is SY Doll's premium silicone line and
shows BrandAuthorizationCard brand=sy, linking to SY's Moonvale collection.
Its authorization registry has relatedBrandValues=[moonvale] but the issuer and
actual image remain SY Doll. Never present that as a certificate naming
Moonvale or prove all factory relationships from similar branding. The direct
SY collection read failed access this run; no retry/bypass. Preserve the approved
qualified relationship wording while checking the exact certificate/current
authority on the Moonvale pass. No new certificate substituted or published.

## Verification / Remaining

42focused tests, TSC, scoped lint and the configured local build/two4950asset
gates pass including the final small FAQ/title edits. The separate actual LOCAL
built source-HTML test passed again over all four routes after the final build.
Actual LOCAL1319/390/320 twelve cases: no document overflow,36 current linked cards
per page, source FAQ/schema equality; CollectionPage with nested ItemList,
BreadcrumbList, FAQPage, Organization/WebSite. This is semantic JSON validation,
NOT an external Google rich-results validator or Product-offer schema proof.
Local robots are index/follow with production canonical owners; hosted preview
must independently show its noindex protection before being given as acceptance.

Pre-final-copy first-card top at390: Erovenus/Climax715.6px; Curvy/Brunette795.8px.
At320:748.6/808.6px. Price ranges on initial selection:999-1795,294-1799,
1399-2819,1200-2819USD. Not all-catalog minima or a frozen future price promise.
Only the current Brunette first-card image was independently confirmed decoded
640x960 this run. Representative media visual checks across all four pages and
final hosted source match remain. All local servers stopped, viewport reset.
Also check ItemList entries against the exact
visible paginated grid before claiming complete structured-data acceptance.
No page-wide/catalog-wide acceptance is claimed from a shallow check.

NEXT: final focused tests/build and exact flagged hosted four-page QA, complete
the competitor gaps honestly, then PR183 actual certificate/source/preview pass.
Do not merge/live, edit151-held IDO/MD hubs, or touch157/238 held Top Fire records.
