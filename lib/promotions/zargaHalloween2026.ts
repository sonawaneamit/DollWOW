export const ZARGA_HALLOWEEN = {
  id: 'zarga-halloween-2026',
  // Europe/Lisbon: 25 October midnight is still WEST; 7 November ends in WET.
  startsAt: '2026-10-24T23:00:00Z',
  endsAt: '2026-11-08T00:00:00Z',
  timeZone: 'Europe/Lisbon'
} as const;

export function isZargaHalloweenActive(now = new Date()) {
  return now.getTime() >= Date.parse(ZARGA_HALLOWEEN.startsAt) && now.getTime() < Date.parse(ZARGA_HALLOWEEN.endsAt);
}

export function zargaHalloweenEndLabel() {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: ZARGA_HALLOWEEN.timeZone })
    .format(new Date(Date.parse(ZARGA_HALLOWEEN.endsAt) - 1));
}
