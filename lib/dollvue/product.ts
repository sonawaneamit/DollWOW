import 'server-only';
import {getProductByHandle} from '@/lib/shopify/storefront';
import {getProductAdminMetafieldsByHandle, mergeProductAdminMetafields} from '@/lib/shopify/admin';

/** Match the actual PDP representation for these newly reviewed brands.
 * A strict public lookup remains first: Admin data cannot publish a hidden doll.
 * Existing brand fingerprints must retain their original representation.
 */
export async function getDollVueProductByHandle(handle: string,
  options: Parameters<typeof getProductByHandle>[1] = {cache:'no-store',strict:true}) {
  const product=await getProductByHandle(handle,{...options,strict:true});
  if(!product || !/^(?:mmx-|fanreal-)/i.test(product.handle)) return product;
  const admin=await getProductAdminMetafieldsByHandle(product.handle);
  if(!admin) return null;
  return mergeProductAdminMetafields(product,admin);
}
