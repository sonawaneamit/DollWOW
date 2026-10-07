import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sampleProducts } from "@/lib/data/sample-products";
import { hasShopifyStorefrontEnv } from "@/lib/utils/env";
import { getProductByHandle, isCustomerVisibleProduct } from "@/lib/shopify/storefront";

vi.mock("@/lib/utils/env", () => ({
  env: { SHOPIFY_STORE_DOMAIN: "test.myshopify.com", SHOPIFY_STOREFRONT_ACCESS_TOKEN: "test-token" },
  hasShopifyStorefrontEnv: vi.fn(() => true)
}));

const sample = sampleProducts.find(isCustomerVisibleProduct)!;
const liveProduct = {
  id: "gid://shopify/Product/live",
  handle: sample.handle,
  title: "Live product",
  description: "",
  vendor: "WM",
  productType: "Doll",
  tags: [],
  featuredImage: null,
  images: { edges: [] },
  variants: { edges: [] },
  priceRange: sample.priceRange
};

beforeEach(() => {
  vi.mocked(hasShopifyStorefrontEnv).mockReturnValue(true);
  vi.stubGlobal("fetch", vi.fn());
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("getProductByHandle strict lookups", () => {
  it("does not substitute a matching sample for a missing or unpublished product", async () => {
    vi.mocked(fetch).mockResolvedValue(Response.json({ data: { product: null } }));
    await expect(getProductByHandle(sample.handle, { strict: true })).resolves.toBeNull();
  });

  it("fails without Shopify configuration instead of returning a matching sample", async () => {
    vi.mocked(hasShopifyStorefrontEnv).mockReturnValue(false);
    await expect(getProductByHandle(sample.handle, { strict: true })).rejects.toThrow("Shopify Storefront API is not configured.");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("propagates network failures instead of returning a matching sample", async () => {
    const error = new Error("Network unavailable");
    vi.mocked(fetch).mockRejectedValue(error);
    await expect(getProductByHandle(sample.handle, { strict: true })).rejects.toBe(error);
  });

  it.each([
    ["HTTP failure", 503, { data: { product: null } }, "Shopify Storefront request failed."],
    ["GraphQL failure with partial data", 200, { data: { product: liveProduct }, errors: [{ message: "Unavailable" }] }, "Unavailable"]
  ])("propagates %s", async (_label, status, payload, message) => {
    vi.mocked(fetch).mockResolvedValue(Response.json(payload, { status }));
    await expect(getProductByHandle(sample.handle, { strict: true })).rejects.toThrow(message);
  });

  it("propagates invalid response data", async () => {
    vi.mocked(fetch).mockResolvedValue(Response.json({}));
    await expect(getProductByHandle(sample.handle, { strict: true })).rejects.toThrow();
  });

  it("returns a mapped live product and preserves cache revalidation", async () => {
    vi.mocked(fetch).mockResolvedValue(Response.json({ data: { product: liveProduct } }));
    await expect(getProductByHandle(sample.handle, { strict: true, cache: "force-cache", revalidate: 45 })).resolves.toMatchObject({
      id: liveProduct.id,
      handle: sample.handle,
      images: [],
      variants: []
    });
    expect(fetch).toHaveBeenCalledWith(
      "https://test.myshopify.com/api/2026-04/graphql.json",
      expect.objectContaining({ cache: "force-cache", next: { revalidate: 45 } })
    );
  });

  it("still excludes hidden live products", async () => {
    vi.mocked(fetch).mockResolvedValue(Response.json({ data: { product: { ...liveProduct, vendor: "Zelex" } } }));
    await expect(getProductByHandle(sample.handle, { strict: true })).resolves.toBeNull();
  });
});

describe("getProductByHandle default compatibility", () => {
  it.each([undefined, false])("retains missing-product fallback when strict is %s", async (strict) => {
    vi.mocked(fetch).mockResolvedValue(Response.json({ data: { product: null } }));
    await expect(getProductByHandle(sample.handle, strict === undefined ? undefined : { strict })).resolves.toMatchObject(sample);
  });

  it("retains fallback without Shopify configuration", async () => {
    vi.mocked(hasShopifyStorefrontEnv).mockReturnValue(false);
    await expect(getProductByHandle(sample.handle)).resolves.toBe(sample);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("retains fallback on network failure and the default no-store policy", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("Network unavailable"));
    await expect(getProductByHandle(sample.handle)).resolves.toBe(sample);
    expect(fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ cache: "no-store" }));
  });
});
