import 'server-only';
import { z } from 'zod';
import { adminFetch } from '@/lib/shopify/admin';
import { hasShopifyAdminEnv } from '@/lib/utils/env';

export type CurrentDollVueHold = 'clear' | 'held' | 'unavailable';

const productSchema = z.object({
  id: z.string(),
  hold: z.object({ value: z.string() }).nullable(),
});
const responseSchema = z.object({ product: productSchema.nullable() });
const nodesSchema = z.object({ nodes: z.array(z.unknown()) });
const TIMEOUT_MS = 3000;
const CHUNK_SIZE = 50;
const MAX_CONCURRENT_CHUNKS = 4;

function validProductId(productId: string) {
  return /^gid:\/\/shopify\/Product\/[1-9]\d*$/.test(productId) && productId.length <= 80;
}

/**
 * Only `clear` permits continuing; this does not establish publication or readiness.
 * Query by the strict Storefront product ID. Never serialize private Admin data.
 */
export async function getCurrentDollVueHold(productId: string): Promise<CurrentDollVueHold> {
  if (!validProductId(productId) || !hasShopifyAdminEnv()) {
    return 'unavailable';
  }

  const data = await fetchWithinDeadline(
    `query DollVueCurrentHold($id: ID!) {
      product(id: $id) {
        id
        hold: metafield(namespace: "custom", key: "catalog_image_review_hold") { value }
      }
    }`,
    { id: productId },
    TIMEOUT_MS,
  );
  const parsed = responseSchema.safeParse(data);
  if (!parsed.success || !parsed.data.product || parsed.data.product.id !== productId) return 'unavailable';
  return parsed.data.product.hold?.value.trim() ? 'held' : 'clear';
}

/** Fresh bulk checks; every distinct input has a result and only `clear` permits continuing. */
export async function getCurrentDollVueHolds(productIds: string[]): Promise<Map<string, CurrentDollVueHold>> {
  const results = new Map<string, CurrentDollVueHold>(productIds.map(id => [id, 'unavailable']));
  const ids = [...results.keys()].filter(validProductId);
  if (!ids.length || !hasShopifyAdminEnv()) return results;

  const deadline = Date.now() + TIMEOUT_MS;
  let offset = 0;
  async function worker() {
    while (offset < ids.length) {
      const remaining = deadline - Date.now();
      if (remaining <= 0) return;
      const chunk = ids.slice(offset, offset + CHUNK_SIZE);
      offset += CHUNK_SIZE;
      const data = await fetchWithinDeadline(
        `query DollVueCurrentHolds($ids: [ID!]!) {
          nodes(ids: $ids) {
            ... on Product {
              id
              hold: metafield(namespace: "custom", key: "catalog_image_review_hold") { value }
            }
          }
        }`,
        { ids: chunk },
        remaining,
      );
      const parsed = nodesSchema.safeParse(data);
      if (!parsed.success || parsed.data.nodes.length !== chunk.length) continue;
      // Shopify nodes are positional. Never let a missing/mismatched node clear another ID.
      parsed.data.nodes.forEach((node, index) => {
        const product = productSchema.safeParse(node);
        if (product.success && product.data.id === chunk[index]) {
          results.set(chunk[index], product.data.hold?.value.trim() ? 'held' : 'clear');
        }
      });
    }
  }
  await Promise.all(Array.from({ length: Math.min(MAX_CONCURRENT_CHUNKS, Math.ceil(ids.length / CHUNK_SIZE)) }, worker));
  return results;
}

async function fetchWithinDeadline(query: string, variables: Record<string, unknown>, timeoutMs: number): Promise<unknown> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    // adminFetch uses no-store and existing token renewal. No result cache: a new
    // hold must revoke the next action. The deadline bounds waiting, not its I/O.
    return await Promise.race([
      adminFetch<unknown>(query, variables),
      new Promise<undefined>(resolve => {
        timer = setTimeout(() => resolve(undefined), timeoutMs);
      }),
    ]);
  } catch {
    // Upstream messages may contain private review text; do not log or return them.
    return undefined;
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}
