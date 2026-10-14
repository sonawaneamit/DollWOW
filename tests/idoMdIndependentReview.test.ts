import { afterEach, describe, expect, it, vi } from 'vitest';
import { sampleProducts } from '@/lib/data/sample-products';
import { readFileSync } from 'node:fs';
import { getCustomizationConfig } from '@/lib/customization/configs';
import { getDefaultSelections, getOptionConflict, resolveCustomization } from '@/lib/customization/resolve';
import { MD_MENU_TAG } from '@/lib/customization/ido-md';
import { promotionPricingForSelections } from '@/lib/promotions/optionPricing';
import { templateConfigurationPresets } from '@/lib/customization/template-presets';
import { templateConfigSignature } from '@/lib/customization/template-config-signature';
import type { CustomizationGroup } from '@/types/customization';
import type { Product } from '@/types/product';

const mocks = vi.hoisted(() => ({ getProductsByVariantIds: vi.fn() }));
vi.mock('@/lib/shopify/storefront', () => ({ getProductsByVariantIds: mocks.getProductsByVariantIds }));
import { serverValidateAndRepriceLine } from '@/lib/cart/server-validation';
import { namedUpgradeBuilds } from '@/lib/cart/named-upgrade-builds';

const body = 'premium-head-body-options-multiple';
const option = (id: string, priceDelta = 0) => ({ id, label: id, priceDelta, priceVerified: true });
function product(): Product {
  const groups: CustomizationGroup[] = [
    { id: 'head', label: 'Head', display: 'compact', required: true, options: [option('no-change'), option('other-heads')] },
    { id: 'other-heads', label: 'Other Heads', display: 'compact', required: true,
      visibleWhen: [[{ groupId: 'head', optionId: 'other-heads' }]],
      options: [{ ...option('choose-a-head'), purchasable: false }, option('m22'), option('m55'), option('m999')] },
    { id: 'head-type', label: 'Head Type', display: 'compact', required: true, options: [option('ros-head-movable-jaw'), option('hard-silicone')] },
    { id: body, label: 'Body', display: 'compact', selectionMode: 'multiple', options: [
      option('hard-hand'), option('articulated-fingers-free'), option('soft-butt', 100),
      option('bionic-skin-softer-skin', 299), option('subcutaneous-heating', 149)
    ] },
    { id: 'accessories', label: 'Accessories', display: 'compact', selectionMode: 'multiple',
      options: [option('vine-talk-ai-box-free'), option('care-kit', 99)] }
  ];
  return { ...sampleProducts[0], vendor: 'MD Doll', tags: [MD_MENU_TAG],
    variants: [{ ...sampleProducts[0].variants[0], availableForSale: true }],
    extended: { brand: 'MD Doll', headModel: 'M22', material: 'silicone', stockStatus: 'custom', customizationGroups: groups } };
}

afterEach(() => vi.useRealTimers());
describe('independent IDO/MD release review', () => {
  it('allows entering Other Heads from the included ROS default without enabling checkout of a placeholder', () => {
    const config = getCustomizationConfig(product());
    const defaults = getDefaultSelections(config);
    expect(defaults['head-type']).toBe('ros-head-movable-jaw');
    expect(getOptionConflict(config, defaults, 'head', 'other-heads')).toBeNull();
    const pending = resolveCustomization(config, { ...defaults, head: 'other-heads' }, 2899);
    expect(pending.requiresPriceConfirmation).toBe(true);
    expect(getOptionConflict(config, { ...defaults, head: 'other-heads' }, 'other-heads', 'm22')).toBeNull();
    expect(getOptionConflict(config, { ...defaults, head: 'other-heads' }, 'other-heads', 'm55')).toBeNull();
    expect(getOptionConflict(config, { ...defaults, head: 'other-heads' }, 'other-heads', 'm999')).not.toBeNull();
  });

  it('keeps fixed inclusions and independent choices across all three preset tiers and campaign expiry', () => {
    const p = product(), config = getCustomizationConfig(p);
    const definition = { tag: MD_MENU_TAG, signature: templateConfigSignature(config), tiers: [
      { id: 'starter' as const, description: 'Included build', add: [{ groupId: body, optionId: 'articulated-fingers-free' }], remove: [] },
      { id: 'enthusiast' as const, description: 'Softness', add: [{ groupId: body, optionId: 'soft-butt' }], remove: [] },
      { id: 'collector' as const, description: 'Heating', add: [{ groupId: body, optionId: 'subcutaneous-heating' }], remove: [] }
    ] };
    const octoberConfig = promotionPricingForSelections(p, config, {}, new Date('2026-10-31T12:00:00Z')).config;
    const current = { ...getDefaultSelections(octoberConfig),
      [body]: ['hard-hand', 'articulated-fingers-free', 'bionic-skin-softer-skin'],
      accessories: ['vine-talk-ai-box-free', 'care-kit'] };
    for (const [date, bionicPrice] of [['2026-10-31T12:00:00Z', 0], ['2026-11-01T07:00:00Z', 299]] as const) {
      const priced = promotionPricingForSelections(p, config, current, new Date(date)).config;
      const resolved = resolveCustomization(priced, current, 2899);
      const presets = templateConfigurationPresets(definition, config, priced, 2899, resolved.selections);
      expect(presets, date).toHaveLength(3);
      expect(presets.map(tier => tier.totalPrice)).toEqual([2998 + bionicPrice, 2998 + bionicPrice, 3147 + bionicPrice]);
      for (const preset of presets) {
        expect(preset.selections[body]).toContain('hard-hand');
        expect(preset.selections.accessories).toContain('care-kit');
      }
    }
    const source = readFileSync('components/ProductOptions.tsx', 'utf8');
    expect(source).toContain('config.id === MD_MENU_TAG.slice(8) ? resolved.selections : selected');
    expect(source).toContain('templateConfigurationPresets(templateRecipe, config, pricedConfig, basePrice, presetSelections)');
  });

  it('reprices the conditional softness benefit on the server when bionic skin is removed', async () => {
    vi.setSystemTime(new Date('2026-11-02T12:00:00Z'));
    const p = product();
    mocks.getProductsByVariantIds.mockResolvedValue(new Map([[p.variants[0].id, p]]));
    const request = (choices: string[]) => serverValidateAndRepriceLine({
      merchandiseId: p.variants[0].id, quantity: 1, attributes: [], selections: { [body]: choices }
    });
    expect((await request(['soft-butt', 'bionic-skin-softer-skin'])).customizationCharge?.amount).toBe(299);
    expect((await request(['soft-butt'])).customizationCharge?.amount).toBe(100);
  });

  it('does not retain conditional free softness after the paid bionic cart child is removed', async () => {
    vi.setSystemTime(new Date('2026-11-02T12:00:00Z'));
    const p = product();
    mocks.getProductsByVariantIds.mockResolvedValue(new Map([[p.variants[0].id, p]]));
    const validated = await serverValidateAndRepriceLine({
      merchandiseId: p.variants[0].id, quantity: 1, attributes: [],
      selections: { [body]: ['soft-butt', 'bionic-skin-softer-skin'] }
    });
    expect(validated.customizationCharge?.items).toHaveLength(1);
    expect(validated.customizationCharge?.items[0].dependencyDetails?.included)
      .toContainEqual({ key: 'Included: Body', value: 'soft-butt' });
    const builds = namedUpgradeBuilds({ lines: { pageInfo: { hasNextPage: false }, nodes: [{
      id: 'parent', quantity: 1, parentRelationship: null,
      merchandise: { id: p.variants[0].id, product: { title: p.title } },
      attributes: [...validated.namedUpgradeAttributes!, { key: '_DollWOW_checkout_model', value: 'named-upgrades-v1' }]
    }] } }, [{ parentVariantId: p.variants[0].id, group: 'Body', label: 'bionic-skin-softer-skin',
      unitAmount: 299, currencyCode: 'USD', merchandiseId: 'bionic-child', productTitle: 'Bionic skin' }]);
    expect(builds[0].includedChoices.some(attribute => attribute.value.includes('soft-butt'))).toBe(false);
  });
});
