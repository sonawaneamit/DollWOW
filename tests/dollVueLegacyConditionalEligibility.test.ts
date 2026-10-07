import { beforeEach, expect, it, vi } from 'vitest';
import type { BrandCustomizationConfig } from '@/types/customization';
import type { DollVueReadinessRecord } from '@/lib/dollvue/readiness';
import { sampleProducts } from '@/lib/data/sample-products';
import { areDollVueSelectionsValid, dollVueGroups } from '@/lib/dollvue/config';
import { dollVueReadinessFingerprint } from '@/lib/dollvue/readiness';
import { DOLLVUE_APPEARANCE_POLICY } from '@/lib/dollvue/appearance';

const state = vi.hoisted(() => ({ registry: {} as Record<string, DollVueReadinessRecord>, config: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/dollvue/readiness-registry.json', () => ({ default: state.registry }));
vi.mock('@/lib/customization/configs', () => ({ getCustomizationConfig: state.config }));
vi.mock('@/lib/dollvue/currentHold', () => ({ getCurrentDollVueHold: async () => 'clear' }));
import { resolveCurrentDollVueEligibility, withDollVueCatalogEligibility } from '@/lib/dollvue/eligibility';

const reference = '/option-assets/blue.webp';
const source = '/product-media/conditional.webp';
const iris = [{ groupId: 'eye-color', optionId: 'blue' }];
function fixture(brand: string) {
  const product = { ...sampleProducts[0], id: `gid://shopify/Product/${brand}`, handle: `${brand}-conditional-fixture`,
    vendor: brand, tags: [], productType: 'Custom Doll', featuredImage: { url: source, altText: 'Fixture' },
    images: [{ url: source, altText: 'Fixture' }],
    extended: { ...sampleProducts[0].extended, stockStatus: 'custom' as const, brand } };
  const config: BrandCustomizationConfig = { id: 'legacy-test', brandLabel: brand, leadTimeNote: '', rules: [], groups: [
    { id: 'head', label: 'Head', display: 'cards', options: [{ id: 'no-change', label: 'As shown' }] },
    { id: 'eye-color', label: 'Eye Color', display: 'swatches', visibleWhen: [[{ groupId: 'head', optionId: 'no-change' }]],
      options: [{ id: 'blue', label: 'Blue', dollVueEnabled: true, swatch: { kind: 'image', value: reference } }] },
  ] };
  state.config.mockReturnValue(config);
  return { product, config };
}
beforeEach(() => {
  vi.clearAllMocks();
  for (const id of Object.keys(state.registry)) delete state.registry[id];
});

it.each(['irontech', 'starpery', 'lusandy'])('does not expand recordless %s conditional choices or mutate its defaults', async brand => {
  const { product, config } = fixture(brand), before = structuredClone(config);
  expect(areDollVueSelectionsValid(config, iris)).toBe(true);
  const result = await resolveCurrentDollVueEligibility(product);
  expect(result.available).toBe(false);
  expect(dollVueGroups(result.config)).toEqual([]);
  expect(areDollVueSelectionsValid(result.config, iris)).toBe(false);
  expect(result.config.groups[1].visibleWhen).toEqual(config.groups[1].visibleWhen);
  expect(config).toEqual(before);
  // Lightweight legacy cards retain their existing coarse eligibility, without config hydration.
  state.config.mockClear();
  expect(withDollVueCatalogEligibility(product).dollVueAvailable).toBe(true);
  expect(state.config).not.toHaveBeenCalled();
});

it('preserves unconditional legacy choices while disabling conditional choices in the same menu', async () => {
  const { product, config } = fixture('irontech');
  config.groups.push({ id: 'hairstyle', label: 'Hairstyle', display: 'swatches', options: [
    { id: 'long', label: 'Long', dollVueEnabled: true, swatch: { kind: 'image', value: '/option-assets/long.webp' } },
  ] });
  const result = await resolveCurrentDollVueEligibility(product);
  expect(result.available).toBe(true);
  expect(dollVueGroups(result.config).map(group => group.id)).toEqual(['hairstyle']);
  expect(areDollVueSelectionsValid(result.config, iris)).toBe(false);
  expect(areDollVueSelectionsValid(result.config, [{ groupId: 'hairstyle', optionId: 'long' }])).toBe(true);
});

it('allows exact reviewed Gynoid conditional eyes and never falls back for stale records', async () => {
  const { product, config } = fixture('gynoid');
  state.registry[product.id] = { productId: product.id, policy: DOLLVUE_APPEARANCE_POLICY,
    fingerprint: dollVueReadinessFingerprint(product, config), status: 'ready', sourcePositions: [0],
    choices: [{ ...iris[0], reference }], imageDigests: { [source]: 'a'.repeat(64), [reference]: 'b'.repeat(64) } };
  const result = await resolveCurrentDollVueEligibility(product);
  expect(result.available).toBe(true);
  expect(areDollVueSelectionsValid(result.config, iris)).toBe(true);
  config.groups[0].options.unshift({ id: 'replacement', label: 'Replacement' });
  expect((await resolveCurrentDollVueEligibility(product)).available).toBe(false);
});
