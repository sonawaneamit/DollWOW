# Option-image hotlink repair

## Scope and publication

Repair the supplied 6 October audit without changing products, option identities,
prices, compatibility or publication status. This is a local repair candidate;
no production deployment or Shopify metafield mutation was performed.

The supplied CSV plus expanded hardcoded libraries contain 2,928 unique source
URLs. The local ingestion result is:

| Resolution | Source URLs |
| --- | ---: |
| Rehosted, validated images | 2,901 |
| Neutral default/no-thanks images omitted; text choices retained | 26 |
| Broken Dark green nail image intentionally made text-only | 1 |
| Unresolved downloads | 0 |

The rehosted images deduplicate to 2,775 local assets. The animated GIF retains
its original animation. Originals, hashes, source mapping and audit records are
on the external SSD in `data/exports/hotlink-repair-2026-10-06/`.
The runtime manifest contains only hashed keys and owned paths, not source URLs.
This migration does not establish new dealer authorizations or cross-brand head
compatibility. Existing compatibility assumptions require their separate evidence.

## Implemented safeguards

- Shared menu and public-payload boundaries resolve only owned images. Unresolved
  images fall back to the existing text choice, never another doll's image.
- Missing visual references cannot be selected for DollVue generation.
- WM/Irontech included-option inference and SE/6YE/HR identity repairs recognize
  the exact migrated assets, preserving prior selection and price behavior.
- DollVue resolves owned relative URLs against the deployment, validates image
  bodies and fails before generation if a selected reference is unavailable.
- Customer-facing payloads exclude internal provenance and operations notes;
  server evidence is retained. Homepage product cards no longer carry full menus.
- Draft import rejects unmapped option-image references before writes. Recognized
  references are rewritten to owned paths; audited neutral omissions stay text-only.
- Build hooks check local asset decoding, public promotion-data freshness and
  browser bundles. A GitHub workflow runs the asset/provenance regression checks.

## Repeatable commands

1. Ingest approved sources with `scripts/ingest-option-assets.mjs --csv FILE
   --discover --allow-host HOST`, repeating the allow-host flag for each authorized
   source. Never bypass a denial. The command is resumable and preserves originals.
2. Run `npm run check:option-assets -- --input REVIEWED_PRODUCTS.json` before import.
3. Run `npm run check:public-promotion-data` and the focused asset/payload tests.
4. Build normally; the prebuild/postbuild hooks enforce local images and clean JS.
5. Run `scripts/check-option-assets-browser.mjs` against the intended preview with
   `OPTION_AUDIT_BASE` and, if needed, `BROWSER_EXECUTABLE` set. This is a sample
   browser check, not proof that all conditional branches or templates were exercised.
6. Before deployment, complete hosted-release and authorized DollVue checks. Deploy
   assets together with their mapping and code. Do not write these paths into live
   Shopify records before their production delivery URLs work.

## Verification limits

All 2,775 output images were decoded and hash-checked. 83 focused regression tests
cover payload privacy, image ownership, ingestion, menus, conditional options,
promotions and DollVue references. A development browser-bundle scan passes.

The homepage, SE Lita B and Irontech Suki passed local browser checks at 1440px
and 390px. The PDP checks opened skin, eye, hair/nail and head menus (32 group
openings across the two viewports): no external option-image requests, failed
image responses, visible broken images, tested internal payload leaks or browser
errors were observed. This is six sampled page/viewport checks, not a catalog-wide
interactive pass. Results: `data/exports/hotlink-repair-2026-10-06/browser/results.json`.

The isolated production release built successfully from main, including TypeScript,
asset decoding and the production browser-bundle gate. Its production server passed
the same six desktop/mobile browser checks and 32 option-group openings. No hosted
release, full 74-template interactive sweep, or paid/authenticated DollVue generation
is claimed at this checkpoint. The private browser results record the exact scope.

## Draft inventory extension

A read-only Shopify audit paginated all 2,254 draft records, including every image
and custom-metafield connection. Of these, 1,412 are customer product drafts and
842 are hidden checkout-charge records. The latter contain no image references.
Before extending the repair, 867 product drafts had 3,082 additional unmapped raw
option-image URLs. No external gallery/editorial image references were found.
The snapshot, per-product statuses and field-level evidence are preserved under
`data/exports/hotlink-repair-2026-10-06/drafts/`. Coverage of a mapped URL is not proof
of a rendered draft-page test. Draft statuses must remain unchanged during release.

The extension resolved 3,075 of those 3,082 raw URLs: 3,064 map to verified owned
images and 11 are intentional neutral/text-only choices. Seven remain excluded
pending source/product-context review, documented in the private
`drafts/repair-unresolved.json`; they must not be counted as verified thumbnails.
No original mapping was removed or changed. Shopify records and statuses were
not mutated: this is storefront-boundary remapping, not a metadata migration.

The broader test run exposed two external sample-image fixtures; those were
updated to owned-namespace fixtures and their 20 tests pass. One unchanged
Fanreal September wording assertion still expects the obsolete phrase
`sitewide 10%`; the production component correctly uses eligibility wording.
That unrelated pre-existing assertion is not changed by this repair.

Do not count this local candidate as a live-site repair until deployment and hosted
readback pass. Preserve the original Shopify metadata until an explicit, backed-up
metadata migration is performed; this change remaps it at the storefront boundary.
