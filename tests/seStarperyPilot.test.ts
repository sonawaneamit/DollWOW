import { describe, expect, it } from 'vitest';
import { amyDollVueLooks,seStarperyPicks,seStarperyTradeoffs,seStarperyPilot, seStarperyPilotEnabled, seStarperyPriceGap } from '@/lib/learn/seStarperyPilot';

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
    expect(amy).not.toHaveProperty('waist');
    expect(amy).not.toHaveProperty('hips');
    expect(alba.height).toBe(amy.height);
  });
  it('represents both brands in four need-based picks and real tradeoffs',()=>{
    expect(seStarperyPicks).toHaveLength(4);
    expect(seStarperyPicks.filter(p=>p.modelIndex===0)).toHaveLength(2);
    expect(seStarperyPicks.filter(p=>p.modelIndex===1)).toHaveLength(2);
    for(const item of seStarperyTradeoffs){expect(item.pros).toHaveLength(4);expect(item.cons).toHaveLength(3);}
    expect(amyDollVueLooks).toHaveLength(2);
    expect(amyDollVueLooks[0].selections).toContainEqual({groupId:'eye-color',optionId:'green'});
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
