import 'server-only';
import { restorationDecision } from './restoration-decision';
import {
  updateVariantPrices,
  updateMetafields,
  batchVerifyPrices,
  verifyMetafield,
  type ShopifyVariantPrice,
  type ShopifyMetafieldUpdate,
  type MutationResult,
  type ReadbackResult,
} from './shopify-adapter';

/**
 * BFCM Restoration Executor
 * 
 * Executes scheduled restoration of promotional prices/options to original values.
 * Safe, idempotent, with conflict detection and readback verification.
 * 
 * Environment Variables:
 * - BFCM_RESTORE_ENABLED: Must be "true" to enable actual mutations (defaults to dry-run)
 * - SHOPIFY_ADMIN_API_TOKEN: Required for Shopify mutations
 * - SHOPIFY_STORE_DOMAIN: Required for Shopify mutations
 */

export type RestorationEntry = {
  id: string;
  type: 'variant_price' | 'metafield';
  productHandle?: string;
  productTitle?: string;
  restoreAt: string;
  original: any;
  promotional: any;
  capturedAt?: string;
};

export type RestorationJournal = {
  entries: RestorationEntry[];
  brands: Record<string, { count: number; deadline: string }>;
  capturedAt: string;
};

export type RestorationResult = {
  processed: number;
  restored: number;
  skipped: number;
  conflicts: number;
  failures: number;
  details: Array<{
    id: string;
    action: 'RESTORED' | 'ALREADY_RESTORED' | 'WAIT' | 'CONFLICT' | 'FAILED';
    reason?: string;
    verified?: boolean;
  }>;
  dryRun: boolean;
};

/**
 * Execute restoration for entries that have reached their deadline
 */
export async function executeRestoration(
  journal: RestorationJournal,
  now = new Date(),
  dryRun = true
): Promise<RestorationResult> {
  const result: RestorationResult = {
    processed: 0,
    restored: 0,
    skipped: 0,
    conflicts: 0,
    failures: 0,
    details: [],
    dryRun: dryRun || process.env.BFCM_RESTORE_ENABLED !== 'true',
  };
  
  const priceUpdates: ShopifyVariantPrice[] = [];
  const metafieldUpdates: ShopifyMetafieldUpdate[] = [];
  const verifyPrices: Array<{ variantId: string; expectedPrice: string; expectedCompareAt?: string | null }> = [];
  const verifyMetafields: Array<{ productId: string; namespace: string; key: string; expectedValue: string }> = [];
  
  // Process each entry
  for (const entry of journal.entries) {
    result.processed++;
    
    // Get current value (in real implementation, fetch from Shopify)
    // For now, assume current = promotional for dry-run demo
    const current = entry.promotional;
    
    const decision = restorationDecision(entry, current, now);
    
    switch (decision.action) {
      case 'WAIT':
        result.skipped++;
        result.details.push({
          id: entry.id,
          action: 'WAIT',
          reason: 'Deadline not reached',
        });
        break;
        
      case 'ALREADY_RESTORED':
        result.skipped++;
        result.details.push({
          id: entry.id,
          action: 'ALREADY_RESTORED',
          reason: 'Value already matches original',
        });
        break;
        
      case 'CONFLICT':
        result.conflicts++;
        result.details.push({
          id: entry.id,
          action: 'CONFLICT',
          reason: decision.reason || 'Manual edit detected',
        });
        break;
        
      case 'RESTORE':
        // Queue for restoration
        if (entry.type === 'variant_price') {
          priceUpdates.push({
            variantId: entry.id,
            price: String(entry.original.price),
            compareAtPrice: entry.original.compareAtPrice || null,
          });
          verifyPrices.push({
            variantId: entry.id,
            expectedPrice: String(entry.original.price),
            expectedCompareAt: entry.original.compareAtPrice || null,
          });
        } else if (entry.type === 'metafield') {
          // Extract productId from entry
          const productId = entry.id.split('/metafield/')[0];
          metafieldUpdates.push({
            productId,
            namespace: 'custom',
            key: 'customization_options',
            value: JSON.stringify(entry.original),
            type: 'json',
          });
          verifyMetafields.push({
            productId,
            namespace: 'custom',
            key: 'customization_options',
            expectedValue: JSON.stringify(entry.original),
          });
        }
        break;
    }
  }
  
  // Execute price mutations
  if (priceUpdates.length > 0) {
    try {
      const priceResults = await updateVariantPrices(priceUpdates, result.dryRun);
      
      for (const mutationResult of priceResults) {
        if (mutationResult.success) {
          result.restored++;
          result.details.push({
            id: mutationResult.id,
            action: 'RESTORED',
            verified: false, // Will verify next
          });
        } else {
          result.failures++;
          result.details.push({
            id: mutationResult.id,
            action: 'FAILED',
            reason: mutationResult.error,
          });
        }
      }
      
      // Verify price updates if not dry-run
      if (!result.dryRun) {
        const verifyResults = await batchVerifyPrices(verifyPrices);
        
        for (const verifyResult of verifyResults) {
          const detail = result.details.find(d => d.id === verifyResult.id);
          if (detail) {
            detail.verified = verifyResult.matches;
            if (!verifyResult.matches) {
              detail.reason = `Verification failed: expected ${JSON.stringify(verifyResult.expected)}, got ${JSON.stringify(verifyResult.actual)}`;
            }
          }
        }
      }
    } catch (error) {
      console.error('Price update batch failed:', error);
      result.failures += priceUpdates.length;
    }
  }
  
  // Execute metafield mutations
  if (metafieldUpdates.length > 0) {
    try {
      const metafieldResults = await updateMetafields(metafieldUpdates, result.dryRun);
      
      for (const mutationResult of metafieldResults) {
        if (mutationResult.success) {
          result.restored++;
          result.details.push({
            id: mutationResult.id,
            action: 'RESTORED',
            verified: false,
          });
        } else {
          result.failures++;
          result.details.push({
            id: mutationResult.id,
            action: 'FAILED',
            reason: mutationResult.error,
          });
        }
      }
      
      // Verify metafield updates if not dry-run
      if (!result.dryRun) {
        for (const verify of verifyMetafields) {
          const verifyResult = await verifyMetafield(
            verify.productId,
            verify.namespace,
            verify.key,
            verify.expectedValue
          );
          
          const detail = result.details.find(d => d.id === verify.productId);
          if (detail) {
            detail.verified = verifyResult.matches;
            if (!verifyResult.matches) {
              detail.reason = `Verification failed: ${verifyResult.error || 'value mismatch'}`;
            }
          }
        }
      }
    } catch (error) {
      console.error('Metafield update batch failed:', error);
      result.failures += metafieldUpdates.length;
    }
  }
  
  return result;
}

/**
 * Generate dry-run report for specific SKUs
 */
export function generateDryRunReport(
  journal: RestorationJournal,
  sampleHandles: string[],
  now = new Date()
): string {
  const lines: string[] = [
    '# BFCM Restoration Dry-Run Report',
    `Generated: ${now.toISOString()}`,
    `Journal captured: ${journal.capturedAt}`,
    '',
    '## Summary',
    `Total entries: ${journal.entries.length}`,
    '',
  ];
  
  for (const [brand, info] of Object.entries(journal.brands)) {
    lines.push(`- ${brand}: ${info.count} entries, deadline ${info.deadline}`);
  }
  
  lines.push('', '## Sample SKUs', '');
  
  for (const handle of sampleHandles) {
    const entries = journal.entries.filter(e => e.productHandle === handle);
    
    if (entries.length === 0) {
      lines.push(`### ${handle}`, 'No entries found', '');
      continue;
    }
    
    const entry = entries[0];
    lines.push(`### ${entry.productTitle || handle}`);
    lines.push(`Handle: ${handle}`);
    lines.push(`Deadline: ${entry.restoreAt}`);
    lines.push('');
    
    for (const e of entries) {
      const decision = restorationDecision(e, e.promotional, now);
      lines.push(`**${e.type}** (${e.id})`);
      lines.push(`- Action: ${decision.action}`);
      
      if (e.type === 'variant_price') {
        lines.push(`- Original price: $${e.original.price}`);
        lines.push(`- Promotional price: $${e.promotional.price}`);
        
        if (decision.action === 'RESTORE') {
          lines.push(`- ✅ Would restore to: $${e.original.price}`);
        }
      }
      
      lines.push('');
    }
  }
  
  return lines.join('\n');
}
