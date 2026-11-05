import 'server-only';
import type { Product } from '@/types/product';
import type { BrandCustomizationConfig } from '@/types/customization';
import { templateRuntimeHash } from '@/lib/customization/template-release-registry';
import manifest from '@/data/pricing/dol255-approved-prices.json';

const changing = new Map(manifest.rows.filter(row => row.before !== row.after).map(row => [row.id, row]));

/** Preserve only the exact existing bundle approval across Martin's price-only batch. */
export function greenbackApprovedPriceBinding(product: Product, config: BrandCustomizationConfig): Product {
  const row = changing.get(product.id);
  if (!row?.beforeRuntimeHash || !row.afterRuntimeHash || row.handle !== product.handle || row.brand !== product.extended.brand) return product;
  const source = structuredClone(product);
  const money = [...source.variants.map(variant => variant.price), source.priceRange.minVariantPrice, source.priceRange.maxVariantPrice];
  for (const price of money) {
    if (price.currencyCode !== 'USD' || Number(price.amount) !== row.after) return product;
    price.amount = row.after.toFixed(2);
  }
  if (templateRuntimeHash(source, config) !== row.afterRuntimeHash) return product;
  for (const price of money) price.amount = row.beforeAmount;
  return templateRuntimeHash(source, config) === row.beforeRuntimeHash ? source : product;
}

export function isGreenbackPricePreview(product: Pick<Product, 'id' | 'handle'>, environment: Record<string, string | undefined> = process.env) {
  return environment.VERCEL_ENV === 'preview' && environment.NEXT_PUBLIC_DOL255_PREVIEW === '1'
    && changing.get(product.id)?.handle === product.handle;
}

/** Preview advertised prices without changing Shopify or granting checkout approval. */
export function withGreenbackPricePreview(product: Product): Product {
  if (!isGreenbackPricePreview(product)) return product;
  const row = changing.get(product.id)!;
  const source = structuredClone(product);
  const money = [...source.variants.map(variant => variant.price), source.priceRange.minVariantPrice, source.priceRange.maxVariantPrice];
  if (money.some(price => price.currencyCode !== 'USD' || ![row.before, row.after].includes(Number(price.amount)))) return product;
  for (const price of money) price.amount = row.after.toFixed(2);
  return source;
}
