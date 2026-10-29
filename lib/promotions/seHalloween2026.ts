export const SE_HALLOWEEN_2026 = {
  id: 'se-halloween-2026',
  startsAt: '2026-09-30T23:00:00Z',
  // Working October end date approved by Martin; supplier confirmation pending.
  endsAt: '2026-11-01T00:00:00Z',
  timeZone: 'Europe/Lisbon',
  inferredEnd: true
} as const;

export function seHalloweenEndLabel() {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric',
    timeZone: SE_HALLOWEEN_2026.timeZone
  }).format(new Date(Date.parse(SE_HALLOWEEN_2026.endsAt) - 1)) + ', end of day Portugal time';
}

export function isSeHalloweenPreview(environment: { VERCEL_ENV?: string; NEXT_PUBLIC_DOL275_PREVIEW?: string } = {
  VERCEL_ENV: process.env.VERCEL_ENV, NEXT_PUBLIC_DOL275_PREVIEW: process.env.NEXT_PUBLIC_DOL275_PREVIEW
}) {
  return environment.NEXT_PUBLIC_DOL275_PREVIEW === '1'
    && environment.VERCEL_ENV === 'preview';
}

export function isSeHalloweenActive(now = Date.now()) {
  return Number.isFinite(now) && now >= Date.parse(SE_HALLOWEEN_2026.startsAt)
    && now < Date.parse(SE_HALLOWEEN_2026.endsAt);
}

export function seHalloweenCampaignDay(now: Date) {
  if (!Number.isFinite(now.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: SE_HALLOWEEN_2026.timeZone, year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(now);
  const part = (name: string) => parts.find(p => p.type === name)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

// Explicit preview build flag only. Production builds never acquire this clock.
export function seHalloweenPreviewClockEnabled() {
  return process.env.NEXT_PUBLIC_DOL275_PREVIEW === '1'
    && process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview'
    && (typeof window !== 'undefined' || process.env.VERCEL_ENV === 'preview');
}
