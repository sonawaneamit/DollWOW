import { expect, it } from 'vitest';
import snapshots from '@/data/draft-previews/se-elf-pdps.json';
import type { Product } from '@/types/product';
import { getCustomizationConfig } from '@/lib/customization/configs';
import { withSeOct27PreviewRules } from '@/lib/customization/se-oct27-preview';
import { getDefaultSelections, resolveCustomization } from '@/lib/customization/resolve';

it('defaults the exact four Elf products to included photographed skin outside preview', () => {
  for (const [index, raw] of snapshots.entries()) {
    const product = raw as unknown as Product;
    const config = getCustomizationConfig(product);
    const defaults = getDefaultSelections(config);
    expect(defaults['skin-tone']).toBe('photographed-skin');
    expect(config.groups.find(group => group.id === 'skin-tone')!.options[0].label)
      .toBe(`${index < 2 ? 'Red' : 'Black'} (as photographed)`);
    expect(defaults['choose-head']).toBe('factory-default');
    expect(config.groups.find(group => group.id === 'choose-head')!.options).toHaveLength(49);
    expect(!!config.groups.find(group => group.id === 'silicone-head-upgrade')).toBe(index > 0);
    expect(!!config.groups.find(group => group.id === 'body-weight')).toBe(index > 0);
    const resolved = resolveCustomization(config, defaults, Number(product.priceRange.minVariantPrice.amount));
    expect(resolved.issues).toEqual([]);
    expect(resolved.optionPriceDelta).toBe(0);
    expect(resolved.requiresPriceConfirmation).toBe(false);
  }
});

it('does not change an unrelated SE parent outside preview', () => {
  const product = {...snapshots[0], handle: 'sedoll-unrelated'} as unknown as Product;
  const config = getCustomizationConfig(product);
  expect(withSeOct27PreviewRules(product, config)).toBe(config);
  expect(getDefaultSelections(config)['skin-tone']).not.toBe('photographed-skin');
});

it('does not infer silicone-head availability in the photographed red/black skin', () => {
  const product = snapshots[0] as unknown as Product;
  const base = getCustomizationConfig(product);
  const config = withSeOct27PreviewRules(product, {...base, groups: [...base.groups,
    {id: 'silicone-head-upgrade', label: 'Silicone Head Upgrade', display: 'cards',
      options: [{id: 'keep-original-head', label: 'Keep the original head', priceDelta: 0},
        {id: 'silicone-test', label: 'Silicone head', priceDelta: 100}]}]});
  const selection = {...getDefaultSelections(config), 'silicone-head-upgrade': 'silicone-test'};
  expect(resolveCustomization(config, selection, 1645).issues.map(issue => issue.message))
    .toContain('Silicone head upgrades are currently available in Light Tan only.');
});
