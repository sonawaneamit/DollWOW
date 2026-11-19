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
