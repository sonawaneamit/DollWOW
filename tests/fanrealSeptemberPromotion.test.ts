import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FanrealSeptemberPdpPromotion } from "@/components/promotions/FanrealSeptemberPromotion";
import { PromotionalOptionPrice } from "@/components/promotions/PromotionalOptionPrice";
import {
  FANREAL_SEPTEMBER_FREEBIES,
  fanrealSeptemberOfferForProduct,
  matchesFanrealSeptemberOption
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
      "Extra Silicone Head"
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
    expect(insideMarkup).toContain("Free Extra Silicone Head");
    expect(insideMarkup).not.toContain("Free Hard Feet");
    expect(insideMarkup).toContain("sitewide 10%");
    expect(insideMarkup).not.toMatch(/Official|href=/i);
    expect(endedMarkup).toBe("");
  });

  it("matches only Extra Silicone Head in the Fanreal Sept free-add-ons group", () => {
    expect(matchesFanrealSeptemberOption(
      { id: "fanreal-sept-free-add-ons", label: "Fanreal Sept Free Add-Ons" },
      { id: "extra-silicone-head", label: "Extra Silicone Head", priceDelta: 550 }
    )).toBe(true);
    expect(matchesFanrealSeptemberOption(
      { id: "standing", label: "Standing / Feet" },
      { id: "standing-without-bolts-hard-feet", label: "Standing without bolts (Hard feet)" }
    )).toBe(false);
    expect(matchesFanrealSeptemberOption(
      { id: "fanreal-sept-free-add-ons", label: "Fanreal Sept Free Add-Ons" },
      { id: "hard-hand", label: "Hard Hand", priceDelta: 0 }
    )).toBe(false);
    expect(matchesFanrealSeptemberOption(
      { id: "standing", label: "Standing / Feet" },
      { id: "extra-silicone-head", label: "Extra Silicone Head", priceDelta: 550 }
    )).toBe(false);
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

    const standing = promotionOptionPrice(
      diana(),
      { id: "standing", label: "Standing / Feet" },
      { id: "standing-without-bolts-hard-feet", label: "Standing without bolts (Hard feet)" },
      inside
    );
    expect(standing).toMatchObject({ active: false, promoLabel: null, catalogDelta: 0, displayDelta: 0 });
    const standingMarkup = renderToStaticMarkup(createElement(PromotionalOptionPrice, { pricing: standing, currencyCode: "USD", included: true }));
    expect(standingMarkup).toBe("Included");
    expect(standingMarkup).not.toContain("Fanreal");
    expect(standingMarkup).not.toContain("$0");

    expect(promotionOptionPrice(diana(), { id: "fanreal-sept-free-add-ons", label: "Fanreal Sept Free Add-Ons" }, { id: "hard-hand", label: "Hard Hand", priceDelta: 0 }, inside))
      .toMatchObject({ active: false, promoLabel: null });

    const headMarkup = renderToStaticMarkup(createElement(PromotionalOptionPrice, { pricing, currencyCode: "USD" }));
    expect(headMarkup).toContain("$550");
    expect(headMarkup).toContain("$0");
    expect(headMarkup).toContain("Fanreal - Limited Time Promo (Ends: 30 Sept)");
    expect(headMarkup).toMatch(/rounded-full/);
  });
});
