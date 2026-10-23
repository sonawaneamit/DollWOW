import 'server-only';
import { z } from 'zod';
import { adminFetch } from './admin';
import { processProductNotification, type IndexNowProduct, type IndexNowState } from '@/lib/seo/indexNowProduct';
import { indexNowKey, notifyIndexNow } from '@/lib/seo/indexNow';

const namespace = '$app:indexnow', key = 'notification_state';
const fingerprint = z.string().regex(/^[a-f0-9]{64}$/);
const stateSchema = z.object({
  version: z.literal(1), submittedFingerprint: fingerprint.optional(),
  submittedUrl: z.url().startsWith('https://dollwow.com/products/').optional(), submittedAt: z.iso.datetime().optional(),
  pending: z.object({ fingerprint, url: z.url().startsWith('https://dollwow.com/products/'), claimedAt: z.iso.datetime() }).strict().optional()
}).strict();

type ProductRead = {
  id: string; handle: string; status: string; publishedAt: string | null; vendor: string; tags: string[];
  priceRangeV2: { minVariantPrice: { currencyCode: string } };
  variants: { nodes: Array<{ id: string; price: string }>; pageInfo: { hasNextPage: boolean } };
  state: { value: string; compareDigest: string } | null;
};

export async function notifyShopifyProductChange(id: string) {
  const result = await adminFetch<{ product: ProductRead | null }>(`query IndexNowProduct($id:ID!){
    product(id:$id){
      id handle status publishedAt vendor tags
      priceRangeV2{minVariantPrice{currencyCode}}
      variants(first:250){nodes{id price}pageInfo{hasNextPage}}
      state:metafield(namespace:"${namespace}",key:"${key}"){value compareDigest}
    }
  }`, { id });
  const source = result.product;
  if (!source) return { status: 'missing_product' as const };
  if (source.variants.pageInfo.hasNextPage) throw new Error('IndexNow product variant scope exceeds the verified limit.');
  const product: IndexNowProduct = { ...source, variants: source.variants.nodes,
    currencyCode: source.priceRangeV2.minVariantPrice.currencyCode };
  const state = source.state ? stateSchema.parse(JSON.parse(source.state.value)) : { version: 1 as const };
  return processProductNotification({ product, stored: { value: state, digest: source.state?.compareDigest ?? null },
    write: async (value: IndexNowState, compareDigest: string | null) => {
      const response = await adminFetch<{ metafieldsSet: {
        metafields: Array<{ compareDigest: string }>;
        userErrors: Array<{ code: string; message: string }>;
      } }>(`mutation IndexNowState($fields:[MetafieldsSetInput!]!){
        metafieldsSet(metafields:$fields){metafields{compareDigest}userErrors{code message}}
      }`, { fields: [{ ownerId: id, namespace, key, type: 'json', value: JSON.stringify(value), compareDigest }] });
      const result = response.metafieldsSet;
      if (result.userErrors.length) {
        if (result.userErrors.every(error => error.code === 'STALE_OBJECT')) return null;
        throw new Error('IndexNow state persistence failed.');
      }
      if (!result.metafields[0]?.compareDigest) throw new Error('IndexNow claim digest missing.');
      return result.metafields[0].compareDigest;
    },
    notify: urls => notifyIndexNow(urls, indexNowKey())
  });
}
