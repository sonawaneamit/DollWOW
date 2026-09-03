import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PromotionalOptionPrice } from "@/components/promotions/PromotionalOptionPrice";
import {
  previewPromotionClock,
  promotionOptionPrice,
  withPromotionOptionPricing
} from "@/lib/promotions/optionPricing";
import type { BrandCustomizationConfig, CustomizationGroup, CustomizationOption } from "@/types/customization";
import type { Product } from "@/types/product";

const insideIrontech = new Date("2026-09-15T12:00:00.000Z");
const afterIrontech = new Date("2026-10-08T07:00:00.000Z");
const insideSe = new Date("2026-09-15T12:00:00.000Z");
const afterSe = new Date("2026-10-01T07:00:00.000Z");

type PromotionProduct = Pick<Product, "handle" | "title" | "vendor" | "productType" | "tags" | "extended">;

function irontech(material: string, handle: string): PromotionProduct {
  return {
    handle,
    title: `Irontech ${material} custom doll`,
    vendor: "Irontech Dolls",
    productType: `Custom ${material} doll`,
    tags: ["irontech", "custom", material.toLowerCase()],
    extended: { brand: "Irontech Dolls", material, stockStatus: "custom" }
  };
}

function price(product: PromotionProduct, groupLabel: string, option: CustomizationOption, now = insideIrontech) {
  return promotionOptionPrice(product, { id: groupLabel.toLowerCase().replace(/\s+/g, "-"), label: groupLabel }, option, now);
}

describe("promotion option pricing", () => {
  it("renders a paid active option with its catalog price struck through, $0, and promo text", () => {
    const flora = irontech("Hybrid", "irontech-flora-161cm-g-cup-hybrid-companion-doll-14dpc");
    const pricing = price(flora, "Add Extra Head", { id: "silicone-s1", label: "S1 · Silicone", priceDelta: 299 });

    expect(pricing).toMatchObject({ catalogDelta: 299, displayDelta: 0, strike: true, active: true });
    const markup = renderToStaticMarkup(createElement(PromotionalOptionPrice, { pricing, currencyCode: "USD" }));
    expect(markup).toContain("<s");
    expect(markup).toContain("$299");
    expect(markup).toContain("$0");
    expect(markup).toContain("Irontech Limited Time Promo (Ends: 7 Oct)");
    expect(markup).not.toContain("offer");
  });

  it("returns Flora's catalog $299 automatically at the exact Irontech cutoff", () => {
    const flora = irontech("Hybrid", "irontech-flora-161cm-g-cup-hybrid-companion-doll-14dpc");
    const option = { id: "silicone-s1", label: "S1 · Silicone", priceDelta: 299 };
    expect(price(flora, "Add Extra Head", option, new Date("2026-10-08T06:59:59.999Z")).displayDelta).toBe(0);
    expect(price(flora, "Add Extra Head", option, afterIrontech)).toMatchObject({ catalogDelta: 299, displayDelta: 299, strike: false, active: false });
  });

  it("does not start Irontech pricing before midnight September 7 PT", () => {
    const flora = irontech("Hybrid", "irontech-flora-161cm-g-cup-hybrid-companion-doll-14dpc");
    const option = { id: "silicone-s1", label: "S1 · Silicone", priceDelta: 299 };
    expect(price(flora, "Add Extra Head", option, new Date("2026-09-07T06:59:59.999Z")).displayDelta).toBe(299);
    expect(price(flora, "Add Extra Head", option, new Date("2026-09-07T07:00:00.000Z")).displayDelta).toBe(0);
  });

  it("matches the authorized Evie silicone list and excludes Graceful Daisy", () => {
    const evie = irontech("Silicone", "irontech-evie-161cm-f-cup-silicone-t4-ros-max-companion-doll-mpyhd");
    const options: Array<[string, CustomizationOption]> = [
      ["Skeleton", { id: "evo", label: "EVO Skeleton", priceDelta: 150 }],
      ["Body", { id: "softer-body", label: "Softer Body", priceDelta: 100 }],
      ["Head Type", { id: "ros-max", label: "ROS MAX upgrade", priceDelta: 180 }],
      ["Breast options", { id: "gel-breast", label: "Gel Breast", priceDelta: 120 }],
      ["Fingers", { id: "gracejoint", label: "GraceJoint fingers", priceDelta: 80 }],
      ["Hands", { id: "hard-hands", label: "Hard Hands", priceDelta: 60 }],
      ["Feet", { id: "toe-joints", label: "Toe Joints", priceDelta: 40 }],
      ["Makeup", { id: "s-plus", label: "S+ Makeup", priceDelta: 90 }]
    ];
    for (const [group, option] of options) expect(price(evie, group, option).displayDelta, option.label).toBe(0);
    expect(price(evie, "Fingers", { id: "graceful-daisy", label: "Graceful Daisy", priceDelta: 80 }).eligible).toBe(false);
  });

  it("keeps Tracie and Flora material-specific head and tongue offers distinct", () => {
    const tracie = irontech("TPE", "irontech-tracie-169cm-g-cup-tpe-companion-doll-1xh21");
    const flora = irontech("Hybrid", "irontech-flora-161cm-g-cup-hybrid-companion-doll-14dpc");
    const tpeHead = { id: "tpe-31", label: "31 · TPE", priceDelta: 375 };
    const siliconeHead = { id: "silicone-s1", label: "S1 · Silicone", priceDelta: 299 };
    const withTongue = { id: "with-tongue", label: "With Tongue", priceDelta: 50 };

    expect(price(tracie, "Add Extra Head", tpeHead).active).toBe(true);
    expect(price(tracie, "Add Extra Head", siliconeHead).eligible).toBe(false);
    expect(price(tracie, "Tongue", withTongue).active).toBe(true);
    expect(price(flora, "Add Extra Head", siliconeHead).active).toBe(true);
    expect(price(flora, "Add Extra Head", tpeHead).eligible).toBe(false);
    expect(price(flora, "Tongue", withTongue).eligible).toBe(false);
  });

  it("uses only the official TalkX name and never maps legacy suction Version choices", () => {
    const head = irontech("Silicone", "irontech-ironai-head-companion-doll-1v3pz");
    head.productType = "Custom adult doll";
    head.extended.sourceTitle = "IronAI Head";
    const talkX = price(head, "IronAI", { id: "talkx-box", label: "IronAI TalkX Box", priceDelta: 119 });

    expect(talkX).toMatchObject({ active: true, displayDelta: 0, displayLabel: "IronAI TalkX Box" });
    expect(talkX.promoLabel).toBe("Irontech Limited Time Promo (Ends: 7 Oct) · TalkX + 60 extra mins");
    for (const label of ["Internal Version", "External Version", "Version"]) {
      expect(price(head, "Suction", { id: label.toLowerCase().replace(/\s+/g, "-"), label, priceDelta: 50 }).eligible).toBe(false);
    }
    expect(price(head, "Skeleton", { id: "evo", label: "EVO Skeleton", priceDelta: 150 }).eligible).toBe(false);
  });

  it("applies Annika's SE September free upgrade and reverts at midnight October 1 PT", () => {
    const annika: PromotionProduct = {
      handle: "sedoll-annika-d-165cm-c-cup-tpe-companion-doll-vzkdy",
      title: "SE Doll Annika D",
      vendor: "SE Doll",
      productType: "Custom TPE doll",
      tags: ["se-doll", "tpe", "custom"],
      extended: { brand: "SE Doll", material: "TPE", stockStatus: "custom" }
    };
    const option = { id: "evo-skeleton", label: "EVO Skeleton", priceDelta: 175 };
    expect(price(annika, "Skeleton", option, insideSe)).toMatchObject({
      displayDelta: 0,
      strike: true,
      promoLabel: "SE - Limited Time Promo (Ends: 1 Oct)"
    });
    expect(price(annika, "Skeleton", option, afterSe)).toMatchObject({ catalogDelta: 175, displayDelta: 175, active: false });
  });

  it("derives a priced config without mutating the catalog delta", () => {
    const flora = irontech("Hybrid", "irontech-flora-161cm-g-cup-hybrid-companion-doll-14dpc");
    const group: CustomizationGroup = {
      id: "add-extra-head",
      label: "Add Extra Head",
      display: "cards",
      options: [{ id: "none", label: "No Thanks", priceDelta: 0 }, { id: "silicone-s1", label: "S1 · Silicone", priceDelta: 299 }]
    };
    const config: BrandCustomizationConfig = { id: "irontech", brandLabel: "Irontech", leadTimeNote: "", groups: [group], rules: [] };
    const priced = withPromotionOptionPricing(flora, config, insideIrontech);

    expect(config.groups[0].options[1].priceDelta).toBe(299);
    expect(priced.groups[0].options[1].priceDelta).toBe(0);
    expect(priced.groups[0].selectionMode).toBe("single");
    const reverted = withPromotionOptionPricing(flora, config, afterIrontech);
    expect(reverted.groups[0].options[1].priceDelta).toBe(299);
    expect(reverted.groups[0].selectionMode).toBeUndefined();
  });

  it("does not make an SE body-painting-and-freckles combo free", () => {
    const annika: PromotionProduct = {
      handle: "sedoll-annika-d-165cm-c-cup-tpe-companion-doll-vzkdy",
      title: "SE Doll Annika D",
      vendor: "SE Doll",
      productType: "Custom TPE doll",
      tags: ["se-doll", "tpe", "custom"],
      extended: { brand: "SE Doll", material: "TPE", stockStatus: "custom" }
    };
    expect(price(annika, "Premium", { id: "painting-freckles", label: "Hyper-realism Body Painting & Freckles", priceDelta: 120 }, insideSe)).toMatchObject({
      eligible: false,
      displayDelta: 120
    });
  });

  it("accepts promoClock only on Vercel preview deployments", () => {
    const requested = "2026-09-15T12:00:00.000Z";
    expect(previewPromotionClock(requested, "preview")).toBe(requested);
    expect(previewPromotionClock(requested, "production")).toBeUndefined();
    expect(previewPromotionClock("not-a-date", "preview")).toBeUndefined();
  });
});
