import { describe, expect, it } from 'vitest';
import { filterFinderCards, finderBounds, finderCards, finderQuery, finderRanges, type FinderRow } from '@/lib/catalog/sizeWeightFinder';
const row = (id: string, heightCm = 165, weightLb: number | null = 80, material: FinderRow['material'] = 'tpe'): FinderRow => ({
  id, handle: id, title: id, heightCm, weightLb, material, basis: 'unspecified', image: null, price: '1000', currency: 'USD',
});
describe('dual range Finder', () => {
  it('excludes missing/invalid weights and removes weight-basis data from client cards', () => {
    const cards = finderCards([row('valid'), row('missing', 165, null), row('invalid', 165, NaN), row('zero', 165, 0)]);
    expect(cards.map(card => card.id)).toEqual(['valid']);
    expect(cards[0]).not.toHaveProperty('basis');
  });
  it('derives inclusive safe bounds, including when no eligible weights exist', () => {
    expect(finderBounds(finderCards([row('a')]))).toEqual({ minHeight: 140, maxHeight: 165, minWeight: 36.3, maxWeight: 37 });
    expect(finderBounds([])).toEqual({ minHeight: 140, maxHeight: 141, minWeight: 0, maxWeight: 1 });
  });
  it('filters both height and displayed-kg boundaries inclusively with optional multiple materials', () => {
    const cards = finderCards([row('a', 160), row('b', 170, 90, 'silicone'), row('c', 171), row('d', 165, 80, 'hybrid')]);
    const ranges = { minHeight: 160, maxHeight: 170, minWeight: 36.3, maxWeight: 40.8, materials: [] };
    expect(filterFinderCards(cards, ranges).map(card => card.id)).toEqual(['a', 'b', 'd']);
    expect(filterFinderCards(cards, { ...ranges, materials: ['tpe', 'hybrid'] }).map(card => card.id)).toEqual(['a', 'd']);
    expect(filterFinderCards(cards, { ...ranges, maxWeight: 30 })).toEqual([]);
  });
  it('normalizes reversed/out-of-range/native queries and rejects NaN/empty/multi-value numeric inputs', () => {
    const bounds = { minHeight: 140, maxHeight: 190, minWeight: 0, maxWeight: 80 };
    expect(finderRanges({ minHeight: '999', maxHeight: '100', minWeight: '50', maxWeight: '20', material: ['hybrid', 'bad', 'tpe', 'tpe'] }, bounds)).toEqual({ minHeight: 140, maxHeight: 190, minWeight: 20, maxWeight: 50, materials: ['tpe', 'hybrid'] });
    expect(finderRanges({ minHeight: '', maxHeight: ['160'], minWeight: 'NaN', maxWeight: 'Infinity' }, bounds)).toEqual({ ...bounds, materials: [] });
  });
  it('serializes both ranges and repeated materials without trusting raw query values', () => {
    const ranges = { minHeight: 150, maxHeight: 175, minWeight: 20, maxWeight: 45, materials: ['tpe', 'silicone'] as const };
    const href = finderQuery({ ...ranges, materials: [...ranges.materials] }, 2);
    const query = new URL(href, 'https://dollwow.com').searchParams;
    expect(query.getAll('material')).toEqual(['tpe', 'silicone']);
    expect(query.get('minHeight')).toBe('150');
    expect(query.get('maxWeight')).toBe('45');
    expect(query.get('page')).toBe('2');
  });
});
