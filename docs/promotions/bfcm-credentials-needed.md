# BFCM Implementation - Credentials Required

## Immediate Blocker

Cannot fetch real Shopify products without credentials.

## Required Environment Variables

### For Fetching Real Products

```bash
SHOPIFY_STOREFRONT_ACCESS_TOKEN=xxxxx
SHOPIFY_STORE_DOMAIN=tpaekn-rc.myshopify.com
```

**Purpose:** Fetch real product data (IDs, handles, current prices) from live store

**Scope:** Storefront API access (read-only, public)

**How to obtain:**
1. Shopify Admin → Apps → Develop apps
2. Create app or use existing storefront app
3. Configure Storefront API scopes: `unauthenticated_read_products`
4. Get Storefront Access Token

### For Applying Promotions (When Ready)

```bash
SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_xxxxx  # Note: ADMIN_ACCESS_TOKEN not ADMIN_API_TOKEN
SHOPIFY_STORE_DOMAIN=tpaekn-rc.myshopify.com
```

**Purpose:** Write promotional prices/options to Shopify

**Scopes:** `write_products`, `read_products`

**How to obtain:**
1. Shopify Admin → Apps → Develop apps
2. Create custom app for BFCM automation
3. Configure Admin API scopes: `write_products`, `read_products`
4. Install app and copy Admin Access Token

## What Can Be Done Now

✅ Implementation framework ready
✅ Fetch script ready to run once credentials available  
✅ Promotion logic implemented from PR #270 terms  
✅ Dry-run table generator ready

❌ Cannot fetch real products without credentials  
❌ Cannot generate real dry-run table  
❌ Cannot build preview with real products  
❌ Cannot verify against live Shopify data

## Next Steps

1. **Provide Shopify Storefront Access Token**
   - Set `SHOPIFY_STOREFRONT_ACCESS_TOKEN`
   - Set `SHOPIFY_STORE_DOMAIN`
   
2. **Run Fetch Script**
   ```bash
   SHOPIFY_STOREFRONT_ACCESS_TOKEN=xxx node scripts/fetch-real-bfcm-products.mjs
   ```
   
3. **Review Real Products**
   - Outputs dry-run table with real IDs and prices
   - Saves to `data/bfcm-real-products.json`
   
4. **Build Preview**
   - Use real product data
   - Deploy to Vercel preview
   - Generate shareable links

## Where to Set

**Option 1: Cursor Cloud Agent Secrets**
- Add as secret in Cursor dashboard
- Available in this agent environment

**Option 2: Environment Variable**
- Pass directly when running script:
  ```bash
  SHOPIFY_STOREFRONT_ACCESS_TOKEN=xxx node scripts/fetch-real-bfcm-products.mjs
  ```

**Option 3: .env.local**
- Create `.env.local` in repo root (gitignored)
- Add credentials there
- Script will load automatically
