import { createElement, Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { IrontechAutumnPdpPromotion, IrontechAutumnPromoIndexCard } from "@/components/promotions/IrontechAutumnPromotion";
import { SeDollPdpFreebieBlock, SeDollPromoIndexCards } from "@/components/promotions/SeDollSeptemberPromotion";
import {
  IRONTECH_AUTUMN_OFFERS,
  irontechAutumnOfferForProduct,
  isIrontechAutumnPromotionActive,
  isIrontechAutumnPromotionVisible
} from "@/lib/promotions/irontechAutumn2026";
import { promotionOptionPrice } from "@/lib/promotions/optionPricing";
import type { Product } from "@/types/product";

const duringPromotion = new Date("2026-09-15T12:00:00.000Z");
const beforeActive = new Date("2026-09-05T12:00:00.000Z"); // Visible (published) but not yet Active
const justBeforeActive = new Date("2026-09-07T06:59:59.999Z");
const activeStart = new Date("2026-09-07T07:00:00.000Z");
type PromotionProduct = Pick<Product, "handle" | "title" | "vendor" | "productType" | "tags" | "extended">;

function product(overrides: Partial<PromotionProduct> = {}): PromotionProduct {
  return {
    handle: "irontech-evie-161cm-f-cup-silicone-companion-doll-test",
    title: "Irontech Evie 161cm F-Cup Silicone Customizable Companion Doll",
    vendor: "Irontech Dolls",
    productType: "Custom silicone doll",
    tags: ["irontech", "custom", "silicone"],
    extended: { brand: "Irontech Dolls", material: "Silicone", stockStatus: "custom" as const },
    ...overrides
  };
}

describe("Irontech autumn 2026 promotion", () => {
  it("shows the authorized silicone full-body custom stack in a closed, shared-width accordion", () => {
    const offer = irontechAutumnOfferForProduct(product(), duringPromotion);
    expect(offer).toEqual(IRONTECH_AUTUMN_OFFERS.siliconeFullCustom);
    expect(offer?.included).toEqual([
      "Free EVO Skeleton",
      "Free IronAI TalkX Box + 60 Extra Mins AI Talk Time",
      "Softer Body",
      "Free Second Silicone Head",
      "Free ROS / ROS MAX Upgrade (on any one silicone head)",
      "Free Gel Breast & Buttocks",
      "Free Grace Fingers (GraceJoint)",
      "Free Hard Hand & Hard Feet",
      "Free Toe Joints (if available)",
      "Free S+ Makeup & S+ Body Painting"
    ]);

    vi.setSystemTime(duringPromotion);
    try {
      const markup = renderToStaticMarkup(createElement(IrontechAutumnPdpPromotion, { product: product() }));
      expect(markup).toContain("data-irontech-autumn-pdp-promotion");
      expect(markup).toContain("aria-expanded=\"false\"");
      expect(markup).toContain("aspect-[1920/750]");
      expect(markup).toContain("object-contain");
      expect(markup).toContain("8.26-activity-banner-1920x1080.jpg");
      expect(markup).toContain("8.26-activity-banner-mobile.jpg");
      expect(markup).toContain("hidden=\"\"");
      expect(markup).toContain("DollWOW’s sitewide 10% is applied at checkout");
    } finally {
      vi.useRealTimers();
    }
  });

  it("keeps TPE and hybrid second-head terms distinct", () => {
    expect(irontechAutumnOfferForProduct(product({
      handle: "irontech-tpe-custom",
      title: "Irontech TPE Custom Doll",
      productType: "Custom TPE doll",
      extended: { brand: "Irontech Dolls", material: "TPE", stockStatus: "custom" }
    }), duringPromotion)?.included).toContain("Free Second TPE Head");

    expect(irontechAutumnOfferForProduct(product({
      handle: "irontech-flora-161cm-g-cup-hybrid-companion-doll-14dpc",
      title: "Irontech Flora 161cm G-Cup Hybrid Customizable Companion Doll",
      productType: "Custom hybrid doll",
      extended: { brand: "Irontech Dolls", material: "Hybrid", stockStatus: "custom" }
    }), duringPromotion)?.included).toContain("Free Second Silicone Head (soft or hard)");
  });

  it("limits silicone single-head products to the TalkX bonus", () => {
    const offer = irontechAutumnOfferForProduct(product({
      handle: "irontech-ironai-head-companion-doll-1v3pz",
      title: "Irontech",
      productType: "Custom Adult doll doll",
      tags: ["irontech"],
      extended: { brand: "Irontech Dolls", material: "Adult doll", sourceTitle: "IronAI Head", stockStatus: "custom" }
    }), duringPromotion);

    expect(offer).toEqual(IRONTECH_AUTUMN_OFFERS.siliconeSingleHead);
    expect(offer?.included).toEqual(["Free IronAI TalkX Box + 60 Extra Mins AI Talk Time"]);

    expect(irontechAutumnOfferForProduct(product({
      handle: "irontech-other-silicone-head-only",
      title: "Irontech Other Silicone Head Only",
      productType: "Standalone head",
      extended: { brand: "Irontech Dolls", material: "Silicone", stockStatus: "custom" }
    }), duringPromotion)).toBeNull();
  });

  it("classifies Luna's silicone-head body as hybrid rather than a single head", () => {
    const offer = irontechAutumnOfferForProduct(product({
      handle: "irontech-luna-164cm-silicone-head-tpe-body",
      title: "Irontech Luna 164cm Silicone Head Doll",
      productType: "Custom hybrid doll",
      extended: { brand: "Irontech Dolls", material: "Silicone head / TPE body", stockStatus: "custom" }
    }), duringPromotion);

    expect(offer).toEqual(IRONTECH_AUTUMN_OFFERS.hybrid);
  });

  it("excludes Irontech warehouse stock, torsos, Real Lady, and unrelated brands", () => {
    expect(irontechAutumnOfferForProduct(product({
      extended: { brand: "Irontech Dolls", material: "Silicone", stockStatus: "ready_to_ship" }
    }), duringPromotion)).toBeNull();
    expect(irontechAutumnOfferForProduct(product({
      productType: "Custom silicone torso",
      extended: { brand: "Irontech Dolls", material: "Silicone", stockStatus: "custom" }
    }), duringPromotion)).toBeNull();
    expect(irontechAutumnOfferForProduct(product({
      vendor: "Real Lady",
      extended: { brand: "Real Lady", material: "Silicone", stockStatus: "custom" }
    }), duringPromotion)).toBeNull();
    expect(irontechAutumnOfferForProduct(product({
      handle: "sedoll-silicone-custom",
      vendor: "SE Doll",
      tags: ["se-doll", "custom", "silicone"],
      extended: { brand: "SE Doll", material: "Silicone", stockStatus: "custom" }
    }), duringPromotion)).toBeNull();
  });

  it("keeps Annika on the SE TPE and Loose Joints stack without Irontech autumn", () => {
    const annika = product({
      handle: "sedoll-annika-d-165cm-c-cup-tpe-companion-doll-vzkdy",
      title: "SE Doll Annika D 165cm C-Cup TPE Companion Doll",
      vendor: "SE Doll",
      productType: "Custom TPE doll",
      tags: ["se-doll", "custom", "tpe"],
      extended: { brand: "SE Doll", material: "TPE", stockStatus: "custom" }
    });

    vi.setSystemTime(duringPromotion);
    try {
      const markup = renderToStaticMarkup(createElement(Fragment, null,
        createElement(SeDollPdpFreebieBlock, { product: annika }),
        createElement(IrontechAutumnPdpPromotion, { product: annika })
      ));
      expect(markup).toContain("TPE-doll-1920x750-SEdoll.jpg");
      expect(markup).toContain("factory-Loose-Joints-1920x750.jpg");
      expect(markup).not.toContain("irontech-autumn-2026");
    } finally {
      vi.useRealTimers();
    }
  });

  it("adds one Irontech block without replacing the four SE blocks or Loose Joints on /promo", () => {
    vi.setSystemTime(duringPromotion);
    try {
      const markup = renderToStaticMarkup(createElement(Fragment, null,
        createElement(IrontechAutumnPromoIndexCard),
        createElement(SeDollPromoIndexCards)
      ));
      expect(markup).toContain("Irontech autumn factory promotion");
      expect(markup.match(/TPE-doll-1920x750-SEdoll.jpg/g)?.length).toBeGreaterThan(0);
      expect(markup).toContain("Silicone-doll-1920x750-SEdoll.jpg");
      expect(markup).toContain("Silicone-torso-1920x750-SEdoll.jpg");
      expect(markup).toContain("US-EU-stock-1920x750-SEdoll.jpg");
      expect(markup).toContain("factory-Loose-Joints-1920x750.jpg");
    } finally {
      vi.useRealTimers();
    }
  });

  it("publishes for preview, starts at midnight PT September 7, and includes October 7 PT", () => {
    expect(isIrontechAutumnPromotionVisible(new Date("2026-09-02T23:59:59.999Z"))).toBe(false);
    expect(isIrontechAutumnPromotionVisible(new Date("2026-09-03T00:00:00.000Z"))).toBe(true);
    expect(isIrontechAutumnPromotionVisible(new Date("2026-10-08T06:59:59.999Z"))).toBe(true);
    expect(isIrontechAutumnPromotionVisible(new Date("2026-10-08T07:00:00.000Z"))).toBe(false);
    expect(isIrontechAutumnPromotionActive(beforeActive)).toBe(false);
    expect(isIrontechAutumnPromotionActive(justBeforeActive)).toBe(false);
    expect(isIrontechAutumnPromotionActive(activeStart)).toBe(true);
  });

  it("hides PDP banner offer until Active (Visible-but-not-Active returns null)", () => {
    const flora = product({
      handle: "irontech-flora-161cm-g-cup-hybrid-companion-doll-14dpc",
      title: "Irontech Flora 161cm G-Cup Hybrid Customizable Companion Doll",
      productType: "Custom hybrid doll",
      extended: { brand: "Irontech Dolls", material: "Hybrid", stockStatus: "custom" }
    });

    expect(isIrontechAutumnPromotionVisible(beforeActive)).toBe(true);
    expect(irontechAutumnOfferForProduct(flora, beforeActive)).toBeNull();
    expect(irontechAutumnOfferForProduct(flora, justBeforeActive)).toBeNull();
    expect(irontechAutumnOfferForProduct(product(), beforeActive)).toBeNull();

    vi.setSystemTime(beforeActive);
    try {
      expect(renderToStaticMarkup(createElement(IrontechAutumnPdpPromotion, { product: flora }))).toBe("");
      expect(renderToStaticMarkup(createElement(IrontechAutumnPromoIndexCard))).toBe("");
    } finally {
      vi.useRealTimers();
    }
  });

  it("returns hybrid Flora offer inside Active window and renders PDP banner", () => {
    const flora = product({
      handle: "irontech-flora-161cm-g-cup-hybrid-companion-doll-14dpc",
      title: "Irontech Flora 161cm G-Cup Hybrid Customizable Companion Doll",
      productType: "Custom hybrid doll",
      extended: { brand: "Irontech Dolls", material: "Hybrid", stockStatus: "custom" }
    });

    expect(irontechAutumnOfferForProduct(flora, duringPromotion)).toEqual(IRONTECH_AUTUMN_OFFERS.hybrid);
    expect(irontechAutumnOfferForProduct(flora, activeStart)?.kind).toBe("hybrid");

    vi.setSystemTime(duringPromotion);
    try {
      const markup = renderToStaticMarkup(createElement(IrontechAutumnPdpPromotion, {
        product: flora,
        promoClock: duringPromotion.toISOString()
      }));
      expect(markup).toContain("data-irontech-autumn-pdp-promotion");
      expect(markup).toContain("Free IronAI TalkX Box + 60 Extra Mins AI Talk Time");
    } finally {
      vi.useRealTimers();
    }
  });

  it("keeps TalkX free in-window via promotionOptionPrice while banner stays Active-gated", () => {
    const flora = product({
      handle: "irontech-flora-161cm-g-cup-hybrid-companion-doll-14dpc",
      title: "Irontech Flora 161cm G-Cup Hybrid Customizable Companion Doll",
      productType: "Custom hybrid doll",
      extended: { brand: "Irontech Dolls", material: "Hybrid", stockStatus: "custom" }
    });
    const talkx = { id: "talkx", label: "IronAI TalkX Box", priceDelta: 119 };

    expect(promotionOptionPrice(flora, { id: "ironai", label: "IronAI" }, talkx, beforeActive)).toMatchObject({
      catalogDelta: 119,
      displayDelta: 119,
      strike: false,
      active: false,
      eligible: true
    });
    const inWindow = promotionOptionPrice(flora, { id: "ironai", label: "IronAI" }, talkx, duringPromotion);
    expect(inWindow).toMatchObject({
      catalogDelta: 119,
      displayDelta: 0,
      strike: true,
      active: true
    });
    expect(inWindow.promoLabel).toContain("TalkX");
  });
});
