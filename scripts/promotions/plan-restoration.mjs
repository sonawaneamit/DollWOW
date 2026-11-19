/** Read-only scheduler decision. Production adapter must capture original/promo values at activation. */
export function restorationDecision(entry, current, now = new Date()) {
  if (!entry.id || !Number.isFinite(Date.parse(entry.restoreAt))) throw Error('Invalid restoration entry');
  if (+now < Date.parse(entry.restoreAt)) return { id: entry.id, action: 'WAIT' };
  const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  if (equal(current, entry.original)) return { id: entry.id, action: 'ALREADY_RESTORED' };
  if (!equal(current, entry.promotional)) return { id: entry.id, action: 'CONFLICT', reason: 'Value changed after activation; preserve current edit' };
  return { id: entry.id, action: 'RESTORE', expected: entry.promotional, value: entry.original };
}
