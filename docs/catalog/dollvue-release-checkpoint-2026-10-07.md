# DollVue release check - 7 October 2026

## Scope and release state

Owner authorized sampled verification followed by live release when checks pass. Draft product publication remains forbidden and homepage rearrangement is paused.

Owner subsequently confirmed: "rest look good and visual test passed." Record this as owner acceptance of the examples they tested, with the three UI adjustments handled locally. The supplied review links were the existing live Irontech Kevin, Starpery Leticia and Lusandy Mizuki experiences, not the new integration. Do not extend this approval to untested catalog records or claim hosted integration/deployment verification from it. No further owner visual sign-off is needed for those tested examples unless their output behavior changes.

Owner additionally confirmed that minor generated visual variations are acceptable. The WM Audrey and SE Lita eye-colour samples were generated successfully and inspected: intended eye colours changed, with small facial rendering differences. Those minor differences are not a release blocker. Major changes to identity, proportions, or unselected features still need correction. This acceptance does not publish draft products or waive access, ownership, and checkout checks.

UI FIXES RELEASED; CATALOG EXPANSION NOT RELEASED. Work is isolated on `codex/dollvue-readiness-release`, originally based on `origin/main` d72936eb, in `/Volumes/Extreme Pro/Projects/DollWOW-hotlink-release`. PR #101 contains only the five UI/test files listed below. The broader backend changes remain uncommitted and were NOT included. No Shopify writes, mail or product publication changes were made. Do not release the much larger dirty supplier worktree.

## UI production release

- PR: https://github.com/sonawaneamit/DollWOW/pull/101
- Source commit: `2d1a3aad485c4876363034dc680fa0b054546f5f`; merged main commit: `e385ffe33eb2a75898bbd437f84fd50c4449dd97`.
- Production deployment: `dpl_3JdgjFxNvfGiiigTABKjAyiL25U2`, Ready and aliased to dollwow.com.
- Released files: `components/dollvue/DollVue.tsx`, its CSS module, one DollVue-only announcement visibility rule in `app/globals.css`, the isolated browser QA script and fixture outside app routes.
- Vercel preview build and owned-assets CI passed. Authenticated Vercel preview request reached the application email gate with HTTP 200; this did not authenticate a DollVue customer.
- Production DollVue page returned HTTP 200; all 16 referenced JS/CSS assets loaded. The live JavaScript contains the new agreement reminder, and live CSS contains the grey-button and page-scroll rules. The HTML deployment ID matches the production deployment above. Temporary QA route returns HTTP 404.
- Local Playwright verified interactions at three viewport sizes with mock generation. No production image-generation request was made during this release verification.
- Broader eligibility/readiness, cached-source and validation fixes remain local and incomplete. Do NOT report all catalog dolls enabled.

## Completed checks and fixes

- Cached Shopify snapshot sampled deterministically with seed `dollvue-release-2026-10-07`, one product per raw brand/status stratum: 74 products, 28 ACTIVE and 46 DRAFT. ACTIVE does not prove storefront publication.
- Release runtime resolver, prompt property resolution, one-choice validation, duplicate/unknown rejection and menu immutability checked. Zero invalid exposed choices in the sample. This is structural testing, not image quality or live browser testing.
- 18 active samples expose appearance choices in their resolved menus but fail the old brand-prefix eligibility check. Expansion remains unwired.
- Added canonical non-explicit appearance classification and validation to generation/cart. Preview options reject non-owned references and unresolved conditional groups. Checkout menu and price configuration are unchanged.
- Generation cache key now includes source identity, references and full prompt, rather than only option IDs and photo index.
- Shopify force-cache requests now preserve the requested revalidation period instead of ignoring it.
- 69 focused tests pass across seven files. A full run before updating two now-obsolete body-painting assertions showed 1001 passed / 3 failed / 14 skipped. Two failures were the deliberate exclusion of undefined body painting from previews; revised tests still verify normal checkout promotional pricing. The remaining Fanreal September copy assertion expects old sitewide wording and is unrelated to the changed files. It has not been changed. Do not claim full-suite green.

Private sample report:
`/Volumes/Extreme Pro/Projects/DollWOW/data/exports/dollvue-readiness-2026-10-07/release-runtime-sample.json`

## Remaining release requirements

### UI feedback follow-up

Implemented compact, non-sticky option count, a single page scroll (no nested vertical trap), normal-flow action buttons, and the agreement directly below the generation button. The consent-missing button is visually grey and aria-disabled, but accepts activation only to focus/nudge the checkbox; all generation remains blocked until consent. Reduced-motion users receive the focus/message without animation. The announcement strip is hidden only during DollVue mode to prevent header overlap.

Playwright in isolated headless Brave passed at 1440x1000, 390x844 and 320x700: real pointer activation without consent sends zero requests, checkbox focus, agreement below action, accepted request, two-choice locking/unlocking, page wheel scrolling, no horizontal overflow, keyboard activation and reduced motion. Generation was mocked: these are UI checks, not image-fidelity checks. Screenshots `/tmp/dollvue-controls-{1440,390,320}.png` were captured and mobile/desktop visually inspected. Fixture preserved under `tests/fixtures/dollVueUiPage.tsx`; temporary local route removed after testing. `scripts/check-dollvue-layout.mjs` accepts the temporary fixture URL through `DOLLVUE_UI_CHECK_URL` and an optional installed browser path. No production test endpoint or authentication bypass was added.

1. Representative WM Audrey and SE Lita real generations completed, HTTP 200. Authentication, allowance and email were test doubles; actual Storefront reads, images and Venice generation were real. No customer mail or Shopify publication changes. Minor visual differences accepted as above.
2. Shared evaluator is wired locally into PDP, viewer, access/verify, generation and cart. Lightweight-list freshness and current private hold revocation are being completed. Preserve reviewed legacy coverage, do not widen brand prefixes blindly.
3. Approved source positions and readiness revision are enforced locally. Reviewed-image byte binding is being added to detect replacement at an unchanged URL. Keep review evidence server-only.
4. Strict Storefront lookup is implemented in all public DollVue entry paths, with no sample fallback. Tests reject unpublished products and stale verification links. Prepared drafts remain private and require normal publication to become public.
5. Run hosted preview, privacy, cart and publication/cache checks, then publish only passing live coverage. Do not confuse passing unit/sample tests with this final release gate.

Private inventory and cached Jev results remain on the external SSD. The release worktree now contains the shared evaluator and private registry, not yet deployed. JK's prior visual-review assets were reconciled: 72/72 gallery transforms and 513/513 option references match reviewed originals through verified transforms, rather than falsely failing because compressed bytes differ. Three actual JK generations (Chue, Maud and Ina) subsequently passed visual review under the owner's minor-variation tolerance. Seven draft records now have 14 reviewed eye choices each, approved source positions and image digests. These are family-sampled approvals, not 98 individual generations. No draft product was published.

New registry scope: two live-product records (WM Audrey, SE Lita), seven unpublished JK records, and six explicit excluded records. Existing supported Irontech/Starpery/Lusandy coverage is preserved, not counted as newly reviewed. This is not completion of the entire catalog. The Google tracker still needs the final deployed-state update.

Real-data smoke tests passed 13 checks: both live pilots currently published and privately clear; source/reference byte hashes verified; actual cart payloads returned HTTP 200 (Audrey $1,777; Lita $2,412 including $79 options, before checkout discount); a JK draft and a missing product returned null through strict public lookup. No cart/order write, generation or customer mail was performed in that smoke run.

PR #102: https://github.com/sonawaneamit/DollWOW/pull/102. The first hosted build and owned-assets CI passed. A final hosted revision including the seven JK records and review fixes is pending verification. Temporary Shopify client credentials are scoped to this preview branch for private-hold checks and should be removed after release verification.

Latest broad test run: 1,153 passed, 17 skipped, one unrelated pre-existing Fanreal September copy assertion failed. Production build, TypeScript, owned-assets (4,950 references), and public-promotion checks passed. Hosted verification is still required after the final changes.
