import { afterEach, describe, expect, it, vi } from "vitest";
import { getSeoCatalogProducts } from "@/lib/shopify/storefront";

vi.mock("@/lib/utils/env", () => ({
  env: { SHOPIFY_STORE_DOMAIN: "test.myshopify.com", SHOPIFY_STOREFRONT_ACCESS_TOKEN: "test-token" },
  hasShopifyStorefrontEnv: () => true
}));

afterEach(() => vi.unstubAllGlobals());

describe("public sitemap catalog source", () => {
  it("does not fall back to sample products when the catalog is empty", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ data: { products: { edges: [], pageInfo: { hasNextPage: false, endCursor: null } } } })));
    expect(await getSeoCatalogProducts({ strict: true })).toEqual([]);
  });

  it("fails on upstream errors rather than caching a sample sitemap", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ errors: [{ message: "Unavailable" }] }, { status: 503 })));
    await expect(getSeoCatalogProducts({ strict: true })).rejects.toThrow("Unavailable");
  });

  it("paginates Storefront products and retains updatedAt without using Admin data", async () => {
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      const request = JSON.parse(String(init.body));
      expect(request.query).toContain("updatedAt");
      expect(request.query).not.toContain("status: DRAFT");
      const second = Boolean(request.variables.after);
      const node = {
        id: second ? "2" : "1", handle: second ? "second" : "first", title: "Doll", vendor: "WM",
        tags: [], productType: "Doll", updatedAt: "2026-10-01T12:00:00Z", featuredImage: null,
        priceRange: { minVariantPrice: { amount: "100", currencyCode: "USD" }, maxVariantPrice: { amount: "100", currencyCode: "USD" } }
      };
      return Response.json({ data: { products: { edges: [{ node }], pageInfo: { hasNextPage: !second, endCursor: second ? null : "next" } } } });
    });
    vi.stubGlobal("fetch", fetchMock);
    const products = await getSeoCatalogProducts({ strict: true });
    expect(products.map((p) => p.handle)).toEqual(["first", "second"]);
    expect(products[0].updatedAt).toBe("2026-10-01T12:00:00Z");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toBe("https://test.myshopify.com/api/2026-04/graphql.json");
  });
});
