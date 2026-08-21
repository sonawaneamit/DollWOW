import { beforeEach, describe, expect, it, vi } from "vitest";
import { sampleProducts } from "@/lib/data/sample-products";
import type { Product } from "@/types/product";

const mocks = vi.hoisted(() => ({
  createCart: vi.fn(),
  getProductByVariantId: vi.fn(),
  getProductsByVariantIds: vi.fn(),
  trackServerEvent: vi.fn()
}));

vi.mock("@/lib/shopify/storefront", () => ({
  createCart: mocks.createCart,
  getProductByVariantId: mocks.getProductByVariantId,
  getProductsByVariantIds: mocks.getProductsByVariantIds
}));

vi.mock("@/lib/analytics/events", () => ({
  analyticsEvents: { addToCart: "add_to_cart", beginCheckout: "begin_checkout" },
  trackServerEvent: mocks.trackServerEvent
}));

import { POST } from "@/app/api/cart/create/route";

const VARIANT_ID = "gid://shopify/ProductVariant/123";

function verifiedIrontech(): Product {
  const source = sampleProducts[0];
  return {
    ...source,
    title: "Irontech 165cm full body doll",
    handle: "irontech-165cm-full-body-doll",
    vendor: "Irontech Dolls",
    productType: "Custom Silicone doll",
    tags: ["irontech", "customizable"],
    variants: [{ ...source.variants[0], id: VARIANT_ID, price: { amount: "2000", currencyCode: "USD" } }],
    extended: {
      ...source.extended,
      brand: "Irontech Dolls",
      material: "Full silicone",
      stockStatus: "custom",
      customizationGroups: undefined,
      irontechUlwEligibility: {
        status: "verified",
        bodyModel: "Irontech 165F",
        source: "irontech-production-data",
        verifiedAt: "2026-08-20"
      }
    }
  };
}

describe("POST /api/cart/create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getProductByVariantId.mockResolvedValue(verifiedIrontech());
    mocks.getProductsByVariantIds.mockResolvedValue(new Map([[VARIANT_ID, verifiedIrontech()]]));
    mocks.createCart.mockResolvedValue({ id: "cart", checkoutUrl: "/checkout", totalQuantity: 1 });
  });

  it("recomputes an eligible ULW selection and its canonical $195 charge server-side", async () => {
    const response = await POST(new Request("https://dollwow.com/api/cart/create", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        merchandiseId: VARIANT_ID,
        quantity: 1,
        selections: { "body-weight": "ultra-lightweight" },
        attributes: [{ key: "DollWow Body weight technology", value: "Ultra Light Weight (ULW) (+$1)" }],
        customizationCharge: {
          amount: 1,
          currencyCode: "USD",
          items: [{ group: "Body weight technology", label: "Ultra Light Weight (ULW)", amount: 1 }]
        }
      })
    }));

    expect(response.status).toBe(200);
    expect(mocks.createCart).toHaveBeenCalledWith(expect.objectContaining({
      attributes: expect.arrayContaining([
        { key: "DollWow Body weight technology", value: "Ultra Light Weight (ULW) (+$195)" },
        { key: "DollWow Option Delta", value: "$195" }
      ]),
      customizationCharge: {
        amount: 195,
        currencyCode: "USD",
        title: expect.any(String),
        items: [{ group: "Body weight technology", label: "Ultra Light Weight (ULW)", amount: 195 }]
      }
    }));
  });

  it("rejects ULW when the server-fetched product is not eligible", async () => {
    const product = verifiedIrontech();
    product.extended.irontechUlwEligibility = undefined;
    mocks.getProductsByVariantIds.mockResolvedValue(new Map([[VARIANT_ID, product]]));

    const response = await POST(new Request("https://dollwow.com/api/cart/create", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        merchandiseId: VARIANT_ID,
        quantity: 1,
        selections: { "body-weight": "ultra-lightweight" },
        attributes: [{ key: "DollWow Body weight technology", value: "Ultra Light Weight (ULW) (+$1)" }],
        customizationCharge: { amount: 1, currencyCode: "USD" }
      })
    }));

    expect(response.status).toBe(400);
    expect(mocks.createCart).not.toHaveBeenCalled();
  });

  it.each(["ULW", "Ultra-Light Weight"])(
    "discards a title-only %s charge when structured selections are omitted",
    async (title) => {
      const response = await POST(new Request("https://dollwow.com/api/cart/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          merchandiseId: VARIANT_ID,
          quantity: 1,
          customizationCharge: { amount: 1, currencyCode: "USD", title }
        })
      }));

      expect(response.status).toBe(200);
      expect(mocks.getProductsByVariantIds).toHaveBeenCalledWith([VARIANT_ID]);
      expect(mocks.createCart).toHaveBeenCalledWith(expect.objectContaining({
        merchandiseId: VARIANT_ID,
        customizationCharge: undefined
      }));
    }
  );

  it("discards attribute-only ULW and every other client-supplied reserved DollWow attribute", async () => {
    const response = await POST(new Request("https://dollwow.com/api/cart/create", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        merchandiseId: VARIANT_ID,
        quantity: 1,
        attributes: [
          { key: "DollWow Body weight technology", value: "Ultra Light Weight (ULW) (+$0)" },
          { key: "DollWow Option Delta", value: "$0" },
          { key: "Gift note", value: "Keep this safe note" }
        ]
      })
    }));

    expect(response.status).toBe(200);
    expect(mocks.createCart).toHaveBeenCalledWith(expect.objectContaining({
      attributes: [
        { key: "Gift note", value: "Keep this safe note" },
        { key: "DollWow Reference Name", value: expect.any(String) },
        { key: "Selected configuration", value: "As shown" }
      ],
      customizationCharge: undefined
    }));
  });

  it("preserves an existing uncustomized checkout path but discards its unvalidated client charge", async () => {
    const response = await POST(new Request("https://dollwow.com/api/cart/create", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        merchandiseId: VARIANT_ID,
        quantity: 1,
        attributes: [{ key: "Gift note", value: "Keep this legitimate attribute" }],
        customizationCharge: { amount: 77, currencyCode: "USD", title: "Accessories" }
      })
    }));

    expect(response.status).toBe(200);
    expect(mocks.createCart).toHaveBeenCalledWith(expect.objectContaining({
      attributes: [
        { key: "Gift note", value: "Keep this legitimate attribute" },
        { key: "DollWow Reference Name", value: expect.any(String) },
        { key: "Selected configuration", value: "As shown" }
      ],
      customizationCharge: undefined
    }));
  });

  it("rejects an invalid structured selection instead of accepting its client charge", async () => {
    const response = await POST(new Request("https://dollwow.com/api/cart/create", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        merchandiseId: VARIANT_ID,
        quantity: 1,
        selections: { "body-weight": "client-invented-option" },
        customizationCharge: { amount: 1, currencyCode: "USD", title: "ULW" }
      })
    }));

    expect(response.status).toBe(400);
    expect(mocks.createCart).not.toHaveBeenCalled();
  });
});
