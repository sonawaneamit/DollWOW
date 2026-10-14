import { describe, expect, it } from 'vitest';
import { mapShopifyProduct } from '@/lib/shopify/mappers';
import { sampleProducts } from '@/lib/data/sample-products';
import { MD_MENU_TAG } from '@/lib/customization/ido-md';
import { catalogWeightLb, productWeightLabel } from '@/lib/catalog/mdWeight';
import { primaryProductSpecs, productMeasurementSpecs } from '@/lib/catalog/productSpecs';
import { filterProducts } from '@/lib/catalog/filters';
import { buildProductStructuredData } from '@/lib/catalog/pdpSeo';
import { mdRosRules } from '@/lib/customization/md-ros';

function mapped(brand = 'MD Doll', tags = [MD_MENU_TAG], measurements: Record<string,string> = { Weight: '44kg', 'Factory body weight': '33kg', 'Packing weight': '44kg' }) {
  const sample = sampleProducts[0];
  return mapShopifyProduct({ ...sample, vendor: brand, tags, productType: 'Custom Silicone doll',
    images: { edges: [] }, variants: { edges: sample.variants.map(node => ({ node })) }, media: undefined,
    brand: { value: brand }, weightLb: { value: '97.0' }, measurements: { value: JSON.stringify(measurements) } });
}

describe('release MD factory body weight presentation', () => {
  it('maps Leona33kg body mass, not44kg packing mass, into numeric filtering', () => {
    const product = mapped();
    expect(product.extended.weightLb).toBe(72.8);
    expect(filterProducts([product], { weight: '0-74' })).toHaveLength(1);
    expect(filterProducts([product], { weight: '90-109' })).toHaveLength(0);
    expect(primaryProductSpecs(product)).toContainEqual({ label: 'Body weight', value: '72.8 lb / 33.0 kg' });
    const specs = productMeasurementSpecs(product);
    expect(specs).toContainEqual({ label: 'Body weight', value: '72.8 lb / 33.0 kg' });
    expect(specs).toContainEqual({ label: 'Packing weight', value: '97.0 lb / 44.0 kg' });
    expect(specs.some(spec => spec.label === 'Weight' || spec.label === 'Listed weight')).toBe(false);
    const props = buildProductStructuredData(product).additionalProperty;
    expect(props.some(prop => prop.name === 'Body weight')).toBe(true);
    expect(props.some(prop => prop.name === 'Weight')).toBe(false);
  });
  it('retains Heather listed38kg without claiming body or net mass', () => {
    const product = mapped('MD Doll', [MD_MENU_TAG], { 'Listed weight': '83.8 lb / 38 kg' });
    product.extended.weightLb = catalogWeightLb('MD Doll', product.extended.measurements, 83.8, product.tags);
    expect(product.extended.weightLb).toBe(83.8);
    expect(productWeightLabel(product)).toBe('Listed weight');
    expect(productMeasurementSpecs(product)).toContainEqual({ label: 'Listed weight', value: '83.8 lb / 38.0 kg' });
    expect(JSON.stringify(productMeasurementSpecs(product))).not.toContain('unverified');
  });
  it('leaves unrelated MD and other brands unchanged even with a body marker', () => {
    for (const product of [mapped('MD Doll', []), mapped('IDO', [MD_MENU_TAG]), mapped('WM Doll', [])]) {
      expect(product.extended.weightLb).toBe(97);
      expect(productWeightLabel(product)).toBe('Weight');
      expect(primaryProductSpecs(product).find(spec => spec.label === 'Weight')?.value).toBe('97.0 lb / 44.0 kg');
    }
  });
  it.each(['M52', 'M53', 'M55'])('accepts current official ROS selector %s without enabling unknown codes', head => {
    const groups = [
      { id: 'head', label: 'Head', display: 'compact' as const, options: [{ id: 'no-change', label: 'As shown', priceDelta: 0 }] },
      { id: 'head-type', label: 'Head type', display: 'compact' as const, options: [{ id: 'ros-head-movable-jaw', label: 'ROS', priceDelta: 0 }] }
    ];
    expect(mdRosRules(groups, head)).toEqual([]);
    expect(mdRosRules(groups, 'M999')).toHaveLength(1);
  });
});
