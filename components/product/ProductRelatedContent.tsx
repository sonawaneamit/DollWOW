import 'server-only';
import { ProductLowerAlive } from '@/components/ProductLowerAlive';
import { getCatalogBrand } from '@/lib/catalog/brands';
import { publicProductPayload } from '@/lib/catalog/publicPayload';
import { withProtectedProductImages } from '@/lib/catalog/productImage';
import { scoreSimilarProducts } from '@/lib/catalog/similar';
import { dealerPublicTags, keepsWizardOpen } from '@/lib/customization/dealerPreviewBuilder';
import { getProducts } from '@/lib/shopify/storefront';
import type { Product } from '@/types/product';

export async function ProductRelatedContent({ product, publicProduct }: { product: Product; publicProduct: Product }) {
  const relatedBrand = getCatalogBrand(product.extended.brand ?? product.vendor);
  const brandTag = relatedBrand?.tags[0] ?? relatedBrand?.value;
  const brandQuery = brandTag ? `tag:${JSON.stringify(brandTag)}` : `title:${JSON.stringify(product.extended.brand ?? product.vendor)}`;
  const brandProducts = await getProducts({
    query: brandQuery,
    first: 600,
    imageFirst: 1,
    cacheKey: `pdp-related-brand-v3-${(relatedBrand?.value ?? product.extended.brand ?? product.vendor).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    revalidate: 3600
  });
  const alternatives = scoreSimilarProducts(product, brandProducts, 5);
  return <ProductLowerAlive product={publicProduct} similarProducts={alternatives.map(withProtectedProductImages).map(publicProductPayload).map((item) => keepsWizardOpen(product.handle) ? { ...item, tags: dealerPublicTags(item.tags) ?? item.tags } : item)} />;
}
