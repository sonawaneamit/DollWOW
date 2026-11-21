import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import registry from '@/lib/customization/evidence/template-release.json';
import namedRegistry from '@/lib/cart/evidence/named-upgrades-release.json';
import readback from './fixtures/dol382-nov21-admin-readback.json';
import { getCustomizationConfig } from '@/lib/customization/configs';
import { getDefaultSelections } from '@/lib/customization/resolve';
import { templateRuntimeHash, templateReleaseIssues, createReleasedTemplateSelector } from '@/lib/customization/template-release-registry';
import { templateConfigSignature } from '@/lib/customization/template-config-signature';
import { templateConfigurationPresets } from '@/lib/customization/template-presets';
import { releasedNamedBindings } from '@/lib/cart/named-upgrade-release';
import { upgradeBindingAcceptsChoice } from '@/lib/cart/exact-upgrade-lines';
import { getBrandAuthorization, isLiveAuthorizedBrand } from '@/lib/catalog/authorizations';
import { getCatalogBrand } from '@/lib/catalog/brands';
import type { Product } from '@/types/product';

const sha = (value: string) => createHash('sha256').update(value).digest('hex');
// Tier totals Martin approved for DOL-382 (19 Nov previews; 21 Nov held release), full price, no BFCM.
const expected: Record<string, number[]> = {
  'gid://shopify/Product/10745002033336': [1859, 1859, 1959], // Climax Lexi SiP157
  'gid://shopify/Product/10745002688696': [1859, 1859, 1959], // Climax Frida SiP157
  'gid://shopify/Product/10745005473976': [2359, 2459, 2659], // FU White Peach 163 I
  'gid://shopify/Product/10745005637816': [2359, 2459, 2659], // FU Qin Xingyue 163 I
  'gid://shopify/Product/10745005801656': [2299, 2399, 2599], // FU Luo Chengchuan 176 male (9-ending tiers, 21 Nov)
  'gid://shopify/Product/10638363754680': [2159, 2259, 2459], // FU Anna 162 F
  'gid://shopify/Product/10638363852984': [2159, 2259, 2459], // FU Tifa 162 F
  'gid://shopify/Product/10638363951288': [2259, 2359, 2559], // FU Lisa 157 G RST
  'gid://shopify/Product/10638364049592': [2159, 2259, 2459]  // FU Ziqing 165 F
};

describe('DOL-382 Nov 21 go-live registry (Admin readback)', () => {
  it('keeps the whole release registry valid', () => {
    expect(templateReleaseIssues(registry)).toEqual([]);
    expect(readback).toHaveLength(9);
  });
  const select = createReleasedTemplateSelector(registry);
  for (const row of readback) {
    const product = row.product as unknown as Product;
    it(`binds ${product.handle} to its exact runtime and tier totals`, () => {
      expect(product.tags).not.toContain('dollwow-test');
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
    it(`maps every paid ${product.handle} option to exactly one released charge at the same price`, () => {
      const parent = product.variants[0].id;
      const bindings = releasedNamedBindings(namedRegistry, [parent]);
      const config = getCustomizationConfig(product);
      const paid = config.groups.flatMap(group => group.options.filter(option => (option.priceDelta ?? 0) > 0).map(option => ({ group: group.label, option })));
      expect(paid.length).toBeGreaterThan(20);
      for (const { group, option } of paid) {
        const matches = bindings.filter(binding => binding.group === group && upgradeBindingAcceptsChoice(binding, option.label) && binding.unitAmount === option.priceDelta);
        expect(matches, `${group}: ${option.label}`).toHaveLength(1);
      }
    });
  }
  it('uses the live Mayu/Rhea Climax charge family for the SiP157 dolls', () => {
    const parents = namedRegistry.payload.parents as Record<string, string>;
    expect(parents['gid://shopify/ProductVariant/54865227448504']).toBe(parents['gid://shopify/ProductVariant/53881313198264']);
    expect(parents['gid://shopify/ProductVariant/54865228726456']).toBe(parents['gid://shopify/ProductVariant/53881313296568']);
  });
});

describe('FU Doll authorization wording', () => {
  it('is a live catalog brand with an approved, certificate-pending authorization', () => {
    expect(getCatalogBrand('FUDOLL')?.value).toBe('fudoll');
    expect(isLiveAuthorizedBrand('FUDOLL')).toBe(true);
    const auth = getBrandAuthorization('FUDOLL')!;
    expect(auth.status).toBe('certificate-pending');
    expect(auth.certificatePendingStatement).toBe('Authorized FU Doll dealer: approved, certificate pending.');
    expect(auth.certificatePendingStatement).not.toMatch(/first (order|sale)/i);
  });
});
