import { NextRequest, NextResponse } from 'next/server';
import { restorePrices, type PriceSnapshot } from '@/lib/promotions/bfcm-restore';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  if (process.env.BFCM_RESTORE_ENABLED !== '1') {
    return NextResponse.json({ status: 'disabled', message: 'BFCM restore is disabled. Set BFCM_RESTORE_ENABLED=1 to enable.' });
  }
  
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }
  
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const now = new Date();
    const liveMode = process.env.BFCM_RESTORE_ENABLED === '1' && process.env.BFCM_RESTORE_LIVE === '1';
    const dryRun = !liveMode;
    
    // Check done marker - never run twice in live mode
    if (liveMode && await checkDoneMarker()) {
      return NextResponse.json({
        status: 'already_completed',
        message: 'Restoration already completed. Will not run again.',
        timestamp: now.toISOString(),
      });
    }
    
    const snapshots = await loadSnapshots();
    
    if (snapshots.length === 0) {
      return NextResponse.json({ message: 'No price snapshots found', timestamp: now.toISOString(), dryRun });
    }
    
    const dueSnapshots = snapshots.filter(s => +now >= Date.parse(s.revertAt));
    
    if (dueSnapshots.length === 0) {
      return NextResponse.json({
        message: 'No snapshots due for restoration yet',
        timestamp: now.toISOString(),
        totalSnapshots: snapshots.length,
        nextDeadline: snapshots[0]?.revertAt,
        dryRun,
      });
    }
    
    const result = await restorePrices(dueSnapshots, dryRun);
    
    // Save done marker in live mode
    if (liveMode && result.restored > 0) {
      await saveDoneMarker(result);
    }
    
    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      dryRun,
      liveMode,
      result,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Restoration failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function loadSnapshots(): Promise<PriceSnapshot[]> {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const dataPath = path.join(process.cwd(), 'data/real-sample-products.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const snapshots: PriceSnapshot[] = [];
    
    for (const product of data.products || []) {
      const variant = product.variants?.[0];
      if (!variant) continue;
      const brand = getBrand(product);
      if (!brand) continue;
      const currentPrice = String(variant.price);
      const promoPrice = calculatePromoPrice(product, brand, currentPrice);
      const revertAt = brand === 'IDO' ? '2026-12-01T00:00:00Z' : '2026-12-11T04:59:00Z';
      
      snapshots.push({
        productId: String(product.productId),
        variantId: String(variant.variantId),
        handle: product.handle,
        title: product.title,
        brand,
        originalPrice: currentPrice,
        originalCompareAt: variant.compareAtPrice || null,
        promoPrice,
        promoCompareAt: currentPrice,
        revertAt,
        snapshotAt: data.exportedAt || new Date().toISOString(),
      });
    }
    return snapshots;
  } catch (error) {
    return [];
  }
}

function getBrand(product: any): string | null {
  const { vendor, title, handle, tags = [] } = product;
  const identity = `${vendor} ${title} ${handle} ${tags.join(' ')}`;
  if (/\btop[ -]?fire\b/i.test(identity)) return 'Top Fire';
  if (/\bgalatea\b/i.test(identity)) return 'Galatea';
  if (/\bclimax\b/i.test(identity) || handle.startsWith('climax-')) return 'Climax';
  if (/\b6ye\b/i.test(identity)) return '6YE';
  if (/\bido(?:doll)?\b/i.test(identity)) return 'IDO';
  return null;
}

function calculatePromoPrice(product: any, brand: string, originalPrice: string): string {
  const price = parseFloat(originalPrice);
  switch (brand) {
    case 'Top Fire': return (price - 150).toFixed(2);
    case 'Galatea': return originalPrice;
    case 'Climax': return price >= 900 ? Math.floor(price * 0.9).toFixed(2) : originalPrice;
    case '6YE': return Math.floor(price * 0.95).toFixed(2);
    case 'IDO': {
      const isRTS = /\b(in.stock|ready.to.ship)\b/i.test(product.title);
      return isRTS ? '2499.00' : originalPrice;
    }
    default: return originalPrice;
  }
}

async function checkDoneMarker(): Promise<boolean> {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const markerPath = path.join(process.cwd(), 'data/bfcm-restore-done.json');
    return fs.existsSync(markerPath);
  } catch {
    return false;
  }
}

async function saveDoneMarker(result: any): Promise<void> {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const markerPath = path.join(process.cwd(), 'data/bfcm-restore-done.json');
    fs.writeFileSync(markerPath, JSON.stringify({
      completedAt: new Date().toISOString(),
      restored: result.restored,
      failed: result.failed,
    }, null, 2));
  } catch (error) {
    console.error('Failed to save done marker:', error);
  }
}
