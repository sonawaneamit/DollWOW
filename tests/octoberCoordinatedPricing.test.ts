import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sampleProducts } from "@/lib/data/sample-products";
import type { BrandCustomizationConfig, CustomizationGroup, CustomizationOption } from "@/types/customization";
import type { Product } from "@/types/product";
vi.mock('server-only', () => ({}));
vi.mock('@/lib/dollvue/currentHold', () => ({ getCurrentDollVueHold: vi.fn(async () => 'clear') }));

const mocks = vi.hoisted(() => ({ getCustomizationConfig: vi.fn(), getProductsByVariantIds: vi.fn(), getProductByHandle: vi.fn() }));
vi.mock("@/lib/customization/configs", () => ({ getCustomizationConfig: mocks.getCustomizationConfig }));
vi.mock("@/lib/shopify/storefront", () => ({ getProductsByVariantIds: mocks.getProductsByVariantIds, getProductByHandle: mocks.getProductByHandle }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));

import { ProductOptions } from "@/components/ProductOptions";
import { CurrencyProvider } from "@/components/CurrencyProvider";
import { OctoberSupplierPdpPromotion } from "@/components/promotions/OctoberSupplierPromotion";
import { PromotionalOptionPrice } from "@/components/promotions/PromotionalOptionPrice";
import { octoberSupportedBenefits } from "@/lib/promotions/october2026";
import { promotionOptionPrice, promotionPricingForSelections } from "@/lib/promotions/optionPricing";
import { resolveCustomization } from "@/lib/customization/resolve";
import { serverValidateAndRepriceLine } from "@/lib/cart/server-validation";
import { POST as dollVueCart } from "@/app/dollvue/cart/route";

const during = new Date("2026-10-15T12:00:00Z");
const variantId = "gid://shopify/ProductVariant/october-coordinated";
const option = (id: string, label: string, priceDelta: number): CustomizationOption => ({ id, label, priceDelta, priceVerified: true, purchasable: true });
const none = option("none", "No Thanks", 0);
const extra = option("silicone-s1", "S1 · Silicone", 299);
function group(id: string, options: CustomizationOption[], selectionMode: "single" | "multiple" = "single"): CustomizationGroup {
  return { id, label: id.replaceAll("-", " "), options, selectionMode, display: "cards" };
}
function catalog(groups: CustomizationGroup[]): BrandCustomizationConfig {
  return { id: "october-coordinated", brandLabel: "Reviewed", leadTimeNote: "", groups, rules: [] };
}
function product(brand = "Irontech Dolls", material = "Silicone"): Product {
  const base = sampleProducts[0];
  return { ...base, handle: "irontech-october-coordinated", title: `${brand} ${material} doll`, vendor: brand,
    productType: `Custom ${material} doll`, tags: [], images: [], featuredImage: null,
    variants: [{ ...base.variants[0], id: variantId, availableForSale: true, price: { amount: "2000", currencyCode: "USD" } }],
    extended: { brand, material, stockStatus: "custom", customAvailable: true }
  };
}
function prepare(p: Product, c: BrandCustomizationConfig) {
  mocks.getCustomizationConfig.mockReturnValue(c);
  mocks.getProductsByVariantIds.mockResolvedValue(new Map([[variantId, p]]));
  mocks.getProductByHandle.mockResolvedValue(p);
}
function markup(p: Product, c: BrandCustomizationConfig, selections = {}, now = during) {
  return renderToStaticMarkup(createElement(OctoberSupplierPdpPromotion, {
    product: p, promoClock: now.toISOString(), context: promotionPricingForSelections(p, c, selections, now).context
  }));
}

describe("coordinated October PDP and server pricing", () => {
  beforeEach(() => { vi.clearAllMocks(); vi.stubGlobal("React", React); vi.setSystemTime(during); });
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

  it("mounts the light-theme promotion in the real configurator with a free-head tile", () => {
    const p = product();
    const c = catalog([group("add-extra-head", [none, extra], "multiple")]);
    prepare(p, c);
    const html = renderToStaticMarkup(createElement(CurrencyProvider, null, createElement(ProductOptions, {
      product: p, config: c, promoClock: during.toISOString(), templateRecipe: null
    })));
    expect(html).toContain("data-october-supplier-promotion");
    expect(html).toContain("One additional silicone head from the eligible choices");
    expect(html).toContain("$299</s>"); expect(html).toContain("$0</span>");
    expect(markup(p, c)).not.toMatch(/text-ivory|text-gold|bg-ink/);
  });

  it("keeps the same head limit and amount in tile, summary and validated cart", async () => {
    const p = product();
    const c = catalog([group("add-extra-head", [none, extra, option("silicone-s2", "S2 · Silicone", 299)], "multiple")]);
    prepare(p, c);
    const selections = { "add-extra-head": "silicone-s1" };
    const pricing = promotionPricingForSelections(p, c, selections, during);
    expect(pricing.config.groups[0].selectionMode).toBe("single");
    expect(promotionOptionPrice(p, c.groups[0], extra, during, true, pricing.context).displayDelta).toBe(0);
    expect(resolveCustomization(pricing.config, selections, 2000).totalPrice).toBe(2000);
    const line = await serverValidateAndRepriceLine({ merchandiseId: variantId, quantity: 1, selections });
    expect(line.customizationCharge).toBeUndefined();
    await expect(serverValidateAndRepriceLine({ merchandiseId: variantId, quantity: 1,
      selections: { "add-extra-head": ["silicone-s1", "silicone-s2"] }
    })).rejects.toThrow("not available for checkout");
    expect(c.groups[0].options[1].priceDelta).toBe(299);
  });

  it("does not advertise a free head or ROS allocation for ambiguous menus", () => {
    const p = product();
    const ros = option("ros-max-upgrade", "ROS MAX Upgrade", 180);
    const c = catalog([
      group("add-extra-head", [none, extra], "multiple"), group("additional-head", [none, extra]),
      group("head-type", [none, ros]), group("head-type-for-extra-head", [none, ros]),
      group("ironai-talkx-box", [none, option("talkx-box", "IronAI TalkX Box", 119)])
    ]);
    const pricing = promotionPricingForSelections(p, c, {}, during);
    expect(pricing.config.groups[0].options[1].priceDelta).toBe(299);
    expect(pricing.config.groups[2].options[1].priceDelta).toBe(180);
    const html = markup(p, c);
    expect(html).toContain("TalkX"); expect(html).not.toContain("additional silicone head"); expect(html).not.toContain("ROS MAX");
    const conditional = { ...c, groups: c.groups.map(g => ({ ...g, visibleWhen: [[{ groupId: "head-type", optionId: "none" }]] })) };
    expect(markup(p, conditional)).toBe("");
    expect(markup(p, catalog([]))).toBe("");
  });

  it("keeps unreleased eyelid charges unchanged for ROS selections and omitted defaults", async () => {
    const p = product("SE Doll", "Silicone Pro");
    const eyelids = { ...option("movable-eyelids", "Movable Eyelids", 100), factoryExists: true };
    const c = catalog([
      group("head-type", [option("ros", "ROS", 150), none]),
      group("premium-body-options", [none, eyelids], "multiple")
    ]);
    prepare(p, c);
    for (const [head, expected] of [["ros", 100], ["none", 100], [undefined, 100]] as const) {
      const selections = { ...(head ? { "head-type": head } : {}), "premium-body-options": ["movable-eyelids"] };
      const pricing = promotionPricingForSelections(p, c, selections, during);
      const tile = promotionOptionPrice(p, c.groups[1], eyelids, during, true, pricing.context);
      expect(tile.displayDelta).toBe(expected);
      const html = renderToStaticMarkup(createElement(PromotionalOptionPrice, { pricing: tile, currencyCode: "USD" }));
      expect(html).toContain(`$${expected}`); expect(html).not.toContain("$0</span>");
      const line = await serverValidateAndRepriceLine({ merchandiseId: variantId, quantity: 1, selections });
      expect(line.customizationCharge?.amount).toBe(expected);
      const benefits = octoberSupportedBenefits(p, pricing.context, during).join(" ");
      expect(benefits.includes("30% off Movable Eyelids")).toBe(false);
    }
    expect(eyelids.priceDelta).toBe(100);
  });

  it("renders any future paid adjustment at its actual amount, never as free", () => {
    const html = renderToStaticMarkup(createElement(PromotionalOptionPrice, { currencyCode: "USD", pricing: {
      catalogDelta: 100, displayDelta: 70, strike: true, promoLabel: "Verified test adjustment",
      active: true, eligible: true, displayLabel: "Movable Eyelids"
    } }));
    expect(html).toContain("$70"); expect(html).not.toContain("$0</span>");
  });

  it("hides conflicted benefits instead of advertising a disabled free option", () => {
    const p = product();
    const c = catalog([group("add-extra-head", [none, extra]), group("body", [none, option("heating", "Body Heating", 200)])]);
    c.rules = [{ id: "unsupported-pair", type: "incompatible", when: { groupId: "body", optionId: "heating" },
      conflictsWith: { groupId: "add-extra-head", optionId: extra.id }, message: "Unsupported pair" }];
    expect(markup(p, c, { body: "heating" })).toBe("");
  });

  it("expires the mounted offer and server price without trusting a client clock", async () => {
    const p = product(); const c = catalog([group("add-extra-head", [none, extra], "multiple")]); prepare(p, c);
    const ended = new Date("2026-11-09T08:00:00Z"); vi.setSystemTime(ended);
    expect(markup(p, c, {}, ended)).toBe("");
    const input = { merchandiseId: variantId, quantity: 1, selections: { "add-extra-head": [extra.id] }, promoClock: during.toISOString() };
    expect((await serverValidateAndRepriceLine(input)).customizationCharge?.amount).toBe(299);
  });

  it.each([["2026-10-15T12:00:00Z", 0], ["2026-11-09T08:00:00Z", 75]])("excludes undefined body-painting previews without changing normal checkout pricing at %s", async (clock, delta) => {
    vi.setSystemTime(new Date(clock)); const p = product();
    const paint: CustomizationOption = { ...option("s-body-painting-free", "S+ Body Painting", 75), dollVueEnabled: true,
      swatch: { kind: "image", value: "/option-assets/painting.jpg" } };
    const c = catalog([group("makeup-options", [none, paint], "multiple")]); prepare(p, c);
    const response = await dollVueCart(new Request("http://localhost:3226/dollvue/cart", {
      method: "POST", headers: { "content-type": "application/json", origin: "http://localhost:3226" },
      body: JSON.stringify({ productHandle: p.handle, selections: [{ groupId: "makeup-options", optionId: paint.id }], promoClock: during.toISOString() })
    }));
    expect(response.status).toBe(404);
    const line = await serverValidateAndRepriceLine({ merchandiseId: variantId, quantity: 1, selections: { 'makeup-options': [paint.id] } });
    expect(line.customizationCharge?.amount ?? 0).toBe(delta);
  });
});
