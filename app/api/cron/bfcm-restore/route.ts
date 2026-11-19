import { NextRequest, NextResponse } from 'next/server';
import { executeRestoration } from '@/lib/promotions/restoration-executor';
import type { RestorationJournal } from '@/lib/promotions/restoration-executor';

/**
 * BFCM Restoration Cron Endpoint
 * 
 * Scheduled via Vercel Cron to run at restoration deadlines.
 * Protected by cron secret verification.
 * 
 * Deadlines:
 * - Most brands: 2026-12-11T04:59:00Z (Dec 10, 11:59 PM US Eastern)
 * - IDO: 2026-12-01T00:00:00Z
 * 
 * Environment Variables Required:
 * - CRON_SECRET: Vercel cron secret for authentication
 * - BFCM_RESTORE_ENABLED: Must be "true" to enable actual mutations
 * - SHOPIFY_ADMIN_API_TOKEN: Shopify Admin API access token
 * - SHOPIFY_STORE_DOMAIN: Shopify store domain
 * 
 * Security:
 * - Verifies cron secret from request headers
 * - Defaults to dry-run mode unless BFCM_RESTORE_ENABLED=true
 * - Requires explicit authorization header
 */

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes

// In production, load from persistent storage (database, KV store, etc.)
// For now, this is a placeholder that would be populated during promotion activation
function loadRestorationJournal(): RestorationJournal {
  // TODO: Load from Vercel KV, Supabase, or other persistent storage
  // This journal should be created during promotion activation and stored
  
  return {
    entries: [],
    brands: {
      'Top Fire': { count: 0, deadline: '2026-12-11T04:59:00Z' },
      'Galatea': { count: 0, deadline: '2026-12-11T04:59:00Z' },
      'Climax': { count: 0, deadline: '2026-12-11T04:59:00Z' },
      '6YE': { count: 0, deadline: '2026-12-11T04:59:00Z' },
      'IDO': { count: 0, deadline: '2026-12-01T00:00:00Z' },
    },
    capturedAt: new Date().toISOString(),
  };
}

function saveCompletionMarker(result: any) {
  // TODO: Store completion marker in persistent storage
  // Prevents duplicate restoration if cron runs multiple times
  console.log('Would save completion marker:', {
    timestamp: new Date().toISOString(),
    restored: result.restored,
    conflicts: result.conflicts,
    failures: result.failures,
  });
}

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) {
    return NextResponse.json(
      { error: 'CRON_SECRET not configured' },
      { status: 500 }
    );
  }
  
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  try {
    const now = new Date();
    const dryRun = process.env.BFCM_RESTORE_ENABLED !== 'true';
    
    // Load restoration journal
    const journal = loadRestorationJournal();
    
    // Check if any entries are due
    const dueEntries = journal.entries.filter(
      entry => +now >= Date.parse(entry.restoreAt)
    );
    
    if (dueEntries.length === 0) {
      return NextResponse.json({
        message: 'No entries due for restoration',
        timestamp: now.toISOString(),
        totalEntries: journal.entries.length,
        dryRun,
      });
    }
    
    // Execute restoration
    console.log('Starting restoration:', {
      timestamp: now.toISOString(),
      totalEntries: journal.entries.length,
      dueEntries: dueEntries.length,
      dryRun,
    });
    
    const result = await executeRestoration(journal, now, dryRun);
    
    console.log('Restoration completed:', {
      ...result,
      timestamp: now.toISOString(),
    });
    
    // Save completion marker if not dry-run and successful
    if (!dryRun && result.restored > 0) {
      saveCompletionMarker(result);
    }
    
    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      dryRun,
      result,
    });
  } catch (error) {
    console.error('Restoration failed:', error);
    
    return NextResponse.json(
      {
        error: 'Restoration failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Support POST for manual triggers (with same auth)
export async function POST(request: NextRequest) {
  return GET(request);
}
