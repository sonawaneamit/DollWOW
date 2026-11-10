import { expect, test } from 'vitest';
import { formatMeasurementDual, primaryProductSpecs, productMeasurementSpecs } from '../lib/catalog/productSpecs';
import snapshot from '../data/draft-previews/mmx-pdp-nov10.json';
import type { Product } from '../types/product';

test('height ranges and head-dependent qualifications survive repeated PDP formatting', () => {
  const raw = '156–160 cm (depends on head)';
  const formatted = formatMeasurementDual('Height', raw);
  expect(formatted).toBe('5 ft 1 in–5 ft 3 in / 156–160 cm (depends on head)');
  expect(formatMeasurementDual('Height', formatted)).toBe(formatted);
});

test('body-only and packing qualifications survive weight conversion', () => {
  for (const qualifier of ['body only; head excluded', 'packed', 'without head']) {
    const formatted = formatMeasurementDual('Weight', `32 kg (${qualifier})`);
    expect(formatted).toBe(`70.5 lb / 32.0 kg (${qualifier})`);
    expect(formatMeasurementDual('Weight', formatted)).toBe(formatted);
  }
});

test('the real MMX PDP hero and detailed specs retain both source qualifications', () => {
  const product = snapshot.products.find(product => product.extended.bodyCode === '156B') as unknown as Product;
  for (const specs of [primaryProductSpecs(product), productMeasurementSpecs(product)]) {
    expect(specs.find(spec => spec.label === 'Height')?.value).toContain('156–160 cm (depends on head)');
    expect(specs.find(spec => spec.label === 'Weight')?.value).toContain('(body only; head excluded)');
  }
});
