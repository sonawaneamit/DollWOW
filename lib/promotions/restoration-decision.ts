/**
 * Read-only scheduler decision logic for BFCM restoration.
 * Extracted from scripts/promotions/plan-restoration.mjs for runtime use.
 * 
 * Production adapter must capture original/promo values at activation.
 */

export type RestorationDecision = 
  | { id: string; action: 'WAIT' }
  | { id: string; action: 'ALREADY_RESTORED' }
  | { id: string; action: 'CONFLICT'; reason: string }
  | { id: string; action: 'RESTORE'; expected: unknown; value: unknown };

export function restorationDecision(
  entry: { id: string; restoreAt: string; original: unknown; promotional: unknown },
  current: unknown,
  now = new Date()
): RestorationDecision {
  if (!entry.id || !Number.isFinite(Date.parse(entry.restoreAt))) {
    throw new Error('Invalid restoration entry');
  }
  
  if (+now < Date.parse(entry.restoreAt)) {
    return { id: entry.id, action: 'WAIT' };
  }
  
  const equal = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
  
  if (equal(current, entry.original)) {
    return { id: entry.id, action: 'ALREADY_RESTORED' };
  }
  
  if (!equal(current, entry.promotional)) {
    return { 
      id: entry.id, 
      action: 'CONFLICT', 
      reason: 'Value changed after activation; preserve current edit' 
    };
  }
  
  return { 
    id: entry.id, 
    action: 'RESTORE', 
    expected: entry.promotional, 
    value: entry.original 
  };
}
