import { sampleProducts } from "@/lib/data/sample-products";
import type { Product } from "@/types/product";
import { normalizeCheckoutUrl } from "@/lib/cart/checkout-url";
import { env, hasShopifyStorefrontEnv } from "@/lib/utils/env";
import { storefrontAuthHeaders } from "./auth";
import { mapShopifyProduct } from "./mappers";
import { isHiddenCatalogBrand } from "@/lib/catalog/brands";
import { customerDeliveryEstimate } from "@/lib/catalog/delivery";

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

type MetafieldValue = { value: string } | null;
type SeoProductNode = {
  id: string;
  handle: string;
  title: string;
  vendor: string;
  productType: string;
  tags: string[];
  featuredImage: Product["featuredImage"];
  priceRange: Product["priceRange"];
  displayName: MetafieldValue;
  bodyType: MetafieldValue;
  lookTags: MetafieldValue;
  brand: MetafieldValue;
  sourceTitle: MetafieldValue;
  sourceHandle: MetafieldValue;
  headModel: MetafieldValue;
  material: MetafieldValue;
  heightCm: MetafieldValue;
  weightLb: MetafieldValue;
  cupSize: MetafieldValue;
  measurements: MetafieldValue;
  warehouseCountry: MetafieldValue;
  warehouseRegions: MetafieldValue;
  stockStatus: MetafieldValue;
  deliveryEstimate: MetafieldValue;
  stockLastCheckedAt: MetafieldValue;
  customAvailable: MetafieldValue;
};

type SeoProductListData = {
  products: {
    edges: Array<{ cursor: string; node: SeoProductNode }>;
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  };
};

type SearchProductData = {
  products: {
    edges: Array<{
      node: Omit<ProductListNode, "description" | "images" | "variants">;
    }>;
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

function productFieldsBase(imageFirst: number) {
  return `
  id
  handle
  title
  description
  vendor
  productType
  tags
  featuredImage { url altText width height }
  images(first: ${imageFirst}) { edges { node { url altText width height } } }
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
  sourceReleaseRank: metafield(namespace: "custom", key: "source_release_rank") { value }
  material: metafield(namespace: "custom", key: "material") { value }
  heightCm: metafield(namespace: "custom", key: "height_cm") { value }
  weightLb: metafield(namespace: "custom", key: "weight_lb") { value }
  cupSize: metafield(namespace: "custom", key: "cup_size") { value }
  measurements: metafield(namespace: "custom", key: "measurements") { value }
  warehouseCountry: metafield(namespace: "custom", key: "warehouse_country") { value }
  warehouseRegions: metafield(namespace: "custom", key: "warehouse_regions") { value }
  stockStatus: metafield(namespace: "custom", key: "stock_status") { value }
  deliveryEstimate: metafield(namespace: "custom", key: "delivery_estimate") { value }
  stockLastCheckedAt: metafield(namespace: "custom", key: "stock_last_checked_at") { value }
  customAvailable: metafield(namespace: "custom", key: "custom_available") { value }
  qcNote: metafield(namespace: "custom", key: "qc_note") { value }
`;
}

function productListFields(options: { includeCustomizationGroups?: boolean; imageFirst?: number; includeMedia?: boolean } = {}) {
  return `
    ${productFieldsBase(options.imageFirst ?? 8)}
    ${
      options.includeMedia
        ? `media(first: 50) {
            edges { node {
              mediaContentType
              alt
              ... on MediaImage { image { url altText width height } }
              ... on Video { previewImage { url altText width height } sources { url mimeType } }
            } }
          }`
        : ""
    }
    ${options.includeCustomizationGroups ? 'customizationGroups: metafield(namespace: "custom", key: "customization_groups") { value }' : ""}
  `;
}

const productDetailFields = `
  ${productListFields({ includeCustomizationGroups: true, imageFirst: 50, includeMedia: true })}
`;

export async function getProducts({
  query,
  first = 96,
  includeCustomizationGroups = false,
  sortKey = "CREATED_AT",
  reverse = true,
  imageFirst = 8,
  cacheKey,
  cache,
  revalidate
}: {
  query?: string;
  first?: number;
  includeCustomizationGroups?: boolean;
  sortKey?: "TITLE" | "CREATED_AT" | "UPDATED_AT" | "PRICE" | "BEST_SELLING";
  reverse?: boolean;
  imageFirst?: number;
  cacheKey?: string;
  cache?: RequestCache;
  revalidate?: number;
} = {}) {
  const fallbackProducts = sampleProducts.filter(isCustomerVisibleProduct).slice(0, first);
  if (!hasShopifyStorefrontEnv()) return fallbackProducts;

  try {
    const products: Product[] = [];
    let after: string | null = null;
    const target = Math.max(1, first);

    while (products.length < target) {
      const pageSize = Math.min(250, target - products.length);
      const data: ProductListData = await storefrontFetch<ProductListData>(
        `# ${cacheKey ?? "catalog-v1"}
        query Products($first: Int!, $query: String, $after: String, $sortKey: ProductSortKeys!, $reverse: Boolean!) {
          products(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) {
            edges { cursor node { ${productListFields({ includeCustomizationGroups, imageFirst })} } }
            pageInfo { hasNextPage endCursor }
          }
        }`,
        { first: pageSize, query, after, sortKey, reverse },
        { cache, revalidate }
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

export async function getSeoCatalogProducts({ first = 5000, revalidate = 3600 }: { first?: number; revalidate?: number } = {}) {
  const fallbackProducts = sampleProducts.filter(isCustomerVisibleProduct).slice(0, first);
  if (!hasShopifyStorefrontEnv()) return fallbackProducts;

  try {
    const products: Product[] = [];
    let after: string | null = null;
    const target = Math.max(1, first);

    while (products.length < target) {
      const pageSize = Math.min(250, target - products.length);
      const data: SeoProductListData = await storefrontFetch<SeoProductListData>(
        `# seo-catalog-v1
        query SeoCatalogProducts($first: Int!, $after: String) {
          products(first: $first, after: $after, sortKey: CREATED_AT, reverse: true) {
            edges { cursor node {
              id
              handle
              title
              vendor
              productType
              tags
              featuredImage { url altText width height }
              priceRange {
                minVariantPrice { amount currencyCode }
                maxVariantPrice { amount currencyCode }
              }
              displayName: metafield(namespace: "custom", key: "display_name") { value }
              bodyType: metafield(namespace: "custom", key: "body_type") { value }
              lookTags: metafield(namespace: "custom", key: "look_tags") { value }
              brand: metafield(namespace: "custom", key: "brand") { value }
              sourceTitle: metafield(namespace: "custom", key: "source_title") { value }
              sourceHandle: metafield(namespace: "custom", key: "source_handle") { value }
              headModel: metafield(namespace: "custom", key: "head_model") { value }
              material: metafield(namespace: "custom", key: "material") { value }
              heightCm: metafield(namespace: "custom", key: "height_cm") { value }
              weightLb: metafield(namespace: "custom", key: "weight_lb") { value }
              cupSize: metafield(namespace: "custom", key: "cup_size") { value }
              measurements: metafield(namespace: "custom", key: "measurements") { value }
              warehouseCountry: metafield(namespace: "custom", key: "warehouse_country") { value }
              warehouseRegions: metafield(namespace: "custom", key: "warehouse_regions") { value }
              stockStatus: metafield(namespace: "custom", key: "stock_status") { value }
              deliveryEstimate: metafield(namespace: "custom", key: "delivery_estimate") { value }
              stockLastCheckedAt: metafield(namespace: "custom", key: "stock_last_checked_at") { value }
              customAvailable: metafield(namespace: "custom", key: "custom_available") { value }
            } }
            pageInfo { hasNextPage endCursor }
          }
        }`,
        { first: pageSize, after },
        { revalidate }
      );

      products.push(...data.products.edges.map(({ node }) => mapSeoCatalogProduct(node)).filter(isCustomerVisibleProduct));
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

function mapSeoCatalogProduct(node: SeoProductNode): Product {
  const bodyType = metafieldText(node.bodyType);
  const stockStatus = metafieldText(node.stockStatus);
  return {
    id: node.id,
    handle: node.handle,
    title: node.title,
    description: "",
    vendor: node.vendor,
    productType: node.productType,
    tags: node.tags || [],
    featuredImage: node.featuredImage,
    images: node.featuredImage ? [node.featuredImage] : [],
    variants: [],
    priceRange: node.priceRange,
    extended: {
      displayName: metafieldText(node.displayName) || undefined,
      bodyType: bodyType === "male" || bodyType === "female" || bodyType === "unknown" ? bodyType : undefined,
      lookTags: metafieldStringArray(node.lookTags),
      brand: metafieldText(node.brand) || undefined,
      sourceTitle: metafieldText(node.sourceTitle) || undefined,
      sourceHandle: metafieldText(node.sourceHandle) || undefined,
      headModel: metafieldText(node.headModel) || undefined,
      material: metafieldText(node.material) || undefined,
      heightCm: metafieldNumber(node.heightCm),
      weightLb: metafieldNumber(node.weightLb),
      cupSize: metafieldText(node.cupSize) || undefined,
      measurements: metafieldRecord(node.measurements),
      warehouseCountry: metafieldText(node.warehouseCountry) || undefined,
      warehouseRegions: metafieldStringArray(node.warehouseRegions),
      stockStatus: stockStatus === "ready_to_ship" || stockStatus === "custom" || stockStatus === "check_stock" ? stockStatus : undefined,
      deliveryEstimate: customerDeliveryEstimate(
        stockStatus === "ready_to_ship" || stockStatus === "custom" || stockStatus === "check_stock" ? stockStatus : undefined,
        metafieldText(node.deliveryEstimate) || undefined
      ),
      stockLastCheckedAt: metafieldText(node.stockLastCheckedAt) || undefined,
      customAvailable: metafieldBoolean(node.customAvailable)
    }
  };
}

function metafieldText(value: MetafieldValue) {
  return value?.value?.trim() ?? "";
}

function metafieldNumber(value: MetafieldValue) {
  const parsed = Number(metafieldText(value));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function metafieldBoolean(value: MetafieldValue) {
  const normalized = metafieldText(value).toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  return undefined;
}

function metafieldStringArray(value: MetafieldValue) {
  const text = metafieldText(value);
  if (!text) return undefined;
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed.map((item) => String(item).trim()).filter(Boolean);
  } catch {
    return text.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return undefined;
}

function metafieldRecord(value: MetafieldValue) {
  const text = metafieldText(value);
  if (!text) return undefined;
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return Object.fromEntries(Object.entries(parsed).map(([key, item]) => [key, String(item)]));
    }
  } catch {
    return undefined;
  }
  return undefined;
}

/**
 * Lightweight catalog lookup for live typeahead. Product cards and PDPs need
 * galleries, variants and dozens of metafields; a four-row search suggestion
 * does not. Keeping this query deliberately small makes cold searches feel
 * immediate while returning the same normalized Product shape to the ranker.
 */
export async function getSearchProducts({
  query,
  first = 48,
  revalidate = 300
}: {
  query?: string;
  first?: number;
  revalidate?: number;
} = {}) {
  const fallbackProducts = sampleProducts.filter(isCustomerVisibleProduct).slice(0, first);
  if (!hasShopifyStorefrontEnv()) return fallbackProducts;

  try {
    const data = await storefrontFetch<SearchProductData>(
      `# catalog-typeahead-v1
      query SearchProducts($first: Int!, $query: String) {
        products(first: $first, query: $query, sortKey: RELEVANCE) {
          edges { node {
            id
            handle
            title
            vendor
            productType
            tags
            featuredImage { url altText width height }
            priceRange {
              minVariantPrice { amount currencyCode }
              maxVariantPrice { amount currencyCode }
            }
            displayName: metafield(namespace: "custom", key: "display_name") { value }
            brand: metafield(namespace: "custom", key: "brand") { value }
            sourceTitle: metafield(namespace: "custom", key: "source_title") { value }
            lookTags: metafield(namespace: "custom", key: "look_tags") { value }
            material: metafield(namespace: "custom", key: "material") { value }
            heightCm: metafield(namespace: "custom", key: "height_cm") { value }
            cupSize: metafield(namespace: "custom", key: "cup_size") { value }
            stockStatus: metafield(namespace: "custom", key: "stock_status") { value }
          } }
        }
      }`,
      { first: Math.min(Math.max(first, 1), 100), query },
      { revalidate }
    );

    return data.products.edges
      .map(({ node }) =>
        mapShopifyProduct({
          ...node,
          description: "",
          images: { edges: [] },
          variants: { edges: [] }
        } as ProductListNode)
      )
      .filter(isCustomerVisibleProduct);
  } catch (error) {
    console.error(error);
    return fallbackProducts;
  }
}

function isCustomerVisibleProduct(product: Product) {
  if (isHiddenCatalogBrand(product.extended.brand ?? product.vendor)) return false;
  if ((product.tags || []).some((tag) => isHiddenCatalogBrand(tag))) return false;
  return !(product.tags || []).some((tag) => /^dollwow-system$/i.test(tag) || /^custom-option-charge$/i.test(tag) || /^dollwow-test$/i.test(tag));
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

    const product = data.product ? mapShopifyProduct(data.product) : (sampleProducts.find((item) => item.handle === handle) ?? null);
    return product && isCustomerVisibleProduct(product) ? product : null;
  } catch (error) {
    console.error(error);
    return sampleProducts.find((product) => product.handle === handle) ?? null;
  }
}

export async function getProductsByHandles(
  handles: string[],
  options: { cache?: RequestCache; revalidate?: number } = { revalidate: 120 }
) {
  const uniqueHandles = [...new Set(handles.filter(Boolean))];
  if (!uniqueHandles.length) return [];
  if (!hasShopifyStorefrontEnv()) {
    const byHandle = new Map(sampleProducts.filter(isCustomerVisibleProduct).map((product) => [product.handle, product]));
    return uniqueHandles.map((handle) => byHandle.get(handle)).filter((product): product is Product => Boolean(product));
  }

  try {
    const variableDefinitions = uniqueHandles.map((_, index) => `$handle${index}: String!`).join(", ");
    const selections = uniqueHandles
      .map((_, index) => `product${index}: product(handle: $handle${index}) { ${productListFields({ imageFirst: 8 })} }`)
      .join("\n");
    const variables = Object.fromEntries(uniqueHandles.map((handle, index) => [`handle${index}`, handle]));
    const data = await storefrontFetch<Record<string, ProductListNode | null>>(
      `query ProductsByHandle(${variableDefinitions}) { ${selections} }`,
      variables,
      options
    );
    return uniqueHandles
      .map((_, index) => data[`product${index}`])
      .filter((node): node is ProductListNode => Boolean(node))
      .map(mapShopifyProduct)
      .filter(isCustomerVisibleProduct);
  } catch (error) {
    console.error(error);
    return [];
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
    items?: Array<{ group?: string; label: string; amount: number }>;
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
          // Shopify Checkout currently presents cart lines in reverse creation
          // order. Add pricing components first so the actual doll is the
          // first, primary item customers see in the checkout summary.
          ...customizationChargeLines(input.customizationCharge),
          {
            merchandiseId: input.merchandiseId,
            quantity: input.quantity,
            attributes: withCare365Attribute(input.attributes)
          }
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

export async function createCartWithLines(input: {
  lines: Array<{
    merchandiseId: string;
    quantity: number;
    attributes?: Array<{ key: string; value: string }>;
  }>;
  discountCodes?: string[];
}) {
  if (!hasShopifyStorefrontEnv()) {
    return {
      id: "mock-cart",
      checkoutUrl: "/cart?mockCheckout=1",
      totalQuantity: input.lines.reduce((sum, line) => sum + line.quantity, 0)
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
        lines: input.lines.map((line) => ({
          merchandiseId: line.merchandiseId,
          quantity: line.quantity,
          attributes: withCare365Attribute(line.attributes)
        })),
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
  const checkoutDomain = (env.SHOPIFY_CHECKOUT_DOMAIN || "checkout.dollwow.com").replace(/^https?:\/\//, "").replace(/\/$/, "");
  return normalizeCheckoutUrl(checkoutUrl, checkoutDomain);
}

type ShopifyCartLineInput = {
  merchandiseId: string;
  quantity: number;
  attributes?: Array<{ key: string; value: string }>;
};

function withCare365Attribute(attributes: Array<{ key: string; value: string }> = []) {
  if (attributes.some((attribute) => attribute.key.toLowerCase() === "dollwow care")) return attributes;
  return [...attributes, { key: "DollWOW Care", value: "Care 365 included" }];
}

type ChargeVariant = {
  amount: number;
  merchandiseId: string;
};

export function customizationChargeLines(charge?: {
  amount: number;
  currencyCode: string;
  title?: string;
  items?: Array<{ group?: string; label: string; amount: number }>;
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

  const lines: ShopifyCartLineInput[] = [];
  const itemTotalCents = (charge.items || []).reduce((sum, item) => sum + Math.round(item.amount * 100), 0);
  const chargeItems = charge.items?.length && itemTotalCents === Math.round(charge.amount * 100)
    ? charge.items
    : [{ label: "Selected upgrades", amount: charge.amount }];

  for (const item of chargeItems) {
    let remainingCents = Math.round(item.amount * 100);
    for (const variant of variants) {
      const variantCents = Math.round(variant.amount * 100);
      if (variantCents <= 0 || remainingCents < variantCents) continue;
      const quantity = Math.floor(remainingCents / variantCents);
      if (!quantity) continue;
      lines.push({
        merchandiseId: variant.merchandiseId,
        quantity,
        attributes: [
          { key: "Applies to", value: charge.title || "Selected product" },
          { key: "Customization", value: [item.group, item.label].filter(Boolean).join(" — ") }
        ]
      });
      remainingCents -= quantity * variantCents;
    }
    if (remainingCents !== 0) {
      throw new Error("Custom option charge denominations do not cover this option total. Add smaller Shopify charge variants.");
    }
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
