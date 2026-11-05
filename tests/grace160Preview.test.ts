import { describe, it, expect } from 'vitest';
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
