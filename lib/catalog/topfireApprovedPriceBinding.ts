import 'server-only';
import type { Product } from '@/types/product';
import type { BrandCustomizationConfig } from '@/types/customization';
import { templateRuntimeHash } from '@/lib/customization/template-release-registry';
import manifest from '@/data/pricing/dol257-approved-price-release.json';

const approved = new Map(manifest.rows.filter(row => row.beforeRuntimeHash).map(row => [row.id, row]));

// Preserve only the exact existing menu approval across Martin's seven-price
// release. Display and checkout continue using the real Shopify price.
export function topfireApprovedPriceBinding(product: Product, config: BrandCustomizationConfig): Product {
  const row = approved.get(product.id);
  if (!row || row.handle !== product.handle || product.extended.brand !== row.brand) return product;
  const source = structuredClone(product);
  const money = [...source.variants.map(v => v.price), source.priceRange.minVariantPrice, source.priceRange.maxVariantPrice];
  for (const price of money) {
    if (!Number.isFinite(Number(price.amount)) || Number(price.amount) !== row.after) return product;
    price.amount = row.after.toFixed(2);
  }
  if (templateRuntimeHash(source, config) !== row.afterRuntimeHash) return product;
  for (const price of money) price.amount = row.before.toFixed(1);
  return templateRuntimeHash(source, config) === row.beforeRuntimeHash ? source : product;
}
