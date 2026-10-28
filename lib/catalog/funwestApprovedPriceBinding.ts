import 'server-only';
import type { Product } from '@/types/product';
import type { BrandCustomizationConfig } from '@/types/customization';
import { templateRuntimeHash } from '@/lib/customization/template-release-registry';
import manifest from '@/data/pricing/dol276-approved-price-release.json';

const approved = new Map(manifest.rows.filter(row => row.beforeRuntimeHash).map(row => [row.id, row]));

// Only the exact reviewed after-price runtime can reuse its original menu
// approval. Displayed/checkout prices remain the real Shopify prices.
export function funwestApprovedPriceBinding(product: Product, config: BrandCustomizationConfig): Product {
  const row = approved.get(product.id);
  if (!row || row.handle !== product.handle || product.extended.brand !== 'FunWest Dolls') return product;
  // MoneyV2 renders whole-dollar amounts with one decimal; the reviewed
  // simulation used two. Canonicalize only that formatting, not the price.
  const source = structuredClone(product);
  for (const money of [...source.variants.map(v => v.price), source.priceRange.minVariantPrice, source.priceRange.maxVariantPrice]) {
    if (!Number.isFinite(Number(money.amount)) || Number(money.amount) !== row.after) return product;
    money.amount = Number(money.amount).toFixed(2);
  }
  if (templateRuntimeHash(source, config) !== row.afterRuntimeHash) return product;
  source.variants.forEach(variant => { variant.price.amount = row.before.toFixed(1); });
  source.priceRange.minVariantPrice.amount = row.before.toFixed(1);
  source.priceRange.maxVariantPrice.amount = row.before.toFixed(1);
  return templateRuntimeHash(source, config) === row.beforeRuntimeHash ? source : product;
}
