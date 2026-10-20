import { afterEach, describe, expect, it, vi } from "vitest";
vi.hoisted(() => {
  process.env.SHOPIFY_STORE_DOMAIN = "qa-test.myshopify.com";
  process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN = "qa-storefront-token";
});
import { updateCartAnalyticsAttribute } from "@/lib/shopify/storefront";
afterEach(() => { vi.unstubAllGlobals(); });
describe("checkout analytics attribute persistence", () => {
  it("preserves unrelated cart metadata and replaces only its own previous value", async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: { cart: { attributes: [{ key: "keep", value: "original" }, { key: "_dollwow_analytics_context", value: "old" }] } } })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: { cartAttributesUpdate: { userErrors: [] } } })));
    vi.stubGlobal("fetch", fetch);
    await updateCartAnalyticsAttribute("private-cart-id", { key: "_dollwow_analytics_context", value: "new" });
    const body = JSON.parse(fetch.mock.calls[1][1].body);
    expect(body.variables.attributes).toEqual([{ key: "keep", value: "original" }, { key: "_dollwow_analytics_context", value: "new" }]);
    expect(fetch.mock.calls[0][1].signal).toBe(fetch.mock.calls[1][1].signal);
  });
  it("does not blindly overwrite attributes if the existing cart cannot be read", async () => {
    const fetch = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ data: { cart: null } })));
    vi.stubGlobal("fetch", fetch);
    await expect(updateCartAnalyticsAttribute("missing", { key: "a", value: "b" })).rejects.toThrow("unavailable");
    expect(fetch).toHaveBeenCalledOnce();
  });
});
