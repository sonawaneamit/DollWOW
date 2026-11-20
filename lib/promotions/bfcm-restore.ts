import 'server-only';

/**
 * BFCM Restoration System
 * 
 * IMPORTANT: BFCM promotional pricing is DISPLAY-ONLY in preview environment.
 * No promotional prices are written to Shopify during the promotion period.
 * This restore system is a safety mechanism in case prices were ever written.
 * 
 * Current implementation: Prices remain unchanged in Shopify. Promotional display
 * happens only in preview environment via DOL371_BRAND_PREVIEW=1.
 * 
 * Disabled by default. Requires SHOPIFY_ADMIN_ACCESS_TOKEN with write_products scope.
 * 
 * DOL-371
 */

export type PriceSnapshot = {
  productId: string;
  variantId: string;
  handle: string;
  title: string;
  brand: string;
  originalPrice: string;
  originalCompareAt: string | null;
  promoPrice: string;
  promoCompareAt: string | null;
  revertAt: string;
  snapshotAt: string;
};

export type RestoreResult = {
  success: boolean;
  variantId: string;
  oldPrice: string;
  newPrice: string;
  oldCompareAt: string | null;
  newCompareAt: string | null;
  verified: boolean;
  error?: string;
};

export type RestoreRun = {
  runAt: string;
  dryRun: boolean;
  processed: number;
  restored: number;
  skipped: number;
  failed: number;
  results: RestoreResult[];
};

/**
 * Snapshot current prices before applying promo
 */
export async function snapshotPrices(products: Array<{
  productId: string;
  variantId: string;
  handle: string;
  title: string;
  brand: string;
  currentPrice: string;
  currentCompareAt: string | null;
  promoPrice: string;
  promoCompareAt: string | null;
  revertAt: string;
}>): Promise<PriceSnapshot[]> {
  const now = new Date().toISOString();
  
  return products.map(p => ({
    productId: p.productId,
    variantId: p.variantId,
    handle: p.handle,
    title: p.title,
    brand: p.brand,
    originalPrice: p.currentPrice,
    originalCompareAt: p.currentCompareAt,
    promoPrice: p.promoPrice,
    promoCompareAt: p.promoCompareAt,
    revertAt: p.revertAt,
    snapshotAt: now,
  }));
}

/**
 * Restore prices via Shopify Admin API
 */
export async function restorePrices(
  snapshots: PriceSnapshot[],
  dryRun = true
): Promise<RestoreRun> {
  const runAt = new Date().toISOString();
  const results: RestoreResult[] = [];
  
  const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  
  if (!token || !domain) {
    throw new Error('SHOPIFY_ADMIN_ACCESS_TOKEN and SHOPIFY_STORE_DOMAIN required');
  }
  
  let restored = 0;
  let skipped = 0;
  let failed = 0;
  
  for (const snapshot of snapshots) {
    try {
      // Check if already restored (read current price)
      const currentPrice = await readVariantPrice(token, domain, snapshot.variantId);
      
      if (currentPrice === snapshot.originalPrice) {
        skipped++;
        results.push({
          success: true,
          variantId: snapshot.variantId,
          oldPrice: currentPrice,
          newPrice: snapshot.originalPrice,
          oldCompareAt: null,
          newCompareAt: snapshot.originalCompareAt,
          verified: true,
        });
        continue;
      }
      
      if (dryRun) {
        results.push({
          success: true,
          variantId: snapshot.variantId,
          oldPrice: snapshot.promoPrice,
          newPrice: snapshot.originalPrice,
          oldCompareAt: snapshot.promoCompareAt,
          newCompareAt: snapshot.originalCompareAt,
          verified: false,
        });
        restored++;
        continue;
      }
      
      // Write new price
      await writeVariantPrice(token, domain, snapshot.variantId, {
        price: snapshot.originalPrice,
        compare_at_price: snapshot.originalCompareAt,
      });
      
      // Readback verify
      const verifiedPrice = await readVariantPrice(token, domain, snapshot.variantId);
      const verified = verifiedPrice === snapshot.originalPrice;
      
      if (verified) {
        restored++;
      } else {
        failed++;
      }
      
      results.push({
        success: verified,
        variantId: snapshot.variantId,
        oldPrice: snapshot.promoPrice,
        newPrice: snapshot.originalPrice,
        oldCompareAt: snapshot.promoCompareAt,
        newCompareAt: snapshot.originalCompareAt,
        verified,
      });
    } catch (error) {
      failed++;
      results.push({
        success: false,
        variantId: snapshot.variantId,
        oldPrice: snapshot.promoPrice,
        newPrice: snapshot.originalPrice,
        oldCompareAt: snapshot.promoCompareAt,
        newCompareAt: snapshot.originalCompareAt,
        verified: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
  
  return {
    runAt,
    dryRun,
    processed: snapshots.length,
    restored,
    skipped,
    failed,
    results,
  };
}

async function readVariantPrice(token: string, domain: string, variantId: string): Promise<string> {
  const numericId = variantId.split('/').pop() || variantId;
  
  const response = await fetch(
    `https://${domain}/admin/api/2024-10/variants/${numericId}.json`,
    {
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json',
      },
    }
  );
  
  if (!response.ok) {
    throw new Error(`Failed to read variant ${variantId}: ${response.status}`);
  }
  
  const data = await response.json();
  return String(data.variant.price);
}

async function writeVariantPrice(
  token: string,
  domain: string,
  variantId: string,
  update: { price: string; compare_at_price: string | null }
): Promise<void> {
  const numericId = variantId.split('/').pop() || variantId;
  
  const response = await fetch(
    `https://${domain}/admin/api/2024-10/variants/${numericId}.json`,
    {
      method: 'PUT',
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        variant: {
          id: numericId,
          price: update.price,
          compare_at_price: update.compare_at_price,
        },
      }),
    }
  );
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to update variant ${variantId}: ${response.status} - ${text}`);
  }
}
