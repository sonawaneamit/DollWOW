import type { Product } from '@/types/product';
import { ZARGA_HANDLE } from './zargaPreview';

export const ZARGA_PRODUCT_ID = 'gid://shopify/Product/10689749090488';
export const ZARGA_VARIANT_ID = 'gid://shopify/ProductVariant/54573731971256';

export function isZargaReleasedProduct(product: Pick<Product, 'id' | 'handle'>) {
  return product.id === ZARGA_PRODUCT_ID && product.handle === ZARGA_HANDLE;
}
