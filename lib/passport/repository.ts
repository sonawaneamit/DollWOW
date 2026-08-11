import "server-only";
import crypto from "node:crypto";
import { adminFetch } from "@/lib/shopify/admin";
import { env, hasShopifyAdminEnv } from "@/lib/utils/env";
import type { DollPassport, PassportLifecycle } from "@/lib/passport/types";

type ShopifyOrder = {
  id: string;
  name: string;
  createdAt: string;
  email?: string | null;
  customer?: { id: string; email?: string | null } | null;
  passport?: { value?: string | null } | null;
  lineItems: { nodes: Array<{
    id: string; title: string; quantity: number; sku?: string | null; vendor?: string | null; variantTitle?: string | null;
    customAttributes: Array<{ key: string; value: string }>;
    product?: { id: string; handle: string; featuredImage?: { url: string } | null } | null;
    variant?: { id: string } | null;
  }> };
};

type PassportOverrides = { lines?: Record<string, { lifecycleState?: PassportLifecycle; deliveryDate?: string; careStartedAt?: string; careEndsAt?: string; factoryApproval?: DollPassport["factory_approval"]; careDocuments?: DollPassport["care_documents"]; manufacturerIdentifiers?: Record<string, unknown>; events?: DollPassport["events"] }> };

function passportSecret() {
  if (!env.PASSPORT_SESSION_SECRET) throw new Error("Passport access is not configured.");
  return env.PASSPORT_SESSION_SECRET;
}

function opaquePassportId(orderId: string, lineId: string, unit: number) {
  return crypto.createHmac("sha256", passportSecret()).update(`${orderId}:${lineId}:${unit}`).digest("base64url");
}

function isDollLine(item: ShopifyOrder["lineItems"]["nodes"][number]) {
  return Boolean(item.product?.id) && !/selected customization|custom option charge|accessor(?:y|ies)|care kit|repair kit/i.test(item.title);
}

function parseOverrides(order: ShopifyOrder): PassportOverrides {
  try { return JSON.parse(order.passport?.value || "{}") as PassportOverrides; } catch { return {}; }
}

function passportsFromOrder(order: ShopifyOrder, ownerEmail: string) {
  const overrides = parseOverrides(order);
  return order.lineItems.nodes.filter(isDollLine).flatMap((item) => Array.from({ length: Math.max(1, item.quantity) }, (_, index) => {
    const unit = index + 1;
    const line = overrides.lines?.[item.id] ?? {};
    const build = Object.fromEntries(item.customAttributes.filter((attribute) => attribute.key && !attribute.key.startsWith("_")).map((attribute) => [attribute.key.replace(/^DollWOW\s*/i, ""), attribute.value]));
    return {
      id: opaquePassportId(order.id, item.id, unit),
      owner_email: ownerEmail,
      shopify_order_id: order.id,
      shopify_order_line_id: `${item.id}:${unit}`,
      order_number: order.name,
      order_date: order.createdAt,
      delivery_date: line.deliveryDate ?? null,
      lifecycle_state: line.lifecycleState ?? "build_review",
      care_started_at: line.careStartedAt ?? null,
      care_ends_at: line.careEndsAt ?? null,
      product_title: item.title,
      product_image_url: item.product?.featuredImage?.url ?? null,
      product_handle: item.product?.handle ?? null,
      brand: item.vendor ?? null,
      model: String(build["Reference Name"] ?? "") || null,
      build_record: { variant: item.variantTitle, sku: item.sku, ...build },
      factory_approval: line.factoryApproval ?? {},
      care_documents: line.careDocuments ?? [],
      manufacturer_identifiers: { shopifyProductId: item.product?.id, shopifyVariantId: item.variant?.id, ...(line.manufacturerIdentifiers ?? {}) },
      created_at: order.createdAt,
      events: line.events ?? []
    } satisfies DollPassport;
  }));
}

async function ordersForOwner(email: string): Promise<ShopifyOrder[]> {
  if (!hasShopifyAdminEnv()) return [];
  const safeEmail = email.trim().toLowerCase().replace(/["\\]/g, "");
  try {
    const data = await adminFetch<{ orders: { nodes: ShopifyOrder[] } }>(`query PassportOrders($query: String!) {
      orders(first: 50, query: $query, sortKey: CREATED_AT, reverse: true) {
        nodes {
          id name createdAt email customer { id email }
          passport: metafield(namespace: "dollwow", key: "passport") { value }
          lineItems(first: 50) { nodes { id title quantity sku vendor variantTitle customAttributes { key value } product { id handle featuredImage { url } } variant { id } } }
        }
      }
    }`, { query: `email:${safeEmail} financial_status:paid` });
    return data.orders.nodes.filter((order) => (order.email || order.customer?.email || "").toLowerCase() === safeEmail);
  } catch (error) {
    console.warn("[passport] Shopify order lookup failed", error instanceof Error ? error.message : error);
    return [];
  }
}

export async function hasPassportOrders(email: string) {
  return (await ordersForOwner(email)).some((order) => order.lineItems.nodes.some(isDollLine));
}

export async function listPassportsForOwner(email: string): Promise<DollPassport[]> {
  const normalized = email.trim().toLowerCase();
  return (await ordersForOwner(normalized)).flatMap((order) => passportsFromOrder(order, normalized));
}

export async function getPassportForOwner(id: string, email: string): Promise<DollPassport | null> {
  return (await listPassportsForOwner(email)).find((passport) => passport.id === id) ?? null;
}
