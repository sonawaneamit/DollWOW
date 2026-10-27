import 'server-only';
import type { Product } from '@/types/product';
import manifest from '@/data/pricing/dol257-topfire-preview.json';

const approved = new Map(manifest.map(row => [row.id, row]));
const sourceProducts = new WeakMap<Product['variants'], Product>();

export function topfirePricePreviewEnabled() {
  return process.env.VERCEL_ENV === 'preview' && process.env.DOLLWOW_TOPFIRE_PRICE_PREVIEW === '1';
}

export function assertTopfirePricePreviewReadOnly() {
  if (topfirePricePreviewEnabled()) throw new Error('Pricing review only. Checkout is unavailable on this preview.');
}

export function applyTopfirePricePreview(product: Product): Product {
  if (!topfirePricePreviewEnabled()) return product;
  const row = approved.get(product.id);
  if (!row) return product;
  const variantIds = new Set(row.variantIds);
  if (row.handle !== product.handle || (product.variants.length > 0 && product.variants.length !== variantIds.size)
    || product.variants.some(variant => !variantIds.has(variant.id) || variant.price.currencyCode !== 'USD' || Number(variant.price.amount) !== row.before)
    || [product.priceRange.minVariantPrice, product.priceRange.maxVariantPrice].some(price => price.currencyCode !== 'USD' || Number(price.amount) !== row.before)) {
    throw new Error(`Pricing review source changed: ${product.handle}`);
  }
  const price = { amount: row.after.toFixed(2), currencyCode: 'USD' };
  const preview = { ...product,
    variants: product.variants.map(variant => ({ ...variant, price: { ...price } })),
    priceRange: { minVariantPrice: { ...price }, maxVariantPrice: { ...price } }
  };
  sourceProducts.set(preview.variants, product);
  return preview;
}

export function topfirePricePreviewSourceProduct(product: Product): Product {
  return topfirePricePreviewEnabled() ? sourceProducts.get(product.variants) ?? product : product;
}
