# Preset Hosted Candidate - September 18, 2026

Status: hosted checks passed; user authorized production release on September 18.
Production publication and post-release verification are recorded below when completed.

## Scope

- 19 existing reviewed brands; 2,580 preset assignments across 129 recipe bindings.
- 2,591 mapped parent variants for named customization checkout, using 108 shared charge groups.
- Fanreal remains deferred; previously documented recipe exceptions remain excluded.
- Original customization menus remain editable. No discount, shipping, duty or tax policy change.
- Retains Afterpay from main commit ff26f69.

## Evidence Actually Completed

- Fresh full-catalog check: all 2,580 products matched current tags, menu signatures, three resolved presets, totals and paid-choice mappings. Source: preset-candidate-1789715107385.json in the conversion workspace review directory.
- Availability audit: 1,834 named add-on variants in US, PT, GB, CA, AU and DE; 11,004 reads, zero failures. Source: upgrade-market-availability-1789715585091.json.
- Moonvale M55 was unavailable in Portugal because Managed Markets reported insufficient information. Its generic description was replaced with factual brand/model/purpose information. Subsequent availability reads pass. No market restriction was disabled.
- Brave hosted checkout from local Avant Amelia Collector: Portugal address, all four named paid options, free insured shipping, existing promotion applied, payment available. No payment or order submitted.
- 70 existing focused regression tests passed before integration. 37 checkout tests passed after the initial production bridge and mixed-cart addition. Final isolated-worktree verification remains required.
- Final isolated regression: 95 test files passed, 658 tests passed, one skipped. TypeScript and whitespace checks passed. These tests do not replace hosted checkout verification.

## Approval Meaning

The packaged registries are approved inputs for the hosted release candidate based on the evidence above. Their hashes bind those exact inputs. This is not evidence that a hosted production-mode build has passed. DOLLWOW_TEMPLATE_RELEASE must remain disabled on production until that separate check completes.

## Rollback

Disable DOLLWOW_TEMPLATE_RELEASE and revert the release commit if production verification fails. Do not delete Shopify charge products, change their prices, or remove historic order mappings as a rollback action.

## Hosted Build

Preview: https://doll-l0rb2jc76-sonawaneamits-projects.vercel.app

Vercel deployment dpl_5cT6hF9QuWAnmh2QxHahwHoJkH21 reached READY. The optimized production build, TypeScript and static generation succeeded with DOLLWOW_TEMPLATE_RELEASE=1 supplied only to this preview's build/runtime.

Two attempts to open the hosted preview in Brave were blocked because the browser tool could not verify its admin-enforced security policy. No bypass or alternative access path was attempted. This is not a hosted browser pass. Production remains unpublished; no production environment flags changed.

Before release, verify SE Lita's head chooser and exact selected head in checkout, an Avant or WM build, Starpery's free synthetic hair/hard feet and paid human hair, an RTS-only item, and a mixed cart. Confirm the three presets actually render in the hosted build, original editing still works, and add-to-cart is accessible on mobile. Do not place orders or submit payment.

Additional integration hold: the release bridge deliberately rejects paid customizations without an approved parent mapping. Before globally enabling it, resolve the treatment of deferred Fanreal and other out-of-cohort custom products so their existing checkout is not inadvertently disabled. Base-only/RTS orders and mixed reviewed-custom plus base-only carts are covered; mixed carts containing an unreviewed paid configuration are not release-approved. Do not describe the 19-brand cohort as the whole live catalog.

## Release Checks Completed After Browser Recovery

- Updated hosted candidate: https://doll-4iw95ouqs-sonawaneamits-projects.vercel.app (deployment dpl_EwDrCMrRPbN6v6oMVJK4Gaqgckuy). Production build passed.
- Brave: Lita Enthusiast selected head #136SC, total USD 2,618 before existing discount/localization. Actual hosted checkout shows that exact head, named irrigator and drying rod, free insured shipping, and available payment action in Portugal. No payment submitted.
- Brave: Starpery Yvonne Enthusiast includes synthetic hair and hard feet at zero. Collector total USD 3,075; hosted checkout charges human hair by name, keeps hard feet included, and reaches payment.
- Mobile 390x844: Avant Amelia Collector total USD 2,467, confirmation feedback, and visible Add to Cart outside collapsed review. Hosted checkout reaches payment. Viewport override reset.
- Brave: Fanreal Carlee RTS remains outside presets and proceeds through the existing bag to checkout. No Fanreal catalog edits.
- Mixed-cart regression: live Shopify cart for Lita paid eye customization plus Fanreal Kelly included configuration passes. The actual checkout shows both dolls and attaches the named eye charge to Lita.
- Excluded-only carts preserve their existing checkout. Mixed carts preserve explicitly marked legacy lines while reviewed builds always require exact named mappings. Live prices, quantities and original attributes are checked before returning checkout. Deferred paid-line combinations have automated fixtures including price drift and factory-packet separation; the live Fanreal sample has no paid options, so this is not claimed as a real paid-Fanreal test.
- Full regression after mixed-cart fix: 662 passing tests, one skipped; TypeScript passes. Separate opt-in live mixed-cart test passes. No orders or payments created.
- The earlier browser and integration holds above are historical and are resolved by these checks. Deferred brands retain legacy charges until separately onboarded; this release does not claim named-charge coverage for the entire catalog.

## New Catalog Batches

Continue assigning exactly one reviewed options: template tag to each eligible custom full-body doll. Reuse the shared recipe and shared exact-price charge records; do not create three new recipes or duplicate charges per doll. New or changed products must pass compatibility checks and be added to the released assignment/parent maps in the same catalog batch. A tag alone does not add an unreviewed product to these versioned artifacts. RTS-only and component products remain outside preset assignment. Existing importers do not yet invoke this gate automatically.
