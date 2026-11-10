/** Exact Ria v4 artwork and campaign approved in DOL-364 on 10 November. */
export const SINGLES_DAY_2026 = {
  id: 'singles-day-2026',
  amountUsd: 299,
  startsAt: '2026-11-11T05:00:00.000Z', // 00:00 America/New_York (EST)
  // Provisional early Black Friday handover; one shared setting for the hero schedule.
  endsAt: '2026-11-16T05:00:00.000Z',
  timeZone: 'America/New_York',
  headline: '$299 off full-size dolls',
} as const;

export function isSinglesDayActive(now = Date.now(), endsAt: string = SINGLES_DAY_2026.endsAt) {
  return now >= Date.parse(SINGLES_DAY_2026.startsAt) && now < Date.parse(endsAt);
}
