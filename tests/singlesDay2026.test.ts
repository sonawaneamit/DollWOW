import { describe, expect, it } from 'vitest';
import { isSinglesDayActive, SINGLES_DAY_2026 } from '../lib/promotions/singlesDay2026';
describe('approved Singles Day live-now schedule',()=>{
 it('uses the superseding 10 November start and the provisional handover',()=>{
  const start=Date.parse(SINGLES_DAY_2026.startsAt),end=Date.parse(SINGLES_DAY_2026.endsAt);
  expect(new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',dateStyle:'short',timeStyle:'short',hourCycle:'h23'}).format(start)).toContain('11:00');
  expect(isSinglesDayActive(start-1)).toBe(false);expect(isSinglesDayActive(start)).toBe(true);
  expect(isSinglesDayActive(end-1)).toBe(true);expect(isSinglesDayActive(end)).toBe(false);
 });
 it('accepts an adjusted early Black Friday handover without extending the default',()=>{
  expect(isSinglesDayActive(Date.parse('2026-11-15T06:00:00Z'),'2026-11-15T05:00:00Z')).toBe(false);
 });
});
