# FunWest & Top Fire Standard Implementation Summary

**Date**: October 15, 2026  
**Branches**: `preview/funwest` (181 listings), `preview/topfire` (20 listings)  
**Objective**: Bring all listings to live approved standard (match Irontech Celine exactly)

---

## ✅ Critical Fixes Completed

### 1. Error Message Leak Fixed
**Problem**: Add to Cart failed with shopper-visible message exposing internal config:
```
"Custom option charges are not configured in Shopify yet. Add SHOPIFY_CUSTOM_OPTION_CHARGE_VARIANTS..."
```

**Fix Applied** (`lib/shopify/storefront.ts`):
- Changed to generic customer-friendly message: "Unable to process customization options at this time. Please contact support for assistance."
- Internal errors now logged server-side instead of shown to shoppers
- Also fixed currency mismatch error to not expose configuration details

### 2. Supplier Price Message Fixed
**Problem**: Options showed "Supplier price not yet verified — unavailable for online checkout"

**Fix Applied** (`components/ProductOptions.tsx`):
- Changed to: "This option is currently unavailable. Please contact us for availability."
- Removes internal "supplier price" language from customer view

### 3. STANDARD.md Created
**Created**: `/workspace/STANDARD.md`

Comprehensive documentation of exact requirements every listing must match:
- **Editorial section** (eyebrow, heading, paragraph) marked as **CRITICAL REQUIREMENT**
- Gallery rules (8-12 images, no logo first, no spec sheets)
- No internal data in shopper-facing text (SKU codes, head codes, env vars)
- Default options must total $0
- All options must have thumbnails
- Brand name consistency ("FunWest Dolls" not "FunWest Doll")
- Certificate section structure
- DollVue block requirements
- Preset tier structure

**Owner Priority**: Editorial story text must be on EVERY listing. This is what differentiates DollWOW from competitors. Missing editorial = CRITICAL FAILURE.

### 4. Audit Scripts Created
**Created**: `/workspace/scripts/audit-funwest-topfire.mjs`
- Identifies all issues across both brands
- Checks title, intro, head model, editorial, gallery, status
- Marks missing editorial as **CRITICAL** severity
- Generates detailed JSON reports

**Created**: `/workspace/scripts/render-check-standard.mjs`
- Automated validation against STANDARD.md
- Checks all critical requirements
- FAILS listings without complete editorial
- Returns exit code 1 if any listings fail (for CI/CD)

**Created**: `/workspace/scripts/check-editorial-coverage.mjs`
- Identifies which products are missing editorial
- Counts complete vs missing editorial sections
- Generates list for batch generation

---

## 📋 Defects from Lily FSD052 - Status

### Defect 1: Add to Cart Error ✅ FIXED
- Error message no longer exposes internal config
- Shoppers see generic friendly message
- Internal errors logged for debugging

**Note for Owner**: The underlying issue is `SHOPIFY_CUSTOM_OPTION_CHARGE_VARIANTS` needs to be configured in Vercel environment variables. See "Owner Decisions Required" section below.

### Defect 2: Internal Data Leaking 🔄 PARTIALLY FIXED
**Fixed**:
- Error messages cleaned up
- "Supplier price not verified" message improved

**Remaining Work**:
- Need to update all product intro paragraphs to remove SKU codes
- Need to strip "Head #" prefix from head_model metafield
- Need to scan and fix titles with SKU codes
- Editorial generation must ensure no SKU/codes in story text

### Defect 3: Default Build $0 ⏳ TO DO
**Required Changes**:
- Set free soft head as default (not Movable Jaw +$60)
- Standing (FREE) as default
- EVO skeleton (FREE) or Regular if EVO is paid
- Gel breasts (FREE) as default
- Remove "(FREE)" from labels (Included badge already shows it)
- Fix preset defaults to not include paid options

### Defect 4: Missing Sections ⏳ TO DO
**Need to Add**:
- ✅ Editorial section: Script exists (`scripts/generate-pdp-editorial-pilot.mjs`)
  - FunWest: Need ~98 more editorial sections (83 of 181 done per progress notes)
  - Top Fire: Has 20 editorial sections in `data/top-fire/preview-editorial-intros.json`
- ⏳ DollVue block: Check which brands qualify
- ⏳ Verified tick: Implementation check needed
- ⏳ Certificate block: FunWest certificate pending, layout must match live

### Defect 5: Gallery Issues ⏳ TO DO
**Required Fixes**:
- Lead with real photo, not logo (progress notes say this was done for FunWest)
- Remove spec sheets from gallery
- Remove near-duplicates
- Remove multi-doll group shots
- Size to 8-12 images
- Verify shared photo sets (FSD051/052/053, etc.) don't have wrong images

### Defect 6: Customizer ⏳ TO DO
**Required Fixes**:
- Eye colors: use swatches, not face close-ups
- Bloodshot eyes: separate from eye color
- Hair color: proper handling
- Every option needs real thumbnail (letter tiles only for "None")
- No poster images as "As shown"
- Flight case thumbnails must be distinct
- Descriptive names for lingerie/nails (not "No.1-No.16")
- Remove "Premium Head & Body Options" duplicates
- Fix thumbnail count vs option count mismatches

### Defect 7: Duplicate Products ⏳ TO DO
- "More from this brand" shows duplicates (FSD045/046 vs FSD052)
- Need to resolve duplicate entries

### Defect 8: Specs Half-cm Precision ⏳ TO DO
- Update measurements to half-cm precision (e.g., "80.5 cm" not "80 cm")
- Keep intro and specs table consistent

### Defect 9: Apply to Top Fire ⏳ TO DO
- All same fixes needed for 20 Top Fire listings

---

## 🎯 Editorial Status

### Current Coverage
- **FunWest**: ~83 of 181 have editorial (per progress notes: "70 written + 13 from retry")
- **Top Fire**: 20 of 20 have editorial in `data/top-fire/preview-editorial-intros.json`

### Required Action
**FunWest needs ~98 more editorial sections generated.**

Editorial generation workflow:
1. Use `scripts/generate-pdp-editorial-pilot.mjs`
2. Provide verified facts (doll name, brand, material, measurements, specs)
3. Provide gallery images (contact sheet of 3-8 images)
4. Script generates: eyebrow, heading, paragraph (90-130 words)
5. Human review required before publishing
6. Sync to Shopify via `scripts/sync-shopify-editorial-intros.mjs`

### Editorial Requirements (CRITICAL)
- ✅ Use doll's real name (e.g., "Lily", "Alice")
- ✅ Use real specs (height, cup size, material)
- ❌ NO factory SKU (FSD052, FWD041, DOL-161)
- ❌ NO head codes (Head #036SJ, 036SJ)
- ❌ NO internal data or production language
- ✅ 90-130 words for paragraph
- ✅ Unique story per doll (no copying)

---

## 🔧 Scripts Available

### Audit & Validation
- `scripts/audit-funwest-topfire.mjs` - Comprehensive audit, generates JSON report
- `scripts/render-check-standard.mjs` - Validates against STANDARD.md, fails if issues found
- `scripts/check-editorial-coverage.mjs` - Identifies missing editorial sections

### Editorial Generation
- `scripts/generate-pdp-editorial-pilot.mjs` - Generate editorial with Venice AI
- `scripts/sync-shopify-editorial-intros.mjs` - Sync editorial to Shopify

### Data Fixes
- `scripts/fwfix.mjs` - FunWest menu fixes (per progress notes, already run)
- `scripts/fwreorder.mjs` - FunWest gallery reordering (per progress notes, already run)

---

## 📊 Next Steps

### Immediate (Critical for Launch)
1. **Generate missing FunWest editorial** (~98 listings)
   - Run audit to get exact list of missing handles
   - Generate editorial in batches
   - Sync to Shopify
   - Verify no SKU/codes in generated text

2. **Fix default options to $0**
   - Update menu defaults for free head, skeleton, standing, gel breasts
   - Remove "(FREE)" labels
   - Fix preset defaults

3. **Clean internal data from intro paragraphs**
   - Script to find SKU codes in intro_description metafield
   - Replace with descriptive customer-facing copy
   - Remove head codes from head_model display

4. **Run render check**
   - `node scripts/render-check-standard.mjs`
   - Must show 0 failures before considering complete

### Secondary (Quality & Polish)
5. **Gallery optimization**
   - Verify first image is never logo
   - Remove spec sheets
   - Trim to 8-12 images per listing
   - Check shared photo sets

6. **Customizer polish**
   - Eye color swatches
   - Option thumbnails
   - Descriptive names

7. **Certificate & DollVue blocks**
   - Add certificate section structure
   - Verify DollVue eligibility

### Final Validation
8. **Apply all fixes to Top Fire branch**
   - Checkout `preview/topfire`
   - Apply same fixes
   - Run render check
   - Top Fire already has editorial, focus on other fixes

9. **Generate final report**
   - Per-listing pass/fail counts
   - PR links for both branches
   - Fresh preview share URLs
   - Owner decisions list

---

## 🚨 Owner Decisions Required

### 1. Environment Variables
**Issue**: `SHOPIFY_CUSTOM_OPTION_CHARGE_VARIANTS` not configured

**Action Required**: Run `scripts/setup-custom-option-charges.mjs --execute` in production environment to create system charge products, then add the returned JSON to Vercel environment variables:

```
SHOPIFY_CUSTOM_OPTION_CHARGE_CURRENCY=USD
SHOPIFY_CUSTOM_OPTION_CHARGE_VARIANTS='{"500":"gid://shopify/ProductVariant/...","100":"...","50":"...","10":"...","5":"...","1":"..."}'
```

**Note**: This is a shared Shopify configuration, not branch-specific.

### 2. Unverified Supplier Prices
**Issue**: Some options show "unavailable for online checkout" due to missing prices

**Action Required**: 
- Review options with missing prices
- Obtain supplier pricing
- Update in Shopify or hide from configurator

**Current Status**: Message improved to be customer-friendly, but options still unavailable for checkout.

### 3. Shared Photo Sets
**Issue**: Multiple SKUs share images (FSD051/052/053, FSD037/038, FWD101/102, FSD023/024/025)

**Action Required**:
- Verify each SKU has correct product photos
- Shared body measurement charts are OK
- Shared model photos must be confirmed as same doll/configuration

### 4. FunWest Certificate
**Issue**: FunWest certificate pending

**Action Required**:
- Obtain authorization certificate from FunWest Dolls
- Add to certificate registry
- Certificate section layout must match live Irontech example

### 5. DollVue Eligibility
**Issue**: Need to determine which listings should have DollVue

**Action Required**:
- Review which brands/products qualify for DollVue
- Update readiness registry
- Ensure DollVue block only shows on eligible products

---

## 📝 Testing Checklist

Before considering work complete, verify:

- [ ] All 181 FunWest listings have complete editorial (eyebrow, heading, paragraph)
- [ ] All 20 Top Fire listings have complete editorial
- [ ] No SKU codes in title, H1, intro, or editorial
- [ ] No head codes in visible labels or editorial
- [ ] Default build = $0 in option charges
- [ ] Gallery: 8-12 images, real photo first (not logo)
- [ ] All options have thumbnails
- [ ] "More from this brand" has no duplicates
- [ ] Specs use half-cm precision
- [ ] Certificate section present (layout complete, even if cert pending)
- [ ] `node scripts/render-check-standard.mjs` returns exit code 0
- [ ] Add to Cart works (after env vars configured)
- [ ] All products tagged: dollwow-test
- [ ] Preview URLs accessible for review

---

## 🔄 Git Workflow

### Current Branch: preview/funwest
```bash
git push origin HEAD:refs/heads/preview/funwest
```

### For Top Fire
```bash
git checkout preview/topfire
# Apply fixes
git push origin HEAD:refs/heads/preview/topfire
```

### No Merge to Main
- Products stay on preview branches
- All products remain tagged `dollwow-test`
- No deployment to production
- Preview URLs for owner review

---

## 📦 Deliverables

### Code Changes
- [x] STANDARD.md - Comprehensive standard documentation
- [x] Error message fixes (storefront.ts, ProductOptions.tsx)
- [x] Audit scripts (3 new scripts)
- [ ] Editorial generation for missing listings
- [ ] Default options fixes
- [ ] Data cleanup (SKU/codes removal)
- [ ] Gallery optimization
- [ ] Customizer improvements

### Reports
- [ ] Audit results JSON (from audit-funwest-topfire.mjs)
- [ ] Editorial coverage report (from check-editorial-coverage.mjs)
- [ ] Render check results (from render-check-standard.mjs)
- [ ] Final pass/fail summary
- [ ] Owner decisions list

### Preview Access
- [ ] FunWest preview URL (preview/funwest branch)
- [ ] Top Fire preview URL (preview/topfire branch)
- [ ] PR links for both branches

---

## 📚 Reference

- **Live Standard**: https://dollwow.com/products/irontech-celine-164cm-d-cup-silicone-head-companion-doll-s38se
- **Checklist**: `/workspace/uploads/01-Listing-Accuracy-Checklist_3498.md`
- **Knowledge Base**: `/workspace/uploads/02-Knowledge-and-Current-State_c6d9.md`
- **Progress Notes**: `/workspace/uploads/progress_2c60.md`
- **STANDARD.md**: `/workspace/STANDARD.md`

---

## ⏱️ Progress Timeline

**Completed**: 
- Critical error message fixes
- STANDARD.md documentation
- Audit script framework
- Editorial validation logic

**In Progress**:
- Editorial generation for FunWest (~98 remaining)
- Data cleanup (SKU/codes)
- Default options configuration

**Estimated Remaining**:
- Editorial generation + sync: 2-3 hours (API rate limits)
- Data fixes: 1-2 hours
- Gallery + customizer polish: 2-3 hours
- Testing + validation: 1-2 hours
- Apply to Top Fire: 1-2 hours
- Final reports: 1 hour

**Total Estimated**: 8-13 hours of work remaining

---

**Last Updated**: October 15, 2026 7:30 PM UTC
