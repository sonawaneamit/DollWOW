# DOL-371 BFCM Implementation Status - Nov 20, 2026

## Critical Blocker: Shopify Credentials Required

Cannot proceed without Shopify Storefront API access token.

### Required Immediately

```bash
SHOPIFY_STOREFRONT_ACCESS_TOKEN=xxxxx
SHOPIFY_STORE_DOMAIN=tpaekn-rc.myshopify.com
```

**Purpose:** Fetch real live products to build accurate dry-run table

**Scope:** Storefront API, `unauthenticated_read_products`

**How to obtain:**
1. Shopify Admin → Apps → Develop apps
2. Create or use existing storefront app
3. Get Storefront Access Token
4. Provide to agent as environment variable or Cursor secret

---

## What I've Built (Ready to Use)

### 1. Real Product Fetch Script ✅
**File:** `scripts/fetch-real-bfcm-products.mjs`

**What it does:**
- Queries live Shopify store via Storefront API
- Fetches real products for each brand (Top Fire, Galatea, Climax, 6YE, IDO)
- Filters by confirmed promo eligibility criteria
- Selects 3 products per brand
- Shows real Product IDs, Variant IDs, current live prices
- Calculates promo prices per confirmed terms
- Generates dry-run table
- Saves results to `data/bfcm-real-products.json`

**Usage:**
```bash
SHOPIFY_STOREFRONT_ACCESS_TOKEN=xxx node scripts/fetch-real-bfcm-products.mjs
```

**Output format:**
| Brand | Product Handle | Product ID | Variant ID | Original | Promo | Restore To | Revert At |
|-------|---------------|------------|------------|----------|-------|------------|-----------|
| Top Fire | real-handle | gid://... | gid://... | $2,349 | $2,199 | $2,349 | 2026-12-11T04:59:00Z |

### 2. Confirmed Promo Terms (from PR #270)

**Top Fire:**
- $150 off full silicone dolls
- Free second head
- Vendor cost also drops $150
- Show original as compare-at price
- Starts: Nov 15
- Revert: Dec 11 04:59 UTC (Dec 10 11:59 PM Eastern)

**Galatea:**
- 3 free custom-order upgrades (body heating, vaginal suction, oral heating)
- Price unchanged
- Through Dec 31
- Revert: Dec 11 04:59 UTC (same as other brands for consistency)

**Climax:**
- 10% off large dolls (>= $900)
- Free second head, gel butt, hands/feet on full dolls
- Custom and torso eligible
- Vendor cost also drops 10%
- Starts: Nov 13
- Revert: Dec 11 04:59 UTC

**6YE:**
- 5% off all products
- Free extra head on large dolls (>= 135cm, treat all current live 6YE full dolls 150-173cm as large)
- Vendor cost also drops 5%
- 6YE's own offer runs to Dec 31
- Revert: Dec 11 04:59 UTC (aligned with other brands)

**IDO:**
- Fixed pricing: $2,599 custom / $2,499 RTS
- Free random wig + moving pad on custom
- November promo (warehouse style)
- Starts: Nov 1
- **Revert: Dec 1 00:00 UTC (end of Nov 30)** ⚠️ Different deadline

**BLACKFRIDAYWOW26 Code:**
- Already live, stacks on top
- $299 off orders >= $900
- Do NOT change this code
- Do NOT change live announcement bar

---

## What's Blocked Without Credentials

❌ Cannot fetch real product IDs  
❌ Cannot get current live prices  
❌ Cannot generate accurate dry-run table  
❌ Cannot build preview with real products  
❌ Cannot verify promo logic against real data

---

## Promo Eligibility Logic (Implemented)

### Top Fire
```
✓ Full doll (not torso, not head-only, not accessory)
✓ Silicone material
✓ Must have 'silicone' tag or in title
```

### Galatea
```
✓ Custom order only
✓ Must have 'custom' or 'customizable' tag
```

### Climax
```
✓ Custom order only
✓ Full doll OR torso
✓ 10% discount only if price >= $900
```

### 6YE
```
✓ All products
✓ 5% discount always
✓ Free extra head only on dolls >= 135cm height
✓ Treat all current 150-173cm dolls as large-size
```

### IDO
```
✓ Full dolls only
✓ Custom OR ready-to-ship
✓ Fixed pricing: $2,599 custom / $2,499 RTS
```

---

## Price Calculation (Implemented)

### Top Fire
```javascript
promoPrice = originalPrice - 150
compareAtPrice = originalPrice
```

### Galatea
```javascript
promoPrice = originalPrice  // unchanged
freeOptions = ['body-heating', 'vaginal-suction', 'oral-heating']
```

### Climax
```javascript
promoPrice = originalPrice >= 900 ? Math.floor(originalPrice * 0.9) : originalPrice
gifts = ['second-head', 'gel-butt', ...(full ? ['hands-feet'] : [])]
```

### 6YE
```javascript
promoPrice = Math.floor(originalPrice * 0.95)
gifts = heightCm >= 135 ? ['second-head'] : []
```

### IDO
```javascript
promoPrice = isCustom ? 2599 : 2499
gifts = isCustom ? ['random-wig', 'moving-pad'] : []
```

---

## Revert Schedule (Corrected)

| Brand | Revert Time | Notes |
|-------|-------------|-------|
| Top Fire | 2026-12-11T04:59:00Z | Dec 10, 11:59 PM US Eastern |
| Galatea | 2026-12-11T04:59:00Z | Dec 10, 11:59 PM US Eastern |
| Climax | 2026-12-11T04:59:00Z | Dec 10, 11:59 PM US Eastern |
| 6YE | 2026-12-11T04:59:00Z | Dec 10, 11:59 PM US Eastern |
| IDO | 2026-12-01T00:00:00Z | **End of Nov 30** (different!) |

---

## Next Steps (Once Credentials Provided)

### Step 1: Fetch Real Products ✅ Ready
```bash
SHOPIFY_STOREFRONT_ACCESS_TOKEN=xxx node scripts/fetch-real-bfcm-products.mjs
```

Expected output:
- 3-5 products per brand (15-25 total)
- Real Product IDs (gid://shopify/Product/...)
- Real Variant IDs (gid://shopify/ProductVariant/...)
- Current live prices
- Calculated promo prices
- Revert timestamps
- Saved to `data/bfcm-real-products.json`

### Step 2: Review Dry-Run Table
- Verify selected products are correct
- Verify current prices match expectations
- Verify promo calculations are correct
- Adjust selection if needed

### Step 3: Build Preview Implementation
- Import bfcmBrandPreview.ts from PR #270
- Apply promo logic to product pages
- Show discounted prices
- Show free options as $0
- Show BLACKFRIDAYWOW26 code stacking
- Cart/checkout shows both discounts

### Step 4: Deploy Vercel Preview
- Deploy to preview environment
- Generate shareable links for each brand's products
- Generate deals page link
- Customer-facing copy only (no internal notes)

### Step 5: Build Restoration (If Requested)
- Only after preview is approved
- Default to disabled/dry-run
- Separate from preview deployment
- Safe for Martin to review

---

## What I Did NOT Build (Per Your Feedback)

❌ Did NOT use fake fixtures  
❌ Did NOT invent product IDs  
❌ Did NOT guess prices  
❌ Did NOT create unusable test data  
❌ Did NOT stack on PR #270  
❌ Did NOT create production cron  
❌ Did NOT use wrong token name  
❌ Did NOT set production env flags

---

## Branch Status

**Current Branch:** `cursor/bfcm-real-products-d4ca`  
**Based On:** `main` (NOT stacked on PR #270)  
**Status:** Credential blocker, ready to proceed once unblocked

**Files:**
- `scripts/fetch-real-bfcm-products.mjs` - Real product fetch script
- `docs/promotions/bfcm-credentials-needed.md` - Credential requirements
- `docs/promotions/dol371-status-nov20.md` - This file

**Not Pushed Yet:** Waiting for credentials and real data before creating PR

---

## Questions for Martin

1. **Shopify Storefront Token:** Can you provide `SHOPIFY_STOREFRONT_ACCESS_TOKEN`?
   - Needed to fetch real products
   - Read-only, safe to share with agent
   - Can be added as Cursor Cloud Agent secret or passed directly

2. **Product Selection:** Should I fetch more than 3 per brand for you to choose from?

3. **Preview Scope:** Should preview show:
   - Only the sample products? OR
   - All eligible products with promo applied?

4. **Restoration:** Do you want automatic restoration built, or just:
   - Preview of promotional pricing
   - Manual revert instructions
   - Dry-run documentation

5. **Deploy Timing:** When do promos go live?
   - Need to know for testing preview before Black Friday

---

## Immediate Action Required

**Provide Shopify Storefront Access Token** to unblock:
```bash
# Option 1: Set as Cursor Cloud Agent secret
# (Go to Cursor Dashboard → Cloud Agents → Secrets)
SHOPIFY_STOREFRONT_ACCESS_TOKEN=xxxxx

# Option 2: Provide directly and I'll run script
# Option 3: Create .env.local with token
```

Once provided, I can:
1. Fetch real products (5 minutes)
2. Generate accurate dry-run table (immediate)
3. Build preview implementation (30 minutes)
4. Deploy to Vercel preview (10 minutes)
5. Provide shareable links for review

**Estimated time to preview:** 45 minutes after credentials provided
