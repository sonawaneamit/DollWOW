import { sampleProducts } from "@/lib/data/sample-products";
import type { Product } from "@/types/product";
import { env, hasShopifyStorefrontEnv } from "@/lib/utils/env";
import { storefrontAuthHeaders } from "./auth";
import { mapShopifyProduct } from "./mappers";

const API_VERSION = "2026-04";
const DEFAULT_CHECKOUT_DOMAIN = "checkout.dollwow.com";

const fallbackCollections = [
  { id: "ready", handle: "ready-to-ship", title: "Ready To Ship" },
  { id: "custom", handle: "custom", title: "Custom Dolls" },
  { id: "premium", handle: "premium", title: "Premium Silicone" }
];

type ShopifyResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

type ProductListNode = Parameters<typeof mapShopifyProduct>[0];
type ProductListData = {
  products: {
    edges: Array<{ cursor: string; node: ProductListNode }>;
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  };
};

type ProductCountData = {
  products: {
    edges: Array<{ cursor: string }>;
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  };
};

async function storefrontFetch<T>(query: string, variables: Record<string, unknown> = {}, options: { cache?: RequestCache; revalidate?: number } = {}) {
  if (!hasShopifyStorefrontEnv()) {
    throw new Error("Shopify Storefront API is not configured.");
  }

  const domain = env.SHOPIFY_STORE_DOMAIN!.replace(/^https?:\/\//, "");
  const response = await fetch(`https://${domain}/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...storefrontAuthHeaders(env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!)
    },
    body: JSON.stringify({ query, variables }),
    ...(options.cache ? { cache: options.cache } : { next: { revalidate: options.revalidate ?? 120 } })
  });

  const payload = (await response.json()) as ShopifyResponse<T>;
  if (!response.ok || payload.errors?.length) {
    throw new Error(payload.errors?.[0]?.message ?? "Shopify Storefront request failed.");
  }

  return payload.data as T;
}

const productListFieldsBase = `
  id
  handle
  title
  description
  vendor
  productType
  tags
  featuredImage { url altText width height }
  images(first: 8) { edges { node { url altText width height } } }
  priceRange {
    minVariantPrice { amount currencyCode }
    maxVariantPrice { amount currencyCode }
  }
  variants(first: 30) {
    edges {
      node {
        id
        title
        availableForSale
        price { amount currencyCode }
        selectedOptions { name value }
      }
    }
  }
  catalogIdentityKey: metafield(namespace: "custom", key: "catalog_identity_key") { value }
  catalogBodyIdentityKey: metafield(namespace: "custom", key: "catalog_body_identity_key") { value }
  headModel: metafield(namespace: "custom", key: "head_model") { value }
  displayName: metafield(namespace: "custom", key: "display_name") { value }
  bodyType: metafield(namespace: "custom", key: "body_type") { value }
  lookTags: metafield(namespace: "custom", key: "look_tags") { value }
  brand: metafield(namespace: "custom", key: "brand") { value }
  sourceTitle: metafield(namespace: "custom", key: "source_title") { value }
  sourceHandle: metafield(namespace: "custom", key: "source_handle") { value }
  material: metafield(namespace: "custom", key: "material") { value }
  heightCm: metafield(namespace: "custom", key: "height_cm") { value }
  weightLb: metafield(namespace: "custom", key: "weight_lb") { value }
  cupSize: metafield(namespace: "custom", key: "cup_size") { value }
  measurements: metafield(namespace: "custom", key: "measurements") { value }
  warehouseCountry: metafield(namespace: "custom", key: "warehouse_country") { value }
  stockStatus: metafield(namespace: "custom", key: "stock_status") { value }
  deliveryEstimate: metafield(namespace: "custom", key: "delivery_estimate") { value }
  stockLastCheckedAt: metafield(namespace: "custom", key: "stock_last_checked_at") { value }
  customAvailable: metafield(namespace: "custom", key: "custom_available") { value }
  qcNote: metafield(namespace: "custom", key: "qc_note") { value }
`;

function productListFields(options: { includeCustomizationGroups?: boolean } = {}) {
  return `
    ${productListFieldsBase}
    ${options.includeCustomizationGroups ? 'customizationGroups: metafield(namespace: "custom", key: "customization_groups") { value }' : ""}
  `;
}

const productDetailFields = `
  ${productListFields({ includeCustomizationGroups: true })}
`;

export async function getProducts({
  query,
  first = 96,
  includeCustomizationGroups = false
}: {
  query?: string;
  first?: number;
  includeCustomizationGroups?: boolean;
} = {}) {
  const fallbackProducts = sampleProducts.slice(0, first);
  if (!hasShopifyStorefrontEnv()) return fallbackProducts;

  try {
    const products: Product[] = [];
    let after: string | null = null;
    const target = Math.max(1, first);

    while (products.length < target) {
      const pageSize = Math.min(250, target - products.length);
      const data: ProductListData = await storefrontFetch<ProductListData>(
        `query Products($first: Int!, $query: String, $after: String) {
          products(first: $first, after: $after, query: $query, sortKey: TITLE) {
            edges { cursor node { ${productListFields({ includeCustomizationGroups })} } }
            pageInfo { hasNextPage endCursor }
          }
        }`,
        { first: pageSize, query, after }
      );

      products.push(...data.products.edges.map((edge) => mapShopifyProduct(edge.node)).filter(isCustomerVisibleProduct));
      if (!data.products.pageInfo.hasNextPage) break;
      after = data.products.pageInfo.endCursor;
      if (!after) break;
    }

    return products.length ? products : fallbackProducts;
  } catch (error) {
    console.error(error);
    return fallbackProducts;
  }
}

function isCustomerVisibleProduct(product: Product) {
  return !(product.tags || []).some((tag) => /^dollwow-system$/i.test(tag) || /^custom-option-charge$/i.test(tag));
}

export async function getProductCount({ query }: { query?: string } = {}) {
  if (!hasShopifyStorefrontEnv()) return sampleProducts.length;

  try {
    let count = 0;
    let after: string | null = null;

    do {
      const data: ProductCountData = await storefrontFetch<ProductCountData>(
        `query ProductsCount($query: String, $after: String) {
          products(first: 250, after: $after, query: $query) {
            edges { cursor }
            pageInfo { hasNextPage endCursor }
          }
        }
      }`,
        { query, after }
      );

      count += data.products.edges.length;
      after = data.products.pageInfo.hasNextPage ? data.products.pageInfo.endCursor : null;
    } while (after);

    return count;
  } catch (error) {
    console.error(error);
    return 0;
  }
}

export async function getProductByHandle(handle: string, options: { cache?: RequestCache; revalidate?: number } = { cache: "no-store" }) {
  if (!hasShopifyStorefrontEnv()) {
    return sampleProducts.find((product) => product.handle === handle) ?? null;
  }

  try {
    const data = await storefrontFetch<{ product: Parameters<typeof mapShopifyProduct>[0] | null }>(
      `query Product($handle: String!) {
        product(handle: $handle) { ${productDetailFields} }
      }`,
      { handle },
      options
    );

    return data.product ? mapShopifyProduct(data.product) : (sampleProducts.find((product) => product.handle === handle) ?? null);
  } catch (error) {
    console.error(error);
    return sampleProducts.find((product) => product.handle === handle) ?? null;
  }
}

export async function getCollections() {
  if (!hasShopifyStorefrontEnv()) return fallbackCollections;

  try {
    const data = await storefrontFetch<{
      collections: { edges: Array<{ node: { id: string; handle: string; title: string } }> };
    }>(
      `query Collections {
        collections(first: 20) {
          edges { node { id handle title } }
        }
      }`
    );

    const collections = data.collections.edges.map((edge) => edge.node);
    return collections.length ? collections : fallbackCollections;
  } catch (error) {
    console.error(error);
    return fallbackCollections;
  }
}

export async function createCart(input: {
  merchandiseId: string;
  quantity: number;
  attributes?: Array<{ key: string; value: string }>;
  customizationCharge?: {
    amount: number;
    currencyCode: string;
    title?: string;
  };
  discountCodes?: string[];
}) {
  if (!hasShopifyStorefrontEnv()) {
    return {
      id: "mock-cart",
      checkoutUrl: "/cart?mockCheckout=1",
      totalQuantity: input.quantity
    };
  }

  const data = await storefrontFetch<{
    cartCreate: {
      cart: { id: string; checkoutUrl: string; totalQuantity: number } | null;
      userErrors: Array<{ field: string[]; message: string }>;
    };
  }>(
    `mutation CartCreate($input: CartInput!) {
      cartCreate(input: $input) {
        cart { id checkoutUrl totalQuantity }
        userErrors { field message }
      }
    }`,
    {
      input: {
        lines: [
          {
            merchandiseId: input.merchandiseId,
            quantity: input.quantity,
            attributes: input.attributes ?? []
          },
          ...customizationChargeLines(input.customizationCharge)
        ],
        discountCodes: input.discountCodes ?? []
      }
    }
  );

  const error = data.cartCreate.userErrors[0];
  if (error) throw new Error(error.message);
  if (!data.cartCreate.cart) throw new Error("Shopify did not return a cart.");
  return {
    ...data.cartCreate.cart,
    checkoutUrl: normalizeShopifyCheckoutUrl(data.cartCreate.cart.checkoutUrl)
  };
}

export function normalizeShopifyCheckoutUrl(checkoutUrl: string) {
  const checkoutDomain = (env.SHOPIFY_CHECKOUT_DOMAIN || DEFAULT_CHECKOUT_DOMAIN).replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (!checkoutDomain || checkoutUrl.startsWith("/")) return checkoutUrl;

  try {
    const url = new URL(checkoutUrl);
    const storefrontHost = new URL(env.NEXT_PUBLIC_SITE_URL).hostname.toLowerCase();
    const apexStorefrontHost = storefrontHost.replace(/^www\./, "");
    const shopifyStoreHost = env.SHOPIFY_STORE_DOMAIN?.replace(/^https?:\/\//, "").replace(/\/$/, "").toLowerCase();
    const checkoutHost = checkoutDomain.toLowerCase();
    const checkoutLikePath = url.pathname.startsWith("/cart") || url.pathname.startsWith("/checkouts");
    const host = url.hostname.toLowerCase();
    const shouldNormalize =
      checkoutLikePath &&
      host !== checkoutHost &&
      (host === storefrontHost ||
        host === apexStorefrontHost ||
        host === `www.${apexStorefrontHost}` ||
        host === shopifyStoreHost ||
        host.endsWith(".myshopify.com"));

    if (!shouldNormalize) return checkoutUrl;
    url.protocol = "https:";
    url.hostname = checkoutDomain;
    return url.toString();
  } catch {
    return checkoutUrl;
  }
}

type ShopifyCartLineInput = {
  merchandiseId: string;
  quantity: number;
  attributes?: Array<{ key: string; value: string }>;
};

type ChargeVariant = {
  amount: number;
  merchandiseId: string;
};

export function customizationChargeLines(charge?: {
  amount: number;
  currencyCode: string;
  title?: string;
}): ShopifyCartLineInput[] {
  if (!charge || charge.amount <= 0) return [];

  const configuredCurrency = (env.SHOPIFY_CUSTOM_OPTION_CHARGE_CURRENCY || "USD").toUpperCase();
  if (charge.currencyCode.toUpperCase() !== configuredCurrency) {
    throw new Error(`Custom option charges are configured for ${configuredCurrency}, but this product is priced in ${charge.currencyCode}.`);
  }

  const variants = parseCustomizationChargeVariants();
  if (!variants.length) {
    throw new Error("Custom option charges are not configured in Shopify yet. Add SHOPIFY_CUSTOM_OPTION_CHARGE_VARIANTS before checking out paid customizations.");
  }

  let remainingCents = Math.round(charge.amount * 100);
  const lines: ShopifyCartLineInput[] = [];

  for (const variant of variants) {
    const variantCents = Math.round(variant.amount * 100);
    if (variantCents <= 0 || remainingCents < variantCents) continue;
    const quantity = Math.floor(remainingCents / variantCents);
    if (!quantity) continue;
    lines.push({
      merchandiseId: variant.merchandiseId,
      quantity,
      attributes: [
        { key: "DollWow Charge Type", value: "Custom options" },
        { key: "DollWow Charge For", value: charge.title || "Selected customization options" },
        { key: "DollWow Charge Amount", value: `${configuredCurrency} ${variant.amount}` }
      ]
    });
    remainingCents -= quantity * variantCents;
  }

  if (remainingCents !== 0) {
    throw new Error("Custom option charge denominations do not cover this option total. Add smaller Shopify charge variants.");
  }

  return lines;
}

function parseCustomizationChargeVariants(): ChargeVariant[] {
  const raw = env.SHOPIFY_CUSTOM_OPTION_CHARGE_VARIANTS;
  if (!raw) return [];

  let entries: Array<[string, unknown]> = [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      entries = Object.entries(parsed as Record<string, unknown>);
    }
  } catch {
    entries = raw.split(",").map((pair) => {
      const separatorIndex = pair.indexOf(":");
      if (separatorIndex === -1) return [pair, ""] as [string, unknown];
      const amount = pair.slice(0, separatorIndex);
      const id = pair.slice(separatorIndex + 1);
      return [amount, id] as [string, unknown];
    });
  }

  return entries
    .map(([amount, merchandiseId]) => ({
      amount: Number(amount),
      merchandiseId: String(merchandiseId || "").trim()
    }))
    .filter((variant) => variant.amount > 0 && variant.merchandiseId.startsWith("gid://shopify/ProductVariant/"))
    .sort((a, b) => b.amount - a.amount);
}

export { API_VERSION as SHOPIFY_STOREFRONT_API_VERSION };
