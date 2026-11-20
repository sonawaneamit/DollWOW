import { NextRequest, NextResponse } from 'next/server';
import { snapshotCurrentPrices, checkDoneMarker, saveDoneMarker, restorePrices } from '@/lib/promotions/bfcm-restore-v2';

/**
 * BFCM Restore Cron Endpoint
 * 
 * IMPORTANT: BFCM promotional pricing is DISPLAY-ONLY.
 * No promo prices are written to Shopify. This endpoint is a safety mechanism
 * that remains disabled unless explicitly enabled.
 * 
 * Schedule: Every 15 minutes, checks if restore deadline has passed
 * 
 * Requires:
 * - BFCM_RESTORE_ENABLED=1 to enable
 * - BFCM_RESTORE_LIVE=1 for live mode (default: dry-run)
 * - CRON_SECRET for authentication
 * - SHOPIFY_ADMIN_ACCESS_TOKEN for Shopify API
 * 
 * DOL-371
 */

const REVERT_TIMES = {
  main: '2026-12-11T04:59:00Z', // Top Fire, Galatea, Climax, 6YE
  ido: '2026-12-01T00:00:00Z'   // IDO
};

export async function GET(request: NextRequest) {
  // Guard: Must be explicitly enabled
  if (process.env.BFCM_RESTORE_ENABLED !== '1') {
    return NextResponse.json({
      status: 'disabled',
      message: 'BFCM restore is disabled. Set BFCM_RESTORE_ENABLED=1 to enable.',
      note: 'BFCM promo is display-only. No prices are written to Shopify.'
    });
  }
  
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }
  
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const shopifyDomain = process.env.SHOPIFY_STORE_DOMAIN;
  const accessToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
  
  if (!shopifyDomain || !accessToken) {
    return NextResponse.json({
      error: 'Missing Shopify credentials',
      required: ['SHOPIFY_STORE_DOMAIN', 'SHOPIFY_ADMIN_ACCESS_TOKEN']
    }, { status: 500 });
  }
  
  try {
    const now = new Date();
    const mainDeadline = new Date(REVERT_TIMES.main);
    const idoDeadline = new Date(REVERT_TIMES.ido);
    
    // Check if either deadline has passed
    const shouldRestore = now >= mainDeadline || now >= idoDeadline;
    
    if (!shouldRestore) {
      return NextResponse.json({
        status: 'waiting',
        message: 'Restore deadline not yet reached',
        currentTime: now.toISOString(),
        deadlines: REVERT_TIMES,
        note: 'BFCM promo is display-only. No prices changed in Shopify.'
      });
    }
    
    // Check if already completed
    const doneMarker = await checkDoneMarker(shopifyDomain, accessToken);
    if (doneMarker.done) {
      return NextResponse.json({
        status: 'already_completed',
        message: 'Restoration already completed',
        completedAt: doneMarker.completedAt,
        restored: doneMarker.count,
        note: 'BFCM promo was display-only. No prices were changed.'
      });
    }
    
    // Snapshot current prices from live Shopify
    const snapshots = await snapshotCurrentPrices(shopifyDomain, accessToken);
    
    // Filter by deadline
    const dueSnapshots = snapshots.filter(s => {
      const deadline = new Date(s.revertAt);
      return now >= deadline;
    });
    
    if (dueSnapshots.length === 0) {
      return NextResponse.json({
        status: 'no_work',
        message: 'No snapshots due for restoration',
        totalSnapshots: snapshots.length,
        dueSnapshots: 0
      });
    }
    
    // Determine mode
    const liveMode = process.env.BFCM_RESTORE_ENABLED === '1' 
                     && process.env.BFCM_RESTORE_LIVE === '1';
    const dryRun = !liveMode;
    
    // Execute restore
    const result = await restorePrices(dueSnapshots, shopifyDomain, accessToken, dryRun);
    
    // Save done marker in live mode
    if (liveMode && result.restored > 0) {
      await saveDoneMarker(shopifyDomain, accessToken, result.restored);
    }
    
    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      mode: dryRun ? 'dry-run' : 'live',
      note: 'BFCM promo is display-only. No promo prices were written to Shopify.',
      result: {
        ...result,
        snapshots: dueSnapshots.map(s => ({
          handle: s.handle,
          brand: s.brand,
          currentPrice: s.currentPrice,
          revertAt: s.revertAt
        }))
      }
    });
  } catch (error) {
    console.error('BFCM restore error:', error);
    return NextResponse.json({
      error: 'Restore failed',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
