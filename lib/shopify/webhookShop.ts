import 'server-only';
import { adminFetch } from './admin';

export function canonicalWebhookShopDomain(value: string | null | undefined): string | null {
  const domain = value?.trim().toLowerCase();
  return domain && /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(domain) ? domain : null;
}

let cached: { domain: string; expiresAt: number } | null = null;
let inflight: Promise<string> | null = null;

// Shopify may retain a permanent shop domain different from the API alias.
// Resolve it through the authenticated Admin connection, never the payload.
export async function expectedWebhookShopDomain(): Promise<string> {
  if (cached && cached.expiresAt > Date.now()) return cached.domain;
  if (inflight) return inflight;
  inflight = (async () => {
    const result = await adminFetch<{ shop: { myshopifyDomain: string } }>(
      'query WebhookShopIdentity { shop { myshopifyDomain } }'
    );
    const domain = canonicalWebhookShopDomain(result.shop.myshopifyDomain);
    if (!domain) throw new Error('Invalid canonical shop identity.');
    cached = { domain, expiresAt: Date.now() + 5 * 60_000 };
    return domain;
  })();
  try { return await inflight; } finally { inflight = null; }
}
