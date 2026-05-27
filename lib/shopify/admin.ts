import { env, hasShopifyAdminEnv } from "@/lib/utils/env";

const API_VERSION = "2026-04";

async function adminFetch<T>(query: string, variables: Record<string, unknown> = {}) {
  if (!hasShopifyAdminEnv()) {
    throw new Error("Shopify Admin API is not configured.");
  }

  const domain = env.SHOPIFY_STORE_DOMAIN!.replace(/^https?:\/\//, "");
  const response = await fetch(`https://${domain}/admin/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": env.SHOPIFY_ADMIN_ACCESS_TOKEN!
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store"
  });

  const payload = await response.json();
  if (!response.ok || payload.errors?.length) {
    throw new Error(payload.errors?.[0]?.message ?? "Shopify Admin request failed.");
  }
  return payload.data as T;
}

export async function createPriceMatchDiscountCode(input: {
  title: string;
  code: string;
  startsAt: string;
  endsAt: string;
  percentage: number;
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
          value: { percentage: input.percentage / 100 },
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

export { API_VERSION as SHOPIFY_ADMIN_API_VERSION };
