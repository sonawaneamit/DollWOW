import { describe, expect, it } from 'vitest';
import sample from '@/data/internal-link-sample.json';
import { sampleProducts } from '@/lib/data/sample-products';
import { catalogContextualLinks, contextualLinkSampleEnabled, productContextualLinks } from '@/lib/catalog/contextualLinks';

const product = { ...sampleProducts[0], handle: 'sample-doll', vendor: 'Irontech', productType: 'Custom silicone doll', tags: ['silicone', 'full-doll'],
  extended: { ...sampleProducts[0].extended, brand: 'Irontech', material: 'silicone', bodyType: 'female' as const } };
describe('DOL-225 bounded contextual-link sample', () => {
  it('has exactly twenty public source paths and is preview-only', () => {
    expect(sample).toHaveLength(20); expect(new Set(sample).size).toBe(20);
    for (const path of sample) {
      expect(contextualLinkSampleEnabled(path, { VERCEL_ENV: 'preview' })).toBe(true);
      for (const env of ['production', 'development', '']) expect(contextualLinkSampleEnabled(path, { VERCEL_ENV: env })).toBe(false);
    }
    expect(contextualLinkSampleEnabled('/products/outside-sample', { VERCEL_ENV: 'preview' })).toBe(false);
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
