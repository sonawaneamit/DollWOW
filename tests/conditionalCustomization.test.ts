import { describe, it, expect, vi } from 'vitest';
import type { BrandCustomizationConfig, CustomizationGroup, CustomizationSelections } from '@/types/customization';
import type { Product } from '@/types/product';
import { customizationVisibility } from '@/lib/customization/visibility';
import { getDefaultSelections, resolveCustomization } from '@/lib/customization/resolve';
import { getCustomizationConfig } from '@/lib/customization/configs';
import { templateConfigSignature } from '@/lib/customization/template-config-signature';
import { templateConfigurationPresets, type TemplatePresetDefinition } from '@/lib/customization/template-presets';
import { promotionOptionPrice, withPromotionOptionPricing } from '@/lib/promotions/optionPricing';
const state = vi.hoisted(() => ({ product: null as Product | null }));
vi.mock('@/lib/shopify/storefront', () => ({ getProductsByVariantIds: vi.fn(async () => new Map([['variant-test', state.product]])) }));
import { serverValidateAndRepriceLine } from '@/lib/cart/server-validation';

const option = (id: string, priceDelta = 0) => ({ id, label: id, priceDelta, priceVerified: true, purchasable: true });
function group(id: string, options: ReturnType<typeof option>[], visibleWhen?: CustomizationGroup['visibleWhen']): CustomizationGroup {
  return { id, label: id, display: 'compact', required: true, options, ...(visibleWhen ? { visibleWhen } : {}) };
}
const rule = (groupId: string, optionId: string) => ({ groupId, optionId });
function fixture(): BrandCustomizationConfig {
  return { id: 'test-conditional', brandLabel: 'Fixture', leadTimeNote: '', rules: [], groups: [
    group('main', [option('shown'), option('other')]),
    group('material', [option('tpe'), option('silicone')], [[rule('main', 'other')]]),
    group('tpe-hair', [option('wig')], [[rule('material', 'tpe')]]),
    group('silicone-hair', [option('wig'), option('implanted', 100)], [[rule('main', 'shown')], [rule('material', 'silicone')]]),
    group('hair-color', [option('black')], [[rule('silicone-hair', 'implanted')]]),
    group('extra-head', [option('none'), option('yes', 200)]),
    group('extra-material', [option('tpe'), option('silicone')], [[rule('extra-head', 'yes')]]),
    group('extra-finish', [option('standard'), option('enhanced', 70)], [[rule('extra-material', 'silicone')]]),
    { ...group('extras', [option('none'), option('care', 20)]), selectionMode: 'multiple', required: false },
  ] };
}
function product(config: BrandCustomizationConfig) {
  state.product = { id: 'test-product', title: 'Irontech test fixture', handle: 'irontech-test-fixture', vendor: 'Irontech', productType: 'Test fixture', tags: [],
    extended: { brand: 'Irontech', customizationGroups: config.groups },
    variants: [{ id: 'variant-test', availableForSale: true, price: { amount: '2000', currencyCode: 'USD' } }],
  } as unknown as Product;
  return state.product;
}
const line = (selections: CustomizationSelections) => ({ merchandiseId: 'variant-test', quantity: 2, attributes: [], selections });

describe('conditional customization shared by UI and cart', () => {
  it('omits hidden required fields from initial defaults and prices', () => {
    const config = fixture();
    const defaults = getDefaultSelections(config);
    expect(defaults).not.toHaveProperty('material');
    expect(defaults).not.toHaveProperty('tpe-hair');
    expect(defaults).toHaveProperty('silicone-hair', 'wig');
    expect(resolveCustomization(config, defaults, 2000)).toMatchObject({ issues: [], totalPrice: 2000 });
  });
  it('does not charge stale hidden choices or include them in cart properties', () => {
    const result = resolveCustomization(fixture(), { main: 'other', material: 'tpe', 'silicone-hair': 'implanted', 'hair-color': 'black', 'extra-head': 'none', 'extra-material': 'silicone', 'extra-finish': 'enhanced', extras: ['care'] }, 2000);
    expect(result.totalPrice).toBe(2020);
    expect(result.selections).not.toHaveProperty('extra-finish');
    expect(result.selections).not.toHaveProperty('hair-color');
    expect(result.cartAttributes.some(a => a.value.includes('implanted') || a.value.includes('enhanced'))).toBe(false);
  });
  it('restores active branch choices without mutating the saved user selections', () => {
    const selected = { main: 'other', material: 'tpe', 'silicone-hair': 'implanted', 'hair-color': 'black' };
    resolveCustomization(fixture(), selected, 2000);
    expect(selected['silicone-hair']).toBe('implanted');
    expect(resolveCustomization(fixture(), { ...selected, material: 'silicone' }, 2000).totalPrice).toBe(2100);
  });
  it('requires all AND terms and supports alternative OR branches', () => {
    const config = fixture();
    config.groups.push(group('both', [option('x')], [[rule('main', 'other'), rule('material', 'silicone')]]));
    expect(customizationVisibility(config, { main: 'other', material: 'tpe' }).activeGroupIds.has('both')).toBe(false);
    expect(customizationVisibility(config, { main: 'other', material: 'silicone' }).activeGroupIds.has('both')).toBe(true);
  });
  it('fails closed on cycles, missing references, duplicates and empty conditions', () => {
    for (const kind of ['cycle', 'missing', 'duplicate', 'empty']) {
      const config = fixture();
      if (kind === 'cycle') config.groups[0].visibleWhen = [[rule('material', 'tpe')]];
      if (kind === 'missing') config.groups[1].visibleWhen = [[rule('missing', 'x')]];
      if (kind === 'duplicate') config.groups.push(config.groups[0]);
      if (kind === 'empty') config.groups[1].visibleWhen = [];
      const result = resolveCustomization(config, {}, 2000);
      expect(result.issues, kind).not.toHaveLength(0);
      expect(result.selectedOptions, kind).toEqual([]);
    }
  });
  it('does not infer a conditional-menu price from FREE or first-option position', () => {
    const config = fixture();
    config.groups[0].options[0] = { id: 'shown', label: 'Shown (FREE)' };
    expect(resolveCustomization(config, {}, 2000).requiresPriceConfirmation).toBe(true);
  });
  it('does not approve or discount conditional options through legacy promotion label matching', () => {
    const config = fixture();
    config.groups[3].options[1] = { id: 'implanted', label: 'IronAI TalkX Box', priceDelta: 100, priceVerified: false, purchasable: false };
    const promoted = withPromotionOptionPricing(product(config), config, new Date('2026-09-13T12:00:00Z'));
    expect(promoted).toBe(config);
    expect(promotionOptionPrice(product(config), config.groups[3], config.groups[3].options[1], new Date('2026-09-13T12:00:00Z'), false)).toMatchObject({ displayDelta: 100, active: false });
    expect(resolveCustomization(promoted, { 'silicone-hair': 'implanted' }, 2000).requiresPriceConfirmation).toBe(true);
    config.groups[3].options[1].priceVerified = true;
    config.groups[3].options[1].purchasable = true;
    expect(resolveCustomization(withPromotionOptionPricing(product(config), config, new Date('2026-09-13T12:00:00Z')), { 'silicone-hair': 'implanted' }, 2000).totalPrice).toBe(2100);
  });
  it('includes branch rules in menu identity without changing legacy identities', () => {
    const config = fixture();
    const signature = templateConfigSignature(config);
    config.groups[1].visibleWhen = [[rule('main', 'shown')]];
    expect(templateConfigSignature(config)).not.toBe(signature);
    config.groups.forEach(g => delete g.visibleWhen);
    expect(templateConfigSignature(config)).not.toContain('visibleWhen');
  });
  it('preserves one-choice conditional controls and exact IDs through the Irontech importer', () => {
    const config = fixture();
    const imported = getCustomizationConfig(product(config));
    expect(imported.id).toBe('irontech-conditional-import-v1');
    expect(imported.groups.map(g => g.id)).toEqual(config.groups.map(g => g.id));
    expect(imported.groups[2].options).toHaveLength(1);
    expect(imported.groups[2].visibleWhen).toEqual(config.groups[2].visibleWhen);
    expect(imported.groups.some(g => g.id === 'choose-head')).toBe(false);
  });
  it('server rejects hidden submitted choices, including empty hidden groups', async () => {
    const config = fixture(); product(config);
    const hiddenCases: CustomizationSelections[] = [{ 'extra-finish': 'enhanced' }, { 'tpe-hair': [] }];
    for (const hidden of hiddenCases) {
      await expect(serverValidateAndRepriceLine(line({ ...getDefaultSelections(config), ...hidden }))).rejects.toThrow();
    }
  });
  it('server charges visible choices and quantity once using the same resolver', async () => {
    const config = fixture(); product(config);
    const resolved = resolveCustomization(config, { main: 'shown', 'silicone-hair': 'implanted', extras: ['care'] }, 2000);
    const result = await serverValidateAndRepriceLine(line(resolved.selections));
    expect(result.customizationCharge?.amount).toBe(240);
    expect(result.customizationCharge?.items.map(i => i.label)).toEqual(['implanted', 'care']);
  });
  it('server rejects unavailable and unverified conditional choices', async () => {
    for (const update of [{ priceVerified: false }, { purchasable: false }, { priceDelta: NaN }]) {
      const config = fixture(); Object.assign(config.groups[3].options[1], update); product(config);
      await expect(serverValidateAndRepriceLine(line({ ...getDefaultSelections(config), 'silicone-hair': 'implanted' }))).rejects.toThrow();
    }
  });
  it('does not offer a preset that silently loses a recipe upgrade to a hidden branch', () => {
    const config = fixture();
    const recipe: TemplatePresetDefinition = { tag: 'options:fixture', signature: templateConfigSignature(config), tiers: [
      { id: 'starter', description: 'One', add: [{ groupId: 'extras', optionId: 'care' }], remove: [] },
      { id: 'enthusiast', description: 'Two', add: [{ groupId: 'silicone-hair', optionId: 'implanted' }], remove: [] },
      { id: 'collector', description: 'Three', add: [{ groupId: 'extra-head', optionId: 'yes' }], remove: [] },
    ] };
    expect(templateConfigurationPresets(recipe, config, config, 2000, { main: 'other', material: 'tpe' })).toEqual([]);
  });
});
