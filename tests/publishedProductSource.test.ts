import { afterEach, describe, expect, it, vi } from "vitest";

const draft = vi.hoisted(() => vi.fn());
vi.mock("@/lib/catalog/privateDraftPreview", () => ({ getPrivateDraftPreview: draft }));
vi.mock("@/lib/utils/env", () => ({ env: { SHOPIFY_STORE_DOMAIN: "example.myshopify.com", SHOPIFY_STOREFRONT_ACCESS_TOKEN: "test-token" }, hasShopifyStorefrontEnv: () => true }));
import { getProductByHandle } from "@/lib/shopify/storefront";

afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });

describe("explicit published product source", () => {
  it("preserves the existing draft preview default", async () => {
    draft.mockResolvedValue({ id: "existing-preview" });
    expect(await getProductByHandle("example", { strict: true })).toEqual({ id: "existing-preview" });
    expect(draft).toHaveBeenCalledWith("example");
  });
  it("does not substitute a draft snapshot for a strict published lookup", async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { product: null } }) });
    vi.stubGlobal("fetch", fetch);
    expect(await getProductByHandle("example", { strict: true, publishedOnly: true, cache: "no-store" })).toBeNull();
    expect(draft).not.toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledOnce();
    expect(JSON.parse(fetch.mock.calls[0][1].body).variables).toEqual({ handle: "example" });
  });
  it("keeps a published-source failure strict rather than falling back to a draft", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("source unavailable")));
    await expect(getProductByHandle("example", { strict: true, publishedOnly: true })).rejects.toThrow("source unavailable");
    expect(draft).not.toHaveBeenCalled();
  });
});
