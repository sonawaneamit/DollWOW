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
  return gynoidPreviewEnabled() ? structuredClone(allSnapshots) as unknown as Product[] : [];
}

export function gynoidPreviewProduct(handle: string): Product | null {
  return gynoidPreviewProducts().find(p => p.handle === handle) ?? null;
}

export function gynoidLocalImagePath(product: Product, url: string) {
  if (!gynoidPreviewEnabled() || !isGynoidPreviewProduct(product)) return null;
  const snapshot = additions.find(p => p.id === product.id);
  return snapshot?.images.some(i => i.url === url) ? `public${url}` : null;
}
