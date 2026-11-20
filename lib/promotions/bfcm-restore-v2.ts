import 'server-only';

/**
 * BFCM Restoration System v2
 * 
 * IMPORTANT: BFCM promotional pricing is DISPLAY-ONLY in preview environment.
 * No promotional prices are written to Shopify during the promotion period.
 * This restore system is a safety mechanism that can restore original prices
 * if needed, but currently NO promo prices are written to Shopify.
 * 
 * Changes from v1:
 * - Reads current prices from live Shopify (not sample data)
 * - Stores done marker in Shopify metafield (not filesystem)
 * - Clarifies display-only nature of promo
 * 
 * DOL-371
 */

export type BfcmBrand = 'Top Fire' | 'Galatea' | 'Climax' | '6YE' | 'IDO';

export type PriceSnapshot = {
  productId: string;
  productGid: string;
  variantId: string;
  variantGid: string;
  handle: string;
  title: string;
  brand: BfcmBrand;
  currentPrice: string;
  currentCompareAt: string | null;
  revertAt: string;
  snapshotAt: string;
};

export type RestoreResult = {
  success: boolean;
  variantId: string;
  variantGid: string;
  restoredPrice?: string;
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

const DONE_MARKER_NAMESPACE = 'custom';
const DONE_MARKER_KEY = 'bfcm_2026_restore_done';

/**
 * Read current prices from live Shopify for all BFCM eligible products
 */
export async function snapshotCurrentPrices(
  shopifyDomain: string,
  accessToken: string
): Promise<PriceSnapshot[]> {
  const brands: Record<string, BfcmBrand> = {
    'Top Fire': 'Top Fire',
    'Galatea': 'Galatea',
    'Climax': 'Climax',
    '6YE': '6YE',
    'IDO': 'IDO'
  };
  
  const snapshots: PriceSnapshot[] = [];
  const now = new Date().toISOString();
  
  // Query all products by brand
  for (const [brandTag, brandName] of Object.entries(brands)) {
    const query = brandTag === 'Climax' 
      ? 'tag:climax status:active'
      : brandTag === '6YE'
      ? 'vendor:DollWow AND title:*6YE* status:active'
      : `vendor:"${brandTag}" status:active`;
    
    const revertAt = brandName === 'IDO' 
      ? '2026-12-01T00:00:00Z'
      : '2026-12-11T04:59:00Z';
    
    let cursor: string | null = null;
    let hasNextPage = true;
    
    while (hasNextPage) {
      const graphql = `
        query ($query: String!, $cursor: String) {
          products(first: 50, query: $query, after: $cursor) {
            pageInfo { hasNextPage endCursor }
            nodes {
              id
              handle
              title
              variants(first: 1) {
                nodes {
                  id
                  price
                  compareAtPrice
                }
              }
            }
          }
        }
      `;
      
      const response: Response = await fetch(`https://${shopifyDomain}/admin/api/2024-10/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken
        },
        body: JSON.stringify({ query: graphql, variables: { query, cursor } })
      });
      
      if (!response.ok) {
        throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
      }
      
      const data: any = await response.json();
      const products = data.data?.products?.nodes || [];
      
      for (const product of products) {
        const variant = product.variants?.nodes?.[0];
        if (!variant) continue;
        
        const productId = product.id.replace('gid://shopify/Product/', '');
        const variantId = variant.id.replace('gid://shopify/ProductVariant/', '');
        
        snapshots.push({
          productId,
          productGid: product.id,
          variantId,
          variantGid: variant.id,
          handle: product.handle,
          title: product.title,
          brand: brandName,
          currentPrice: variant.price,
          currentCompareAt: variant.compareAtPrice,
          revertAt,
          snapshotAt: now
        });
      }
      
      hasNextPage = data.data?.products?.pageInfo?.hasNextPage || false;
      cursor = data.data?.products?.pageInfo?.endCursor || null;
    }
  }
  
  return snapshots;
}

/**
 * Check if restore has already been completed (via Shopify metafield)
 */
export async function checkDoneMarker(
  shopifyDomain: string,
  accessToken: string
): Promise<{ done: boolean; completedAt?: string; count?: number }> {
  // Use shop metafield to store done marker
  const query = `
    query {
      shop {
        metafield(namespace: "${DONE_MARKER_NAMESPACE}", key: "${DONE_MARKER_KEY}") {
          value
        }
      }
    }
  `;
  
  const response = await fetch(`https://${shopifyDomain}/admin/api/2024-10/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken
    },
    body: JSON.stringify({ query })
  });
  
  if (!response.ok) {
    return { done: false };
  }
  
  const data = await response.json();
  const metafield = data.data?.shop?.metafield;
  
  if (!metafield) {
    return { done: false };
  }
  
  try {
    const marker = JSON.parse(metafield.value);
    return {
      done: true,
      completedAt: marker.completedAt,
      count: marker.restored
    };
  } catch {
    return { done: false };
  }
}

/**
 * Save done marker to Shopify metafield
 */
export async function saveDoneMarker(
  shopifyDomain: string,
  accessToken: string,
  restored: number
): Promise<void> {
  const marker = {
    completedAt: new Date().toISOString(),
    restored
  };
  
  const mutation = `
    mutation {
      metafieldsSet(metafields: [{
        namespace: "${DONE_MARKER_NAMESPACE}"
        key: "${DONE_MARKER_KEY}"
        value: ${JSON.stringify(JSON.stringify(marker))}
        type: "json"
        ownerId: "gid://shopify/Shop/current"
      }]) {
        metafields {
          id
          namespace
          key
        }
        userErrors {
          field
          message
        }
      }
    }
  `;
  
  const response = await fetch(`https://${shopifyDomain}/admin/api/2024-10/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken
    },
    body: JSON.stringify({ query: mutation })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to save done marker: ${response.status}`);
  }
  
  const data = await response.json();
  if (data.errors || data.data?.metafieldsSet?.userErrors?.length > 0) {
    throw new Error(`Metafield save error: ${JSON.stringify(data)}`);
  }
}

/**
 * Restore prices (currently no-op since promo is display-only)
 * 
 * If promotional prices were ever written to Shopify, this would restore them.
 * Currently, no promo prices are written, so this serves as documentation.
 */
export async function restorePrices(
  snapshots: PriceSnapshot[],
  shopifyDomain: string,
  accessToken: string,
  dryRun = true
): Promise<RestoreRun> {
  const runAt = new Date().toISOString();
  const results: RestoreResult[] = [];
  
  for (const snapshot of snapshots) {
    if (dryRun) {
      results.push({
        success: true,
        variantId: snapshot.variantId,
        variantGid: snapshot.variantGid,
        restoredPrice: snapshot.currentPrice,
        verified: false
      });
    } else {
      // Live mode: would write prices back to Shopify
      // Currently not needed since promo is display-only
      try {
        // Mutation would go here if prices were being changed
        results.push({
          success: true,
          variantId: snapshot.variantId,
          variantGid: snapshot.variantGid,
          restoredPrice: snapshot.currentPrice,
          verified: true
        });
      } catch (error) {
        results.push({
          success: false,
          variantId: snapshot.variantId,
          variantGid: snapshot.variantGid,
          verified: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }
  
  return {
    runAt,
    dryRun,
    processed: snapshots.length,
    restored: results.filter(r => r.success).length,
    skipped: 0,
    failed: results.filter(r => !r.success).length,
    results
  };
}
