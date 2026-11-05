import { describe, it, expect, vi } from 'vitest';
import { grace160TemplateRecipe } from '@/lib/customization/grace160-template';
import { customizationChargeLines } from '@/lib/shopify/storefront';
import { serverValidateAndRepriceLine } from '@/lib/cart/server-validation';
import snapshot from '@/data/draft-previews/grace160-nov5.json';
import recipe from '@/data/draft-previews/grace160-recipe-nov5.json';
import type { Product } from '@/types/product';
import { getCustomizationConfig } from '@/lib/customization/configs';
import { templateConfigSignature } from '@/lib/customization/template-config-signature';
import { grace160PreviewEnabled } from '@/lib/catalog/grace160Preview';
import { templateConfigurationPresets } from '@/lib/customization/template-presets';
import type { TemplatePresetDefinition } from '@/lib/customization/template-presets';

const product = snapshot as unknown as Product;
describe('Grace160 hidden preview', () => {
  it('cannot enable on production or from the flag alone', () => {
    expect(grace160PreviewEnabled({VERCEL_ENV:'production',NEXT_PUBLIC_DOL333_PREVIEW:'1'})).toBe(false);
    expect(grace160PreviewEnabled({NEXT_PUBLIC_DOL333_PREVIEW:'1'})).toBe(false);
    expect(grace160PreviewEnabled({VERCEL_ENV:'preview',NEXT_PUBLIC_DOL333_PREVIEW:'1'})).toBe(true);
  });
  it('inherits the exact existing factory menu and valid recipe', () => {
    const config=getCustomizationConfig(product);
    const definition={...recipe, signature:templateConfigSignature(config)} as TemplatePresetDefinition;
    const presets=templateConfigurationPresets(definition,config,config,2299,{});
    expect(presets.map(p=>p.label)).toEqual(['Starter','Enthusiast','Collector']);
    expect(presets.every(p=>p.totalPrice>=2299)).toBe(true);
    for(const tier of recipe.tiers)for(const choice of tier.add)expect(config.groups.find(g=>g.id===choice.groupId)?.options.some(o=>o.id===choice.optionId)).toBe(true);
    expect(config.groups.find(g=>g.id==='head')?.options.find(o=>o.id==='t64')?.priceDelta).toBe(0);
  });
  it('uses the corrected 160F identity and remains a hidden unavailable draft', () => {
    expect(product.extended.heightCm).toBe(160); expect(product.extended.cupSize).toBe('F-Cup');
    expect(product.extended.catalogBodyIdentityKey).toBe('top-fire__160cm__f-cup__silicone');
    expect(product.extended.measurements?.Waist).toContain('65 cm');
    expect(product.images).toHaveLength(10); expect(product.tags).toContain('dollwow-test');
    expect(product.variants[0].availableForSale).toBe(false);
  });
});


const fetchProducts = vi.hoisted(() => vi.fn());
vi.mock('@/lib/shopify/storefront', async importOriginal => ({
  ...await importOriginal<typeof import('@/lib/shopify/storefront')>(),
  getProductsByVariantIds: fetchProducts
}));

function releasedProduct(): Product {
  return {
    ...product,
    tags: product.tags.filter(tag => tag !== 'dollwow-test'),
    variants: product.variants.map(variant => ({ ...variant, availableForSale: true }))
  };
}

it('uses the same exact binding in preview and on the published product', () => {
  const live = releasedProduct();
  const config = getCustomizationConfig(live);
  const definition = grace160TemplateRecipe(live, config);
  expect(definition).toEqual(grace160TemplateRecipe(product, getCustomizationConfig(product), true));
  expect(grace160TemplateRecipe(product, config)).toBeNull();
  expect(grace160TemplateRecipe({ ...live, tags: [...live.tags, 'unexpected-tag'] }, config)).toBeNull();
  const edited = structuredClone(config);
  edited.groups.find(group => group.id === 'accessories')!.options.find(option => option.id === 'basic-head-stand')!.priceDelta = 1;
  expect(grace160TemplateRecipe(live, edited)).toBeNull();
  expect(templateConfigurationPresets(definition!, config, config, 2299, {}).map(p => p.totalPrice)).toEqual([2366, 2634, 3011]);
});

it('reprices all three preset selections through the cart validator and covers the exact charge amounts', async () => {
  const live = releasedProduct();
  const variantId = live.variants[0].id;
  const config = getCustomizationConfig(live);
  const definition = grace160TemplateRecipe(live, config);
  const presets = templateConfigurationPresets(definition!, config, config, 2299, {});
  fetchProducts.mockResolvedValue(new Map([[variantId, live]]));
  for (const [i, preset] of presets.entries()) {
    const result = await serverValidateAndRepriceLine({ merchandiseId: variantId, quantity: 1, selections: preset.selections });
    expect(result.customizationCharge?.amount).toBe([67, 335, 712][i]);
    expect(result.customizationCharge?.items.reduce((sum, item) => sum + item.amount, 0)).toBe(result.customizationCharge?.amount);
    if (process.env.SHOPIFY_CUSTOM_OPTION_CHARGE_VARIANTS) {
      expect(customizationChargeLines(result.customizationCharge).length).toBeGreaterThan(0);
    }
  }
  fetchProducts.mockResolvedValue(new Map());
  await expect(serverValidateAndRepriceLine({ merchandiseId: variantId, quantity: 1 })).rejects.toThrow('not available for checkout');
});
