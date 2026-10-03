import { afterEach, describe, expect, it, vi } from "vitest";
import { sampleProducts } from "@/lib/data/sample-products";
import { promotionOptionPrice, withPromotionOptionPricing } from "@/lib/promotions/optionPricing";
import type { Product } from "@/types/product";
const mocks = vi.hoisted(() => ({ getProductsByVariantIds: vi.fn() }));
vi.mock("@/lib/shopify/storefront", () => mocks);
import { serverValidateAndRepriceLine } from "@/lib/cart/server-validation";

const breathing = { id: "breathing-system", label: "Breathing System", priceDelta: 100 };
const group = { id: "body-upgrades", label: "Body Upgrades", display: "cards" as const, selectionMode: "multiple" as const, options: [breathing, { id: "none", label: "No Thanks", priceDelta: 0 }] };
const product: Product = { ...sampleProducts[0], handle: "wm-reviewed-test", title: "WM reviewed doll", vendor: "WM Dolls", productType: "Doll", tags: ["wm-dolls"],
  extended: { brand: "WM Dolls", material: "TPE", heightCm: 165, stockStatus: "custom", customizationGroups: [group] },
  variants: [{ ...sampleProducts[0].variants[0], availableForSale: true, price: { amount: "1500", currencyCode: "USD" } }] };
afterEach(() => vi.useRealTimers());

describe("WM owner-approved October breathing", () => {
  it.each([["2026-09-30T12:00:00Z",100],["2026-10-03T12:00:00Z",0],["2026-11-01T07:00:00Z",100]])("uses one effective price in PDP and server cart at %s", async (clock, expected) => {
    vi.setSystemTime(new Date(clock));
    mocks.getProductsByVariantIds.mockResolvedValue(new Map([[product.variants[0].id,product]]));
    expect(promotionOptionPrice(product,group,breathing).displayDelta).toBe(expected);
    const line=await serverValidateAndRepriceLine({merchandiseId:product.variants[0].id,quantity:1,selections:{"body-upgrades":["breathing-system"]}});
    expect(line.customizationCharge?.amount ?? 0).toBe(expected);
    expect(line.attributes.some(a=>a.value.includes("Breathing System"))).toBe(true);
    expect(breathing.priceDelta).toBe(100);
  });
  it("does not change other brands, RTS, heating, or disabled promotions", () => {
    const now=new Date("2026-10-03T12:00:00Z");
    for(const p of [{...product,extended:{...product.extended,brand:"Lusandy"}},{...product,extended:{...product.extended,stockStatus:"ready_to_ship" as const}}]) expect(promotionOptionPrice(p,group,breathing,now).displayDelta).toBe(100);
    expect(promotionOptionPrice(product,group,{...breathing,id:"body-heating",label:"Body Heating"},now).displayDelta).toBe(100);
    expect(promotionOptionPrice(product,group,breathing,now,false).displayDelta).toBe(100);
    expect(withPromotionOptionPricing(product,{id:"wm",brandLabel:"WM Dolls",leadTimeNote:"",rules:[],groups:[group]},now).groups[0].options[0].priceDelta).toBe(0);
  });
});
