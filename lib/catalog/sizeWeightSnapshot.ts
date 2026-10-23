import 'server-only';
import { unstable_cache } from 'next/cache';
import { getSeoCatalogProducts } from '@/lib/shopify/storefront';
import { buildFinderRows } from '@/lib/catalog/sizeWeightFinder';

export const getSizeWeightSnapshot = unstable_cache(async () => {
  const products = await getSeoCatalogProducts({ first: 5000, strict: true, revalidate: 0 });
  if (products.length >= 5000) throw new Error('Catalog coverage cap reached');
  return { ...buildFinderRows(products), checkedAt: new Date().toISOString() };
}, ['doll-size-weight-finder-v1'], { revalidate: 1800 });
