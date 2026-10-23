import 'server-only';
import { unstable_cache } from 'next/cache';
import { getSeoCatalogProducts } from '@/lib/shopify/storefront';
import { buildFinderRows } from '@/lib/catalog/sizeWeightFinder';

const readSnapshot = unstable_cache(async () => {
  const products = await getSeoCatalogProducts({ first: 5000, strict: true, revalidate: 0 });
  if (products.length >= 5000) throw new Error('Catalog coverage cap reached');
  return { ...buildFinderRows(products), checkedAt: new Date().toISOString() };
}, ['doll-size-weight-finder-v3'], { revalidate: 1800 });

export async function getSizeWeightSnapshot() {
  const snapshot = await readSnapshot();
  const checkedAt = Date.parse(snapshot.checkedAt);
  if (!Number.isFinite(checkedAt) || Date.now() - checkedAt > 86400000) throw new Error('Catalog snapshot expired');
  return snapshot;
}
