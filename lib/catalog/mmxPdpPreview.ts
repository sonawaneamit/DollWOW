import type { Product } from '@/types/product';
import type { BrandCustomizationConfig } from '@/types/customization';
import type { TemplatePresetDefinition } from '@/lib/customization/template-presets';
import { getCustomizationConfig } from '@/lib/customization/configs';
import { normalizeCustomizationGroups } from '@/lib/shopify/mappers';
import { templateConfigSignature } from '@/lib/customization/template-config-signature';
import snapshot from '@/data/draft-previews/mmx-pdp-nov10.json';
import recipes from '@/data/draft-previews/mmx-pdp-recipes-nov10.json';

export function mmxPdpPreviewEnabled(environment: Record<string, string | undefined> = process.env) {
  return environment.VERCEL_ENV === 'preview' && environment.DOLLWOW_DOL261_PREVIEW === '1';
}

export function mmxPdpPreviewProduct(handle: string, environment: Record<string, string | undefined> = process.env): Product | null {
  if (!mmxPdpPreviewEnabled(environment)) return null;
  const saved = snapshot.products.find(product => product.handle === handle);
  if (!saved) return null;
  const product = structuredClone(saved) as unknown as Product;
  product.extended.customizationGroups = normalizeCustomizationGroups(product.extended.customizationGroups);
  return product;
}

/** Internal PDP QA only; this does not register or approve a production template. */
export function mmxPdpPreviewRecipe(product: Product, config: BrandCustomizationConfig): TemplatePresetDefinition | null | undefined {
  const reference = mmxPdpPreviewProduct(product.handle);
  if (!reference) return undefined;
  if (reference.id !== product.id || JSON.stringify(reference.priceRange) !== JSON.stringify(product.priceRange)) return null;
  const tags = product.tags.filter(tag => tag.startsWith('options:'));
  const referenceTag = reference.tags.find(tag => tag.startsWith('options:'))!;
  if (tags.length !== 1 || tags[0] !== referenceTag) return null;
  const signature = templateConfigSignature(config);
  if (signature !== templateConfigSignature(getCustomizationConfig(reference))) return null;
  const recipe = recipes[referenceTag as keyof typeof recipes];
  return recipe ? { ...structuredClone(recipe), tag: referenceTag, signature } as TemplatePresetDefinition : null;
}
