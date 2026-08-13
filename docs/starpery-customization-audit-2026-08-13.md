# Starpery customization audit — 2026-08-13

## Scope

This audit normalizes the checkout option model for all current Starpery catalog products. It is the first brand in the planned brand-by-brand customization cleanup.

## Evidence and authority order

1. **Starpery official workbook** — `Starpery Latest Price List - 2026-06-09(English version）.xlsx`, supplied directly by DollWOW. The workbook's only visible sheet is titled `Starpery price list 2026.02.09`; that internal date differs from the filename and should be confirmed with Starpery before a later revision replaces it.
2. **Rosemary current Starpery product forms** — used for current option names, option images, product-specific availability, and exact included visual references. Dealer promotions do not override factory prices.
3. **YourDoll Starpery collection/options pages** — secondary dealer cross-check. Its Cloudflare challenge prevented a stable automated option-form extraction during this run, so no YourDoll-only price was adopted.

## Implemented pricing decisions

The official workbook overrides dealer promotions for matching factory options:

- Hard silicone head: included.
- Soft silicone/simple oral head: included.
- ROS movable-jaw construction: +$100.
- Implanted synthetic hair: +$150.
- Implanted human hair: +$300.
- Custom pubic-hair styles 1–3: +$50 from the current Rosemary product form, within the official $50–$100 range.
- Adhesive pubic-hair appliqué: +$80.
- Hard feet without standing bolts: +$100 where offered.
- Enhanced finger bone 2.0: +$165 where explicitly identified.
- Five-point moaning system: +$100.
- Heating system 3.0: +$200.
- Silicone fixed-vagina clamping/suction: +$150 where offered.
- Custom face realism: +$200.
- Custom body realism: +$250.
- Full-weight body/no weight reduction: +$150.
- Extra standard head ordered with a doll: +$500 each.
- Extra ROS-compatible head: +$600 each, representing the $500 extra head plus the $100 ROS construction.

## Head-selection model

- **Choose a Head** is required and single-select. The photographed head plus the complete current 175-head reference catalog are available; switching the identity is included.
- **Head type** separately prices construction, preventing an ROS identity from silently losing its +$100 factory upgrade.
- Checkout compatibility rules require ROS-listed heads to use the ROS construction and prevent standard-only heads from being paired with it.
- **Add Extra Head** is optional and multi-select. Each distinct selected head is charged independently.
- The incomplete imported groups named `An Extra Free Head`, `An Extra Head`, and all `For Extra Head` subgroups are replaced by this normalized model. This prevents a dealer promotion from creating a free Starpery extra head on DollWOW.
- Free-text `Other Head` choices were removed from checkout because they reintroduced an ambiguous unpriced path.

## Visual references and Doll Visualizer

- Imported product-specific option groups remain the source for compatibility and their current supplier/dealer reference images.
- Visualizer-friendly options are marked eligible only when an actual image reference is present.
- The current safe groups include skin tone, hairstyle/implanted-hair color, eye color, nail colors, areola color, and labia color when supplied on the product.
- **Head switching is intentionally not Visualizer-enabled in this release.** It becomes eligible only after the same complete head identity model is implemented for every brand and the head-replacement prompt/QA path is validated. At that point, the head reference may control facial/head identity only; the original product photo must retain its body, pose, crop, camera, lighting, clothing, and setting.

## Product-specific compatibility preserved

Starpery products with imported option groups keep those product-specific groups. The shared normalizer only:

- inserts the complete head identity groups;
- removes conflicting dealer extra-head promotions;
- applies official prices to recognized factory upgrades;
- converts known included reference choices to verified $0 selections;
- leaves unavailable product-specific choices absent rather than assuming every Starpery SKU supports every option.

## Items not priced as retail in this pass

The workbook lists factory accessory costs for inserts, adapters, eyes, wigs, hooks, sample material, and flight cases. Those are not treated as authoritative DollWOW retail prices. Existing product-specific dealer-retail accessory choices remain only when they already have a verified checkout price. A separate accessory-margin policy should set DollWOW retail pricing before adding factory-cost-only accessories globally.

## Validation

- 313 current Starpery catalog records audited against the normalized runtime configuration.
- 313/313 received the complete single-select head group.
- 313/313 received the complete multi-select extra-head group.
- 0 default configurations require price confirmation.
- 0 Visualizer-eligible options lack an image reference.
- Starpery unit tests cover free head switching, paid multi-head selection, ROS identity/construction compatibility, ROS pricing, official-over-dealer precedence, product-specific imagery, and TPE/silicone compatibility.

## Brand-rollout follow-up

Repeat the same process per brand:

1. complete and verify head identity catalog;
2. separate `Choose a Head` (one) from `Add Extra Head` (many);
3. establish construction/special-head surcharges;
4. preserve product-specific compatibility;
5. verify every checkout price;
6. verify Visualizer reference images;
7. only then enable head switching in Doll Visualizer.
