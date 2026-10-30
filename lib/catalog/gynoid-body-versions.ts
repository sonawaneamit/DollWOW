import type { Product, ProductVariant } from '@/types/product';

// Martin's 30 Oct approval names these two retained parents for the Deluxe rows.
export const gynoidBodyVersionMappings = [
  {
    model: 'M13', productId: 'gid://shopify/Product/10637911163064',
    handle: 'gynoid-lisa-170cm-silicone-companion-doll-model-13',
    standardVariantId: 'gid://shopify/ProductVariant/54252188663992',
    deluxeVariantId: 'gid://shopify/ProductVariant/54595304489144',
    standardUSD: 5299, deluxeUSD: 5799, standardWeightKg: 30, deluxeWeightKg: 32
  },
  {
    model: 'M21', productId: 'gid://shopify/Product/10637915029688',
    handle: 'gynoid-elsa-164cm-silicone-companion-doll-model-21',
    standardVariantId: 'gid://shopify/ProductVariant/54252192497848',
    deluxeVariantId: 'gid://shopify/ProductVariant/54595305504952',
    standardUSD: 4799, deluxeUSD: 5099, standardWeightKg: 30, deluxeWeightKg: 30
  }
] as const;

export function gynoidBodyVersionMapping(product: Pick<Product, 'id' | 'handle'>) {
  return gynoidBodyVersionMappings.find(row => row.productId === product.id && row.handle === product.handle);
}

function bodyVersion(variant: ProductVariant) {
  const options = variant.selectedOptions;
  if (options.length !== 1 || options[0].name !== 'Body version') return null;
  return options[0].value === 'Standard' || options[0].value === 'Deluxe' ? options[0].value : null;
}

/** Validate actual server-fetched variants; never derive a Deluxe ID from a body/head name. */
export function verifiedGynoidBodyVersion(product: Pick<Product, 'id' | 'handle' | 'variants'>, variantId: string) {
  const mapping = gynoidBodyVersionMapping(product);
  if (!mapping) {
    if (gynoidBodyVersionMappings.some(row => row.productId === product.id || row.handle === product.handle ||
        row.standardVariantId === variantId || row.deluxeVariantId === variantId)) throw new Error('The Gynoid body identity needs review.');
    return null;
  }
  const fail = () => { throw new Error('The Gynoid body version is not verified for checkout.'); };
  if (product.variants.length !== 2 || new Set(product.variants.map(v => v.id)).size !== 2) return fail();
  const standard = product.variants.find(v => v.id === mapping.standardVariantId);
  const deluxe = product.variants.find(v => v.id === mapping.deluxeVariantId);
  if (!standard || !deluxe || !/^gid:\/\/shopify\/ProductVariant\/\d+$/.test(deluxe.id) ||
      bodyVersion(standard) !== 'Standard' || bodyVersion(deluxe) !== 'Deluxe' ||
      standard.price.currencyCode !== 'USD' || deluxe.price.currencyCode !== 'USD' ||
      Number(standard.price.amount) !== mapping.standardUSD || Number(deluxe.price.amount) !== mapping.deluxeUSD) return fail();
  const variant = product.variants.find(v => v.id === variantId);
  if (!variant) return fail();
  const version = bodyVersion(variant)!;
  return {
    version, model: mapping.model,
    priceUSD: version === 'Standard' ? mapping.standardUSD : mapping.deluxeUSD,
    bodyWeightKg: version === 'Standard' ? mapping.standardWeightKg : mapping.deluxeWeightKg
  };
}
