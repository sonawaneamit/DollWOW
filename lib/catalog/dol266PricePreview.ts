import 'server-only';
import type { Product } from '@/types/product';
import delta from '@/data/pricing/dol266-approved-price-delta.json';
const approved = new Map(delta.map(row => [row.id, row]));

export function dol266PricePreviewEnabled() {
  return process.env.VERCEL_ENV === 'preview' && process.env.DOLLWOW_DOL266_PRICE_PREVIEW === '1';
}
export function assertDol266PricePreviewReadOnly() {
  if (dol266PricePreviewEnabled()) throw new Error('Pricing review only. Checkout is unavailable on this preview.');
}
export function applyDol266PricePreview(product: Product): Product {
  if (!dol266PricePreviewEnabled()) return product;
  const row = approved.get(product.id);
  if (!row) return product;
  if (row.handle !== product.handle || (product.variants.length > 0 && product.variants.length !== 1)
    || product.variants.some(v => v.id !== row.variantId || Number(v.price.amount) !== row.before || v.price.currencyCode !== 'USD')
    || [product.priceRange.minVariantPrice, product.priceRange.maxVariantPrice].some(p => Number(p.amount) !== row.before || p.currencyCode !== 'USD')) {
    throw new Error(`Pricing review source changed: ${product.handle}`);
  }
  const price = { amount: row.after.toFixed(2), currencyCode: 'USD' };
  return { ...product, variants: product.variants.map(v => ({ ...v, price: { ...price } })),
    priceRange: { minVariantPrice: { ...price }, maxVariantPrice: { ...price } } };
}
