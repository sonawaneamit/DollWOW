import { beforeEach, describe, expect, it, vi } from "vitest";
import { sampleProducts } from "@/lib/data/sample-products";
import type { BrandCustomizationConfig } from "@/types/customization";
import type { Product } from "@/types/product";

vi.hoisted(() => {
  process.env.NEXT_PUBLIC_SITE_URL = "https://dollwow.com";
});

const mocks = vi.hoisted(() => ({
  getProductByHandle: vi.fn(),
  getCustomizationConfig: vi.fn()
}));

vi.mock("@/lib/shopify/storefront", () => ({
  getProductByHandle: mocks.getProductByHandle
}));

vi.mock("@/lib/customization/configs", () => ({
  getCustomizationConfig: mocks.getCustomizationConfig
}));

import { POST } from "@/app/dollvue/cart/route";

const config: BrandCustomizationConfig = {
  id: "adversarial-dollvue",
  brandLabel: "Irontech Dolls",
  leadTimeNote: "",
  rules: [],
  groups: [{
    id: "finishing-details",
    label: "Finishing detail",
    selectionMode: "multiple",
    display: "swatches",
    options: [{
      id: "none",
      label: "No add-on",
      priceDelta: 0,
      priceVerified: true,
      purchasable: true
    }, {
      id: "supplier-choice",
      label: "Standard finish",
      productionNote: "Default supplier selection",
      priceDelta: 0,
      priceVerified: true,
      purchasable: true
    }, {
      id: "painted-freckles",
      label: "Painted freckles",
      priceDelta: 90,
      priceVerified: true,
      purchasable: true,
      dollVueEnabled: true,
      swatch: { kind: "image", value: "https://supplier.test/painted-freckles.jpg" }
    }]
  }]
};

function dollVueProduct(): Product {
  const source = sampleProducts[0];
  return {
    ...source,
    handle: "irontech-adversarial-dollvue-model",
    title: "Irontech DollVue Model",
    vendor: "Irontech Dolls",
    tags: ["irontech", "customizable"],
    variants: [{
      ...source.variants[0],
      id: "gid://shopify/ProductVariant/dollvue",
      availableForSale: true,
      price: { amount: "2000", currencyCode: "USD" }
    }],
    extended: {
      ...source.extended,
      brand: "Irontech Dolls",
      stockStatus: "custom"
    }
  };
}

describe("POST /dollvue/cart", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getProductByHandle.mockResolvedValue(dollVueProduct());
    mocks.getCustomizationConfig.mockReturnValue(config);
  });

  it("removes every differently-recognized neutral default when adding a paid multiple-selection preview", async () => {
    const response = await POST(new Request("https://dollwow.com/dollvue/cart", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://dollwow.com"
      },
      body: JSON.stringify({
        productHandle: "irontech-adversarial-dollvue-model",
        selections: [{ groupId: "finishing-details", optionId: "painted-freckles" }]
      })
    }));

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.item.selections["finishing-details"]).toEqual(["painted-freckles"]);
    expect(payload.item.unitPrice).toBe(2090);
    expect(payload.item.attributes).toContainEqual({
      key: "DollWow Finishing detail",
      value: "Painted freckles (+$90)"
    });
  });
});