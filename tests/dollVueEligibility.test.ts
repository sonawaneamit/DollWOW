import { describe, expect, it, vi } from 'vitest';
import { sampleProducts } from '@/lib/data/sample-products';
import type { Product } from '@/types/product';
import type { BrandCustomizationConfig } from '@/types/customization';
import { DOLLVUE_APPEARANCE_POLICY } from '@/lib/dollvue/appearance';
import { dollVueReadinessFingerprint, type DollVueReadinessRecord } from '@/lib/dollvue/readiness';

const mocks = vi.hoisted(() => ({ registry: {} as Record<string, DollVueReadinessRecord>, config: vi.fn(), hold: vi.fn() }));
vi.mock('@/lib/dollvue/readiness-registry.json', () => ({ default: mocks.registry }));
vi.mock('@/lib/customization/configs', () => ({ getCustomizationConfig: mocks.config }));
vi.mock('@/lib/dollvue/currentHold', () => ({ getCurrentDollVueHold: mocks.hold }));
import { resolveCurrentDollVueEligibility, resolveDollVueEligibility, withDollVueCatalogEligibility } from '@/lib/dollvue/eligibility';
import { isDollVueCatalogProduct } from '@/lib/dollvue/config';

const config: BrandCustomizationConfig = { id: 'test', brandLabel: 'Example', leadTimeNote: '', rules: [], groups: [{
  id: 'eyes', label: 'Eye color', display: 'swatches', options: [{ id: 'blue', label: 'Blue',
    priceDelta: 10, dollVueEnabled: true, swatch: { kind: 'image', value: '/option-assets/blue.webp' } }],
}] };
const product = (id: string, handle = 'example-reviewed-model'): Product => ({ ...sampleProducts[0], id, handle,
  productType: 'Custom Doll', tags: [], vendor: 'Example',
  featuredImage: { url: '/product-media/example.webp', altText: null }, images: [], media: [],
  extended: { brand: 'Example', stockStatus: 'custom' },
});

describe('shared DollVue eligibility', () => {
  it('rechecks private holds without exposing their contents or trusting a legacy flag', async () => {
    mocks.config.mockReturnValue(config);
    const p = product('private-hold', 'irontech-existing-example');
    for (const hold of ['held', 'unavailable']) {
      mocks.hold.mockResolvedValue(hold);
      expect((await resolveCurrentDollVueEligibility(p)).available).toBe(false);
    }
    mocks.hold.mockResolvedValue('clear');
    expect((await resolveCurrentDollVueEligibility(p)).available).toBe(true);
  });
  it('uses exact review data to enable a new brand and only reviewed choices', () => {
    mocks.config.mockReturnValue(config);
    const p = product('reviewed');
    mocks.registry[p.id] = { productId: p.id, policy: DOLLVUE_APPEARANCE_POLICY,
      fingerprint: dollVueReadinessFingerprint(p, config), status: 'ready', sourcePositions: [0],
      choices: [{ groupId: 'eyes', optionId: 'blue', reference: '/option-assets/blue.webp' }],
      imageDigests: { '/product-media/example.webp': 'a'.repeat(64), '/option-assets/blue.webp': 'b'.repeat(64) } };
    expect(resolveDollVueEligibility(p).available).toBe(true);
    expect(isDollVueCatalogProduct(withDollVueCatalogEligibility(p))).toBe(true);
    expect(resolveDollVueEligibility({ ...p, featuredImage: { url: '/product-media/changed.webp', altText: null } }).available).toBe(false);
  });
  it('never turns a candidate or a brand name alone into approval', () => {
    mocks.config.mockReturnValue(config);
    const p = product('candidate');
    expect(resolveDollVueEligibility(p).available).toBe(false);
    expect(isDollVueCatalogProduct(withDollVueCatalogEligibility(p))).toBe(false);
  });
  it('does not silently widen legacy coverage to formerly blocked example handles', () => {
    mocks.config.mockReturnValue(config);
    for (const handle of ['wm-head-sn-01-186cm-na-cup-silicone-companion-doll-1y0cj',
      'real-lady-shizuka-159cm-h-cup-silicone-companion-doll-1ldrw']) {
      const p = product(handle, handle);
      expect(resolveDollVueEligibility(p).available).toBe(false);
      expect(withDollVueCatalogEligibility(p).dollVueAvailable).toBe(false);
    }
  });
  it('preserves supported legacy products but rejects empty menus, holds and RTS', () => {
    mocks.config.mockReturnValue(config);
    const p = product('legacy', 'irontech-existing-example');
    expect(resolveDollVueEligibility(p).available).toBe(true);
    expect(resolveDollVueEligibility({ ...p, tags: ['content-review-hold'] }).available).toBe(false);
    expect(resolveDollVueEligibility({ ...p, extended: { stockStatus: 'ready_to_ship' } }).available).toBe(false);
    mocks.config.mockReturnValue({ ...config, groups: [] });
    expect(resolveDollVueEligibility(p).available).toBe(false);
  });
  it('never falls back to legacy eligibility for an explicit excluded record', () => {
    mocks.config.mockReturnValue(config);
    const p = product('held', 'irontech-existing-held');
    mocks.registry[p.id] = { productId: p.id, policy: DOLLVUE_APPEARANCE_POLICY, fingerprint: '',
      status: 'excluded', sourcePositions: [], choices: [] };
    expect(resolveDollVueEligibility(p).available).toBe(false);
    expect(isDollVueCatalogProduct(withDollVueCatalogEligibility(p))).toBe(false);
  });
});
