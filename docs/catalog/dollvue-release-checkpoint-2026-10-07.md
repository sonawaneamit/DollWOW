# DollVue release check - 7 October 2026

## Scope and release state

Owner authorized sampled verification followed by live release when checks pass. Draft product publication remains forbidden and homepage rearrangement is paused.

Owner subsequently confirmed: "rest look good and visual test passed." Record this as owner acceptance of the examples they tested, with the three UI adjustments handled locally. The supplied review links were the existing live Irontech Kevin, Starpery Leticia and Lusandy Mizuki experiences, not the new integration. Do not extend this approval to untested catalog records or claim hosted integration/deployment verification from it. No further owner visual sign-off is needed for those tested examples unless their output behavior changes.

Owner additionally confirmed that minor generated visual variations are acceptable. The WM Audrey and SE Lita eye-colour samples were generated successfully and inspected: intended eye colours changed, with small facial rendering differences. Those minor differences are not a release blocker. Major changes to identity, proportions, or unselected features still need correction. This acceptance does not publish draft products or waive access, ownership, and checkout checks.

UI FIXES AND INITIAL REVIEWED EXPANSION RELEASED. PR #101 released the UI; PR #102 released shared eligibility and nine reviewed records. Only two of those records are public products; seven remain unpublished JK drafts. All-catalog coverage remains unfinished. No Shopify writes, mail or product publication changes were made. Do not release the much larger dirty supplier worktree.

## Reviewed expansion production release

### WM shared-family follow-up (PR #103 merged; production checks pending)

- Scope: 38 additional existing public WM products, in reviewed batches of 16 and 22. Together with PR #102 this prepares 47 ready records: 40 public products and seven unpublished JK drafts. Six prior explicit exclusions remain unchanged.
- Source photographs were reviewed by the assistant, not the owner. The owner's approval covers minor generated variation and shared-family reuse, not individual image sign-off.
- Every new record binds its exact current product/menu fingerprint, approved source position zero, source-byte hash and 14 previously reviewed WM eye references. Eye choices 10-13 remain outside this colour-only scope.
- Both batches passed fresh bulk Storefront identity/public availability, private-hold, owned-image byte, and local configuration checks. The second batch additionally passed 308 individual eye-choice compatibility/cart-attribute checks. All 38 actual local cart-handler checks passed, including exact totals, selections, attributes and charges. The 234 focused checks, TypeScript and production build passed. Hosted checks passed for all 38 viewers and carts, plus 12 existing-example/draft/access regression checks. PR #103 merged as `e6b2ecd5a844a379d1a00a927ea461d3c7728676`; production verification is pending.
- Sixty candidate sources were inspected. Twenty-two source exclusions are private DollVue-preview findings only; no catalog tags, sale availability or product publication were changed.
- Private proposals are under `wm-family-preparation-20/reviewed-wm-16-record-proposal.json` and `wm-family-next40/reviewed-wm-22-record-proposal.json` in the existing SSD readiness evidence directory. No supplier URLs, notes or credentials were added to public payloads.
- Shared hairstyle references are being evaluated separately. Do not claim hair support from the eye-only records or count family matches as ready products.

### Shared main-head hairstyles (local; not released)

- Two real Audrey generations passed assistant visual review: hairstyle No.8 alone and hairstyle No.8 with eye No.2. Minor facial/detail differences are within the owner's accepted tolerance. No individual human visual approval is claimed.
- A separate proposal adds 15 visually reviewed, owned main-head hairstyle references to 39 WM and seven unpublished JK records. Existing eyes, source pins and product fingerprints are preserved; SE is unchanged. This adds choices, not 46 new products.
- All 46 current family/configuration matches, private holds, 75 image byte bindings and combined-selection/default checks passed. All 39 current public cart handlers passed for hair No.8 plus eye No.2, with exact totals, selections, attributes and charges; a representative JK draft returned public 404. TypeScript and production build passed. Two generation calls total, no retries. The first generation's later checksum assertion detected a concurrent registry edit; generation itself succeeded, and the combined test passed. No customer email or product mutation occurred.
- Private evidence: `wm-audrey-hair-pilot/private-report.json`, `reviewed-hair-46-record-proposal.json` and `cart-handler-read-1791386854865.json` in the existing SSD readiness directory. Hosted/production verification is required before releasing the extension.

### Initial nine-record release

- PR #102 merged as `0bda7cc4d2b0a91b96b51d1dd9be4879789bb303`.
- Production deployment `dpl_Dsa6BdnijqBPxsFb31GGrRviTrVP`, `https://doll-fspiqg2m5-sonawaneamits-projects.vercel.app`, Ready and aliased to dollwow.com.
- Twelve hosted and twelve production checks passed: five live example viewers, two priced cart payloads, public draft viewer/PDP/cart rejection, foreign-origin rejection and duplicate-selection rejection.
- New public examples: WM Audrey and SE Lita B. Seven JK draft records are prepared for normal owner publication: Janice, Chue, Ruth, Maud, Enid, Malthus and Ina. These expose reviewed eye-colour options only; broader appearance coverage is not claimed.
- Five actual sample generations were inspected (two WM/SE, three JK). Minor differences accepted. Full test run: 1,192 passed, 19 skipped, one pre-existing unrelated Fanreal September copy assertion failed. Hosted build and owned-assets CI passed.
- Private reports: `data/exports/dollvue-readiness-2026-10-07/hosted-release-check.json`, `production-release-check.json`, `release-smoke.json`, and `jk-generation/visual-review.json` in the external-SSD primary project.
- Temporary branch-scoped preview credentials were removed after verification. Production credentials were not changed.

## UI production release

- PR: https://github.com/sonawaneamit/DollWOW/pull/101
- Source commit: `2d1a3aad485c4876363034dc680fa0b054546f5f`; merged main commit: `e385ffe33eb2a75898bbd437f84fd50c4449dd97`.
- Production deployment: `dpl_3JdgjFxNvfGiiigTABKjAyiL25U2`, Ready and aliased to dollwow.com.
- Released files: `components/dollvue/DollVue.tsx`, its CSS module, one DollVue-only announcement visibility rule in `app/globals.css`, the isolated browser QA script and fixture outside app routes.
- Vercel preview build and owned-assets CI passed. Authenticated Vercel preview request reached the application email gate with HTTP 200; this did not authenticate a DollVue customer.
- Production DollVue page returned HTTP 200; all 16 referenced JS/CSS assets loaded. The live JavaScript contains the new agreement reminder, and live CSS contains the grey-button and page-scroll rules. The HTML deployment ID matches the production deployment above. Temporary QA route returns HTTP 404.
- Local Playwright verified interactions at three viewport sizes with mock generation. No production image-generation request was made during this release verification.
- PR #102 subsequently released the shared eligibility/readiness, cached-source and validation fixes. Do NOT report all catalog dolls enabled.

## Completed checks and fixes

- Cached Shopify snapshot sampled deterministically with seed `dollvue-release-2026-10-07`, one product per raw brand/status stratum: 74 products, 28 ACTIVE and 46 DRAFT. ACTIVE does not prove storefront publication.
- Release runtime resolver, prompt property resolution, one-choice validation, duplicate/unknown rejection and menu immutability checked. Zero invalid exposed choices in the sample. This is structural testing, not image quality or live browser testing.
- The initial sample found 18 active products with appearance choices blocked by the old prefix gate. The new registry now supports reviewed expansion beyond those prefixes; those sample counts are not readiness approvals.
- Added canonical non-explicit appearance classification and validation to generation/cart. Preview options reject non-owned references and unresolved conditional groups. Checkout menu and price configuration are unchanged.
- Generation cache key now includes source identity, references and full prompt, rather than only option IDs and photo index.
- Shopify force-cache requests now preserve the requested revalidation period instead of ignoring it.
- 69 focused tests pass across seven files. A full run before updating two now-obsolete body-painting assertions showed 1001 passed / 3 failed / 14 skipped. Two failures were the deliberate exclusion of undefined body painting from previews; revised tests still verify normal checkout promotional pricing. The remaining Fanreal September copy assertion expects old sitewide wording and is unrelated to the changed files. It has not been changed. Do not claim full-suite green.

Private sample report:
`/Volumes/Extreme Pro/Projects/DollWOW/data/exports/dollvue-readiness-2026-10-07/release-runtime-sample.json`

## Verification and remaining catalog work

### UI feedback follow-up

Implemented compact, non-sticky option count, a single page scroll (no nested vertical trap), normal-flow action buttons, and the agreement directly below the generation button. The consent-missing button is visually grey and aria-disabled, but accepts activation only to focus/nudge the checkbox; all generation remains blocked until consent. Reduced-motion users receive the focus/message without animation. The announcement strip is hidden only during DollVue mode to prevent header overlap.

Playwright in isolated headless Brave passed at 1440x1000, 390x844 and 320x700: real pointer activation without consent sends zero requests, checkbox focus, agreement below action, accepted request, two-choice locking/unlocking, page wheel scrolling, no horizontal overflow, keyboard activation and reduced motion. Generation was mocked: these are UI checks, not image-fidelity checks. Screenshots `/tmp/dollvue-controls-{1440,390,320}.png` were captured and mobile/desktop visually inspected. Fixture preserved under `tests/fixtures/dollVueUiPage.tsx`; temporary local route removed after testing. `scripts/check-dollvue-layout.mjs` accepts the temporary fixture URL through `DOLLVUE_UI_CHECK_URL` and an optional installed browser path. No production test endpoint or authentication bypass was added.

1. Representative WM Audrey and SE Lita real generations completed, HTTP 200. Authentication, allowance and email were test doubles; actual Storefront reads, images and Venice generation were real. No customer mail or Shopify publication changes. Minor visual differences accepted as above.
2. Shared evaluator, lightweight-list freshness and current private hold revocation are released. Preserve reviewed legacy coverage, do not widen brand prefixes blindly.
3. Approved source positions, readiness revision and image-byte binding are enforced in the deployed generation route. Keep review evidence server-only.
4. Strict Storefront lookup is released in all public DollVue entry paths, with no sample fallback. Tests reject unpublished products and stale verification links. Prepared drafts remain private and require normal publication to become public.
5. Hosted and production gates passed for this nine-record release. Remaining catalog families still require their source/reference review and ready-record preparation; do not equate inventory candidates with completed rollout.

Private inventory and cached Jev results remain on the external SSD. The shared evaluator and private registry are deployed. JK's prior visual-review assets were reconciled: 72/72 gallery transforms and 513/513 option references match reviewed originals through verified transforms, rather than falsely failing because compressed bytes differ. Three actual JK generations (Chue, Maud and Ina) subsequently passed visual review under the owner's minor-variation tolerance. Seven draft records now have 14 reviewed eye choices each, approved source positions and image digests. These are family-sampled approvals, not 98 individual generations. No draft product was published.

New registry scope: two live-product records (WM Audrey, SE Lita), seven unpublished JK records, and six explicit excluded records. Existing supported Irontech/Starpery/Lusandy coverage is preserved, not counted as newly reviewed. This is not completion of the entire catalog. The Google tracker records nine newly tested-ready products and the precise live/draft scope.

Real-data smoke tests passed 13 checks: both live pilots currently published and privately clear; source/reference byte hashes verified; actual cart payloads returned HTTP 200 (Audrey $1,777; Lita $2,412 including $79 options, before checkout discount); a JK draft and a missing product returned null through strict public lookup. No cart/order write, generation or customer mail was performed in that smoke run.

PR #102: https://github.com/sonawaneamit/DollWOW/pull/102. Final hosted and production revisions including seven JK records and access-review fixes passed verification. See the production release section above.

Latest broad test run: 1,192 passed, 19 skipped, one unrelated pre-existing Fanreal September copy assertion failed. Production build, TypeScript, owned-assets (4,950 references), public-promotion checks and final hosted/production verification passed.
