import { sampleProducts } from "@/lib/data/sample-products";
import { env, hasShopifyStorefrontEnv } from "@/lib/utils/env";
import { storefrontAuthHeaders } from "./auth";
import { mapShopifyProduct } from "./mappers";

const API_VERSION = "2026-04";

const fallbackCollections = [
  { id: "ready", handle: "ready-to-ship", title: "Ready To Ship" },
  { id: "custom", handle: "custom", title: "Custom Dolls" },
  { id: "premium", handle: "premium", title: "Premium Silicone" }
];

type ShopifyResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

async function storefrontFetch<T>(query: string, variables: Record<string, unknown> = {}) {
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
    next: { revalidate: 120 }
  });

  const payload = (await response.json()) as ShopifyResponse<T>;
  if (!response.ok || payload.errors?.length) {
    throw new Error(payload.errors?.[0]?.message ?? "Shopify Storefront request failed.");
  }

  return payload.data as T;
}

const productListFields = `
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
  brand: metafield(namespace: "custom", key: "brand") { value }
  material: metafield(namespace: "custom", key: "material") { value }
  heightCm: metafield(namespace: "custom", key: "height_cm") { value }
  weightLb: metafield(namespace: "custom", key: "weight_lb") { value }
  cupSize: metafield(namespace: "custom", key: "cup_size") { value }
  warehouseCountry: metafield(namespace: "custom", key: "warehouse_country") { value }
  stockStatus: metafield(namespace: "custom", key: "stock_status") { value }
  deliveryEstimate: metafield(namespace: "custom", key: "delivery_estimate") { value }
  stockLastCheckedAt: metafield(namespace: "custom", key: "stock_last_checked_at") { value }
  customAvailable: metafield(namespace: "custom", key: "custom_available") { value }
  qcNote: metafield(namespace: "custom", key: "qc_note") { value }
`;

const productDetailFields = `
  ${productListFields}
  customizationGroups: metafield(namespace: "custom", key: "customization_groups") { value }
`;

export async function getProducts({ query, first = 24 }: { query?: string; first?: number } = {}) {
  const fallbackProducts = sampleProducts.slice(0, first);
  if (!hasShopifyStorefrontEnv()) return fallbackProducts;

  try {
    const data = await storefrontFetch<{
      products: { edges: Array<{ node: Parameters<typeof mapShopifyProduct>[0] }> };
    }>(
      `query Products($first: Int!, $query: String) {
        products(first: $first, query: $query, sortKey: TITLE) {
          edges { node { ${productListFields} } }
        }
      }`,
      { first, query }
    );

    const products = data.products.edges.map((edge) => mapShopifyProduct(edge.node));
    return products.length ? products : fallbackProducts;
  } catch (error) {
    console.error(error);
    return fallbackProducts;
  }
}

export async function getProductByHandle(handle: string) {
  if (!hasShopifyStorefrontEnv()) {
    return sampleProducts.find((product) => product.handle === handle) ?? null;
  }

  try {
    const data = await storefrontFetch<{ product: Parameters<typeof mapShopifyProduct>[0] | null }>(
      `query Product($handle: String!) {
        product(handle: $handle) { ${productDetailFields} }
      }`,
      { handle }
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
          }
        ],
        discountCodes: input.discountCodes ?? []
      }
    }
  );

  const error = data.cartCreate.userErrors[0];
  if (error) throw new Error(error.message);
  if (!data.cartCreate.cart) throw new Error("Shopify did not return a cart.");
  return data.cartCreate.cart;
}

export { API_VERSION as SHOPIFY_STOREFRONT_API_VERSION };
