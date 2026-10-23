import { describe, expect, it } from 'vitest';
import { sampleProducts } from '@/lib/data/sample-products';
import { MD_MENU_TAG } from '@/lib/customization/ido-md';
import type { Product } from '@/types/product';
import { buildFinderRows, finderHeight, finderSummary, finderWeight } from '@/lib/catalog/sizeWeightFinder';

function product(id: string, height = 165, weight: number | undefined = 80): Product {
  const p = structuredClone(sampleProducts[0]);
  return { ...p, id, handle: `finder-${id}`, title: `Finder ${id}`, vendor: 'Example', productType: 'Full doll',
    tags: ['full-doll', 'tpe'], featuredImage: null, images: [],
    extended: { ...p.extended, brand: 'Example', heightCm: height, weightLb: weight, material: 'TPE',
      sourceTitle: '', sourceHandle: '', measurements: {} } };
}

describe('size and weight Finder source contract', () => {
  it('includes 140cm, excludes shorter, missing or nonfinite heights', () => {
    const result = buildFinderRows([product('boundary', 140), product('short', 139), product('missing', 0), product('bad', NaN)]);
    expect(result.rows.map(row => row.id)).toEqual(['boundary']);
  });
  it.each(['torso', 'hips', 'standalone head', 'body only'])('excludes partial form %s even with height metadata', form => {
    const p = product('partial'); p.title = form;
    expect(buildFinderRows([p]).rows).toEqual([]);
  });
  it.each(['catalog-review-hold', 'public-age-review-hold', 'dollwow-test', 'custom-option-charge'])('excludes %s without mutating tags', tag => {
    const p = product('held'); p.tags.push(tag);
    const before = structuredClone(p);
    expect(buildFinderRows([p]).rows).toEqual([]);
    expect(p).toEqual(before);
  });
  it.each([0, -1, NaN, Infinity])('shows invalid weight %s as missing, not zero', weight => {
    const { rows } = buildFinderRows([product('missing', 165, weight)]);
    expect(rows[0].weightLb).toBeNull();
    expect(finderSummary(rows, 165, 'tpe').missing).toBe(1);
  });
  it('does not infer a weight from body, head or packing fields', () => {
    const p = product('unknown'); p.extended.weightLb = undefined;
    p.extended.measurements = { 'Body weight': '30kg', 'Head weight': '4kg', 'Packing weight': '40kg' };
    expect(buildFinderRows([p]).rows[0].weightLb).toBeNull();
  });
  it('separates recognized MD body-only weights from generic listed weights', () => {
    const md = product('md', 165, 72.8); md.vendor = 'MD Doll'; md.extended.brand = 'MD Doll';
    md.tags.push(MD_MENU_TAG); md.extended.measurements = { 'Factory body weight': '33kg' };
    const { rows } = buildFinderRows([md, product('generic', 165, 90)]);
    const result = finderSummary(rows, 165, 'tpe');
    expect(result.ranges).toEqual([
      { basis: 'unspecified', count: 1, minLb: 90, maxLb: 90 },
      { basis: 'factory-body-only', count: 1, minLb: 72.8, maxLb: 72.8 },
    ]);
  });
  it('preserves separate listings with identical measurements; removes repeated IDs only', () => {
    const a = product('a');
    expect(buildFinderRows([a, structuredClone(a), product('b')]).rows.map(row => row.id)).toEqual(['a', 'b']);
  });
  it('uses exact height and material; never interpolates or silently falls back', () => {
    const { rows } = buildFinderRows([product('a', 164), product('b', 166)]);
    const result = finderSummary(rows, 165, 'tpe');
    expect(result.matches).toEqual([]);
    expect(result.ranges.every(range => range.minLb === null && range.maxLb === null)).toBe(true);
    expect(finderSummary(rows, 164, 'silicone').matches).toEqual([]);
  });
  it('does not treat an unknown material as TPE', () => {
    const p = product('unknown'); p.tags = ['full-doll']; p.extended.material = 'Unknown';
    const result = buildFinderRows([p]);
    expect(result.rows).toEqual([]); expect(result.excludedMaterial).toBe(1);
  });
  it('retains exact min/max observations and counts missing records', () => {
    const missing = product('c'); missing.extended.weightLb = undefined;
    const result = finderSummary(buildFinderRows([product('a', 165, 60), product('b', 165, 100), missing]).rows, 165, 'tpe');
    expect(result.matches).toHaveLength(3); expect(result.missing).toBe(1);
    expect(result.ranges[0]).toEqual({ basis: 'unspecified', count: 2, minLb: 60, maxLb: 100 });
  });
  it('does not include product images or private measurement records in output', () => {
    const { rows } = buildFinderRows([product('a')]);
    expect(Object.keys(rows[0]).sort()).toEqual(['basis', 'handle', 'heightCm', 'id', 'material', 'title', 'weightLb']);
  });
  it('keeps the full listing title so repeated first names remain distinguishable', () => {
    const p = product('a'); p.title = 'Example Brand Alice 165cm TPE'; p.extended.displayName = 'Alice';
    expect(buildFinderRows([p]).rows[0].title).toBe('Example Brand Alice 165cm TPE');
  });
  it('converts both unit systems without changing input values', () => {
    expect(finderWeight(72.8)).toBe('33.0 kg / 72.8 lb');
    expect(finderHeight(165)).toBe('165 cm / 5 ft 5 in');
    expect(finderHeight(183)).toBe('183 cm / 6 ft 0 in');
  });
});
