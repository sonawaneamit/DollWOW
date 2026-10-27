import 'server-only';
import type { Product } from '@/types/product';
import manifest from '@/data/pricing/dol276-funwest-preview.json';

const approved = new Map(manifest.map(row => [row.id, row]));
const sourceProducts = new WeakMap<Product['variants'], Product>();

export function funwestPricePreviewEnabled() {
  return process.env.VERCEL_ENV === 'preview' && process.env.DOLLWOW_FUNWEST_PRICE_PREVIEW === '1';
}

export function assertPricePreviewReadOnly() {
  if (funwestPricePreviewEnabled()) throw new Error('Pricing review only. Checkout is unavailable on this preview.');
}

export function applyFunwestPricePreview(product: Product): Product {
  if (!funwestPricePreviewEnabled()) return product;
  const row = approved.get(product.id);
  if (!row || row.handle !== product.handle || product.extended.brand !== 'FunWest Dolls') return product;
  const variantIds = new Set(row.variantIds);
  if ((product.variants.length > 0 && product.variants.length !== variantIds.size) || product.variants.some(variant =>
    !variantIds.has(variant.id) || variant.price.currencyCode !== 'USD' || Number(variant.price.amount) !== row.before)) {
    throw new Error(`Pricing review source changed: ${product.handle}`);
  }
  if ([product.priceRange.minVariantPrice, product.priceRange.maxVariantPrice].some(price =>
    price.currencyCode !== 'USD' || Number(price.amount) !== row.before)) throw new Error(`Pricing review range changed: ${product.handle}`);
  const price = { amount: row.after.toFixed(2), currencyCode: 'USD' };
  const preview = {
    ...product,
    variants: product.variants.map(variant => ({ ...variant, price: { ...price } })),
    priceRange: { minVariantPrice: { ...price }, maxVariantPrice: { ...price } }
  };
  sourceProducts.set(preview.variants, product);
  return preview;
}

// Keep existing preset approval checks bound to the original product. The UI
// resolves those same options at the preview base price; checkout stays blocked.
export function pricePreviewSourceProduct(product: Product): Product {
  return funwestPricePreviewEnabled() ? sourceProducts.get(product.variants) ?? product : product;
}
