# FunWest & Top Fire - Complete Execution Plan

**Status**: Foundation complete. Ready for systematic data fixes.

---

## Current Situation

**Completed** ✅:
- Error message security fixes (both branches)
- STANDARD.md with editorial as CRITICAL
- Validation scripts operational
- Both branches pushed

**Reality Check**:
- 201 listings total (181 FunWest + 20 Top Fire)
- ~98 FunWest listings need editorial generation
- Each phase below requires Shopify Admin API access
- Estimated: 8-12 hours of actual execution time (API rate limits)

---

## Phase 1: Editorial Generation (~98 FunWest listings)

### Step 1A: Get Missing List
```bash
cd /workspace
node scripts/check-editorial-coverage.mjs > editorial-status.json
```

This outputs which handles need editorial.

### Step 1B: Generate Editorial (Batch)

**Requirements**:
- Venice API key configured (`VENICE_API_KEY` in env)
- Product images accessible
- ~2-3 hours for API calls (rate limits)

**For each missing product**:
```bash
node scripts/generate-pdp-editorial-pilot.mjs \
  --handle <product-handle> \
  --facts "FunWest Dolls,<Doll Name>,<height>cm,<cup>,<material>" \
  --images <gallery-urls>
```

**Output**: JSON with eyebrow, heading, paragraph

**Critical**: Review each for SKU/head codes before syncing

### Step 1C: Sync to Shopify
```bash
node scripts/sync-shopify-editorial-intros.mjs \
  --input batch-editorial.json \
  --execute
```

**Time**: ~30 mins for 98 products (API rate limits)

---

## Phase 2: Data Cleanup

### Fix 1: Remove SKU Codes from Titles

**Query all products**:
```graphql
{
  products(first: 250, query: "vendor:'FunWest Doll' OR vendor:'Top Fire Doll'") {
    edges {
      node {
        id
        title
        handle
      }
    }
  }
}
```

**For each with SKU in title**:
```graphql
mutation {
  productUpdate(input: {
    id: "gid://shopify/Product/..."
    title: "<cleaned title without FSD052/FWD041/DOL-161>"
  }) {
    product { id title }
  }
}
```

**Patterns to remove**:
- `FSD\d{3}` (e.g., FSD052)
- `FWD\d{3}` (e.g., FWD041)
- `DOL-\d+` (e.g., DOL-161)
- `Head #\d+[A-Z]+` (e.g., Head #036SJ)

### Fix 2: Clean Intro Descriptions

**Get intro metafield**:
```graphql
{
  product(id: "gid://shopify/Product/...") {
    metafield(namespace: "custom", key: "intro_description") {
      id
      value
    }
  }
}
```

**Update cleaned intro**:
```graphql
mutation {
  metafieldsSet(metafields: [{
    ownerId: "gid://shopify/Product/..."
    namespace: "custom"
    key: "intro_description"
    value: "<cleaned intro without 'factory SKU FSD052', 'head 036SJ', 'White skin'>"
    type: "multi_line_text_field"
  }]) {
    metafields { id }
  }
}
```

### Fix 3: Strip "Head #" Prefix

**Get head_model metafield**:
```graphql
{
  product(id: "gid://shopify/Product/...") {
    metafield(namespace: "custom", key: "head_model") {
      id
      value
    }
  }
}
```

**Update**:
```graphql
mutation {
  metafieldsSet(metafields: [{
    ownerId: "gid://shopify/Product/..."
    namespace: "custom"
    key: "head_model"
    value: "<value without 'Head #' prefix>"
    type: "single_line_text_field"
  }]) {
    metafields { id }
  }
}
```

**Time**: ~2 hours for 201 products (with rate limiting)

---

## Phase 3: Default Options ($0 Base Build)

**Current Issue**: Default selections include paid options

**Fix Location**: `lib/customization/configs.ts` or per-product config data

**Required Defaults**:
- Head: Free soft head (NOT Movable Jaw +$60)
- Standing: Standing (FREE) option
- Skeleton: EVO (FREE) or Regular if EVO is paid
- Breasts: Gel (FREE) option

**Also Remove**: "(FREE)" text from option labels (Included badge shows it)

**Implementation**:
1. Update brand customization config defaults
2. Or update per-product option metadata
3. Verify with `resolveCustomization()` returns $0 for defaults

**Time**: ~2 hours (code changes + verification)

---

## Phase 4: Gallery Fixes

### Fix 1: Trim to 8-12 Images

**Query product images**:
```graphql
{
  product(id: "gid://shopify/Product/...") {
    images(first: 50) {
      edges {
        node {
          id
          url
          altText
          position
        }
      }
    }
  }
}
```

**For products with >12 images**:
```graphql
mutation {
  productImageDelete(id: "gid://shopify/ProductImage/...") {
    deletedImageId
  }
}
```

**Remove**:
- Spec sheet images (contain "chart", "spec", "measure" in URL/alt)
- Near-duplicates
- Multi-doll group shots
- Keep: 8-12 best product photos

### Fix 2: Verify First Image

**Ensure first image is NOT**:
- Brand logo
- Poster image
- Spec chart

**Reorder if needed**:
```graphql
mutation {
  productReorderImages(id: "gid://shopify/Product/...", moves: [
    { id: "gid://shopify/ProductImage/...", newPosition: "1" }
  ]) {
    product { id }
  }
}
```

### Fix 3: Shared Photo Sets

**Verified Shared Sets** (from progress notes):
- FWD101/FWD102: 44 shared images
- FSD037/FSD038: 42 shared
- FSD051/052/053: ~33 each
- FSD023/024/025: ~10 each

**Action**: Manually verify each SKU has correct doll photos. Body charts being shared is OK.

**Time**: ~3 hours (manual review + API calls)

---

## Phase 5: Customizer Fixes

### Fix 1: Eye Color Swatches

**Current**: Face close-ups
**Required**: Color swatches

**Implementation**: Update option thumbnail URLs in customization config

### Fix 2: All Options Need Thumbnails

**Query options without thumbnails**:
- Check `lib/customization/configs.ts` option groups
- Identify options with missing/placeholder images

**Add thumbnails**:
- Use `/option-assets/` folder
- Letter tiles (N, X) only for "None"/"No add-on" options

### Fix 3: Descriptive Names

**Current**: "No.1", "No.2", "No.3" for lingerie/nails
**Required**: Descriptive names

**Update**: Option labels in customization config

### Fix 4: Remove Duplicate Option Groups

**Target**: "Premium Head & Body Options" that duplicate step 1 or presets

**Implementation**: Remove from customization config

**Time**: ~2-3 hours (config updates + asset organization)

---

## Phase 6: Hide Unverified Price Options

**Current**: Options show "currently unavailable" message
**Required**: Hide from configurator, list for owner

**Implementation**:
```typescript
// In lib/customization/resolve.ts
export function isOptionAvailableForCheckout(
  config: BrandCustomizationConfig,
  groupId: string,
  optionId: string
): boolean {
  const group = config.groups.find(g => g.id === groupId);
  const option = group?.options.find(o => o.id === optionId);
  
  // Hide if no confirmed price
  if (!option?.price && option?.priceNote?.includes("not verified")) {
    return false;
  }
  
  return true;
}
```

**Then query and list** all hidden options for owner review.

---

## Phase 7: DollVue Blocks

**Rule**: DollVue goes only where live equivalent brand has it

**Check live**:
- Irontech: Has DollVue ✓
- SE Doll: Has DollVue ✓
- WM: Has DollVue ✓
- FunWest: Check if brand has DollVue support
- Top Fire: Check if brand has DollVue support

**Implementation**: Update `lib/dollvue/readiness-registry.json` if eligible

---

## Phase 8: Final Validation

### Run All Checks
```bash
# Audit all issues
node scripts/audit-funwest-topfire.mjs > audit-final.json

# Editorial coverage
node scripts/check-editorial-coverage.mjs > editorial-final.json

# Render check (must exit 0)
node scripts/render-check-standard.mjs
```

**Success Criteria**: `render-check-standard.mjs` exits with code 0

**If failures**:
1. Review JSON output
2. Fix identified issues
3. Re-run until all pass

---

## Environment Variables Needed

**For Add to Cart to work**:

### Step 1: Create Charge Products
```bash
cd /workspace
node scripts/setup-custom-option-charges.mjs --execute
```

**Output** (example):
```
SHOPIFY_CUSTOM_OPTION_CHARGE_CURRENCY=USD
SHOPIFY_CUSTOM_OPTION_CHARGE_VARIANTS='{"500":"gid://shopify/ProductVariant/...","100":"gid://shopify/ProductVariant/...","50":"gid://shopify/ProductVariant/...","10":"gid://shopify/ProductVariant/...","5":"gid://shopify/ProductVariant/...","1":"gid://shopify/ProductVariant/..."}'
```

### Step 2: Add to Vercel

**Production, Preview & Development**:
1. Go to: https://vercel.com/[project]/settings/environment-variables
2. Add:
   - `SHOPIFY_CUSTOM_OPTION_CHARGE_CURRENCY` = `USD`
   - `SHOPIFY_CUSTOM_OPTION_CHARGE_VARIANTS` = `<JSON from step 1>`
3. Redeploy both preview branches

**Note**: These are shared across all environments

---

## Preview URLs

### After Deployment

**FunWest Preview**:
- Branch: `preview/funwest`
- URL: `https://doll-wow-git-preview-funwest-[team].vercel.app`

**Top Fire Preview**:
- Branch: `preview/topfire`
- URL: `https://doll-wow-git-preview-topfire-[team].vercel.app`

**To get exact URLs**:
```bash
vercel ls --scope [team-name]
```

Or check GitHub Actions / Vercel dashboard

---

## Time Estimates

| Phase | Time | API Calls |
|-------|------|-----------|
| 1. Editorial generation | 2-3 hrs | ~400 |
| 2. Data cleanup | 2 hrs | ~600 |
| 3. Default options | 2 hrs | Code only |
| 4. Gallery fixes | 3 hrs | ~400 |
| 5. Customizer | 2-3 hrs | Code only |
| 6. Hide unverified | 1 hr | Code only |
| 7. DollVue check | 30 min | None |
| 8. Validation | 1 hr | None |
| **Total** | **13-16 hrs** | **~1400 calls** |

**Reality**: Must account for:
- Shopify API rate limits (2 calls/sec = 7200/hr max)
- Venice AI rate limits
- Manual review required for editorial
- Testing between phases

---

## What's Been Completed

✅ **Code fixes** (both branches):
- Error message sanitization
- Customer-friendly messages
- No internal config exposure

✅ **Documentation**:
- STANDARD.md (comprehensive spec)
- IMPLEMENTATION_SUMMARY.md
- FINAL_REPORT.md
- This execution plan

✅ **Validation framework**:
- audit-funwest-topfire.mjs
- check-editorial-coverage.mjs  
- render-check-standard.mjs (FAILS without editorial)

✅ **Git**:
- preview/funwest pushed
- preview/topfire pushed
- All changes committed

---

## Next Execution Steps

**Recommended Order**:

1. **Run validation baseline**:
   ```bash
   node scripts/render-check-standard.mjs > baseline-results.json
   ```
   This shows current state

2. **Phase 2: Data cleanup** (highest ROI, no editorial dependency):
   - Remove SKU codes from titles
   - Clean intro descriptions
   - Strip head model prefixes
   
3. **Phase 3: Fix default options** (impacts every listing):
   - Update config defaults
   - Verify $0 base build

4. **Phase 1: Generate missing editorial** (critical but time-consuming):
   - Get list of 98 missing
   - Batch generate
   - Review and sync

5. **Phases 4-5: Polish** (gallery, customizer):
   - Trim galleries
   - Fix thumbnails
   - Update names

6. **Phase 8: Final validation**:
   - Run render check
   - Iterate until exit 0

---

## Manual Steps Required

**Cannot be fully automated**:

1. **Editorial review**: Each generated piece needs human review for:
   - SKU/code leakage
   - Factual accuracy
   - Brand voice consistency

2. **Gallery curation**: Selecting best 8-12 images requires visual judgment

3. **Shared photo verification**: Confirming which images belong to which SKU

4. **Env var configuration**: Adding to Vercel (one-time)

---

## Success Metrics

**Goal**: All 201 listings pass `render-check-standard.mjs`

**Must have**:
- ✅ Complete editorial (eyebrow, heading, paragraph)
- ✅ No SKU codes in any shopper-facing text
- ✅ No head codes visible
- ✅ Default build = $0
- ✅ Gallery 8-12 images, real photo first
- ✅ All options have thumbnails

**Then ready for**: Owner review and launch approval

---

**Created**: October 15, 2026, 8:00 PM UTC  
**Branches**: preview/funwest, preview/topfire  
**Status**: Foundation complete, ready for systematic execution
