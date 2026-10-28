import type { Product } from '@/types/product';
import snapshots from '@/data/draft-previews/gynoid-oct28.json';

export function gynoidPreviewEnabled() {
  return process.env.VERCEL_ENV === 'preview' && process.env.NEXT_PUBLIC_DOL273_PREVIEW === '1';
}

export function isGynoidPreviewProduct(product: Pick<Product, 'id' | 'handle'>) {
  return snapshots.some(p => p.id === product.id && p.handle === product.handle);
}

export function gynoidPreviewProducts(): Product[] {
  return gynoidPreviewEnabled() ? structuredClone(snapshots) as unknown as Product[] : [];
}

export function gynoidPreviewProduct(handle: string): Product | null {
  return gynoidPreviewProducts().find(p => p.handle === handle) ?? null;
}
