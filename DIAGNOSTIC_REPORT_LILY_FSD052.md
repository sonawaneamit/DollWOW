# Diagnostic Report: Lily FSD052 QA Failure Analysis

**Date**: 2026-10-15  
**Deployment**: f2294d5 on preview/funwest  
**Product**: Lily FSD052 (funwest-dolls-lily-157cm-g-cup-silicone-companion-doll-fsd052)

## Observed Issues

From the rendered HTML (`lily-render_d4ea.html`):
- ✗ 0 occurrences of certificate/authorization
- ✗ 0 occurrences of Starter/Enthusiast/Collector presets
- ✗ 0 occurrences of DollVue badge/entry point
- ✗ 138 occurrences of `(FREE)` still present in option labels
- ✓ Editorial intro present and working

## Root Causes Identified

### 1. DollVue Hidden by `dollwow-test` Tag

**Location**: `lib/dollvue/eligibility.ts` line 15

**Issue**: The `isDollVueExcluded` function excluded all products with the `dollwow-test` tag:

```typescript
export function isDollVueExcluded(product: Product) {
  return product.extended.stockStatus === 'ready_to_ship' ||
    product.tags.some(tag => /age.*hold|safety.*hold|content.*hold|^dollwow-system$|^custom-option-charge$|^dollwow-test$/i.test(tag)) ||
    /head only|head-only|torso|accessor|upgrade|customization|charge|^system\b/i.test(product.productType);
}
```

Every FunWest product carries `dollwow-test` to gate them from production, but this also suppressed DollVue on preview deployments where they are under review.

**Fix Applied**: Modified `isDollVueExcluded` to check deployment environment:

```typescript
export function isDollVueExcluded(product: Product) {
  const isPreviewDeployment = process.env.VERCEL_ENV === 'preview' || process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview';
  return product.extended.stockStatus === 'ready_to_ship' ||
    product.tags.some(tag => {
      if (/^dollwow-test$/i.test(tag)) return !isPreviewDeployment;
      return /age.*hold|safety.*hold|content.*hold|^dollwow-system$|^custom-option-charge$/i.test(tag);
    }) ||
    /head only|head-only|torso|accessor|upgrade|customization|charge|^system\b/i.test(product.productType);
}
```

**Commit**: `440cec0` - "Allow dollwow-test products in DollVue on preview deployments"

### 2. Template Presets Missing: Environment Variable Not Set

**Location**: `lib/customization/template-loader.ts` line 15

**Issue**: Template presets require `DOLLWOW_TEMPLATE_RELEASE=1` environment variable:

```typescript
export async function loadTemplateRecipe(product: Product): Promise<TemplatePresetDefinition | null | undefined> {
  const local = await loadLocalTemplateRecipe(product);
  if (local !== undefined) return local;
  if (process.env.DOLLWOW_TEMPLATE_RELEASE !== '1') return undefined;  // ← Blocks presets
  return selectReleased(product, getCustomizationConfig(product));
}
```

The FunWest products are registered in `lib/customization/evidence/template-release.json` with Starter/Enthusiast/Collector recipes, but without the env var set, `templateRecipe` returns `undefined` and presets never render.

**Fix Required**: Set `DOLLWOW_TEMPLATE_RELEASE=1` in Vercel environment variables for the preview/funwest branch.

**Evidence**: The template release registry (line 8) includes:
> "FunWest custom (preview, dollwow-test) bound to funwest tpe/silicone Starter/Enthusiast/Collector recipes using the imported option prices (Kaia, 2026-10-15)"

### 3. Certificate/Authorization Section Hidden

**Location**: `app/(store)/products/[handle]/page.tsx` line 110

**Issue**: Certificate section is gated by `isLiveAuthorizedBrand`:

```typescript
const hasAuthorizationSection = isLiveAuthorizedBrand(productBrand);
```

`lib/catalog/authorizations.ts` includes FunWest:

```typescript
{
  id: "funwest-dolls",
  brand: "FunWest Dolls",
  brandValue: "funwest",
  aliases: ["funwest", "funwest doll", "funwest dolls", "fun west"],
  status: "authorized"
}
```

And `lib/catalog/brands.ts` line 17 marks it preview-only:

```typescript
const previewOnlyCatalogBrandValues: string[] = ["funwest", "top-fire"];
```

**Diagnosis**: The brand lookup chain should work:
1. `productBrand` = `product.extended.brand || product.vendor` = "FunWest Dolls"
2. `getCatalogBrand("FunWest Dolls")` → normalizes to "funwest" → returns brand object
3. `isLiveAuthorizedBrand` checks `!brandsWithoutAuthorizationOnFile.has("funwest")` → returns true

**Status**: This should already work. If the certificate still doesn't appear, the issue may be:
- `product.extended.brand` is undefined or has a different value than "FunWest Dolls"
- Or the `publicProductPayload` is stripping the brand incorrectly

**Verification Needed**: Check the actual runtime value of `product.extended.brand` in the rendered page props.

### 4. `(FREE)` Labels Not Stripped

**Location**: `lib/promotions/optionPricing.ts` lines 124-127

**Code Path**:
```typescript
const brand = product.extended.brand || product.vendor;
const baseLabel = (brand && /funwest|top[- ]?fire/i.test(brand))
  ? option.label.replace(/\s*\(FREE\)\s*/gi, '').trim()
  : option.label;

return {
  // ...
  displayLabel: talkX ? "IronAI TalkX Box" : baseLabel
};
```

The stripping logic is correct and the regex `/funwest|top[- ]?fire/i` matches "FunWest Dolls".

**Rendering**: In `components/ProductOptions.tsx` line 765:

```tsx
<span className="block text-[17px] font-semibold text-text">{pricing.displayLabel}</span>
```

The `pricing.displayLabel` should contain the stripped label.

**Diagnosis**: The 138 `(FREE)` occurrences suggest either:
1. `product.extended.brand` is undefined, so the fallback to `product.vendor` isn't matching the regex
2. OR the labels are being rendered from a different code path that bypasses `promotionOptionPrice`

**Verification Needed**: 
- Confirm `product.extended.brand` value in the rendered page
- Check if `(FREE)` appears in option group summaries, cart drawer, or other UI elements beyond the main option tiles

## Recommendations

### Immediate Actions

1. **Set Vercel Environment Variable**:
   - Name: `DOLLWOW_TEMPLATE_RELEASE`
   - Value: `1`
   - Scope: Preview branch `preview/funwest` only
   - This will enable template presets (Starter/Enthusiast/Collector)

2. **Verify Brand Value**:
   - Inspect the actual `__NEXT_DATA__` in a fresh deploy to confirm `product.extended.brand` = "FunWest Dolls"
   - If it's undefined, check the Shopify metafield mapping in `lib/shopify/admin.ts`

3. **Deploy and Test**:
   - Deploy commit `440cec0` (already pushed to preview/funwest)
   - After setting `DOLLWOW_TEMPLATE_RELEASE=1`, redeploy
   - Verify DollVue badge appears
   - Verify Starter/Enthusiast/Collector preset cards appear
   - Verify certificate/authorization section appears
   - Count `(FREE)` occurrences in HTML

### Code Changes Applied

#### preview/funwest
- ✓ Commit `440cec0`: Fixed `isDollVueExcluded` to allow `dollwow-test` on preview

#### preview/topfire
- ✓ Already has the same fix (lines 14-19 in `lib/dollvue/eligibility.ts`)

### Outstanding Issues

1. **Certificate section**: Likely works but needs verification with fresh deployment
2. **`(FREE)` stripping**: Likely works but needs brand value verification

## Test Plan

After deploying with `DOLLWOW_TEMPLATE_RELEASE=1`:

1. **Grep rendered HTML for**:
   - `dollvue` (expect >6 occurrences including the badge)
   - `(FREE)` (expect 0 occurrences)
   - `Starter` (expect at least 3)
   - `Enthusiast` (expect at least 3)
   - `Collector` (expect at least 3)
   - `certificate` or `authorization` (expect >0)

2. **Visual QA**:
   - DollVue badge visible below gallery
   - Three preset cards (Starter/Enthusiast/Collector) visible in customizer
   - Authorization section with FunWest Dolls heading visible
   - No `(FREE)` visible in any option labels

3. **Repeat for**:
   - Top Fire Grace 162 on preview/topfire
   - Both FunWest and Top Fire products should pass all checks

## Related Commits

- `440cec0` - Allow dollwow-test products in DollVue on preview deployments (preview/funwest)
- `f2294d5` - Strip (FREE) from FunWest/Top Fire labels (already deployed)
- `c2611a7` - Fix preview issues: add Top Fire to preview brands, remove stale registry entry

## Environment Variables Required

| Variable | Value | Scope | Purpose |
|----------|-------|-------|---------|
| `DOLLWOW_TEMPLATE_RELEASE` | `1` | preview/funwest, preview/topfire | Enable template presets from release registry |
| `VERCEL_ENV` | `preview` | Auto-set by Vercel | Used to gate dollwow-test exclusion |
