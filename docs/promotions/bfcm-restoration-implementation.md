# BFCM Restoration Automation - Implementation Guide

## Overview

Automatic restoration system for BFCM brand promotions (DOL-371).
Restores promotional prices and options to original values at scheduled deadlines.

**Status:** Implementation Complete, Dry-Run Tested ✅  
**Production:** Disabled by default (requires explicit env flag)

## Components

### 1. Shopify Mutation Adapter
**File:** `lib/promotions/shopify-adapter.ts`

Handles Shopify Admin API mutations and readback verification:
- Update variant prices
- Update product metafields (customization options)
- Verify price changes
- Verify metafield changes
- Batch operations with rate limiting

### 2. Restoration Decision Logic
**File:** `lib/promotions/restoration-decision.ts`

Implements safe restoration decision algorithm:
- `WAIT`: Deadline not reached yet
- `ALREADY_RESTORED`: Value already matches original
- `CONFLICT`: Manual edit detected, preserve current value
- `RESTORE`: Safe to restore to original value

### 3. Restoration Executor
**File:** `lib/promotions/restoration-executor.ts`

Orchestrates restoration execution:
- Loads restoration journal
- Processes entries based on decisions
- Executes Shopify mutations
- Verifies all changes via readback
- Logs results and conflicts
- Generates dry-run reports

### 4. Cron API Route
**File:** `app/api/cron/bfcm-restore/route.ts`

Protected API endpoint for scheduled execution:
- Verifies cron secret
- Loads restoration journal
- Executes restoration
- Saves completion markers
- Returns detailed results

### 5. Vercel Cron Configuration
**File:** `vercel.json`

Schedules automatic restoration:
```json
{
  "crons": [
    {
      "path": "/api/cron/bfcm-restore",
      "schedule": "59 4 1,11 12 *"
    }
  ]
}
```

Runs at:
- December 1, 2026 at 04:59 UTC (for IDO - adjust timezone if needed)
- December 11, 2026 at 04:59 UTC (for Top Fire, Galatea, Climax, 6YE)

## Required Environment Variables

### Shopify API Credentials

**SHOPIFY_ADMIN_API_TOKEN**
- **Required:** Yes
- **Scope:** `write_products`, `read_products`
- **Source:** Shopify Admin → Apps → Develop apps → Create custom app
- **Description:** Admin API access token with product write permissions
- **Example:** `shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

**SHOPIFY_STORE_DOMAIN**
- **Required:** Yes
- **Format:** `store-name.myshopify.com`
- **Description:** Your Shopify store domain
- **Example:** `tpaekn-rc.myshopify.com`

### Restoration Control

**BFCM_RESTORE_ENABLED**
- **Required:** No (defaults to `false`)
- **Values:** `true` | `false`
- **Description:** Master switch for restoration mutations
- **Default:** `false` (dry-run mode)
- **⚠️ CRITICAL:** Must be explicitly set to `true` to enable actual Shopify mutations

**CRON_SECRET**
- **Required:** Yes (for API route protection)
- **Description:** Secret token for authenticating cron requests
- **How to set:** Generate random string: `openssl rand -hex 32`
- **Vercel:** Automatically provided by Vercel Cron
- **Example:** `abc123...xyz789`

### Optional Environment Variables

**DOL371_BRAND_PREVIEW**
- **Required:** No
- **Values:** `1` | `0`
- **Description:** Enable BFCM preview mode (PR #270 functionality)
- **Default:** `0`

## Restoration Deadlines

| Brand      | Deadline (UTC)       | Timezone Note                |
|------------|----------------------|------------------------------|
| Top Fire   | 2026-12-11T04:59:00Z | Dec 10, 11:59 PM US Eastern  |
| Galatea    | 2026-12-11T04:59:00Z | Dec 10, 11:59 PM US Eastern  |
| Climax     | 2026-12-11T04:59:00Z | Dec 10, 11:59 PM US Eastern  |
| 6YE        | 2026-12-11T04:59:00Z | Dec 10, 11:59 PM US Eastern  |
| IDO        | 2026-12-01T00:00:00Z | Nov 30, midnight Lisbon time |

## How It Works

### 1. Promotion Activation (Not Implemented Yet)

During BFCM activation, the system would:
1. Capture current (original) prices and options
2. Apply promotional prices and included options
3. Create restoration journal entries
4. Store journal in persistent storage (Vercel KV, Supabase, etc.)

**Restoration Journal Entry:**
```json
{
  "id": "gid://shopify/ProductVariant/12345",
  "type": "variant_price",
  "productHandle": "product-handle",
  "productTitle": "Product Title",
  "restoreAt": "2026-12-11T04:59:00Z",
  "original": {
    "price": "2799.00",
    "compareAtPrice": null
  },
  "promotional": {
    "price": "2649.00",
    "compareAtPrice": "2799.00"
  },
  "capturedAt": "2026-11-15T00:00:00Z"
}
```

### 2. Scheduled Restoration

Vercel Cron triggers `/api/cron/bfcm-restore` at deadline:

1. **Load Journal:** Fetch restoration journal from storage
2. **Process Entries:** For each entry:
   - Fetch current Shopify value
   - Run restoration decision algorithm
   - Queue mutations if action is `RESTORE`
3. **Execute Mutations:** Batch update prices and metafields
4. **Verify Changes:** Readback verify all mutations
5. **Log Results:** Record restored count, conflicts, failures
6. **Save Markers:** Store completion timestamp

### 3. Conflict Detection

If a product was manually edited after promotion started:
- Decision: `CONFLICT`
- Action: Preserve current value, DO NOT overwrite
- Log: Record conflict for manual review
- Reason: "Value changed after activation; preserve current edit"

### 4. Idempotency

Safe to run multiple times:
- Already restored? Skip with `ALREADY_RESTORED`
- Completion markers prevent duplicate processing
- Readback verification catches partial failures
- Retry logic for transient errors

## Dry-Run Mode

**Default Behavior:** Dry-run (no mutations)

Dry-run mode when:
- `BFCM_RESTORE_ENABLED` is unset
- `BFCM_RESTORE_ENABLED=false`
- Missing Shopify credentials

### Testing Dry-Run

**Automated Test:**
```bash
npm run test:bfcm-restore-dry-run
```

**Manual Script:**
```bash
npx tsx scripts/promotions/dry-run-restoration.mjs
```

**Output:**
- Shows restoration decisions for sample SKUs
- Lists what WOULD be restored (no actual changes)
- Displays original vs. promotional prices
- Indicates which entries need restoration

**Sample Output:**
```
### Top Fire Venus 170cm E-Cup Silicone Doll
Handle: top-fire-doll-venus-170cm-e-cup-silicone-companion-doll
Deadline: 2026-12-11T04:59:00Z

**variant_price** (gid://shopify/ProductVariant/54901234567890)
- Action: RESTORE
- Original price: $2799.00
- Promotional price: $2649.00
- ✅ Would restore to: $2799.00
```

## Production Activation Checklist

Before enabling restoration in production:

### 1. Shopify Configuration
- [ ] Create Shopify custom app with Admin API access
- [ ] Grant `write_products` and `read_products` scopes
- [ ] Copy Admin API access token
- [ ] Set `SHOPIFY_ADMIN_API_TOKEN` in Vercel environment
- [ ] Set `SHOPIFY_STORE_DOMAIN` in Vercel environment

### 2. Cron Security
- [ ] Verify `CRON_SECRET` is set by Vercel
- [ ] Test API route authentication
- [ ] Confirm cron schedule is correct

### 3. Restoration Journal
- [ ] Implement journal capture during promotion activation
- [ ] Store journal in Vercel KV or Supabase
- [ ] Update `loadRestorationJournal()` in API route
- [ ] Implement `saveCompletionMarker()` in API route

### 4. Testing
- [ ] Test against Shopify development store
- [ ] Verify price updates work
- [ ] Verify metafield updates work
- [ ] Test readback verification
- [ ] Test conflict detection
- [ ] Run dry-run on production data

### 5. Monitoring
- [ ] Set up log monitoring (Vercel logs, Datadog, etc.)
- [ ] Configure alerts for restoration failures
- [ ] Monitor cron execution
- [ ] Track completion markers

### 6. Enable Production
- [ ] Set `BFCM_RESTORE_ENABLED=true` in Vercel
- [ ] Deploy updated configuration
- [ ] Verify cron job is scheduled
- [ ] Monitor first execution

## Manual Trigger

Test or manually trigger restoration:

```bash
# Requires valid CRON_SECRET
curl -X POST https://your-domain.com/api/cron/bfcm-restore \
  -H "Authorization: Bearer $CRON_SECRET"
```

## Monitoring

### Successful Restoration
```json
{
  "success": true,
  "timestamp": "2026-12-11T05:00:00.000Z",
  "dryRun": false,
  "result": {
    "processed": 100,
    "restored": 95,
    "skipped": 3,
    "conflicts": 2,
    "failures": 0
  }
}
```

### Conflict Example
```json
{
  "id": "gid://shopify/ProductVariant/12345",
  "action": "CONFLICT",
  "reason": "Value changed after activation; preserve current edit"
}
```

### Failure Example
```json
{
  "id": "gid://shopify/ProductVariant/12345",
  "action": "FAILED",
  "reason": "Shopify API error: 429 Too Many Requests",
  "verified": false
}
```

## File Structure

```
lib/promotions/
├── shopify-adapter.ts          # Shopify API mutations + readback
├── restoration-decision.ts     # Decision algorithm
├── restoration-executor.ts     # Execution orchestration
└── bfcmBrandPreview.ts        # Existing preview logic (PR #270)

app/api/cron/
└── bfcm-restore/
    └── route.ts               # Protected cron endpoint

scripts/promotions/
├── plan-restoration.mjs       # Existing read-only planner (PR #270)
└── dry-run-restoration.mjs    # Dry-run demo script

tests/fixtures/
└── bfcm-restoration-journal.json  # Sample journal for testing

vercel.json                    # Cron schedule configuration
```

## Security

### API Route Protection
- Requires `Authorization: Bearer $CRON_SECRET` header
- Vercel Cron automatically provides correct secret
- Manual triggers must supply valid secret
- Returns 401 Unauthorized for invalid/missing secret

### Dry-Run by Default
- Defaults to dry-run even if endpoint is accessed
- Requires explicit `BFCM_RESTORE_ENABLED=true`
- Logs all operations
- Safe to test in production

### Conflict Preservation
- Never overwrites manual edits
- Logs all conflicts for review
- Preserves current value if detected
- Allows manual intervention

## Troubleshooting

### "Shopify Storefront API is not configured"
**Cause:** Missing or invalid Shopify credentials  
**Fix:** Set `SHOPIFY_ADMIN_API_TOKEN` and `SHOPIFY_STORE_DOMAIN`

### "Unauthorized" on cron endpoint
**Cause:** Missing or invalid CRON_SECRET  
**Fix:** Verify Vercel Cron is configured, or provide valid secret for manual trigger

### "No entries due for restoration"
**Cause:** Cron ran before deadline or journal is empty  
**Fix:** Check deadline times, verify journal is populated

### Readback verification failed
**Cause:** Shopify mutation succeeded but readback doesn't match  
**Fix:** Check for rate limiting, retry with exponential backoff

### Restoration journal not loading
**Cause:** Persistent storage not implemented  
**Fix:** Implement `loadRestorationJournal()` to fetch from Vercel KV or Supabase

## Next Steps

1. **Implement Journal Storage**
   - Choose storage (Vercel KV recommended)
   - Implement `loadRestorationJournal()` in API route
   - Implement `saveCompletionMarker()` in API route

2. **Implement Promotion Activation**
   - Capture original values before applying promotion
   - Apply promotional prices and options
   - Create restoration journal entries
   - Store journal in persistent storage

3. **Testing**
   - Test against Shopify development store
   - Verify all restoration scenarios
   - Test dry-run mode thoroughly

4. **Production Configuration**
   - Set all required environment variables
   - Enable `BFCM_RESTORE_ENABLED=true`
   - Monitor first scheduled execution

## Related

- PR #270: BFCM brand preview (contains read-only planner)
- DOL-371: BFCM brand promotions ticket
- `lib/promotions/bfcmBrandPreview.ts`: Preview logic
- `scripts/promotions/plan-restoration.mjs`: Read-only decision planner
