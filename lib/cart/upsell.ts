import type { Product } from "@/types/product";

export type UpsellSnapshot = {
  merchandiseId: string;
  productHandle: string;
  productTitle: string;
  brand?: string;
  imageUrl?: string;
  imageAlt?: string;
  unitPrice: number;
  currencyCode: string;
  readyToShip: boolean;
};

const ACCESSORY_PATTERN = /accessor|care|clean|storage|wig|hair|cloth|lingerie|lubric|stand|repair|kit/i;
const ACCESSORY_MAX_PRICE = 800;

/**
 * Ranks catalog products as cart/drawer upsells. Accessories and care items
 * rank first (natural AOV builders), then ready-to-ship dolls for shoppers
 * still comparing. Anything already in the bag is excluded by the caller.
 */
export function rankUpsells(products: Product[], limit = 8): Product[] {
  return products
    .map((product) => ({ product, score: upsellScore(product) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || upsellPrice(a.product) - upsellPrice(b.product))
    .slice(0, limit)
    .map((entry) => entry.product);
}

export function upsellScore(product: Product): number {
  const text = `${product.productType} ${product.tags.join(" ")} ${product.title}`;
  const price = upsellPrice(product);
  let score = 0;

  if (ACCESSORY_PATTERN.test(text)) score += 3;
  if (price > 0 && price <= ACCESSORY_MAX_PRICE) score += ACCESSORY_PATTERN.test(text) ? 1 : 0;
  if (product.extended.stockStatus === "ready_to_ship") score += 2;
  if (product.variants.some((variant) => variant.availableForSale)) score += 1;

  return score;
}

export function toUpsellSnapshot(product: Product): UpsellSnapshot | null {
  const variant = product.variants.find((entry) => entry.availableForSale) ?? product.variants[0];
  if (!variant) return null;
  const image = product.featuredImage ?? product.images[0] ?? null;
  return {
    merchandiseId: variant.id,
    productHandle: product.handle,
    productTitle: product.title,
    brand: product.extended.brand ?? product.vendor,
    imageUrl: image?.url,
    imageAlt: image?.altText ?? product.title,
    unitPrice: Number(variant.price.amount ?? product.priceRange.minVariantPrice.amount),
    currencyCode: variant.price.currencyCode ?? product.priceRange.minVariantPrice.currencyCode,
    readyToShip: product.extended.stockStatus === "ready_to_ship"
  };
}

function upsellPrice(product: Product): number {
  return Number(product.priceRange.minVariantPrice.amount ?? 0);
}
