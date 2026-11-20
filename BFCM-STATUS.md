# BFCM Implementation Status - BLOCKER

## Critical: Shopify Credentials Required

**Cannot proceed without:** `SHOPIFY_STOREFRONT_ACCESS_TOKEN`

---

## What's Built (Ready to Use) ✅

### 1. BFCM Brand Preview Logic
**File:** `lib/promotions/bfcmBrandPreview.ts`

Complete implementation of all confirmed promo terms:
- Top Fire: $150 off + free second head (full silicone)
- Galatea: 3 free upgrades (body heating, vaginal suction, oral heating)
- Climax: 10% off large dolls (≥$900) + free extras
- 6YE: 5% off + free extra head on large dolls (≥135cm)
- IDO: $2,599/$2,499 + free wig/pad (ends Nov 30)
- BLACKFRIDAYWOW26: $299 off ≥$900 (stacks)

### 2. Real Product Fetch Script
**File:** `scripts/fetch-real-bfcm-products.mjs`

Ready to query live Shopify and select 3 products per brand:
```bash
SHOPIFY_STOREFRONT_ACCESS_TOKEN=xxx node scripts/fetch-real-bfcm-products.mjs
```

Outputs:
- Real Product IDs (gid://shopify/Product/...)
- Real Variant IDs (gid://shopify/ProductVariant/...)
- Current live prices
- Calculated promo prices
- Dry-run table for review
- JSON file: `data/bfcm-real-products.json`

### 3. Correct Revert Schedule
- Top Fire, Galatea, Climax, 6YE: **Dec 11, 2026 04:59 UTC** (Dec 10 11:59 PM Eastern)
- IDO: **Dec 1, 2026 00:00 UTC** (end of Nov 30)

---

## What's Blocked ❌

Cannot do these without credentials:

1. Fetch real product IDs from Shopify
2. Get current live prices
3. Generate accurate dry-run table
4. Build preview deployment with real products
5. Create shareable preview links
6. Verify promo logic against real data

---

## How to Unblock

### Option 1: Provide Token Directly
```bash
SHOPIFY_STOREFRONT_ACCESS_TOKEN=xxxxx node scripts/fetch-real-bfcm-products.mjs
```

### Option 2: Add to Cursor Cloud Agent Secrets
1. Go to Cursor Dashboard → Cloud Agents → Secrets
2. Add: `SHOPIFY_STOREFRONT_ACCESS_TOKEN`
3. I'll fetch automatically

### Option 3: Create .env.local
```bash
# /agent/repos/DollWOW/.env.local
SHOPIFY_STOREFRONT_ACCESS_TOKEN=xxxxx
SHOPIFY_STORE_DOMAIN=tpaekn-rc.myshopify.com
```

---

## Token Requirements

**Name:** `SHOPIFY_STOREFRONT_ACCESS_TOKEN`  
**Scope:** `unauthenticated_read_products` (Storefront API)  
**Purpose:** Read-only product queries  
**Safe:** Yes, public storefront access only

**How to get it:**
1. Shopify Admin → Apps → Develop apps
2. Create or use existing storefront app
3. Copy Storefront Access Token
4. Provide to agent

---

## Timeline (Once Unblocked)

1. **Fetch products** - 5 minutes
   - Query 50 products per brand
   - Filter by eligibility
   - Select 3 per brand
   - Save to JSON

2. **Generate dry-run table** - Immediate
   - Show real IDs and prices
   - Martin reviews selection

3. **Build preview** - 30 minutes
   - Apply promo logic to selected products
   - Show discounted prices
   - Show free options
   - Show BLACKFRIDAYWOW26 stacking

4. **Deploy to Vercel** - 10 minutes
   - Preview environment only
   - DOL371_BRAND_PREVIEW=1
   - Generate shareable links

**Total:** ~45 minutes after credentials provided

---

## PR Status

**Branch:** `cursor/bfcm-real-products-d4ca`  
**Based on:** `main` (NOT stacked on PR #270)  
**Status:** Credential blocker

**Files ready:**
- ✅ `lib/promotions/bfcmBrandPreview.ts` - Preview logic
- ✅ `scripts/fetch-real-bfcm-products.mjs` - Product fetch
- ✅ `docs/promotions/bfcm-credentials-needed.md` - Credentials guide
- ✅ `docs/promotions/dol371-status-nov20.md` - Full status

**Not created yet:**
- ❌ PR (waiting for real product data)
- ❌ Preview deployment (waiting for real products)
- ❌ Dry-run table (waiting for real products)

---

## What I Fixed from PR #277

✅ Using real products (once credentials provided)  
✅ Not using fake fixtures  
✅ Not inventing product IDs  
✅ Not guessing prices  
✅ Correct revert schedule (IDO Dec 1, others Dec 11)  
✅ Not stacked on PR #270  
✅ No production cron  
✅ Preview environment only  
✅ Safe for review

---

## Next Action Required

**Provide `SHOPIFY_STOREFRONT_ACCESS_TOKEN`**

Then I will:
1. Fetch 3-5 real products per brand
2. Show you the dry-run table with real IDs and prices
3. Build preview deployment
4. Give you shareable links to review

**Waiting for your input to proceed.**
