// DOL-221: approved presentation release, 10 November 2026. Checkout prices stay independent.
export const GYNOID_EARLY_BIRD = {
  id: 'gynoid-early-bird-2026',
  startsAt: '2026-11-05T00:00:00Z',
  endsAt: '2026-12-05T00:00:00Z',
  dateLabel: '5 November – 4 December 2026',
  m25List: { standard: 5299, deluxe: 5799 },
  tiers: [
    { start: '2026-11-05T00:00:00Z', end: '2026-11-15T00:00:00Z', dates: '5–14 November', saving: 500 },
    { start: '2026-11-15T00:00:00Z', end: '2026-11-25T00:00:00Z', dates: '15–24 November', saving: 300 },
    { start: '2026-11-25T00:00:00Z', end: '2026-12-05T00:00:00Z', dates: '25 November – 4 December', saving: 100 }
  ]
} as const;

export function gynoidEarlyBirdPreviewEnabled(environment: Record<string, string | undefined> = process.env) {
  return environment.VERCEL_ENV === 'preview' && environment.NEXT_PUBLIC_DOL221_PREVIEW === '1';
}

export function gynoidEarlyBirdTier(now: Date) {
  const time = now.getTime();
  return GYNOID_EARLY_BIRD.tiers.find(tier => time >= Date.parse(tier.start) && time < Date.parse(tier.end)) ?? null;
}

// Martin approved this exact campaign presentation for production on 10 Nov.
export function gynoidEarlyBirdEnabled(environment: Record<string, string | undefined> = process.env) {
  return environment.DOLLWOW_DOL221_ENABLED !== '0' && (environment.VERCEL_ENV === 'production' || gynoidEarlyBirdPreviewEnabled(environment));
}
