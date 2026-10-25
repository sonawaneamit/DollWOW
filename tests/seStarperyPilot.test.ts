import { describe, expect, it } from 'vitest';
import { seStarperyPilot, seStarperyPilotEnabled, seStarperyPriceGap } from '@/lib/learn/seStarperyPilot';

describe('single SE versus Starpery reader pilot', () => {
  it('is available only on preview deployments', () => {
    expect(seStarperyPilotEnabled('preview')).toBe(true);
    for (const environment of ['production', 'development', undefined]) expect(seStarperyPilotEnabled(environment)).toBe(false);
  });
  it('uses the exact two reviewed models, not brand-wide weight promises', () => {
    const [alba, amy] = seStarperyPilot.models;
    expect(alba.handle).toContain('sedoll-alba-a-161cm');
    expect(amy.handle).toContain('starpery-amy-161cm');
    expect(amy.weight - alba.weight).toBe(17.5);
    expect(amy.waist - alba.waist).toBe(52);
    expect(amy.hips - alba.hips).toBe(36);
    expect(alba.height).toBe(amy.height);
  });
  it('gives each brand a concrete pick with an advantage and trade-off', () => {
    for (const model of seStarperyPilot.models) {
      expect(model.pick).toContain('Our pick');
      expect(model.advantage.length).toBeGreaterThan(40);
      expect(model.tradeoff.length).toBeGreaterThan(40);
      expect(model.verdict).toContain(model.name);
    }
  });
  it('derives the price gap from current prices and refuses invalid/reversed values', () => {
    expect(seStarperyPriceGap('1899', '2199')).toBe(300);
    expect(seStarperyPriceGap('2200', '2199')).toBeNull();
    expect(seStarperyPriceGap('oops', '2199')).toBeNull();
  });
});
