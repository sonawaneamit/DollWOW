import { describe, expect, it } from 'vitest';
import { isSeNovemberWindow, SE_NOVEMBER_REVIEW_TERMS as terms, SE_NOVEMBER_TIMING as timing } from '@/lib/promotions/seNovember2026';

describe('SEDOLL November reviewed terms (not live pricing)', () => {
  it.each([
    ['2026-11-01T03:59:59.999Z', false], ['2026-11-01T04:00:00Z', true],
    ['2026-11-01T05:59:59Z', true], ['2026-11-01T06:00:00Z', true],
    ['2026-12-01T04:59:59.999Z', true], ['2026-12-01T05:00:00Z', false],
    ['2026-12-07T12:00:00Z', false], ['invalid', false]
  ])('uses approved store-time boundaries at %s', (date, active) => {
    expect(isSeNovemberWindow(new Date(date))).toBe(active);
  });
  it('matches independently observed Shopify timezone including the DST transition', () => {
    expect(timing.timeZone).toBe('America/New_York');
    const format = (date: string) => new Intl.DateTimeFormat('en-US', {
      timeZone: timing.timeZone, month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hourCycle: 'h23'
    }).format(new Date(date));
    expect(format(timing.startsAt)).toBe('11/1, 00:00');
    expect(format(timing.endsAt)).toBe('12/1, 00:00');
  });
  it('retains narrow body restrictions rather than granting brand-wide options', () => {
    expect(terms.tpeCustom.reductions[2].bodies).toEqual(['157H', '161F', '163E']);
    expect(terms.siliconeProCustom.softBellyBodies).toEqual(['T148', 'T155', 'T159', 'T165', 'T175']);
    expect(terms.siliconeTorsoCustom.softBellyBodies).toEqual(['ST5', 'ST6', 'ST7', 'ST8']);
    expect(terms.siliconeTorsoCustom.gelButtBodies).toEqual(['ST1', 'ST2', 'ST3', 'ST4', 'ST8']);
  });
  it('keeps random second head and regional suggested retail distinct', () => {
    expect(terms.siliconeProCustom.included).toContain('Random second head');
    expect(terms.warehouse.map(row => [row.region, row.material, row.suggestedMinimumRetailReductionPercent])).toEqual([
      ['US', 'Silicone Pro', 10], ['US', 'STPE', 20], ['EU', 'Silicone Pro', 10], ['EU', 'STPE', 15]
    ]);
    expect(JSON.stringify(terms)).not.toContain('retailPrice');
  });
});
