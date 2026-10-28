import type { Product } from '@/types/product';
import snapshots from '@/data/draft-previews/gynoid-oct28.json';
import additions from '@/data/draft-previews/gynoid-oct28-additions.json';

const allSnapshots = [...snapshots, ...additions];

export function gynoidPreviewEnabled() {
  return process.env.VERCEL_ENV === 'preview' && process.env.NEXT_PUBLIC_DOL273_PREVIEW === '1';
}

export function isGynoidPreviewProduct(product: Pick<Product, 'id' | 'handle'>) {
  return allSnapshots.some(p => p.id === product.id && p.handle === product.handle);
}

export function gynoidPreviewProducts(): Product[] {
  if (!gynoidPreviewEnabled()) return [];
  const products = structuredClone(allSnapshots) as unknown as Product[];
  // The saved menu is not evidence of a free alternate-head entitlement.
  for (const product of products) {
    const head = product.extended.customizationGroups?.find(group => group.id === 'head');
    for (const option of head?.options ?? []) {
      if (option.id === 'no-change') continue;
      option.priceDelta = undefined;
      option.priceVerified = false;
      option.purchasable = false;
      option.productionNote = 'Alternate-head inclusion and incremental price await factory confirmation.';
    }
  }
  return products;
}

export function gynoidPreviewStoreDiscount(product: Pick<Product, 'id' | 'handle'>, basePrice: number) {
  if (!gynoidPreviewEnabled() || !isGynoidPreviewProduct(product)) return null;
  return { eligible: false as const, percentage: 10, discountAmount: 0, totalPrice: basePrice };
}

export function gynoidPreviewProduct(handle: string): Product | null {
  return gynoidPreviewProducts().find(p => p.handle === handle) ?? null;
}

export function gynoidLocalImagePath(product: Product, url: string) {
  if (!gynoidPreviewEnabled() || !isGynoidPreviewProduct(product)) return null;
  const snapshot = additions.find(p => p.id === product.id);
  return snapshot?.images.some(i => i.url === url) ? `public${url}` : null;
}
