import type { Product } from '@/types/product';
import type { BrandCustomizationConfig } from '@/types/customization';
import type { TemplatePresetDefinition } from '@/lib/customization/template-presets';
import { getCustomizationConfig } from '@/lib/customization/configs';
import { normalizeCustomizationGroups } from '@/lib/shopify/mappers';
import { templateConfigSignature } from '@/lib/customization/template-config-signature';
import snapshot from '@/data/draft-previews/fanreal-pdp-nov10.json';
const previewSnapshot = snapshot as unknown as { products: Product[] };

export function fanrealPdpPreviewProduct(handle: string, environment: Record<string, string | undefined> = process.env): Product | null {
  if (environment.VERCEL_ENV !== 'preview' || environment.DOLLWOW_DOL335_PREVIEW !== '1') return null;
  const saved = previewSnapshot.products.find(product => product.handle === handle);
  if (!saved) return null;
  const product = structuredClone(saved) as unknown as Product;
  product.extended.customizationGroups = normalizeCustomizationGroups(product.extended.customizationGroups);
  return product;
}

/** Private runtime QA only; a preview never registers a production release. */
export function fanrealPdpPreviewRecipe(product: Product, config: BrandCustomizationConfig): TemplatePresetDefinition | null | undefined {
  const reference = fanrealPdpPreviewProduct(product.handle);
  if (!reference) return undefined;
  if (reference.id !== product.id || JSON.stringify(reference.priceRange) !== JSON.stringify(product.priceRange) ||
      templateConfigSignature(config) !== templateConfigSignature(getCustomizationConfig(reference))) return null;
  const hair = config.groups.find(group => group.id === 'hair-options');
  if (!hair || product.handle.includes('173cm-male')) return null;
  if (![['wig-cover', 0], ['wig-transplant-ht-fiber', 249], ['hair-transplant-human', 399]].every(([id, price]) => hair.options.some(option => option.id === id && option.priceDelta === price))) return null;
  const tag = product.tags.find(tag => tag.startsWith('options:'));
  if (!tag) return null;
  return { tag, signature: templateConfigSignature(config), tiers: [
    { id: 'starter', description: 'The factory-standard wig finish with your selected head and appearance.', add: [{ groupId: 'hair-options', optionId: 'wig-cover' }], remove: [] },
    { id: 'enthusiast', description: 'Adds factory-implanted high-temperature synthetic hair.', add: [{ groupId: 'hair-options', optionId: 'wig-transplant-ht-fiber' }], remove: [] },
    { id: 'collector', description: 'Uses factory-implanted human hair in place of the synthetic-hair finish.', add: [{ groupId: 'hair-options', optionId: 'hair-transplant-human' }], remove: [] }
  ] };
}
