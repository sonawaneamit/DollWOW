# DOL-382: Clara and Tessa Production Registry - Notes

## Status: PR Created

Branch: `cursor/clara-tessa-registry-d4ca`

## Completed

- ✅ Added Clara T74 170-2 E (gid://shopify/Product/10742344941752) to template-release.json
- ✅ Added Tessa T75 160 F (gid://shopify/Product/10742344974520) to template-release.json  
- ✅ Both use existing Top Fire silicone binding (topfire-female-e17ed253b743)
- ✅ Re-stamped all three approval gates
- ✅ Registration script created: `scripts/register-clara-tessa.mjs`

## Runtime Hash Relink Required

The runtime hashes in this PR are placeholders calculated from draft preview data. They WILL NOT match production values because:

1. The full config resolution requires Shopify API access
2. Product extended fields (identity, stock status, etc.) are not in draft data
3. Label/note details differ between draft and production

**Before merge/go-live:**

Run relink script with configured Shopify API:
```bash
NODE_OPTIONS=--conditions=react-server npx tsx scripts/relink-topfire-production.mjs
```

Or add Clara/Tessa handles to existing relink script.

## Preview Verification

These products remain DRAFT with:
- `dollwow-test` tag
- `catalog-review-hold` tag  
- `dol382-nov18` tag
- Zero publication channels

Deploy to preview environment with DOLLWOW_TEMPLATE_RELEASE=1 to verify:
1. PDP loads with correct tiers
2. Starter/Enthusiast/Collector pricing matches approved previews
3. Configurator shows correct Top Fire silicone options
4. No errors in preset generation

## Pricing Reference

From PR #271:
- Clara base: $2,349
- Tessa base: $2,299

Tiers inherit BFCM preview pricing if stacked on PR #270.

## Next Steps for Production Go-Live

1. **Verify Shopify products exist** - confirm both IDs are correct in production
2. **Relink runtime hashes** - use production Shopify data with API configured
3. **Test in preview environment** - full PDP, preset, and checkout flow
4. **Remove `dollwow-test` tag** - when ready to make discoverable (keep `catalog-review-hold`)
5. **Get Martin's approval** - on exact preview before any publication
6. **Coordinate with PR #271** - if going live together with preview branch work
