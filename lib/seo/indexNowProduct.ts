import { createHash } from 'node:crypto';
import { isHiddenCatalogBrand } from '@/lib/catalog/brands';
import { INDEXNOW_ORIGIN, indexNowUrls } from './indexNow';

export type IndexNowProduct = {
  id: string; handle: string; status: string; publishedAt: string | null;
  vendor: string; tags: string[]; currencyCode: string;
  variants: Array<{ id: string; price: string }>;
};
export type IndexNowState = {
  version: 1;
  submittedFingerprint?: string;
  submittedUrl?: string;
  submittedAt?: string;
  pending?: { fingerprint: string; url: string; claimedAt: string };
};
type StoredState = { value: IndexNowState; digest: string | null };
type Dependencies = {
  product: IndexNowProduct;
  stored: StoredState;
  now?: number;
  write: (state: IndexNowState, compareDigest: string | null) => Promise<string | null>;
  notify: (urls: string[]) => Promise<{ status: number; validationPending: boolean }>;
};
const leaseMs = 90_000;

export function productNotificationSnapshot(product: IndexNowProduct, now = Date.now()) {
  if (!/^gid:\/\/shopify\/Product\/\d+$/.test(product.id) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(product.handle)) {
    throw new Error('Invalid product notification identity.');
  }
  const published = product.publishedAt ? Date.parse(product.publishedAt) : NaN;
  const hidden = isHiddenCatalogBrand(product.vendor) || product.tags.some(tag =>
    isHiddenCatalogBrand(tag) || /^(?:dollwow-test|dollwow-system|custom-option-charge)$/i.test(tag) || /(?:^|[-_:])hold(?:$|[-_:])/i.test(tag));
  const visible = product.status === 'ACTIVE' && Number.isFinite(published) && published <= now && !hidden;
  const url = `${INDEXNOW_ORIGIN}/products/${product.handle}`;
  const prices = product.variants.map(variant => {
    const price = Number(variant.price);
    if (!/^gid:\/\/shopify\/ProductVariant\/\d+$/.test(variant.id) || !/^\d+(?:\.\d{1,2})?$/.test(variant.price) || !Number.isFinite(price) || price < 0) throw new Error('Invalid product notification price.');
    return [variant.id, price.toFixed(2)];
  }).sort(([a], [b]) => a.localeCompare(b));
  if (!prices.length || !/^[A-Z]{3}$/.test(product.currencyCode)) throw new Error('Missing product notification prices.');
  const fingerprint = createHash('sha256').update(JSON.stringify({ id: product.id, url, visible,
    ...(visible ? { currency: product.currencyCode, prices } : {}) })).digest('hex');
  return { fingerprint, url, visible };
}

/** App-owned Shopify metafields provide compare-and-set claims without another datastore. */
export async function processProductNotification({ product, stored, now = Date.now(), write, notify }: Dependencies) {
  const snapshot = productNotificationSnapshot(product, now), previous = stored.value;
  if (previous.version !== 1) throw new Error('Unsupported IndexNow state.');
  if (!snapshot.visible && !previous.submittedUrl) return { status: 'ignored_private' as const };
  if (snapshot.fingerprint === previous.submittedFingerprint) return { status: 'unchanged' as const };
  if (previous.pending && Number.isFinite(Date.parse(previous.pending.claimedAt)) && now - Date.parse(previous.pending.claimedAt) < leaseMs) {
    return { status: 'busy' as const };
  }
  const pending: IndexNowState = { ...previous, pending: { fingerprint: snapshot.fingerprint,
    url: snapshot.url, claimedAt: new Date(now).toISOString() } };
  const claimDigest = await write(pending, stored.digest);
  if (!claimDigest) return { status: 'busy' as const };
  const urls = indexNowUrls([...new Set([
    ...(previous.submittedUrl && previous.submittedUrl !== snapshot.url ? [previous.submittedUrl] : []),
    snapshot.visible ? snapshot.url : previous.submittedUrl!
  ])]);
  const accepted = await notify(urls);
  const committed: IndexNowState = { version: 1, submittedFingerprint: snapshot.fingerprint,
    submittedUrl: snapshot.visible ? snapshot.url : previous.submittedUrl, submittedAt: new Date(now).toISOString() };
  if (!await write(committed, claimDigest)) throw new Error('IndexNow state changed before commit.');
  return { status: 'submitted' as const, count: urls.length, httpStatus: accepted.status, validationPending: accepted.validationPending };
}
