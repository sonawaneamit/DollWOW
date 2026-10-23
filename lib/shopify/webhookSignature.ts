import { createHmac, timingSafeEqual } from 'node:crypto';

export function validShopifyWebhookSignature(body: Uint8Array, signature: string | null, secret: string | undefined) {
  if (!secret || !signature || !/^[A-Za-z0-9+/]{43}=$/.test(signature)) return false;
  const expected = createHmac('sha256', secret).update(body).digest(), received = Buffer.from(signature, 'base64');
  return received.length === expected.length && timingSafeEqual(received, expected);
}
