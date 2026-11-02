# DOL-328 Mobile Navigation

Base: fresh verified `origin/main` 59f0fd6b38178db590f53a011fb90a7bec1a44b9.
Worktree: `/Volumes/Extreme Pro/Projects/DollWOW-dol328-navigation`.
Branch: `codex/dol328-mobile-navigation`. Private preparation, not released.

## Expanded Brief And Regression Gate

Martin's 2 November 18:57/18:59 instructions supersede the earlier narrow
navigation scope. No live release; no preview link to Martin until matched
before/after screenshots, measured Lighthouse scores and browser regressions
are attached. Target 90+ in all four categories, mobile and desktop, on home,
collection, brand, product and DollVue. Targets are not forecasts or guarantees.
Do not retry the exhausted PageSpeed API. Dolly's local baseline is reported
evidence, not independently reproduced scores or real-user field data.

Before further runtime edits, preserve this checklist at desktop and mobile:

- Product options: base, included facts, paid choices, dependencies and total.
- Cart: supported configuration, independent controls, owned-line cleanup.
- Checkout: destination and configuration retained; no payment/order, account
  inputs, old stopped checkout replay, or unowned cart changes.
- DollVue: correct landing and per-product title, eligibility, preview entry;
  accepted QA email/download/generation transport is NOT replay-authorized.
  Mark these consequential end-to-end steps unverified unless separately cleared.
- Search: query, results and actual product destination.
- Menus: open, navigate and close; keyboard and mobile controls remain usable.
- Homepage banner: full-width hit target, artwork, destination and visible CTA.
- Cookie banner: initial state and existing normal controls; no programmatic
  consent mutation or reset of the user's stored choice.
- Chatra: widget loads and opens/closes; do not send a conversation.
- Brand and collection: real cards, filters, pagination, prices and destinations.
- Both sizes: correct titles/canonicals/headings, no overflow, decoded media,
  screenshot evidence and no newly broken navigation.

After each small change, exercise its actual preview at both sizes and retain
screenshots. Any behavioral regression stops that change until fixed or omitted.
Do not claim the entire list passes from unit tests or link/DOM inspection.
Caching proposals require ownership/source review first: never broadly remove
no-store protections from checkout, unpublished products or live eligibility.

By 3 November 09:00 Lisbon, give Dolly a five-line plan with measured before
scores and clearly labeled after targets/expectations; final after scores must
come from actual reports. No new schedule or fabricated completion time.

## Measured Production Findings

- Brave desktop at a 390px viewport reproduces the delay, so it is not confined
  to iPhone Brave. This is not an actual iPhone test.
- DollVue strip activation returned in 296ms. The homepage was still visible
  after 8.76 seconds; DollVue had committed by 19.42 seconds. These are bounds,
  not a precise render-duration claim.
- The completed DollVue route has the correct title. Landing and per-product
  routes already define metadata. A missing-metadata diagnosis is unsupported;
  the old route/title remains visible while navigation is pending.
- The strip links only the middle 80%; its dark margins are not linked.
- In New Arrivals, Samantha.K image, title and price center points all hit the
  correct full-card product anchor. No blanket pointer-events change justified.
- The DollVue page awaits up to 5,000 catalog records plus current readiness
  before rendering. There was no app loading boundary.

## Candidate Changes

- Stream the unchanged DollVue introduction separately from the async verified
  product rail. Keep strict current eligibility and private hold checks intact.
- Add an accessible, dimensionally stable loading state for pending pages.
- Extend the strip anchor to 100%, retaining 10% inner padding and existing
  artwork dimensions. Use native document navigation for this strip to expose
  the streamed document without waiting for the client route payload.
- No changes to product entitlements, menus, prices, consent, analytics,
  generation, cart, Shopify settings, or production flags.

## Verification And Remaining Work

- 31 tests across four focused files pass; scoped lint and diff check pass.
- Configured local Node26 production build/TSC/public-promotion check and both
  4,954-asset checks pass. Existing broad visual-index warning and DollVue
  dynamic/static diagnostics remain, not an all-repository green claim.
- Direct local DollVue HTTP streaming exposed the introduction in 123ms in one
  sample. This is not hosted or real-device performance proof.
- Streaming alone did NOT establish a fast client-side banner transition in
  local testing. The final native-anchor click returned with the correct
  destination, title and introduction visible in 3,081ms in one local mobile-size
  browser sample. No hosted/device speedup or instant-load claim yet.
- Final local DollVue at 1319/390/320 has no horizontal document overflow and
  retains the correct title; the four inspected hero/option images decode.
- Still required: desktop/390/320 final hit targets and navigation, collection
  and brand/category tiles, search cards, remaining banner/carousel and DollVue
  entry points; product-to-home/DollVue title flow; hosted private acceptance.
- Clarity remains secondary and uninstalled. Whole DOL-328 is unfinished; no
  additional In Progress state or automatic parking of other tickets.

## 2 November Hosted Evidence And Lab Baseline

Runtime remains `0a4598cc17209bb2de94fb90c989fa8531c5366c`. All four source
checks passed. GitHub deployment 7500872594 binds that SHA to READY preview
`dpl_HDQYbbKJnypPQsF35ikj3BgwAXBo`; its inspection receipt is retained privately.
No release or unchanged redeployment was requested.

The authenticated Brave preview banner reached the correct DollVue URL, title
and introduction in one 3,062ms sample at 390px. An earlier click encountered
the delayed Halloween dialog and is excluded, not a failed navigation timing.
The strip width is 390px at a 390px viewport. Matched live/private DollVue
390px screenshots were inspected and uploaded to DOL-328; 1319px screenshots
are retained locally. Both titles are correct and neither overflows. The first
four inspected images eventually decoded; the first desktop read contained two
still-pending images and is not recorded as an immediate decode pass.

Actual partial browser regression evidence: desktop search submitted Samantha,
showed six results and followed the correct Samantha.K product card; empty cart
drawer opened/closed; product configuration disclosure opened; mobile menu
navigated to the real collection; filter controls expanded/collapsed; brand page
has correct title and no overflow at 390/1319. Privacy preferences opened without
changing the saved choice; its tab was closed rather than accepting/declining.
Chatra was not visible on the inspected preview; chat is NOT verified. No cart
creation, checkout, email, generation, payment or consent mutation was performed.
These observations do not complete the full desktop/mobile regression checklist.

Independent Lighthouse 13.6.0 local lab runs against production, 19:11-19:17 UTC:
scores are Performance / Accessibility / Best Practices / SEO, not field data.

| Page | Mobile | Desktop |
| --- | --- | --- |
| Home | 88 / 96 / 100 / 100 | 97 / 96 / 100 / 100 |
| Sex dolls collection | 97 / 96 / 100 / 100 | 98 / 96 / 100 / 100 |
| Dolls Castle brand | 69 / 96 / 100 / 100 | 99 / 96 / 100 / 100 |
| Samantha.K product | 87 / 97 / 81 / 100 | 96 / 97 / 81 / 100 |
| DollVue | 90 / 93 / 100 / 92 | 90 / 93 / 100 / 92 |

Raw reports and `lighthouse-before-summary.json` are ignored private artifacts.
The page/device scores are single samples, not a claim of a stable improvement
over Dolly's differently timed lab reports. The mobile homepage banner accounts
for 1,778,517 transferred bytes and 1,750,793 estimated wasted bytes. Gallery
optimization is intentionally disabled globally to avoid hiding supplier media;
investigate a local-banner-only optimization, not a global switch.

Product Best Practices 81 flags the existing Square marketplace SDK's deprecated
unload listener; do not remove payment code just to improve a score. DollVue SEO
92 flags link text, and Accessibility flags aria-hidden focus and contrast.
Home contrast flags the hero eyebrow, dark archive eyebrow and footer text.
These are measured leads, not completed fixes or a whole-site SEO all-clear.

IMPORTANT: the isolated candidate Lighthouse profile redirected to Vercel login.
Its apparent scores measure the login page, NOT DollWOW; reject all of them.
Raw rejected reports remain evidence; candidate summary contains no accepted
scores. The runner now validates final origin AND pathname and the saved auth
redirect was rejected by an actual negative check. Do not retry this same route,
export browser cookies, disable protection or infer authorization to bypass it.
Authenticated CUA preview QA remains valid and separate. Obtain real candidate
Lighthouse evidence through an authorized browser audit or matched local builds.
The exhausted PSI API was not called. SEO CLI report was stopped after returning
no report; no findings or all-clear are claimed from it.

Next: keep this checklist, reduce the measured local banner payload and add the
visible Try DollVue CTA as a small separate change; trace catalog/readiness
latency before caching. Current private hold checks explicitly require fresh
no-store reads so blanket five-minute route caching would be unsafe. Preserve
them and checkout repricing. Then complete the full browser regression matrix,
actual before/after measurements and remaining screenshots before Martin's link.
No actual iPhone verification, 90+ matrix, wider SEO acceptance or release yet.

## Banner-Only Follow-Up, 2 November Evening

- Extracted only the homepage DollVue strip into its own client component. The
  visible Try DollVue action is part of the existing single native anchor, not
  a nested button. Its accessible name includes its visible label; 44px height.
- Six deterministic WebP derivatives retain the full framing of the two exact
  existing non-explicit face-strip PNGs. Originals are hash-guarded, untouched
  and retained for format/error fallback. No generated artwork, new entitlement
  or supplier-gallery change. Global `images.unoptimized` stays true: the local
  Next implementation forces that setting and disables its optimizer route, so
  a per-image override would not work.
- Actual local browser selection: 390/320 uses mobile 480 (13,910 bytes); 640
  uses mobile 960 (42,394 bytes); 641 uses desktop 640 (12,266 bytes); 1319 uses
  desktop 1280 (33,844 bytes). All five widths decode, preserve the original
  640/641 artwork breakpoint, have no document overflow and retain a full-width
  link. The 390px asset response is HTTP200/WebP and byte-equal to its local file:
  99.22% fewer image bytes than the 1,778,517-byte original, NOT a page score.
- Deliberately moved only our generated 480 derivative out of local public
  serving for one isolated browser test: React removed WebP sources and the
  untouched original PNG decoded at 390px without overflow. The exact derivative
  was restored immediately. Evidence in `banner-phase-fallback.json`/screenshot.
- One local CTA click reached the correct DollVue route/title/introduction in
  3,088ms. This is a single sample, not an instant-load or hosted/device claim.
- 35 tests/five files pass, including original hashes, derivative decoding/full
  ratios/size bounds, responsive sources, fallback mode and accessible single
  link. Scoped lint/diff check pass. Configured local Node26 build/TSC/public
  promotion and both 4,954-asset gates pass; existing visual-index and DollVue
  dynamic/static diagnostics remain. No package or lockfile changes.
- Current local browser also exercises DollVue comparison (range 50 to 51),
  mobile/desktop empty-cart drawer, mobile menu to collection, filter panel,
  mobile search with six Samantha results and its correct product, product
  option disclosure and desktop brand-menu navigation. These remain partial
  regression observations, not configured cart/checkout/email acceptance.
- Local Lighthouse mobile home is 75/96/96/100 with LCP8.0s and TBT10ms: this does
  NOT meet the target. It transferred the mobile 960 WebP (42,676 bytes including
  overhead). This is a separate local-server sample, not a matched comparison
  with the production baseline. Do not present reduced banner bytes as proof
  that the entire page is faster. Catalog-to-hero latency still needs work.
- Local desktop home is 89/96/96/100, LCP1.8s, also below the performance target;
  it selected desktop 1280 and transferred 34,126 bytes including overhead.
- No live merge/deploy, Shopify writes, checkout/generation/email replay,
  consent changes or Clarity installation. Hosted and complete after-metric
  acceptance still required before Martin receives a preview handoff.

## Bounded DollVue Rail (2 November, 19:57)

- The landing rail now stops after nine verified eligible public cards in the
  existing CREATED_AT order instead of walking 5,000 visible records. The
  lightweight mapper has no release rank; existing caller sorting is retained.
  Other catalog callers are unchanged. Reviewed candidates still use the exact
  current detail/private-hold verification; no readiness guard or cache changed.
- An explicit request-time connection boundary keeps the rail dynamic even when
  all nine current cards are legacy pilot products. Existing 300-second catalog
  data caching remains; current no-store verification is not prerendered away.
- One actual read-only helper comparison at 19:47:41Z found byte-identical nine
  cards/order/prices (both full-object hashes
  `0f4c37e86a34e41f42d2cea6e1bae62579d9f2f84d5ff273fb2560a981ee2a08`).
  Full walk: 15,960ms/59 requests; bounded rail: 789ms/one request. All nine are
  existing legacy pilot cards, not nine newly verified registry approvals. The
  old walk's reviewed hydration concerned unused cards. Entry/generation checks
  remain unchanged. This is helper evidence, not a hosted/page-speed guarantee.
- 106 focused tests/six files, scoped lint, configured local Node26 build/TSC,
  promotion checks and both 4,954-asset gates pass. `/dollvue` is dynamic in the
  final build. Existing visual-index and dynamic/static diagnostics remain.
  Four stale test expectations now match the unchanged baseline media limit100.
- Actual local browser at 390/1319 shows all nine matching links/prices, correct
  title, no overflow and settled rail; screenshots retained. Comparison50->51,
  mobile menu and empty cart at both sizes work. The first rail link reaches the
  correct Ria PDP/base2,819. Lazy offscreen images are not counted as decoded.
- Serial local Lighthouse13.6 DollVue mobile99/93/96/92 (LCP1.7s), desktop
  100/93/96/92 (LCP0.4s), correct final origin/path. These are separate local labs,
  NOT matched improvements over the live baseline, field data or iPhone tests.
  Full five-page targets and actual matched after matrix remain unfinished.
- No merchant/settings/cart/checkout/generation/email/consent mutation, live
  merge or release. Full regression, hosted candidate and real-device acceptance
  remain required before Martin's preview handoff. Do not replay parity reads
  or accepted transactional tests merely to refresh a receipt.

## Homepage List Image Read (2 November, 20:14)

- Reconciled the previous inconclusive controls against exact previous43 and
  current19360 hosted previews: settled mouse Brands opens on both, mobile
  Filter & sort expands on both, and Ria Head->Head Type advances the wizard on
  both. Clicking its already-active Head step is not a collapse toggle. No
  control change was needed; early reads are not regression acceptance.
- Only the six homepage96-product list queries now request one image instead
  of eight, matching their existing one-image public card projection. Spotlight
  detail reads, brand-logo reads, PDP galleries and global image settings are
  unchanged. Exact current eligibility/private-hold verification remains.
- One actual read-only latest96 comparison at20:10:01Z: upstream uncompressed
  catalog JSON548,117->397,186 bytes (150,931 fewer,27.5%). All96 projected card
  objects/order/prices/badges match, SHA256
  `3723a515d3ef6aba867fc9dad362ee1664e737a0e621f72cd2339e8ea5fc1cf6`.
  This is one list, not whole-home transfer or visitor-speed proof. Do not rerun
  the unchanged opt-in parity test merely for another receipt.
- 112 tests/five files, scoped lint and diff check pass. Configured local Node26
  build/TSC/promotion checks and both4,954-asset gates pass; existing diagnostics
  remain. Actual local390/1319 home has correct title/no overflow, both empty
  cart drawers work, inspected first two arrivals images decode, and Samantha.K
  card reaches its correct PDP with gallery controls retained. Screens retained.
- Local mobile home remains75/96/96/100, LCP7.3s: performance target still NOT
  met. Smaller upstream JSON is not a measured page-speed win. No broad caching,
  eligibility, product options, checkout, email/generation or consent changes.
  Hosted acceptance and full matched after matrix remain required; nothing live.

## Catalog Browser Bundle Boundary (2 November, 20:29)

- The homepage/card/filter predicate import pulled a1,106,076-byte raw option
  asset manifest chunk into the home browser route. Moved only the existing
  catalog constants/predicates/URL helper into `lib/dollvue/catalog.ts`; config
  re-exports the same bindings. All five moved function bodies are byte-identical
  to128234f4. No option-asset validation, current readiness/private-hold check,
  generation, checkout or caching behavior changes.
- HomeAlive, ProductCard and catalog filters import the lightweight module.
  A runtime dependency-graph test rejects full config/asset-manifest imports
  through these roots;125 tests/six files and scoped lint/diff check pass.
  Configured local Node26 build/TSC/promotion/two4,954-asset gates pass with the
  same existing diagnostics. PDP/DollVue option consumers retain full validation.
- Same-host/port/config Lighthouse13.6 serial local pair, before128234 and after
  this change: mobile75/96/96/100->81/96/96/100, desktop89/96/96/100->92/96/96/100.
  Mobile script transfer585,394->219,272 bytes (62.5% fewer); LCP7.286->4.773s.
  Desktop script586,444->220,322 bytes; LCP1.830->1.473s. Final origin/path
  checked. Single local lab samples, not field data/guaranteed gains; cache,
  changing catalog and animation can vary. Mobile target still NOT met. This
  home pair does not complete the five-page matched after matrix.
- Actual local390/1319 home title/no-overflow/menu/empty cart/screens retain all
  six feeds/48 links. Search has six Samantha results. Broader regression and
  exact hosted acceptance remain unfinished; no live release or Martin handoff.

## Related-Card Experiment Omitted (2 November, 20:45)

- The ordinary ProductOptions and DollVue client runtime import graphs do not
  reach the option asset manifest. No speculative URL-validation split was made.
  Existing full asset validation/mapping, readiness, private holds and checkout
  guards remain unchanged. Font discovery is still an unimplemented lead.
- Tested the existing lightweight card projection after public redaction for
  only the five PDP related cards. One current Samantha.K rail read at20:42:01Z
  has byte-identical rendered markup (SHA256
  `1e0a0c3fef538b32d21df08963c95f0d32375447aee5b7e0bb1fac25840a8542`),
  with serialized props12,318->5,520 bytes. This is related-card prop JSON,
  not whole-PDP transfer or a demonstrated speed gain; no merchant mutations.
- Same localhost3033/Lighthouse13.6 serial product lab samples were mixed:
  mobile71/96/77/92->67/96/77/92, LCP6.094->7.643s;
  desktop89/96/77/92->90/96/77/92, LCP1.779->1.573s. Final origin/path verified.
  Main document resource bytes1,615,154->1,607,199 and mobile transfer
  133,316->131,541. Single samples do not establish causality or a reliable win.
  Local Vercel instrumentation404s, Square deprecation and missing-description
  audit occur both before/after; not newly fixed or certified hosted failures.
- Conservatively OMITTED this runtime candidate under the regression rule.
  The PDP source is restored exactly to ff3; no candidate push/deployment.
  Candidate test text, four raw lab reports and before/after390/1319 screenshots
  are retained privately. Actual local cards/order/text/prices/protected image
  URLs match the baseline, rail scrolls, first image decodes,58-image main
  gallery advances/returns, empty cart works both sizes and mobile menu opens.
  No configured cart, checkout, generation, email, consent or device acceptance.
- Experiment checks:127 tests/seven files pass plus one opt-in current-rail
  parity pass; configured local build/promotion/two4,954 gates and scoped lint
  pass with existing build diagnostics. Standalone TSC exposed the previous
  catalog-boundary test's deliberately out-of-schema legacy `torso` fixture.
  Added a test-only explicit cast without widening production types/behavior;
  standalone TSC now passes. Earlier ff3 standalone-TSC claim is corrected.
- Server3033 stopped, owned tab closed and viewport reset. Local `.next` still
  contains the omitted experiment build: REBUILD before further local QA.
  ff3 remains the current hosted runtime. Full five-page matched matrix,
  regression/screens and exact Martin preview approval remain unfinished.
- Final restored-source suite:125 tests/six files and standalone TSC pass.
  Documentation and the test-only fixture cast remain owned local changes for
  the next actual runtime phase; no unchanged deployment was triggered.

## Independent PDP Related Stream (2 November, 20:56)

- The selected PDP previously awaited the600-product related-brand read before
  returning its gallery and configurator. Moved only that lower-section read
  into the server-only `ProductRelatedContent` behind Suspense. Query,600 limit,
  one image, existing cache key/3,600-second data refresh, ranking, public
  redaction/protected image mapping and dealer-tag filtering remain the same.
  The rejected lightweight-related-card projection is NOT included.
- Selected-product Storefront/Admin/private-preview reads, template validation,
  options,58-image gallery, metadata, promotions, prices and checkout repricing
  are unchanged. A deliberately pending related read test proves the selected
  content can stream; resolved lower-section markup exactly matches the old
  ranking/projection/rendering path. Raw source records remain server-only.
- One actual local HTTP pair: gallery marker1,989->1,051ms; after the change it
  arrives423ms before the related section (previously6ms). Total response
  1,997->1,475ms, resource bytes1,615,154->1,615,777. These are single requests
  with cache/network variation, not guaranteed visitor gains or byte reduction.
- Same localhost3033/Lighthouse13.6 serial product pair, before ff3 and current
  candidate: mobile70/96/77/92->73/96/77/92; desktop88/96/77/92->89/96/77/92.
  Mobile LCP7.477->7.516s is essentially unchanged, NOT improved; desktop
  LCP1.768->1.767s. Mobile CLS0.02088 unchanged; desktop0.11489->0.10240.
  Final origin/path verified. Local instrumentation404/Square deprecation/
  description audit remain; no hosted/field/full-five-page acceptance claim.
- Actual local390/1319 title, heading, all five related cards/order/text/prices/
  protected URLs and gallery label exactly match the before DOM receipt, with
  no document overflow. Empty cart both sizes, gallery advance/return, desktop
  configurator entry, related-rail scroll and mobile menu work. First related
  image decodes640px. Before/after screenshots and DOM receipt retained.
  No configured cart/checkout, email/generation, consent, Chatra message or
  real-device replay/acceptance. Full regression and90+ targets remain open.
- 146 tests/nine files, scoped lint and standalone TSC pass; configured local
  Node26 build/promotion/two4,954-asset gates pass with existing diagnostics.
  Existing fixture-only TSC correction is included. Exact hosted verification
  is still required; no live merge, release or Martin preview handoff.

## Explicit Active-Gallery Priority (2 November, 21:11)

- Added only `fetchPriority="high"` to the existing active ProductGallery image.
  Installed Next forwards it to both that image and its existing preload. All
  58 gallery images, protected URLs, eager/preload behavior, lazy thumbnails,
  video metadata loading and the global unoptimized safeguard remain unchanged.
  No media processing, extra image request, cache, validation or pricing change.
- Lighthouse already observed High network priority before this hint; do not
  portray the audit recommendation as a proven large bottleneck or score win.
  Saved exact363f local baseline versus this candidate, same3033/LH13.6:
  mobile73/96/77/92 remains73/96/77/92; desktop89/96/77/92 remains89/96/77/92.
  Mobile LCP7.516->7.255s; desktop1.767->1.771s. Single samples with network/
  animation/cache variation, not stable gains. Both hint checks change false
  to true; exactly one hero request remains, observed High before and after.
- Actual local390/1319 has one high-priority hero and one matching high-priority
  preload,58 thumbnails with zero high-priority thumbnail hints, correct title/
  no overflow, all five related cards retained and gallery next/previous usable.
  Empty cart both sizes, options entry and mobile menu pass; screenshots kept.
  No configured checkout, email/generation, consent or device replay/acceptance.
- 149 focused tests/ten files, scoped lint/diff check, standalone TSC and the
  configured local Node26 build/promotion/two4,954-asset gates pass, retaining
  existing diagnostics. Exact hosted verification remains required. Scores,
  full five-page matched matrix/regression and Martin handoff are unfinished;
  nothing live. Next prioritize the complete matched matrix/remaining gap
  reconciliation rather than repeating these completed phase measurements.
