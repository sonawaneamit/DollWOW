# Bea: one-product release

Owner authorization: publish one existing adult-model draft from a new brand, 16 October 2026. Molly is handled by another teammate.

## Exact scope

- Parent: `gid://shopify/Product/10663295025336`.
- Variant: `gid://shopify/ProductVariant/54355736527032`.
- Handle: `funwest-dolls-bea-162cm-f-cup-tpe-companion-doll-fwd041`.
- Identity: FunWest FWD041, head 006, 162cm F-cup TPE body, custom factory order.
- Existing base price retained: USD 1,349. Shopify recorded cost: USD 703.97. This is not verified net profit after freight, payment costs or support.
- Existing supplier-origin, Shopify-hosted gallery: all 12 images decoded and visually reviewed by Codex for consistent adult presentation. Manufacturer watermark preserved. No image replacement or watermark removal.

## Changes

Added a factual search description and a non-explicit lifestyle editorial generated through Venice, then reviewed. Reused the existing FunWest TPE recipe with exact option compatibility checked, and bound this product to its current runtime hash.

Preset totals before discounts, shipping and tax: Starter USD 1,474; Enthusiast USD 1,714; Collector USD 1,984. Default manual configuration remains USD 1,349. Preset configuration changes are cumulative and preserve independent appearance choices.

Created 30 internal, named charge products during staging. One optional body-storage bracket was unavailable in CA/GB/DE and was returned to DRAFT; its choice was removed only from Bea. The remaining 29 charge products cover all 38 paid choices, grouping only same-price lingerie styles while retaining the exact selected style. Existing products and other drafts are outside scope.

## Verification

Private evidence root: `/Volumes/Extreme Pro/Projects/DollWOW/data/exports/bea-release-2026-10-16/`.

- `runtime.json`: actual Storefront product mapping, menu, defaults, paid choices and tiers. No unresolved default or preset selections; owned option asset check passed.
- `checkout-results.json`: 42 real test carts passed: defaults, all three presets, and all 38 remaining paid choices. Server repricing was exercised against the actual product fixture, followed by actual Shopify cart creation and named-line verification. The fixture omits the staging exclusion tag to represent the intended release state. No paid orders were placed.
- All 30 applicable variants (parent plus 29 add-ons) available in US, CA, GB and DE. International availability checks use their actual currencies; USD-priced real-cart tests are separate.
- Real preset carts received 10% off: Starter 1,326.60; Enthusiast 1,542.60; Collector 1,785.60. These amounts exclude shipping and tax.
- `venice-editorial.json`: generation response and reviewed output, kept privately.
- `dataforseo-serp.json`: current exact-model U.S. organic SERP research, reported charge USD 0.002. It identifies the factory FWD041 page. This one request does not constitute an all-API SEO/GEO audit or a ranking guarantee.
- `charge-held.json`: the excluded bracket and exact reason, with no altered classification or attempts to bypass market restrictions.
- Pre-change Shopify snapshot: `/Volumes/Extreme Pro/Projects/DollWOW/data/exports/funwest-bea-before-2026-10-16.json`.

Registry changes add exactly one parent. The signature differs from the donor only because of the excluded optional bracket; preset choices remain supported. Existing release entries and named charge mappings are retained.

## Release and reversal

The parent is staged ACTIVE with `dollwow-test` while the scoped registries are verified/deployed. Remove that exclusion only after deployment. Publication channels are Online Store and DollWOW Headless. Verify the public PDP, editorial, presets, gallery and cart after removal; publication alone does not establish these.

To deactivate this release, set only the parent back to DRAFT. Registry entries can remain dormant. The new internal charge products are identified by `bea-release-2026-10-16`; do not deactivate shared pre-existing charges or other brand products. Public caches and sitemaps can take time to refresh.

This document records scoped implementation evidence. Post-deployment browser and release results are kept in the private evidence directory, with the final deployment and live URL included in the user handoff.
