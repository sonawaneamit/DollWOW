import { beforeEach, describe, expect, it, vi } from "vitest";
import { sampleProducts } from "@/lib/data/sample-products";
import type { Product } from "@/types/product";

vi.hoisted(() => {
  process.env.PASSPORT_SESSION_SECRET ||= "test-dollvue-session-secret-at-least-32-characters";
});

const mocks = vi.hoisted(() => ({
  createCartWithLines: vi.fn(),
  getProductByVariantId: vi.fn(),
  getProductsByVariantIds: vi.fn(),
  trackServerEvent: vi.fn()
}));

vi.mock("@/lib/shopify/storefront", () => ({
  createCartWithLines: mocks.createCartWithLines,
  getProductByVariantId: mocks.getProductByVariantId,
  getProductsByVariantIds: mocks.getProductsByVariantIds
}));

vi.mock("@/lib/analytics/events", () => ({
  analyticsEvents: { beginCheckout: "begin_checkout" },
  trackServerEvent: mocks.trackServerEvent
}));

import { POST } from "@/app/api/cart/checkout/route";

const FIRST_VARIANT = "gid://shopify/ProductVariant/123";
const SECOND_VARIANT = "gid://shopify/ProductVariant/456";

function product(variantId: string, title: string): Product {
  const source = sampleProducts[0];
  return {
    ...source,
    title,
    handle: title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    vendor: "Secure Test Brand",
    productType: "Doll",
    tags: ["customizable"],
    variants: [{ ...source.variants[0], id: variantId, availableForSale: true, price: { amount: "2000", currencyCode: "USD" } }],
    extended: {
      ...source.extended,
      displayName: title,
      brand: "Secure Test Brand",
      stockStatus: "custom",
      customizationGroups: [{
        id: "skin-tone",
        label: "Skin tone",
        required: true,
        display: "cards",
        options: [
          { id: "factory", label: "Factory default", priceDelta: 0 },
          { id: "ultra-light-skin", label: "Ultra light skin tone", priceDelta: 45 },
          { id: "tan", label: "Tan", priceDelta: 65 }
        ]
      }, {
        id: "accessories",
        label: "Accessories",
        selectionMode: "multiple",
        display: "cards",
        options: [
          { id: "none", label: "No add-on", priceDelta: 0 },
          { id: "storage-bag", label: "Storage bag", priceDelta: 79 }
        ]
      }]
    }
  };
}

function request(body: unknown) {
  return new Request("https://dollwow.com/api/cart/checkout", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

describe("POST /api/cart/checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getProductByVariantId.mockImplementation(async (id: string) =>
      id === FIRST_VARIANT ? product(FIRST_VARIANT, "Aurora") : product(SECOND_VARIANT, "Nova")
    );
    mocks.getProductsByVariantIds.mockImplementation(async (ids: string[]) => new Map(
      ids.map((id) => [id, id === FIRST_VARIANT ? product(FIRST_VARIANT, "Aurora") : product(SECOND_VARIANT, "Nova")])
    ));
    mocks.createCartWithLines.mockResolvedValue({ id: "cart", checkoutUrl: "/checkout", totalQuantity: 2 });
  });

  it("closes the multi-line bag bypass by independently validating and repricing every line", async () => {
    const response = await POST(request({
      lines: [
        {
          merchandiseId: FIRST_VARIANT,
          quantity: 1,
          attributes: [{ key: "DollWow Body weight technology", value: "ULW (+$1)" }],
          customizationCharge: { amount: 1, currencyCode: "USD", title: "ULW" }
        },
        {
          merchandiseId: SECOND_VARIANT,
          quantity: 1,
          selections: { "skin-tone": "tan" },
          customizationCharge: { amount: 1, currencyCode: "EUR", title: "Client title" }
        }
      ]
    }));

    expect(response.status).toBe(200);
    expect(mocks.getProductsByVariantIds).toHaveBeenCalledWith([FIRST_VARIANT, SECOND_VARIANT]);
    expect(mocks.getProductByVariantId).not.toHaveBeenCalled();
    expect(mocks.createCartWithLines).toHaveBeenCalledWith({
      lines: [
        expect.objectContaining({ attributes: expect.not.arrayContaining([expect.objectContaining({ key: "DollWow Body weight technology" })]), customizationCharge: undefined }),
        expect.objectContaining({
          attributes: expect.arrayContaining([{ key: "DollWow Skin tone", value: "Tan (+$65)" }]),
          customizationCharge: {
            amount: 65,
            currencyCode: "USD",
            title: "Nova",
            items: [{ group: "Skin tone", label: "Tan", amount: 65 }]
          }
        })
      ],
      discountCodes: []
    });
  });

  it("deduplicates a full checkout bag into one bounded product lookup", async () => {
    const lines = Array.from({ length: 20 }, () => ({ merchandiseId: FIRST_VARIANT, quantity: 1 }));

    const response = await POST(request({ lines }));

    expect(response.status).toBe(200);
    expect(mocks.getProductsByVariantIds).toHaveBeenCalledTimes(1);
    expect(mocks.getProductsByVariantIds).toHaveBeenCalledWith([FIRST_VARIANT]);
    expect(mocks.getProductByVariantId).not.toHaveBeenCalled();
    expect(mocks.createCartWithLines.mock.calls[0][0].lines).toHaveLength(20);
  });

  it("multiplies each canonical customization charge by line quantity without changing base quantity", async () => {
    const response = await POST(request({
      lines: [{ merchandiseId: FIRST_VARIANT, quantity: 3, selections: { "skin-tone": "tan" } }]
    }));

    expect(response.status).toBe(200);
    expect(mocks.createCartWithLines).toHaveBeenCalledWith(expect.objectContaining({
      lines: [expect.objectContaining({
        quantity: 3,
        customizationCharge: {
          amount: 195,
          currencyCode: "USD",
          title: "Aurora",
          items: [{ group: "Skin tone", label: "Tan", amount: 195 }]
        }
      })]
    }));
  });

  it("does not claim DollVue preview provenance without server-recorded preview evidence", async () => {
    const selections = { "skin-tone": "ultra-light-skin" };
    const response = await POST(request({
      lines: [{
        merchandiseId: FIRST_VARIANT,
        quantity: 1,
        selections,
        dollVueProvenance: "legacy-server-signed-but-unproven-token",
        attributes: [
          { key: "Gift note", value: "Happy birthday" },
          { key: "DollWow Option Delta", value: "$0" },
          { key: "Unapproved passthrough", value: "remove me" }
        ]
      }]
    }));

    expect(response.status).toBe(200);
    expect(mocks.createCartWithLines).toHaveBeenCalledWith(expect.objectContaining({
      lines: [expect.objectContaining({
        attributes: expect.arrayContaining([
          { key: "Gift note", value: "Happy birthday" },
          { key: "DollWow Skin tone", value: "Ultra light skin tone (+$45)" }
        ]),
        customizationCharge: {
          amount: 45,
          currencyCode: "USD",
          title: "Aurora",
          items: [{ group: "Skin tone", label: "Ultra light skin tone", amount: 45 }]
        }
      })]
    }));
    const line = mocks.createCartWithLines.mock.calls[0][0].lines[0];
    expect(line.attributes).not.toEqual(expect.arrayContaining([expect.objectContaining({ key: "DollVue" })]));
    expect(line.attributes).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ key: "DollWow Option Delta", value: "$0" }),
      expect.objectContaining({ key: "Unapproved passthrough" })
    ]));
  });

  it("ignores forged client-authoritative DollVue provenance", async () => {
    const response = await POST(request({
      lines: [{
        merchandiseId: FIRST_VARIANT,
        quantity: 1,
        selections: { "skin-tone": "ultra-light-skin" },
        configurationSource: "dollvue",
        dollVueProvenance: "forged"
      }]
    }));

    expect(response.status).toBe(200);
    const line = mocks.createCartWithLines.mock.calls[0][0].lines[0];
    expect(line.attributes).not.toEqual(expect.arrayContaining([expect.objectContaining({ key: "DollVue" })]));
  });

  it("rejects contradictory neutral and paid choices in a multi-select group", async () => {
    const response = await POST(request({
      lines: [{
        merchandiseId: FIRST_VARIANT,
        quantity: 1,
        selections: { "skin-tone": "factory", accessories: ["none", "storage-bag"] }
      }]
    }));

    expect(response.status).toBe(400);
    expect(mocks.createCartWithLines).not.toHaveBeenCalled();
  });

  it("rejects a productionNote-only neutral default combined with a paid multi-select choice", async () => {
    const configured = product(FIRST_VARIANT, "Aurora");
    configured.extended.customizationGroups![1].options[0] = {
      id: "supplier-choice",
      label: "Standard accessory package",
      productionNote: "Default supplier selection",
      priceDelta: 0
    };
    mocks.getProductsByVariantIds.mockResolvedValue(new Map([[FIRST_VARIANT, configured]]));

    const response = await POST(request({
      lines: [{
        merchandiseId: FIRST_VARIANT,
        quantity: 1,
        selections: { "skin-tone": "factory", accessories: ["supplier-choice", "storage-bag"] }
      }]
    }));

    expect(response.status).toBe(400);
    expect(mocks.createCartWithLines).not.toHaveBeenCalled();
  });

  it("rejects an excessive number of customization selection groups before lookup", async () => {
    const selections = Object.fromEntries(Array.from({ length: 41 }, (_, index) => [`group-${index}`, "option"]));
    const response = await POST(request({ lines: [{ merchandiseId: FIRST_VARIANT, quantity: 1, selections }] }));

    expect(response.status).toBe(400);
    expect(mocks.getProductsByVariantIds).not.toHaveBeenCalled();
    expect(mocks.createCartWithLines).not.toHaveBeenCalled();
  });

  it.each([
    {},
    { "skin-tone": "unknown" },
    { "unknown-group": "tan" },
    { "skin-tone": [] },
    { "skin-tone": ["tan", "factory"] }
  ])("rejects malformed, unknown, or invalid-cardinality selections: %j", async (selections) => {
    const response = await POST(request({ lines: [{ merchandiseId: FIRST_VARIANT, quantity: 1, selections }] }));

    expect(response.status).toBe(400);
    expect(mocks.createCartWithLines).not.toHaveBeenCalled();
  });

  it("rejects unavailable variants", async () => {
    const unavailable = product(FIRST_VARIANT, "Aurora");
    unavailable.variants[0].availableForSale = false;
    mocks.getProductsByVariantIds.mockResolvedValue(new Map([[FIRST_VARIANT, unavailable]]));

    const response = await POST(request({ lines: [{ merchandiseId: FIRST_VARIANT, quantity: 1 }] }));

    expect(response.status).toBe(400);
    expect(mocks.createCartWithLines).not.toHaveBeenCalled();
  });
});
