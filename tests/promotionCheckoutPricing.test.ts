import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sampleProducts } from "@/lib/data/sample-products";
import type { Product } from "@/types/product";

const mocks = vi.hoisted(() => ({
  createCart: vi.fn(),
  getProductsByVariantIds: vi.fn(),
  trackServerEvent: vi.fn()
}));

vi.mock("@/lib/shopify/storefront", () => ({
  createCart: mocks.createCart,
  getProductsByVariantIds: mocks.getProductsByVariantIds
}));

vi.mock("@/lib/analytics/events", () => ({
  analyticsEvents: { addToCart: "add_to_cart", beginCheckout: "begin_checkout" },
  trackServerEvent: mocks.trackServerEvent
}));

import { POST } from "@/app/api/cart/create/route";

const VARIANT_ID = "gid://shopify/ProductVariant/promo-flora";

function flora(): Product {
  const source = sampleProducts[0];
  return {
    ...source,
    handle: "irontech-flora-161cm-g-cup-hybrid-companion-doll-14dpc",
    title: "Irontech Flora 161cm Hybrid Doll",
    vendor: "Irontech Dolls",
    productType: "Custom hybrid doll",
    tags: ["irontech", "hybrid", "customizable"],
    variants: [{ ...source.variants[0], id: VARIANT_ID, price: { amount: "2000", currencyCode: "USD" } }],
    extended: {
      ...source.extended,
      brand: "Irontech Dolls",
      material: "Hybrid",
      stockStatus: "custom",
      customizationGroups: [{
        id: "silicone-heads",
        label: "Your Custom Silicone Head",
        display: "swatches",
        options: [
          { id: "s1", label: "S1", priceDelta: 0 },
          { id: "s2", label: "S2", priceDelta: 0 }
        ]
      }]
    }
  };
}

function request(extraHeadSelection: string | string[]) {
  return new Request("https://dollwow.com/api/cart/create", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      merchandiseId: VARIANT_ID,
      quantity: 1,
      selections: { "add-extra-head": extraHeadSelection },
      customizationCharge: { amount: 1, currencyCode: "USD", title: "forged client price" }
    })
  });
}

describe("promotion checkout repricing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getProductsByVariantIds.mockResolvedValue(new Map([[VARIANT_ID, flora()]]));
    mocks.createCart.mockResolvedValue({ id: "cart", checkoutUrl: "/checkout", totalQuantity: 1 });
  });

  afterEach(() => vi.useRealTimers());

  it("charges $0 for Flora's catalog-$299 second silicone head inside the window", async () => {
    vi.setSystemTime(new Date("2026-09-15T12:00:00.000Z"));
    const response = await POST(request("silicone-s1"));

    expect(response.status).toBe(200);
    expect(mocks.createCart).toHaveBeenCalledWith(expect.objectContaining({
      customizationCharge: undefined,
      attributes: expect.arrayContaining([
        { key: "DollWow Add Extra Head", value: "S1 · Silicone" },
        { key: "DollWow Option Delta", value: "$0" }
      ])
    }));
  });

  it("restores the server-authoritative $299 charge at the exact cutoff", async () => {
    vi.setSystemTime(new Date("2026-10-08T07:00:00.000Z"));
    const response = await POST(request(["silicone-s1"]));

    expect(response.status).toBe(200);
    expect(mocks.createCart).toHaveBeenCalledWith(expect.objectContaining({
      customizationCharge: {
        amount: 299,
        currencyCode: "USD",
        title: expect.any(String),
        items: [{ group: "Add Extra Head", label: "S1 · Silicone", amount: 299 }]
      },
      attributes: expect.arrayContaining([
        { key: "DollWow Add Extra Head", value: "S1 · Silicone (+$299)" },
        { key: "DollWow Option Delta", value: "$299" }
      ])
    }));
  });
});
