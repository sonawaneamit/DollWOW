import { afterEach, expect, test, vi } from 'vitest';
import snapshot from '../data/draft-previews/mmx-pdp-nov10.json';
import { mmxPdpPreviewProduct, mmxPdpPreviewRecipe } from '../lib/catalog/mmxPdpPreview';
import { getPrivateDraftPreview, privateDraftRecipe } from '../lib/catalog/privateDraftPreview';
import { getCustomizationConfig } from '../lib/customization/configs';
import { templateConfigurationPresets } from '../lib/customization/template-presets';
import { getDefaultSelections, resolveCustomization } from '../lib/customization/resolve';

afterEach(() => vi.unstubAllEnvs());
const handle = snapshot.products[0].handle;

test('MMX private PDP snapshots cannot be enabled on production or by the flag alone', async () => {
  expect(mmxPdpPreviewProduct(handle, { VERCEL_ENV: 'production', DOLLWOW_DOL261_PREVIEW: '1' })).toBeNull();
  expect(mmxPdpPreviewProduct(handle, { DOLLWOW_DOL261_PREVIEW: '1' })).toBeNull();
  expect(mmxPdpPreviewProduct(handle, { VERCEL_ENV: 'preview' })).toBeNull();
  vi.stubEnv('VERCEL_ENV', 'production');
  vi.stubEnv('DOLLWOW_DOL261_PREVIEW', '1');
  expect(await getPrivateDraftPreview(handle)).toBeNull();
});

test('all 18 actual private PDPs have exact recipes and do not preselect a paid spare', async () => {
  vi.stubEnv('VERCEL_ENV', 'preview');
  vi.stubEnv('DOLLWOW_DOL261_PREVIEW', '1');
  expect(snapshot.products).toHaveLength(18);
  for (const saved of snapshot.products) {
    const product = (await getPrivateDraftPreview(saved.handle))!;
    expect(product.id).toBe(saved.id);
    expect(product.tags.filter(tag => tag.startsWith('options:'))).toHaveLength(1);
    const config = getCustomizationConfig(product);
    const defaults = getDefaultSelections(config);
    const base = Number(product.priceRange.minVariantPrice.amount);
    const recipe = await privateDraftRecipe(product, config);
    const tiers = templateConfigurationPresets(recipe ?? null, config, config, base, defaults);
    expect(tiers.map(tier => tier.label)).toEqual(['Starter', 'Enthusiast', 'Collector']);
    const ultra = product.extended.bodyCode === '156B' || product.extended.bodyCode === '172A';
    expect(tiers.map(tier => tier.totalPrice - base)).toEqual(ultra ? [0, 100, 180] : [0, 100, 195]);
    for (const tier of tiers) {
      const selected = resolveCustomization(config, tier.selections, base);
      expect(selected.issues).toEqual([]);
      expect(selected.selectedOptions.some(option => option.groupId === 'accessories' && option.priceDelta > 0)).toBe(false);
    }
  }
});

test('private recipes reject changed identity, base price, template tag and menu', () => {
  vi.stubEnv('VERCEL_ENV', 'preview');
  vi.stubEnv('DOLLWOW_DOL261_PREVIEW', '1');
  const product = mmxPdpPreviewProduct(handle)!;
  const config = getCustomizationConfig(product);
  expect(mmxPdpPreviewRecipe({ ...product, id: 'gid://shopify/Product/1' }, config)).toBeNull();
  const changedPrice = structuredClone(product);
  changedPrice.priceRange.minVariantPrice.amount = '1.00';
  expect(mmxPdpPreviewRecipe(changedPrice, config)).toBeNull();
  expect(mmxPdpPreviewRecipe({ ...product, tags: [...product.tags, 'options:wrong-template'] }, config)).toBeNull();
  const changedMenu = structuredClone(config);
  changedMenu.groups[0].options[0].priceDelta = 500;
  expect(mmxPdpPreviewRecipe(product, changedMenu)).toBeNull();
});
