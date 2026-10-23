import { describe, expect, it } from 'vitest';
import sample from '@/data/internal-link-sample.json';
import excludedHandles from '@/data/contextual-link-exclusions.json';
import { sampleProducts } from '@/lib/data/sample-products';
import { catalogContextualLinks, contextualLinksEnabled, productContextualLinks } from '@/lib/catalog/contextualLinks';

const product = { ...sampleProducts[0], handle: 'sample-doll', vendor: 'Irontech', productType: 'Custom silicone doll', tags: ['silicone', 'full-doll'],
  extended: { ...sampleProducts[0].extended, brand: 'Irontech', material: 'silicone', bodyType: 'female' as const } };
describe('DOL-225 approved contextual-link rollout', () => {
  it('preserves the twenty-page sample and enables canonical route families only', () => {
    expect(sample).toHaveLength(20); expect(new Set(sample).size).toBe(20);
    for (const path of sample) {
      for (const env of ['preview', 'production']) expect(contextualLinksEnabled(path, { VERCEL_ENV: env })).toBe(true);
      for (const env of ['development', '']) expect(contextualLinksEnabled(path, { VERCEL_ENV: env })).toBe(false);
    }
    for (const env of ['preview', 'production']) {
      expect(contextualLinksEnabled('/products/outside-sample', { VERCEL_ENV: env })).toBe(true);
      for (const path of ['/learn/draft', '/products/x?preview=1', '/products/x#section', '/shop/x/y', '/brands/', '//products/x']) {
        expect(contextualLinksEnabled(path, { VERCEL_ENV: env })).toBe(false);
      }
    }
  });
  it('keeps every retained identity-review source out of the rollout without changing products', () => {
    expect(excludedHandles).toHaveLength(18);
    for (const handle of excludedHandles) {
      const source = { ...product, handle };
      expect(productContextualLinks(source)).toEqual([]);
      expect(catalogContextualLinks('/shop/silicone', [source])).toEqual([]);
    }
  });
  it('links known brands to their preferred brand hub and a matching parent', () => {
    const links = productContextualLinks(product);
    expect(links).toContainEqual({ href: '/brands/irontech-dolls', label: 'More from Irontech Dolls', kind: 'brand' });
    expect(links.some(link => link.href === '/shop/silicone')).toBe(true);
    expect(links.filter(link => link.kind === 'guide')).toHaveLength(2);
    expect(links).toHaveLength(4);
  });
  it('does not route a hybrid into a full-silicone collection', () => {
    const links = productContextualLinks({ ...product, tags: ['hybrid', 'full-doll'], extended: { ...product.extended, material: 'hybrid' } });
    expect(links.some(link => link.href === '/shop/hybrid')).toBe(true);
    expect(links.some(link => link.href === '/shop/silicone')).toBe(false);
  });
  it('uses torso format before material or body type', () => {
    const links = productContextualLinks({ ...product, productType: 'Silicone torso', tags: ['torso', 'silicone'] });
    expect(links.some(link => link.href === '/shop/torsos')).toBe(true);
    expect(links.some(link => link.href === '/shop/silicone')).toBe(false);
  });
  it('uses male-bodied collection and guide rather than buyer gender', () => {
    const links = productContextualLinks({ ...product, tags: ['silicone', 'male-doll', 'full-doll'], extended: { ...product.extended, bodyType: 'male' } });
    expect(links.some(link => link.href === '/shop/male-dolls')).toBe(true);
    expect(links.some(link => link.href === '/learn/male-sex-doll-buying-guide')).toBe(true);
  });
  it('does not route a standalone head into a full-doll parent or handling guide', () => {
    const links = productContextualLinks({ ...product, productType: 'Standalone head', tags: ['head-only', 'silicone'] });
    expect(links.some(link => link.kind === 'collection')).toBe(false);
    expect(links.some(link => link.href.includes('size-weight'))).toBe(false);
  });
  it.each(['dollwow-test', 'custom-option-charge', 'dollwow-system', 'safety-hold'])('excludes %s sources from new links', tag => {
    const hidden = { ...product, tags: [tag] };
    expect(productContextualLinks(hidden)).toEqual([]);
    expect(catalogContextualLinks('/brands/irontech-dolls', [hidden])).toEqual([]);
  });
  it('does not link hidden brands or unknown brand guesses', () => {
    expect(productContextualLinks({ ...product, vendor: 'Zelex', extended: { ...product.extended, brand: 'Zelex' } })).toEqual([]);
    expect(productContextualLinks({ ...product, vendor: 'Unknown', extended: { ...product.extended, brand: 'Unknown' } }).some(link => link.kind === 'brand')).toBe(false);
  });
  it('adds only represented material choices on brand hubs', () => {
    const links = catalogContextualLinks('/brands/irontech-dolls', [product]);
    expect(links.map(link => link.href)).toEqual(['/shop/sex-dolls', '/shop/silicone']);
  });
  it('adds only brands represented in the current collection', () => {
    const links = catalogContextualLinks('/shop/silicone', [product]);
    expect(links.map(link => link.href)).toEqual(['/shop/sex-dolls', '/brands/irontech-dolls']);
  });
  it('never emits a self-link, private parameter or duplicate target', () => {
    for (const path of ['/shop/sex-dolls', '/shop/silicone', '/brands/irontech-dolls']) {
      const links = catalogContextualLinks(path, [product, product]);
      expect(links.length).toBe(new Set(links.map(link => link.href)).size);
      for (const link of links) {
        expect(link.href).not.toBe(path); expect(link.href).toMatch(/^\/(brands|shop)\/[a-z0-9-]+$/);
      }
    }
  });
});
