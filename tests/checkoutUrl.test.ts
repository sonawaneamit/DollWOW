import { afterEach, describe, expect, it, vi } from "vitest";

describe("normalizeShopifyCheckoutUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("moves Shopify cart URLs off the Vercel storefront apex", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://dollwow.com");
    vi.stubEnv("SHOPIFY_STORE_DOMAIN", "dollwow.myshopify.com");
    vi.stubEnv("SHOPIFY_CHECKOUT_DOMAIN", "checkout.dollwow.com");

    const { normalizeShopifyCheckoutUrl } = await import("@/lib/shopify/storefront");
    const normalized = normalizeShopifyCheckoutUrl("https://dollwow.com/cart/c/abc123?key=secret");

    expect(normalized).toBe("https://checkout.dollwow.com/cart/c/abc123?key=secret");
  });

  it("keeps non-checkout storefront URLs alone", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://dollwow.com");
    vi.stubEnv("SHOPIFY_CHECKOUT_DOMAIN", "checkout.dollwow.com");

    const { normalizeShopifyCheckoutUrl } = await import("@/lib/shopify/storefront");

    expect(normalizeShopifyCheckoutUrl("https://dollwow.com/products/test")).toBe("https://dollwow.com/products/test");
  });
});
