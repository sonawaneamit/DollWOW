# DOL-328 Mobile Navigation

## 4 November: Return To The Requested Design

Martin rejected the added visible controls. His 11:15 feedback supersedes the
spotlight-control acceptance below. Nothing is approved for release; do not
start DOL-333 before his answer.

Removed: spotlight Pause/Resume, its extra rail wrapper and styling, and its
manual-pause behavior; original automatic rotation and reduced-motion guard
restored. Removed: the extra Try DollVue label/button, border, colors and extra
vertical spacing below the homepage banner. Removed: the global loading screen
and the DollVue product-rail loading placeholder. The existing artwork, native
full-width banner destination and invisible verified data-loading changes stay.
Existing DollVue landing/PDP button styles were not restyled by this branch.

Plain-English reconciliation of the original asks:

- Banner: only its inner image area was linked, leaving the outer margins dead.
  Navigation also waited on the verified product list. The same artwork now has
  a full-width native link, with the introduction delivered before that list.
  This is not a guarantee of instant navigation on every phone.
- Cards: existing home and catalog card markup was already full-card linked.
  This branch did not add a new card-click handler; prior actual price/padding
  checks verified destinations. Do not claim a source fix for an unproven cause.
- Tab title: original routes already had correct metadata. The stale title was
  seen while navigation had not yet committed; settled routes were correct.
  No metadata replacement or general title-manager fix is claimed. The banner's
  native navigation avoids that client-transition path for that link only.

Other visible branch additions were exactly the controls/placeholders removed
above. The private neutral review fixture is not linked in the customer UI and
is unavailable in production. Image delivery, bundle boundaries, rule transport,
related-content streaming and stylesheet ownership are retained optimizations,
not a redesign or a new performance acceptance claim.

At this checkpoint the removals are LOCAL verified: 105 focused tests, scoped
lint, standalone TypeScript, configured build, promotion and both asset gates
pass. Existing build diagnostics remain. Actual mobile390/desktop1319 show no
added controls or overflow; banner reaches the correct DollVue title/heading at
both sizes, mobile home return restores its title. Initial mobile heading wait
used the wrong literal name; the same single click had reached the right page,
with no repeated activation. Two saved JPEGs show the restored spotlight/banner;
desktop is scrolled and is not a whole-hero framing claim. Viewport reset, tab
closed and local server stopped. New private deployment and the requested full
before/after screenshot package are still pending. Older screenshots are dated evidence,
not proof of a broken card or wrong settled title. Do not invent before frames.

## 3 November Spotlight Rotation Control

Private acceptance fix, not a page-speed or whole-ticket completion claim.
Actual exact875 hosted keyboard selection changed to Zeki with its correct
hero link and decoded playing752x560video, then the existing6500ms interval
rotated the selection away while it was being inspected. Manual selection
previously did not pause, and there was no explicit rotation control.

Manual thumbnails now pause rotation. A keyboard-operable Pause/Resume icon
stays outside the horizontally scrolling thumbnail rail, with selected/paused
state exposed through aria-pressed. Reduced motion prevents automatic rotation
and disables Resume; its change listener and the timer are cleaned up. This
controls slide rotation only, not video playback. Media, order, eligible
products, URLs, prices, typefaces and commerce paths are unchanged.

Final41focused tests across6files pass, including12new timer/control tests,
standalone TypeScript/scoped lint and configured LOCAL Node26 preview build,
promotion check and both4954asset gates. Existing visual-index broad-pattern,
Browserslist and dynamic/static diagnostics remain. The initial synthetic
fixture had no registered spotlight handles; corrected before the final pass.
Two intermediate builds caught real UI refinements: keep Resume outside the
scrolling rail and use theme foreground/surface colors for its icon. Final
mobile computed colors are41/32/27 on255/255/255, not the faint peach prototype.

Actual final LOCAL390 selection remained Zeki for23601ms, video752x560 decoded
and playing, no overflow, selected hero link reached the correct Zeki PDP/title.
At1319 a different manual selection paused; keyboard Resume restarted rotation
(Freya to Isla observed after19075ms), and keyboard Pause restored Resume.
Isla then remained selected for29689ms, with decoded playing752x560video;
its hero link reached the correct Isla PDP/title at desktop width.
These are bounded observations, not precise timer/input-latency or real-device
measurements. Screenshots are inline inspections, not a saved/uploaded package.
Remote checks and affected hosted verification of this new candidate remain
pending; exact875 is only the before deployment. No Lighthouse rerun, release,
merge, cart, checkout, email, generation, consent or settings actions. Whole328
remains private HOLD, including mobile90, prior brand decline and broader gates.

## 3 November Conflict Lookup CPU Candidate

The option-tile conflict helper now uses the same normalized, visibility-filtered
selections directly, then the original ordered rule search. It no longer asks
the full resolver to calculate unused prices, issues and cart attributes first.
The full resolver, server checkout, availability, prices, rules and media are
unchanged. This is a private candidate on the same PR235, not a release.

The retained full-resolver reference and candidate match across 1,125 lookups
on the saved actual 3,246-rule config, plus synthetic default, multiple, invalid,
conditional visibility and first-conflict-order cases. Inputs remain unchanged.
The initial synthetic visibility fixture used the wrong shape; corrected to the
actual nested condition array before the final 94-test/9-file pass (one opt-in
skip). Standalone TypeScript and scoped lint pass.

Five same-process batches of the initial 49 head choices measured full-resolver
14.84-19.76ms versus selection-only 10.39-12.36ms, after one warmup each.
This is CPU-only evidence with JIT/scheduler variation, not browser input latency,
an LCP improvement, field data or a 90+ result. No new Lighthouse run is justified
by this small helper saving. Configured LOCAL Node26 build, promotion check and
both 4,954-asset gates pass with the existing build diagnostics retained.
Actual changed-build LOCAL390/1319 default text/control signatures equal the
retained883 views. The LSTPE prerequisite, enabled2099 total, reverse material
conflict and orderly removal/restoration1899 pass without cart actions. Three
inline screenshots inspected; the first desktop capture was scrolled to specs,
not a paid-total frame, while the later desktop conflict frame is legible.
Hosted verification is pending; the earlier exact883 hosted receipt is not this
candidate's hosted proof. Whole-ticket performance and acceptance holds remain
open. Local server stopped, owned tab closed and viewport reset.

## 3 November Lossless Rule Transport, Local Candidate

The actual Samantha K PDP response showed one full product object and ten
React Flight references, not eleven duplicated products. Its public configuration
contained 3,246 compatibility rules taking 1,014,723 JSON bytes. A dictionary and
tuple transport now reconstructs the exact original config before the unchanged
builder uses it. Small configs and future extended rule formats stay unchanged;
invalid encoded indices/rows throw rather than silently dropping constraints.
No options, rules, media, prices, source records, eligibility checks, template
signatures or server checkout paths were removed or changed.

Actual built response round-trip: all 3,246 rules and 14 groups deep-equal the
saved baseline. Config JSON 1,082,753 -> 295,698 bytes; observed decoded HTML
1,620,589 -> 736,412 bytes and Flight text 1,255,847 -> 468,792 bytes.
These are response representation sizes, not compressed network savings.
One local mobile Lighthouse13.6 pair, same localhost3033/server Node/runtime
and CLI flags: 62/96/77/92 -> 68/96/77/92, LCP7614 -> 7559ms, CLS unchanged.
This is not a stable/field/hosted/90+ claim. The retained lower before result
was not rerun for a better score. No desktop/full-matrix rerun this phase.

Default builder text, controls, disabled/pressed states and title match before
and after at390/1319, no overflow or page errors. One paid flight-case selection
shows1899+899=2798 at both sizes; No Thanks restores1899. No cart/checkout,
consent, generation or email actions. Six screenshots inspected; seasonal
overlay and differing scroll positions mean no clean pixel-match/first-tap or
whole-page acceptance. An initial accessible-name locator timed out and reset
the isolated browser runtime; a capture path failed before its first PNG due to
URL escaping. Corrected bounded harness completed; neither was an app defect.

The local candidate passes102tests across10files (one opt-in skip), including
actual config parity, transport/public payload/template/streaming and existing
customization/checkout/preset/visibility regressions, standalone TSC, scoped lint (two existing
ProductOptions warnings), configured local build and both4,954asset gates.
Evidence is in ignored `data/exports/dol-328-2026-11-02/rule-wire/`.
Private hosted/remote verification remains pending; no Martin handoff or live
release. Prior brand decline and all whole-ticket functional/device/consent/
Chatra/transactional gates remain open. Fresh Dolly order:328,333,332,216,295,288.

## 2 November Brand List Image Projection

The brand list now requests `imageFirst: 1`, matching the existing card's
`featuredImage ?? images[0]` contract. The shared Storefront default, full PDP
gallery read, 600/2200 limits, no-store, ranking, filters, metadata, prices,
readiness verification and private-hold checks are unchanged.
Two actual sequential DollsCastle reads returned the same 177 products after
projecting only the redundant image array: equal complete product hash,
rendered-card hash and structured-data hash. Decoded upstream catalog JSON was
929,482 versus 653,368 bytes, not whole-page transfer or a speed guarantee.
The proof uses strict reads to reject sample fallback; production fallback
behavior is unchanged. The parity harness subsequently aligned its local sort
helper exactly with the page; it does not claim a second upstream replay.
50 focused tests in seven files pass, one live-read test skipped by default;
the separate actual read run passed three tests before the final source guard
was added. Scoped lint, standalone TSC, configured local build/promotion and
both 4,954-asset gates pass with existing diagnostics retained.
Changed-build browser/Lighthouse and exact hosted verification are pending;
the ignored checkpoint will carry their actual results. No live release,
Martin handoff or whole-ticket acceptance is implied.

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

## Configurator-Owned CSS Split (2 November, 23:28)

- Moved 201 full-configurator selector records, covering 46 DollVue classes,
  from shared globals to a stylesheet imported only by `DollVue.tsx`. All
  1,404 original selector/declaration/media/keyframe/directive records are
  conserved; relative order within both ownership boundaries is unchanged.
  Shared PDP entry, access gate and star keyframes remain global. The real
  configurator component is byte-unchanged except for the stylesheet import.
  No product, eligibility, session, consent, generation, option or checkout
  logic changed. Initial-view CSS coverage was not used as a deletion list.
- Added a preview/development-only neutral layout fixture with zero allowance
  and `live=false`, tested unavailable in production. No customer session,
  email, consent choice, generation or cart was used. Complete computed styles
  match before/after in four actual built views: photo/choice-limit at1319/390.
  Choice three stays disabled after two choices; generation stays disabled.
  Client exit to home restores the header/body mode and back navigation restores
  the configurator. Shared Ria PDP entry has zero differences across11elements
  for18layout properties at390; its real entry reaches the unauthenticated
  access gate. This is NOT generated-result/error-state, full-media, real-device
  or transactional acceptance. The390photo screenshots have different scroll
  positions, not pixel-matched initial viewport proof. One full PDP style read
  exceeded the provider deadline; bounded layout-property comparison is separate.
- Built manifests exclude full-configurator CSS from home, collection, brand,
  PDP and DollVue landing; only configurator/review fixtures include it. Root
  stylesheet189,341->171,084 uncompressed bytes; observed home stylesheet
  transfer36,018->33,199bytes. These are stylesheet figures, not whole-page
  savings or guaranteed speed. Font faces/subsets/weights remain unchanged.
- Two before and two changed-build home Lighthouse13.6 samples, same3033,
  Node26.12.1/env/lock/flags/fiveHTMLwarmups/runtime-preview and final origin/path:
  mobile79/96/96/100->82/96/96/100,LCP5395->4685ms;
  desktop98/96/96/100->98/96/96/100,LCP1030->1128ms. CLS unchanged.
  Desktop LCP decline retained; single pairs with backend/cache/animation
  variation do not establish a stable overall speed win. Mobile90 still missed.
  No unchanged reruns, full-five-page remeasurement, hosted/field/device claim.
- 111focused tests/11files pass with the saved-source conservation opt-in;
  default110pass/one migration-proof skip. Scoped lint, standalone TSC and
  configured local build/promotion/two4,954asset gates pass; existing visual-index
  and dynamic/static diagnostics retained. Exact new remote checks/deployment
  and hosted affected-route verification remain pending. Private only, no
  Martin handoff/live/merge; whole328 targets/full regression remain unfinished.
