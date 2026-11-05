import type { Product } from '@/types/product';
import snapshot from '@/data/draft-previews/grace160-nov5.json';

export function grace160PreviewEnabled(environment: Record<string, string | undefined> = process.env) {
  return environment.VERCEL_ENV === 'preview' && environment.NEXT_PUBLIC_DOL333_PREVIEW === '1';
}
export function isGrace160PreviewProduct(product: Pick<Product, 'id' | 'handle'>) {
  return product.id === snapshot.id && product.handle === snapshot.handle;
}
export function grace160PreviewProduct(handle: string): Product | null {
  return grace160PreviewEnabled() && handle === snapshot.handle ? structuredClone(snapshot) as unknown as Product : null;
}
