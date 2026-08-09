import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { analyticsEvents, trackServerEvent } from "@/lib/analytics/events";
import { getSupabaseServerClient } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

/**
 * Shopify orders/paid webhook. Verifies the HMAC signature, stores a minimal
 * privacy-safe purchase record in Supabase (no customer PII), and forwards a
 * server-side `purchase` event to GA4 via the Measurement Protocol so revenue
 * can be tied back to the funnel without relying on checkout-page scripts.
 *
 * Required env when enabling:
 * - SHOPIFY_WEBHOOK_SECRET (from the Shopify webhook settings)
 * - GA_MEASUREMENT_ID + GA_MP_API_SECRET (for the GA4 event)
 * - SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (for persistence)
 */
export async function POST(request: Request) {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook secret is not configured." }, { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-shopify-hmac-sha256") ?? "";
  const digest = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");
  const valid = signature.length === digest.length && crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  if (!valid) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let order: ShopifyOrderWebhook;
  try {
    order = JSON.parse(rawBody) as ShopifyOrderWebhook;
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const totalPrice = Number(order.total_price ?? 0);
  const currency = order.currency ?? order.presentment_currency ?? "USD";
  const items = (order.line_items ?? []).map((item) => ({
    item_id: String(item.variant_id ?? item.sku ?? item.id),
    item_name: item.title,
    item_variant: item.variant_title ?? undefined,
    price: Number(item.price ?? 0),
    quantity: item.quantity ?? 1
  }));

  await trackServerEvent(analyticsEvents.purchase, {
    clientId: `order.${order.id}`,
    params: {
      transaction_id: String(order.id),
      value: totalPrice,
      currency,
      items
    }
  });

  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { error } = await supabase.from("analytics_purchases").insert({
      shopify_order_id: String(order.id),
      order_number: order.order_number ? String(order.order_number) : null,
      currency,
      total_price: totalPrice,
      line_count: items.reduce((sum, item) => sum + (item.quantity ?? 1), 0),
      items,
      ordered_at: order.created_at ?? new Date().toISOString()
    });
    if (error) {
      console.warn("[webhooks/orders] could not persist purchase", error.message);
    }
  }

  return NextResponse.json({ ok: true });
}

type ShopifyOrderWebhook = {
  id: number | string;
  order_number?: number | string;
  created_at?: string;
  currency?: string;
  presentment_currency?: string;
  total_price?: string;
  line_items?: Array<{
    id: number | string;
    title?: string;
    variant_id?: number | string;
    variant_title?: string | null;
    sku?: string | null;
    price?: string;
    quantity?: number;
  }>;
};
