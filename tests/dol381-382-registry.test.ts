import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import registry from '@/lib/customization/evidence/template-release.json';
import readback from './fixtures/dol381-382-admin-readback-2026-11-19.json';
import { getCustomizationConfig } from '@/lib/customization/configs';
import { getDefaultSelections } from '@/lib/customization/resolve';
import { templateRuntimeHash, templateReleaseIssues, createReleasedTemplateSelector } from '@/lib/customization/template-release-registry';
import { templateConfigSignature } from '@/lib/customization/template-config-signature';
import { templateConfigurationPresets } from '@/lib/customization/template-presets';
import type { Product } from '@/types/product';

const sha = (value: string) => createHash('sha256').update(value).digest('hex');
const expected: Record<string, number[]> = {
  'gid://shopify/Product/10742344941752': [2416, 2684, 3061], // Clara T74
  'gid://shopify/Product/10742344974520': [2366, 2634, 3011], // Tessa T75
  'gid://shopify/Product/10742348513464': [2679, 2779, 2979]  // Scarlett S60 ROS MAX
};

describe('DOL-381/382 production registry relink (Admin readback 2026-11-19)', () => {
  it('keeps the whole release registry valid', () => {
    expect(templateReleaseIssues(registry)).toEqual([]);
  });
  const select = createReleasedTemplateSelector(registry);
  for (const row of readback) {
    const product = row.product as unknown as Product;
    it(`binds ${product.handle} to its exact runtime and tier totals`, () => {
      const config = getCustomizationConfig(product);
      const entry = registry.payload.entries.find(item => item.productId === product.id)!;
      expect(entry.handle).toBe(product.handle);
      expect(entry.runtimeHash).toBe(templateRuntimeHash(product, config));
      const binding = (registry.payload.bindings as Record<string, { signature: string }>)[entry.bindingKey];
      expect(binding.signature).toBe(`sha256:${sha(templateConfigSignature(config))}`);
      const recipe = select(product, config);
      expect(recipe).not.toBeNull();
      const tiers = templateConfigurationPresets(recipe, config, config, Number(product.variants[0].price.amount), getDefaultSelections(config));
      expect(tiers.map(tier => tier.totalPrice)).toEqual(expected[product.id]);
    });
  }
});

import namedRegistry from '@/lib/cart/evidence/named-upgrades-release.json';
import { releasedNamedBindings } from '@/lib/cart/named-upgrade-release';
import { upgradeBindingAcceptsChoice } from '@/lib/cart/exact-upgrade-lines';

describe('Scarlett S60 ROS MAX named checkout charges', () => {
  const scarlett = readback.find(row => row.product.id === 'gid://shopify/Product/10742348513464')!.product as unknown as Product;
  const parent = scarlett.variants[0].id;
  it('uses the same charge family as the live Luna 171cm ROS MAX body', () => {
    const parents = namedRegistry.payload.parents as Record<string, string>;
    expect(parents[parent]).toBe(parents['gid://shopify/ProductVariant/54084738089144']);
  });
  it('maps every paid Scarlett option to exactly one released charge at the same price', () => {
    const bindings = releasedNamedBindings(namedRegistry, [parent]);
    const config = getCustomizationConfig(scarlett);
    const paid = config.groups.flatMap(group => group.options.filter(option => (option.priceDelta ?? 0) > 0).map(option => ({ group: group.label, option })));
    expect(paid.length).toBeGreaterThan(50);
    for (const { group, option } of paid) {
      const matches = bindings.filter(binding => binding.group === group && upgradeBindingAcceptsChoice(binding, option.label) && binding.unitAmount === option.priceDelta);
      expect(matches, `${group}: ${option.label}`).toHaveLength(1);
    }
    const ros = config.groups.find(group => group.id === 'head-type')!.options.find(option => option.id === 'ros-max-upgrade-free')!;
    expect(ros.priceDelta).toBe(0);
  });
});
