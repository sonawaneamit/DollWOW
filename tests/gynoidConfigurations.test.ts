import { describe, expect, it } from 'vitest';
import reviewed from '@/data/catalog/gynoid-approved-configurations.json';
import { gynoidProductFixture } from './fixtures/gynoid-product';
import { getCustomizationConfig, getFactoryCustomizationConfig } from '@/lib/customization/configs';
import { getGynoidCustomizationConfig, prepareGynoidTemplateCandidate, assertGynoidStandardCheckout } from '@/lib/customization/gynoid';
import { getDefaultSelections, resolveCustomization, isOptionAvailableForCheckout } from '@/lib/customization/resolve';
import { templateConfigurationPresets } from '@/lib/customization/template-presets';

describe('Gynoid exact retained configurations', () => {
  it.each(reviewed.products.map((row, index) => [row.handle, index] as const))('retains source groups, rules and all three tiers for %s', (_handle, index) => {
    const product = gynoidProductFixture(index), before = structuredClone(product);
    const config = getCustomizationConfig(product);
    const defaults = getDefaultSelections(config);
    expect(product).toEqual(before);
    expect(config.groups.map(g => g.id)).toEqual(product.extended.customizationGroups!.map(g => g.id));
    expect(config.groups.every(g => !g.visibleWhen || JSON.stringify(g.visibleWhen) ===
      JSON.stringify(product.extended.customizationGroups!.find(original => original.id === g.id)?.visibleWhen))).toBe(true);
    expect(config.rules).toEqual(reviewed.rules[reviewed.products[index].ruleSet as keyof typeof reviewed.rules]);
    expect(resolveCustomization(config, defaults, 5299).issues).toEqual([]);
    const candidate = prepareGynoidTemplateCandidate(product, config)!;
    const presets = templateConfigurationPresets(candidate, config, config, 5299, defaults);
    expect(presets.map(p => p.totalPrice)).toEqual([5299, 5449, 5549]);
    expect(presets.every(p => resolveCustomization(config, p.selections, 5299).issues.length === 0)).toBe(true);
    expect(candidate.tiers[0].description).toContain('Selected body');
    for (const factory of [config, getFactoryCustomizationConfig(product)]) {
      const head = factory.groups.find(g => g.id === 'head')!;
      expect(head.options.find(o => o.id === 'no-change')).toMatchObject({ priceDelta: 0, priceVerified: true });
      for (const option of head.options.filter(o => o.id !== 'no-change')) {
        expect(option.priceDelta).toBeUndefined();
        expect(option).toMatchObject({ priceVerified: false, purchasable: false });
        expect(isOptionAvailableForCheckout(factory, 'head', option.id)).toBe(false);
      }
    }
  });

  it.each([3, 6])('calculates both body-version bases without turning Deluxe into a softness option: %i', index => {
    const product = gynoidProductFixture(index), config = getCustomizationConfig(product);
    const defaults = getDefaultSelections(config), candidate = prepareGynoidTemplateCandidate(product, config)!;
    for (const base of index === 3 ? [5299, 5799] : [4799, 5099]) {
      expect(templateConfigurationPresets(candidate, config, config, base, defaults).map(p => p.totalPrice))
        .toEqual([base, base + 150, base + 250]);
    }
    if (index === 6) expect(config.groups.find(g => g.id === 'body-version')?.label).toBe('Body model');
  });

  it('rejects incompatible softness, standing/loose-joint and unsupported jaw constructions', () => {
    const config = getCustomizationConfig(gynoidProductFixture(3)), defaults = getDefaultSelections(config);
    const premium = 'premium-head-body-options-multiple';
    for (const selections of [
      { ...defaults, [premium]: ['full-body-extra-softness-including-butts', 'full-body-extra-softness-excluding-butts'] },
      { ...defaults, joint: 'loose-joint-ideal-for-physical-contact' },
      { ...defaults, 'head-type': 'movable-jaw-free' }
    ]) expect(resolveCustomization(config, selections, 5299).issues.length).toBeGreaterThan(0);
    for (const index of [6, 7]) {
      const supported = getCustomizationConfig(gynoidProductFixture(index));
      expect(resolveCustomization(supported, { ...getDefaultSelections(supported), 'head-type': 'movable-jaw-free' }, 4799).issues).toEqual([]);
    }
  });

  it.each(['missing-menu', 'missing-fixed-group', 'duplicate-group', 'duplicate-option', 'bad-condition', 'missing-tag', 'missing-default', 'wrong-head'])('fails closed for %s instead of using generic defaults', failure => {
    const p = gynoidProductFixture(6), groups = p.extended.customizationGroups!;
    if (failure === 'missing-menu') p.extended.customizationGroups = undefined;
    if (failure === 'missing-fixed-group') groups.shift();
    if (failure === 'duplicate-group') groups.push(groups[0]);
    if (failure === 'duplicate-option') groups[1].options.push(groups[1].options[0]);
    if (failure === 'bad-condition') groups[2].visibleWhen = [[{ groupId: 'missing', optionId: 'missing' }]];
    if (failure === 'missing-tag') p.tags = [];
    if (failure === 'missing-default') groups.find(g => g.id === 'head')!.options = [{ id: 'other', label: 'Unknown' }];
    if (failure === 'wrong-head') p.extended.headModel = 'Another head';
    expect(() => getCustomizationConfig(p)).toThrow();
  });
  it.each([0, 1, 2, 4, 5, 7, 8, 9, 10])('binds the retained Standard price and ID for parent %i', index => {
    const row = reviewed.products[index], product = gynoidProductFixture(index);
    product.variants = [{ id: row.standardVariantId, title: 'Default Title', availableForSale: true,
      price: { amount: String(row.standardUSD), currencyCode: 'USD' }, selectedOptions: [] }];
    expect(() => assertGynoidStandardCheckout(product, row.standardVariantId)).not.toThrow();
    expect(() => assertGynoidStandardCheckout(product, 'gid://shopify/ProductVariant/999')).toThrow();
    product.variants[0].price.amount = '1';
    expect(() => assertGynoidStandardCheckout(product, row.standardVariantId)).toThrow();
  });
  it('does not clear Laura, another head/body or a similar brand by name', () => {
    for (const kind of ['id', 'handle', 'preview']) {
      const p = gynoidProductFixture();
      if (kind === 'id') p.id = 'gid://shopify/Product/999';
      if (kind === 'handle') p.handle += '-laura';
      if (kind === 'preview') p.id = 'preview:gynoid:10637906968760';
      expect(getGynoidCustomizationConfig(p)).toBeNull();
      expect(prepareGynoidTemplateCandidate(p, { id: 'other', brandLabel: 'Gynoid', leadTimeNote: '', groups: [], rules: [] })).toBeNull();
    }
  });
});
