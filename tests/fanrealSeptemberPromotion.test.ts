import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FanrealSeptemberPdpPromotion } from "@/components/promotions/FanrealSeptemberPromotion";
import {
  FANREAL_SEPTEMBER_FREEBIES,
  fanrealSeptemberOfferForProduct
} from "@/lib/promotions/fanrealSeptember2026";
import { promotionOptionPrice } from "@/lib/promotions/optionPricing";
import type { Product } from "@/types/product";

type PromotionProduct = Pick<Product, "handle" | "title" | "vendor" | "productType" | "tags" | "extended">;
const inside = new Date("2026-09-15T12:00:00.000Z");
const cutoff = new Date("2026-10-01T07:00:00.000Z");

function diana(stockStatus: Product["extended"]["stockStatus"] = "custom"): PromotionProduct {
  return {
    handle: "fanreal-diana-168cm-f-cup-real-skin-silicone-companion-doll",
    title: "Fanreal Diana 168cm F-Cup Real Skin Silicone Companion Doll",
    vendor: "Fanreal",
    productType: "Custom silicone doll",
    tags: ["fanreal", "silicone", "custom"],
    extended: { brand: "Fanreal", material: "Silicone", stockStatus }
  };
}

describe("Fanreal September 2026 promotion", () => {
  it("uses the exact MAP-backed freebie list", () => {
    expect(FANREAL_SEPTEMBER_FREEBIES).toEqual([
      "Hard Hand", "Hard Feet", "Movable Toes", "Articulated Fingers", "Soft Butt",
      "Soft Vagina", "Implanted Hair", "Extra Silicone Head", "Extra ROS Head"
    ]);
    const text = FANREAL_SEPTEMBER_FREEBIES.join(" ");
    expect(text).not.toMatch(/EVO|Gel Breast|Hyper-Realism|TalkX|Loose Joint/i);
  });

  it("runs through all of 30 September Pacific and auto-reverts at the cutoff", () => {
    expect(fanrealSeptemberOfferForProduct(diana(), new Date("2026-10-01T06:59:59.999Z"))).not.toBeNull();
    expect(fanrealSeptemberOfferForProduct(diana(), cutoff)).toBeNull();
    expect(fanrealSeptemberOfferForProduct(diana("ready_to_ship"), inside)).toBeNull();
  });

  it("uses preview promoClock for PDP visibility and renders no Official CTA", () => {
    const insideMarkup = renderToStaticMarkup(createElement(FanrealSeptemberPdpPromotion, { product: diana(), promoClock: inside.toISOString() }));
    const endedMarkup = renderToStaticMarkup(createElement(FanrealSeptemberPdpPromotion, { product: diana(), promoClock: cutoff.toISOString() }));
    expect(insideMarkup).toContain("1–30 September 2026");
    expect(insideMarkup).toContain("Free Hard Feet");
    expect(insideMarkup).toContain("sitewide 10%");
    expect(insideMarkup).not.toMatch(/Official|href=/i);
    expect(endedMarkup).toBe("");
  });

  it("maps real fixture option ids to derived free pricing without changing catalog price", () => {
    const pricing = promotionOptionPrice(
      diana(),
      { id: "fanreal-sept-free-add-ons", label: "Fanreal Sept Free Add-Ons" },
      { id: "extra-silicone-head", label: "Extra Silicone Head", priceDelta: 550 },
      inside
    );
    expect(pricing).toMatchObject({ catalogDelta: 550, displayDelta: 0, strike: true, active: true, promoLabel: "Fanreal - Limited Time Promo (Ends: 30 Sept)" });
    expect(promotionOptionPrice(diana(), { id: "fanreal-sept-free-add-ons", label: "Fanreal Sept Free Add-Ons" }, { id: "extra-silicone-head", label: "Extra Silicone Head", priceDelta: 550 }, cutoff))
      .toMatchObject({ catalogDelta: 550, displayDelta: 550, active: false });
    expect(promotionOptionPrice(diana(), { id: "standing", label: "Standing / Feet" }, { id: "standing-without-bolts", label: "Standing without bolts (Hard feet)" }, inside).active).toBe(true);
  });
});
