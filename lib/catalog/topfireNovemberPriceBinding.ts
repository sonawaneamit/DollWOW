import 'server-only';
import type { Product } from '@/types/product';
import type { BrandCustomizationConfig } from '@/types/customization';
import { templateRuntimeHash } from '@/lib/customization/template-release-registry';
import manifest from '@/data/pricing/dol257-nov10-approved-prices.json';

const approved = new Map(manifest.rows.filter(row => row.hasRecipe).map(row => [row.id, row]));

/** Preserve the existing exact preset approval across the 10 Nov price-only release. */
export function topfireNovemberPriceBinding(product: Product, config: BrandCustomizationConfig): Product {
  const row = approved.get(product.id);
  if (!row || row.handle !== product.handle || row.brand !== product.extended.brand) return product;
  const source = structuredClone(product);
  const money = [...source.variants.map(variant => variant.price), source.priceRange.minVariantPrice, source.priceRange.maxVariantPrice];
  for (const price of money) {
    if (price.currencyCode !== 'USD' || Number(price.amount) !== row.target) return product;
    price.amount = row.target.toFixed(2);
  }
  if (templateRuntimeHash(source, config) !== row.afterRuntimeHash) return product;
  for (const price of money) price.amount = row.beforeAmount;
  return templateRuntimeHash(source, config) === row.beforeRuntimeHash ? source : product;
}
