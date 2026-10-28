import type { Product } from '@/types/product';
import snapshots from '@/data/draft-previews/se-elf-pdps.json';
import { isSeHalloweenPreview } from '@/lib/promotions/seHalloween2026';

export function isSeElfPreviewProduct(product: Pick<Product, 'id' | 'handle'>) {
  return snapshots.some(p => p.id === product.id && p.handle === product.handle);
}

export function seElfPreviewProduct(handle: string): Product | null {
  if (!isSeHalloweenPreview()) return null;
  const product = snapshots.find(p => p.handle === handle);
  return product ? structuredClone(product) as unknown as Product : null;
}

export function seElfLocalImagePath(product: Product, url: string) {
  if (!isSeHalloweenPreview() || !isSeElfPreviewProduct(product)) return null;
  const snapshot = snapshots.find(p => p.id === product.id)!;
  return snapshot.images.some(image => image.url === url) ? `public${url}` : null;
}
