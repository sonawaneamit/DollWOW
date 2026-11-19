import 'server-only';
import { createHash } from 'node:crypto';

/**
 * Shopify Admin API adapter for BFCM restoration mutations.
 * Handles variant price updates and metafield updates with readback verification.
 * 
 * Required Environment Variables:
 * - SHOPIFY_ADMIN_API_TOKEN: Admin API access token with write_products scope
 * - SHOPIFY_STORE_DOMAIN: Store domain (e.g., "store-name.myshopify.com")
 * - BFCM_RESTORE_ENABLED: Must be "true" to enable actual mutations (defaults to dry-run)
 */

export type ShopifyVariantPrice = {
  variantId: string;
  price: string;
  compareAtPrice?: string | null;
};

export type ShopifyMetafieldUpdate = {
  productId: string;
  namespace: string;
  key: string;
  value: string;
  type: string;
};

export type MutationResult = {
  success: boolean;
  id: string;
  error?: string;
  dryRun?: boolean;
};

export type ReadbackResult = {
  matches: boolean;
  id: string;
  expected: unknown;
  actual: unknown;
  error?: string;
};

const SHOPIFY_API_VERSION = '2024-10';

function getShopifyConfig() {
  const token = process.env.SHOPIFY_ADMIN_API_TOKEN;
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const enabled = process.env.BFCM_RESTORE_ENABLED === 'true';
  
  if (!token || !domain) {
    throw new Error('Shopify credentials not configured. Set SHOPIFY_ADMIN_API_TOKEN and SHOPIFY_STORE_DOMAIN');
  }
  
  return { token, domain, enabled };
}

function shopifyAdminUrl(endpoint: string) {
  const { domain } = getShopifyConfig();
  return `https://${domain}/admin/api/${SHOPIFY_API_VERSION}${endpoint}`;
}

async function shopifyRequest(endpoint: string, options: RequestInit = {}) {
  const { token } = getShopifyConfig();
  
  const response = await fetch(shopifyAdminUrl(endpoint), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': token,
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Shopify API error: ${response.status} ${response.statusText} - ${text}`);
  }
  
  return response.json();
}

/**
 * Update variant prices via Shopify Admin REST API
 */
export async function updateVariantPrices(
  updates: ShopifyVariantPrice[],
  dryRun = true
): Promise<MutationResult[]> {
  const { enabled } = getShopifyConfig();
  const actualDryRun = dryRun || !enabled;
  
  const results: MutationResult[] = [];
  
  for (const update of updates) {
    try {
      if (actualDryRun) {
        // Dry run: just validate and return success
        results.push({
          success: true,
          id: update.variantId,
          dryRun: true,
        });
        continue;
      }
      
      // Extract numeric ID from GID
      const variantId = update.variantId.split('/').pop();
      
      // Update variant via REST API
      await shopifyRequest(`/variants/${variantId}.json`, {
        method: 'PUT',
        body: JSON.stringify({
          variant: {
            id: variantId,
            price: update.price,
            compare_at_price: update.compareAtPrice,
          },
        }),
      });
      
      results.push({
        success: true,
        id: update.variantId,
      });
    } catch (error) {
      results.push({
        success: false,
        id: update.variantId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
  
  return results;
}

/**
 * Update product metafields via Shopify Admin REST API
 */
export async function updateMetafields(
  updates: ShopifyMetafieldUpdate[],
  dryRun = true
): Promise<MutationResult[]> {
  const { enabled } = getShopifyConfig();
  const actualDryRun = dryRun || !enabled;
  
  const results: MutationResult[] = [];
  
  for (const update of updates) {
    try {
      if (actualDryRun) {
        // Dry run: just validate and return success
        results.push({
          success: true,
          id: update.productId,
          dryRun: true,
        });
        continue;
      }
      
      // Extract numeric ID from GID
      const productId = update.productId.split('/').pop();
      
      // Update metafield via REST API
      await shopifyRequest(`/products/${productId}/metafields.json`, {
        method: 'POST',
        body: JSON.stringify({
          metafield: {
            namespace: update.namespace,
            key: update.key,
            value: update.value,
            type: update.type,
          },
        }),
      });
      
      results.push({
        success: true,
        id: update.productId,
      });
    } catch (error) {
      results.push({
        success: false,
        id: update.productId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
  
  return results;
}

/**
 * Verify variant price after mutation
 */
export async function verifyVariantPrice(
  variantId: string,
  expectedPrice: string,
  expectedCompareAt?: string | null
): Promise<ReadbackResult> {
  try {
    const numericId = variantId.split('/').pop();
    const response = await shopifyRequest(`/variants/${numericId}.json`);
    const variant = response.variant;
    
    const actualPrice = String(variant.price);
    const actualCompareAt = variant.compare_at_price ? String(variant.compare_at_price) : null;
    
    const priceMatches = actualPrice === expectedPrice;
    const compareAtMatches = expectedCompareAt === undefined || actualCompareAt === expectedCompareAt;
    
    return {
      matches: priceMatches && compareAtMatches,
      id: variantId,
      expected: { price: expectedPrice, compareAtPrice: expectedCompareAt },
      actual: { price: actualPrice, compareAtPrice: actualCompareAt },
    };
  } catch (error) {
    return {
      matches: false,
      id: variantId,
      expected: { price: expectedPrice },
      actual: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Verify metafield after mutation
 */
export async function verifyMetafield(
  productId: string,
  namespace: string,
  key: string,
  expectedValue: string
): Promise<ReadbackResult> {
  try {
    const numericId = productId.split('/').pop();
    const response = await shopifyRequest(
      `/products/${numericId}/metafields.json?namespace=${namespace}&key=${key}`
    );
    
    const metafields = response.metafields || [];
    const metafield = metafields.find(
      (m: any) => m.namespace === namespace && m.key === key
    );
    
    if (!metafield) {
      return {
        matches: false,
        id: productId,
        expected: expectedValue,
        actual: null,
        error: 'Metafield not found',
      };
    }
    
    const actualValue = String(metafield.value);
    const matches = actualValue === expectedValue;
    
    return {
      matches,
      id: productId,
      expected: expectedValue,
      actual: actualValue,
    };
  } catch (error) {
    return {
      matches: false,
      id: productId,
      expected: expectedValue,
      actual: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Batch verify multiple variant prices
 */
export async function batchVerifyPrices(
  variants: Array<{ variantId: string; expectedPrice: string; expectedCompareAt?: string | null }>
): Promise<ReadbackResult[]> {
  const results: ReadbackResult[] = [];
  
  for (const { variantId, expectedPrice, expectedCompareAt } of variants) {
    const result = await verifyVariantPrice(variantId, expectedPrice, expectedCompareAt);
    results.push(result);
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
}

/**
 * Generate restoration journal entry
 */
export function createRestorationEntry(
  id: string,
  original: unknown,
  promotional: unknown,
  restoreAt: string
) {
  return {
    id,
    original,
    promotional,
    restoreAt,
    capturedAt: new Date().toISOString(),
    checksum: createHash('sha256')
      .update(JSON.stringify({ id, original, promotional, restoreAt }))
      .digest('hex'),
  };
}

/**
 * Validate restoration entry integrity
 */
export function validateRestorationEntry(entry: any): boolean {
  if (!entry.id || !entry.restoreAt || !entry.checksum) return false;
  
  const expectedChecksum = createHash('sha256')
    .update(JSON.stringify({ 
      id: entry.id, 
      original: entry.original, 
      promotional: entry.promotional, 
      restoreAt: entry.restoreAt 
    }))
    .digest('hex');
  
  return entry.checksum === expectedChecksum;
}
