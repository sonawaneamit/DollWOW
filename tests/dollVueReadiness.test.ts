import { describe, expect, it } from 'vitest';
import type { Product } from '@/types/product';
import type { BrandCustomizationConfig } from '@/types/customization';
import { dollVueReadinessFingerprint, evaluateDollVueReadiness, reviewedDollVueConfig, type DollVueReadinessRecord } from '@/lib/dollvue/readiness';
import { DOLLVUE_APPEARANCE_POLICY } from '@/lib/dollvue/appearance';
import { publicProductPayload, homepageCardPayload } from '@/lib/catalog/publicPayload';

const product = { id: 'gid://shopify/Product/test', handle: 'review-fixture', title: 'Review fixture', tags: [],
  vendor: 'Fixture', productType: 'Doll', description: '', images: [], variants: [],
  featuredImage: { url: '/product-media/review-fixture.webp', altText: null, width: 400, height: 600 },
  priceRange: { minVariantPrice: { amount: '100', currencyCode: 'USD' }, maxVariantPrice: { amount: '100', currencyCode: 'USD' } },
  extended: { brand: 'Fixture', stockStatus: 'custom' },
} satisfies Product;
const config: BrandCustomizationConfig = { id: 'test', brandLabel: 'Fixture', leadTimeNote: '', rules: [], groups: [{
  id: 'eyes', label: 'Eye color', display: 'swatches', selectionMode: 'single', options: [
    { id: 'blue', label: 'Blue', priceDelta: 20, swatch: { kind: 'image', value: '/option-assets/blue.webp' } },
    { id: 'green', label: 'Green', priceDelta: 30, swatch: { kind: 'image', value: '/option-assets/green.webp' } },
  ],
}] };
const ready = (): DollVueReadinessRecord => ({ productId: product.id, policy: DOLLVUE_APPEARANCE_POLICY,
  fingerprint: dollVueReadinessFingerprint(product, config), status: 'ready', sourcePositions: [0],
  choices: [{ groupId: 'eyes', optionId: 'blue', reference: '/option-assets/blue.webp' }],
  imageDigests: { '/product-media/review-fixture.webp': 'a'.repeat(64), '/option-assets/blue.webp': 'b'.repeat(64) },
});
const context = { published: true, contentExcluded: false };

describe('DollVue review binding', () => {
  it('requires an explicit passing record', () => {
    expect(evaluateDollVueReadiness(product, config, undefined, context).ready).toBe(false);
    expect(evaluateDollVueReadiness(product, config, { ...ready(), status: 'needs-review' }, context).ready).toBe(false);
    expect(evaluateDollVueReadiness(product, config, ready(), context).publiclyAvailable).toBe(true);
  });
  it('does not authorize unpublished products for a public audience', () => {
    const result = evaluateDollVueReadiness(product, config, ready(), { ...context, published: false, privateReview: true });
    expect(result.ready).toBe(true);
    expect(result.publiclyAvailable).toBe(false);
    expect(reviewedDollVueConfig(config, result, 'public').groups[0].options.every(option => !option.dollVueEnabled)).toBe(true);
    expect(reviewedDollVueConfig(config, result, 'private').groups[0].options[0].dollVueEnabled).toBe(true);
  });
  it('invalidates changed photos, menu meaning, references and compatibility', () => {
    const changedPhoto = { ...product, featuredImage: { ...product.featuredImage, url: '/product-media/replaced.webp' } };
    expect(evaluateDollVueReadiness(changedPhoto, config, ready(), context).reason).toBe('stale-review');
    for (const change of [{ label: 'Head model' }, { visibleWhen: [[{ groupId: 'parent', optionId: 'on' }]] }]) {
      const changed = { ...config, groups: [{ ...config.groups[0], ...change }] };
      expect(evaluateDollVueReadiness(product, changed, ready(), context).reason).toBe('stale-review');
    }
    const changed = structuredClone(config);
    changed.groups[0].options[0].swatch!.value = '/option-assets/replaced.webp';
    expect(evaluateDollVueReadiness(product, changed, ready(), context).reason).toBe('stale-review');
  });
  it('does not invalidate appearance review for a scheduled price change', () => {
    const changed = structuredClone(config);
    changed.groups[0].options[0].priceDelta = 0;
    expect(evaluateDollVueReadiness(product, changed, ready(), context).ready).toBe(true);
  });
  it('requires reviewed byte digests for every source and reference', () => {
    expect(evaluateDollVueReadiness(product, config, { ...ready(), imageDigests: undefined }, context).reason).toBe('missing-image-binding');
    expect(evaluateDollVueReadiness(product, config, { ...ready(), imageDigests: { '/option-assets/blue.webp': 'b'.repeat(64) } }, context).ready).toBe(false);
  });
  it('enables only reviewed choices without changing checkout values', () => {
    const before = JSON.stringify(config);
    const result = reviewedDollVueConfig(config, evaluateDollVueReadiness(product, config, ready(), context), 'public');
    expect(result.groups[0].options.map(option => option.dollVueEnabled)).toEqual([true, false]);
    expect(result.groups[0].options.map(option => option.priceDelta)).toEqual([20, 30]);
    expect(JSON.stringify(config)).toBe(before);
  });
  it('rejects holds, RTS, wrong product and unapproved photo positions', () => {
    expect(evaluateDollVueReadiness(product, config, ready(), { ...context, contentExcluded: true }).ready).toBe(false);
    expect(evaluateDollVueReadiness({ ...product, extended: { ...product.extended, stockStatus: 'ready_to_ship' } }, config, ready(), context).ready).toBe(false);
    for (const change of [{ productId: 'other' }, { sourcePositions: [9] }, { sourcePositions: [] }, { choices: [] }]) {
      expect(evaluateDollVueReadiness(product, config, { ...ready(), ...change }, context).ready).toBe(false);
    }
  });
  it('sends only the capability flag across the customer boundary', () => {
    const source = { ...product, dollVueAvailable: true, readiness: ready() };
    for (const payload of [publicProductPayload(source), homepageCardPayload(source)]) {
      expect(payload.dollVueAvailable).toBe(true);
      expect(JSON.stringify(payload)).not.toContain('fingerprint');
      expect(JSON.stringify(payload)).not.toContain('sourcePositions');
    }
  });
});
