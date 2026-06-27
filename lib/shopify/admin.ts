import { env, hasShopifyAdminEnv } from "@/lib/utils/env";

const API_VERSION = "2026-04";

let tokenCache: { accessToken: string; expiresAt: number } | null = null;

async function adminFetch<T>(query: string, variables: Record<string, unknown> = {}) {
  if (!hasShopifyAdminEnv()) {
    throw new Error("Shopify Admin API is not configured.");
  }

  const domain = env.SHOPIFY_STORE_DOMAIN!.replace(/^https?:\/\//, "");
  const accessToken = await getAdminAccessToken(domain);
  let response = await fetch(`https://${domain}/admin/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": accessToken
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store"
  });

  let payload = await response.json();
  if (response.status === 401 && env.SHOPIFY_ADMIN_ACCESS_TOKEN && env.SHOPIFY_CLIENT_ID && env.SHOPIFY_CLIENT_SECRET) {
    tokenCache = null;
    const fallbackToken = await mintAdminAccessToken(domain);
    response = await fetch(`https://${domain}/admin/api/${API_VERSION}/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": fallbackToken
      },
      body: JSON.stringify({ query, variables }),
      cache: "no-store"
    });
    payload = await response.json();
  }

  if (!response.ok || payload.errors?.length) {
    throw new Error(payload.errors?.[0]?.message ?? "Shopify Admin request failed.");
  }
  return payload.data as T;
}

async function getAdminAccessToken(domain: string) {
  if (env.SHOPIFY_ADMIN_ACCESS_TOKEN) return env.SHOPIFY_ADMIN_ACCESS_TOKEN;
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) return tokenCache.accessToken;
  if (!env.SHOPIFY_CLIENT_ID || !env.SHOPIFY_CLIENT_SECRET) {
    throw new Error("Shopify Admin API requires SHOPIFY_ADMIN_ACCESS_TOKEN or SHOPIFY_CLIENT_ID/SHOPIFY_CLIENT_SECRET.");
  }

  return mintAdminAccessToken(domain);
}

async function mintAdminAccessToken(domain: string) {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) return tokenCache.accessToken;
  if (!env.SHOPIFY_CLIENT_ID || !env.SHOPIFY_CLIENT_SECRET) {
    throw new Error("Shopify Admin API requires SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET to mint an access token.");
  }

  const response = await fetch(`https://${domain}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: env.SHOPIFY_CLIENT_ID,
      client_secret: env.SHOPIFY_CLIENT_SECRET
    }),
    cache: "no-store"
  });
  const payload = (await response.json()) as { access_token?: string; expires_in?: number; error?: string; error_description?: string };

  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description || payload.error || "Failed to mint Shopify Admin access token.");
  }

  tokenCache = {
    accessToken: payload.access_token,
    expiresAt: Date.now() + Math.max((payload.expires_in ?? 3600) - 60, 60) * 1000
  };

  return tokenCache.accessToken;
}

export async function createPriceMatchDiscountCode(input: {
  title: string;
  code: string;
  startsAt: string;
  endsAt: string;
  percentage?: number;
  amountOff?: number;
  currencyCode?: string;
  productVariantIds: string[];
}) {
  const data = await adminFetch<{
    discountCodeBasicCreate: {
      codeDiscountNode: { id: string } | null;
      userErrors: Array<{ message: string }>;
    };
  }>(
    `mutation PriceMatchDiscount($basicCodeDiscount: DiscountCodeBasicInput!) {
      discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
        codeDiscountNode { id }
        userErrors { message }
      }
    }`,
    {
      basicCodeDiscount: {
        title: input.title,
        code: input.code,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        customerSelection: { all: true },
        customerGets: {
          value: input.amountOff
            ? {
                discountAmount: {
                  amount: input.amountOff,
                  appliesOnEachItem: false
                }
              }
            : { percentage: (input.percentage ?? 0) / 100 },
          items: { products: { productVariantsToAdd: input.productVariantIds } }
        },
        combinesWith: {
          orderDiscounts: false,
          productDiscounts: false,
          shippingDiscounts: false
        },
        usageLimit: 1,
        appliesOncePerCustomer: true
      }
    }
  );

  const error = data.discountCodeBasicCreate.userErrors[0];
  if (error) throw new Error(error.message);
  return data.discountCodeBasicCreate.codeDiscountNode;
}

export async function getProductAdminMetafieldsByHandle(handle: string) {
  try {
    const data = await adminFetch<{
      productByHandle: {
        measurements?: { value?: string | null } | null;
        headModel?: { value?: string | null } | null;
      } | null;
    }>(
      `query ProductAdminMetafields($handle: String!) {
        productByHandle(handle: $handle) {
          measurements: metafield(namespace: "custom", key: "measurements") { value }
          headModel: metafield(namespace: "custom", key: "head_model") { value }
        }
      }`,
      { handle }
    );

    const measurements = parseJson<Record<string, string>>(data.productByHandle?.measurements?.value);
    const headModel = data.productByHandle?.headModel?.value || undefined;

    if (!measurements && !headModel) return null;
    return { measurements, headModel };
  } catch {
    return null;
  }
}

function parseJson<T>(value?: string | null) {
  if (!value) return undefined;
  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
}

export { API_VERSION as SHOPIFY_ADMIN_API_VERSION };
