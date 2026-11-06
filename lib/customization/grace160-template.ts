import 'server-only';
import type { Product } from '@/types/product';
import type { BrandCustomizationConfig } from '@/types/customization';
import snapshot from '@/data/draft-previews/grace160-nov5.json';
import recipe from '@/data/draft-previews/grace160-recipe-nov5.json';
import { normalizeCustomizationGroups } from '@/lib/shopify/mappers';
import { isGrace160PreviewProduct } from '@/lib/catalog/grace160Preview';
import { getCustomizationConfig } from './configs';
import { templateConfigSignature } from './template-config-signature';
import { templateRuntimeHash } from './template-release-registry';
import type { TemplatePresetDefinition } from './template-presets';

function normalizePrice(product: Product) {
  const prices = [
    ...product.variants.map(variant => variant.price),
    product.priceRange.minVariantPrice,
    product.priceRange.maxVariantPrice
  ];
  if (prices.some(price => price.currencyCode !== 'USD' || Number(price.amount) !== 2299)) return false;
  for (const price of prices) price.amount = '2299.00';
  return true;
}

function publishedShape(product: Product) {
  const candidate = structuredClone(product);
  candidate.tags = candidate.tags.filter(tag => tag !== 'dollwow-test');
  for (const variant of candidate.variants) variant.availableForSale = true;
  return candidate;
}

const reference = publishedShape(snapshot as unknown as Product);
const referenceConfig = getCustomizationConfig(reference);
const storefrontReference = structuredClone(reference);
// Storefront does not return the body-type metafield for this product. Its
// exact catalog identities, tags and menu still participate in the binding.
delete storefrontReference.extended.bodyType;
storefrontReference.extended.customizationGroups = normalizeCustomizationGroups(reference.extended.customizationGroups);
const reviewedHashes = new Set([
  templateRuntimeHash(reference, referenceConfig),
  templateRuntimeHash(storefrontReference, getCustomizationConfig(storefrontReference))
]);

/** Bind the reviewed recipes only to the exact Grace 160F factory listing and menu. */
export function grace160TemplateRecipe(
  product: Product,
  config: BrandCustomizationConfig,
  privatePreview = false
): TemplatePresetDefinition | null | undefined {
  if (!isGrace160PreviewProduct(product)) return undefined;
  const candidate = privatePreview ? publishedShape(product) : structuredClone(product);
  if (!normalizePrice(candidate) || !reviewedHashes.has(templateRuntimeHash(candidate, config))) return null;
  return { ...structuredClone(recipe), signature: templateConfigSignature(config) } as TemplatePresetDefinition;
}
