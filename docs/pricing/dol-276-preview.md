# DOL-276 Preview Boundary

This branch is review-only. It must not be merged as a production pricing release.

- Source: Greenback v4, 27 October 2026, 164 exact FunWest handles.
- The manifest contains public identities and before/after prices only. Costs,
  margin evidence and the source workbook stay in ignored local exports.
- Both `VERCEL_ENV=preview` and `DOLLWOW_FUNWEST_PRICE_PREVIEW=1` are required.
- PDPs, customizer base/total prices, catalog cards and search use the same
  preview override. No Shopify product, variant or compare-at fields are written.
- All 164 live compare-at fields were null. They remain null; no artificial sale
  or discount is introduced. Existing Halloween promo eligibility is unchanged.
- Existing template recipes are still checked against the original source
  product. No registry approval or fingerprint is changed by this preview.
- Cart creation and checkout are blocked before any Shopify mutation, including
  direct use of the shared cart creation functions.
- MD, draft products, other FunWest listings and unrelated branches are untouched.

Review `/review/funwest-prices` for all 164 before/after rows and linked PDPs.
The standalone DollVue experience has no base-price display; it keeps its
existing readiness, access and generation gates. No image generation is required.

## Verification

Read-only source audit:

```sh
python3 scripts/pricing/read-funwest-proposal.py INPUT.xlsx data/exports/dol-276-2026-10-27/proposal.json
node scripts/pricing/audit-funwest-preview.mjs data/exports/dol-276-2026-10-27/proposal.json EXISTING_ADMIN_HELPER.mjs data/exports/dol-276-2026-10-27
```

The audit rejects incomplete/ambiguous product matches, changed current prices,
wrong brands, non-active listings and truncated variant sets. It generates the
public preview manifest and before/after receipt, never live writes.

Martin must explicitly approve the rendered preview before a separately scoped
live Shopify price update. Recheck source drift and plan price-bound preset
registry updates as part of that future release. This preview is not that release.
