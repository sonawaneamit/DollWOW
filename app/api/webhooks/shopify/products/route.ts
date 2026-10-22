import { NextResponse } from 'next/server';
import { validShopifyWebhookSignature } from '@/lib/shopify/webhookSignature';
import { notifyShopifyProductChange } from '@/lib/shopify/indexNowNotification';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const maxBodyBytes = 2 * 1024 * 1024;

async function limitedBody(request: Request) {
  if (Number(request.headers.get('content-length')) > maxBodyBytes) throw new Error('too_large');
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > maxBodyBytes) { await reader.cancel(); throw new Error('too_large'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return Buffer.concat(chunks);
}

export async function POST(request: Request) {
  let raw: Uint8Array;
  try { raw = await limitedBody(request); } catch {
    return NextResponse.json({ error: 'Webhook body rejected.' }, { status: 413 });
  }
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET || process.env.SHOPIFY_CLIENT_SECRET;
  if (!secret) return NextResponse.json({ error: 'Webhook authentication unavailable.' }, { status: 503 });
  if (!validShopifyWebhookSignature(raw, request.headers.get('x-shopify-hmac-sha256'), secret)) {
    return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 401 });
  }
  const shop = (process.env.SHOPIFY_STORE_DOMAIN ?? '').replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
  if (!shop || request.headers.get('x-shopify-shop-domain')?.toLowerCase() !== shop) {
    return NextResponse.json({ error: 'Unexpected shop.' }, { status: 403 });
  }
  if (!['products/create', 'products/update'].includes(request.headers.get('x-shopify-topic') ?? '')) {
    return NextResponse.json({ error: 'Unexpected webhook topic.' }, { status: 400 });
  }
  if (process.env.VERCEL_ENV !== 'production') return NextResponse.json({ status: 'preview_disabled' });
  let id: string;
  try {
    const data = JSON.parse(new TextDecoder().decode(raw));
    id = data.admin_graphql_api_id ?? (Number.isSafeInteger(data.id) ? `gid://shopify/Product/${data.id}` : '');
    if (!/^gid:\/\/shopify\/Product\/\d+$/.test(id)) throw new Error('identity');
  } catch { return NextResponse.json({ error: 'Invalid product identity.' }, { status: 400 }); }
  try {
    const result = await notifyShopifyProductChange(id);
    return NextResponse.json(result, { status: result.status === 'busy' ? 503 : 200 });
  } catch {
    // Keep delivery retryable; never log the payload, app secret, public key or supplier data.
    console.warn('Product IndexNow notification requires retry.');
    return NextResponse.json({ error: 'Notification requires retry.' }, { status: 503 });
  }
}
