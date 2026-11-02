# DOL-328 Mobile Navigation

Base: fresh verified `origin/main` 59f0fd6b38178db590f53a011fb90a7bec1a44b9.
Worktree: `/Volumes/Extreme Pro/Projects/DollWOW-dol328-navigation`.
Branch: `codex/dol328-mobile-navigation`. Private preparation, not released.

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
