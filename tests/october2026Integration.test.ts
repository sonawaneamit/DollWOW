import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { OctoberSupplierPdpPromotion } from "@/components/promotions/OctoberSupplierPromotion";
import { PromotionalOptionPrice } from "@/components/promotions/PromotionalOptionPrice";
import {
  octoberCampaignDay, octoberOfferForProduct, octoberProductFacts, realLadyOctoberGifts, octoberCandidateOptionAdjustment,
  seOctoberLightweightStatus, type OctoberProduct
} from "@/lib/promotions/october2026";
import { promotionOptionPrice, withPromotionOptionPricing } from "@/lib/promotions/optionPricing";
import { resolveCustomization } from "@/lib/customization/resolve";
import type { BrandCustomizationConfig, CustomizationGroup, CustomizationOption } from "@/types/customization";
import type { OctoberProductFacts } from "@/lib/promotions/october2026Draft";

const during = new Date("2026-10-15T12:00:00Z");
function product(brand = "Irontech Dolls", material = "Silicone", form = "doll"): OctoberProduct {
  return { handle: "reviewed-product", title: `${brand} ${material} ${form}`, vendor: brand,
    productType: `Custom ${material} ${form}`, tags: [],
    extended: { brand, material, stockStatus: "custom" } };
}
function group(id: string, options: CustomizationOption[]): CustomizationGroup {
  return { id, label: id.replaceAll("-", " "), display: "cards", selectionMode: "multiple", options };
}
const paid = (id: string, label: string, priceDelta = 100): CustomizationOption => ({ id, label, priceDelta });
const evo = paid("evo-free", "EVO (FREE)", 175);
const talk = paid("ironai-talkx-box-free", "IronAI TalkX Box", 119);
const extra = paid("silicone-s1", "S1 · Silicone", 299);
const neutral = paid("none", "No Thanks", 0);
function config(groups: CustomizationGroup[]): BrandCustomizationConfig {
  return { id: "reviewed", brandLabel: "Reviewed", leadTimeNote: "", groups, rules: [] };
}
function price(p: OctoberProduct, id: string, option: CustomizationOption, now = during, c?: BrandCustomizationConfig) {
  return promotionOptionPrice(p, group(id, [option]), option, now, true, c ? { config: c } : undefined);
}

describe("October campaign clock and scope", () => {
  it("does not mistake a full-body doll with a head-related tag for a standalone head",()=>{
    const p=product('Real Lady');p.tags=['doll-head'];
    expect(octoberProductFacts(p).form).toBe('full-body');
    expect(octoberOfferForProduct(p,during)?.kind).toBe('real-lady-silicone-full-body');
  });
  it.each([
    ["SE Doll", "TPE", "2026-10-01T07:00:00Z", "2026-11-01T07:00:00Z"],
    ["Irontech Dolls", "Silicone", "2026-10-08T07:00:00Z", "2026-11-09T08:00:00Z"],
    ["Real Lady", "Silicone", "2026-10-05T07:00:00Z", "2026-11-06T08:00:00Z"]
  ])("uses inclusive Pacific dates including DST for %s", (brand, material, start, end) => {
    const p = product(brand, material);
    expect(octoberOfferForProduct(p, new Date(Date.parse(start) - 1))).toBeNull();
    expect(octoberOfferForProduct(p, new Date(start))).not.toBeNull();
    expect(octoberOfferForProduct(p, new Date(Date.parse(end) - 1))).not.toBeNull();
    expect(octoberOfferForProduct(p, new Date(end))).toBeNull();
  });
  it("fails closed on invalid clocks", () => {
    expect(octoberCampaignDay(new Date("invalid"))).toBe("");
    expect(octoberOfferForProduct(product(), new Date("invalid"))).toBeNull();
  });
  it.each(["TPE", "Hybrid", "unknown"])("does not extend Irontech October to %s", (material) => {
    expect(price(product("Irontech Dolls", material), "skeleton", evo).active).toBe(false);
  });
  it.each(["torso", "body only", "accessory"])("excludes Irontech %s", (form) => {
    expect(octoberOfferForProduct(product("Irontech Dolls", "Silicone", form), during)).toBeNull();
  });
  it('includes the factory-banner-confirmed Irontech standalone head TalkX offer',()=>{
    expect(octoberOfferForProduct(product('Irontech Dolls','Silicone','head'),during)?.kind).toBe('irontech-head-talkx-only');
  });
  it("rejects conflicting material and unidentified form, warehouse and unknown fulfillment", () => {
    const p = product();
    p.tags = ["tpe"];
    expect(octoberOfferForProduct(p, during)).toBeNull();
    p.tags = []; p.productType = "Product";
    expect(octoberOfferForProduct(p, during)).toBeNull();
    p.productType = "Custom silicone doll"; p.extended.stockStatus = "ready_to_ship";
    expect(octoberOfferForProduct(p, during)).toBeNull();
    p.extended.stockStatus = undefined;
    expect(octoberOfferForProduct(p, during)).toBeNull();
  });
  it("does not infer Silicone Pro or soft belly from height", () => {
    expect(octoberOfferForProduct(product("SE Doll"), during)).toBeNull();
    const p = product("SE Doll", "Silicone Pro");
    p.extended.heightCm = 165;
    expect(price(p, "body", paid("soft-belly", "Soft Belly")).active).toBe(false);
    p.extended.bodyCode = "T165";
    expect(price(p, "body", paid("soft-belly", "Soft Belly")).displayDelta).toBe(0);
  });
});

describe("October verified option pricing", () => {
  it("prices free and paid options without changing source catalog values", () => {
    const c = config([group("skeleton-type-add-on", [evo]), group("body", [paid("heating", "Body Heating", 200)])]);
    const result = withPromotionOptionPricing(product(), c, during);
    expect(result.groups[0].options[0]).toMatchObject({ priceDelta: 0, purchasable: true, priceVerified: true });
    expect(result.groups[1].options[0].priceDelta).toBe(200);
    expect(c.groups[0].options[0].priceDelta).toBe(175);
    expect(withPromotionOptionPricing(product(), c, new Date("2026-11-09T08:00:00Z")).groups[0].options[0].priceDelta).toBe(175);
  });
  it("keeps Irontech September TPE valid through October 7, without extending it", () => {
    const p = product("Irontech Dolls", "TPE");
    expect(price(p, "skeleton", evo, new Date("2026-10-08T06:59:59.999Z")).displayDelta).toBe(0);
    expect(price(p, "skeleton", evo, new Date("2026-10-08T07:00:00Z")).displayDelta).toBe(175);
  });
  it.each([
    ["SE Doll", "TPE", "skeleton-type-add-on", evo],
    ["Irontech Dolls", "Silicone", "ironai-talkx-box", talk],
    ["Real Lady", "Silicone", "skeleton-type-add-on", paid("evo-max", "EVO MAX Skeleton")],
    ["Real Lady", "Silicone", "makeup-options", paid("ss-makeup", "SS+ Makeup")]
  ])("maps %s %s %s", (brand, material, id, option) => {
    expect(price(product(brand, material), id, option)).toMatchObject({ active: true, displayDelta: 0 });
  });
  it("requires product-supported conditional toe joints", () => {
    const toes = paid("toe-joints", "Toe Joints");
    expect(price(product(), "feet", toes).active).toBe(false);
    expect(price(product(), "feet", { ...toes, factoryExists: true }).active).toBe(true);
  });
  it.each([
    { purchasable: false }, { priceVerified: false }, { factoryExists: false }, { displayable: false },
    { priceDelta: undefined }, { priceDelta: NaN }, { priceDelta: -100 }
  ])("does not revive unavailable or unverified choices: %j", (flags) => {
    expect(price(product(), "skeleton", { ...evo, ...flags }).active).toBe(false);
  });
  it("does not infer free combinations, legacy suction, neutral or unrelated color options", () => {
    for (const o of [paid("combined", "S+ Makeup & Freckles"), paid("daisy", "Graceful Daisy"), neutral])
      expect(price(product(), "makeup-options", o).active).toBe(false);
    expect(price(product(), "ironai", paid("version", "Internal Version")).active).toBe(false);
    expect(price(product(), "nipple-color", paid("evo", "EVO")).active).toBe(false);
  });
  it("calculates candidate SE percentages without activating unreleased named charges", () => {
    const p = product("SE Doll", "Silicone Pro");
    const master = paid("master-body-makeup", "Master Body Makeup", 123.45);
    expect(octoberCandidateOptionAdjustment(p, group("makeup-options", [master]), master, during)?.displayDelta).toBe(111.11);
    expect(price(p, "makeup-options", master).displayDelta).toBe(123.45);
    expect(price(p, "premium-body-options", paid("gel-butt-free", "Gel Butt", 125.55)).displayDelta).toBe(125.55);
    expect(price(p, "premium-body-options", paid("real-skin-texture", "Real Skin Texture", 123)).displayDelta).toBe(123);
    const torso = product("SE Doll", "Silicone", "torso");
    expect(price(torso, "premium-body-options", paid("gel-butt-free", "Gel Butt", 200)).displayDelta).toBe(200);
    expect(price(torso, "makeup-options", paid("master-body-makeup", "Master Body Makeup")).active).toBe(false);
    expect(price(p, "premium-body-options", paid("movable-eyelids", "Movable Eyelids")).active).toBe(false);
    expect(price(p, "body", paid("loose-joints", "Loose Joint System")).active).toBe(false);
  });
  it("respects the global promotion and conditional-menu gates", () => {
    expect(promotionOptionPrice(product(), group("skeleton", [evo]), evo, during, false).active).toBe(false);
    const c = config([{ ...group("skeleton", [evo]), visibleWhen: [[{ groupId: "head", optionId: "ros" }]] }]);
    expect(withPromotionOptionPricing(product(), c, during, true)).toBe(c);
  });
  it("renders the original catalog strike, current price and October label", () => {
    const markup = renderToStaticMarkup(createElement(PromotionalOptionPrice, { pricing: price(product(), "skeleton", evo), currencyCode: "USD" }));
    expect(markup).toContain("<s"); expect(markup).toContain("$175"); expect(markup).toContain("$0");
    expect(markup).toContain("2026-11-08");
  });
});

describe("bounded benefits require coordinated display and pricing integration", () => {
  it("keeps default display and checkout paid until explicit integration", () => {
    const c = config([group("add-extra-head", [neutral, extra])]);
    expect(price(product(), "add-extra-head", extra).displayDelta).toBe(299);
    expect(withPromotionOptionPricing(product(), c, during).groups[0].options[1].priceDelta).toBe(299);
  });
  it.each(["Irontech Dolls", "Real Lady"])("limits %s to one additional head and one exclusive function", (brand) => {
    const ros = paid("ros-max-upgrade", "ROS MAX Upgrade", 180);
    const c = config([group("add-extra-head", [neutral, extra, paid("silicone-s2", "S2 · Silicone", 299)]), group("head-type", [neutral, ros])]);
    const result = withPromotionOptionPricing(product(brand), c, during, true);
    expect(result.groups.map((g) => g.selectionMode)).toEqual(["single", "single"]);
    expect(result.groups[0].options[1].priceDelta).toBe(0);
    expect(result.groups[1].options[1].priceDelta).toBe(0);
    expect(price(product(brand), "add-extra-head", extra, during, c).displayDelta).toBe(0);
    expect(c.groups[0].selectionMode).toBe("multiple");
  });
  it("fails closed for duplicate head groups and independently upgraded extra heads", () => {
    const ros = paid("ros-max-upgrade", "ROS MAX Upgrade", 180);
    const c = config([group("add-extra-head", [extra]), group("second-head", [extra]), group("head-type", [ros]), group("head-type-for-extra-head", [ros])]);
    expect(price(product(), "add-extra-head", extra, during, c).active).toBe(false);
    expect(price(product(), "head-type", ros, during, c).active).toBe(false);
    expect(price(product(), "add-extra-head", paid("silicone-s1", "S1 Silicone ROS MAX", 450), during, c).active).toBe(false);
  });
  it("resolves forged multi-head selections to at most one head and preserves the base price", () => {
    const c = config([group("add-extra-head", [neutral, extra, paid("silicone-s2", "S2 · Silicone", 299)])]);
    const priced = withPromotionOptionPricing(product(), c, during, true);
    const resolved = resolveCustomization(priced, { "add-extra-head": ["silicone-s1", "silicone-s2"] }, 2000);
    expect(resolved.selectedOptions).toHaveLength(1);
    expect(resolved.totalPrice).toBe(2000);
    const ended = resolveCustomization(withPromotionOptionPricing(product(), c, new Date("2026-11-09T08:00:00Z"), true), { "add-extra-head": ["silicone-s1", "silicone-s2"] }, 2000);
    expect(ended.optionPriceDelta).toBe(598);
    expect(ended.totalPrice).toBe(2598);
  });
  it("enforces SE articulated OR ultra-flex fingers", () => {
    const c = config([group("fingers", [neutral, paid("articulated", "Articulated Fingers"), paid("ultra-flex", "Ultra-flex Fingers")])]);
    const result = withPromotionOptionPricing(product("SE Doll", "Silicone Pro"), c, during, true);
    expect(result.groups[0].selectionMode).toBe("single");
    expect(result.groups[0].options.map((o) => o.priceDelta)).toEqual([0, 0, 0]);
  });
  it("calculates ROS-dependent eyelids but retains the catalog charge pending checkout release", () => {
    const p = product("SE Doll", "Silicone Pro");
    const eyelids = { ...paid("movable-eyelids", "Movable Eyelids", 100), factoryExists: true };
    const c = config([group("head-type", [neutral, paid("ros", "ROS")]), group("premium-body-options", [eyelids])]);
    const withSelection = (selections: Record<string, string | string[]>) => withPromotionOptionPricing(p, c, during, true, selections).groups[1].options[0].priceDelta;
    expect(octoberCandidateOptionAdjustment(p, c.groups[1], eyelids, during, { config: c, selections: { "head-type": "ros" } })?.displayDelta).toBe(70);
    expect(withSelection({ "head-type": "ros" })).toBe(100);
    expect(withSelection({ "head-type": "none" })).toBe(100);
    expect(withSelection({ "head-type": ["ros", "none"] })).toBe(100);
    expect(withSelection({ "head-type": "missing" })).toBe(100);
    expect(withPromotionOptionPricing(p, c, during, true).groups[1].options[0].priceDelta).toBe(100);
  });
});

describe("Real Lady gifts, head-only and LSTPE holds", () => {
  it("gives heads TalkX only, without full-body freebies", () => {
    const p = product("Real Lady", "Silicone", "head");
    expect(octoberProductFacts(p).form).toBe("head");
    expect(price(p, "ironai-talkx-box", talk).displayDelta).toBe(0);
    expect(price(p, "skeleton", paid("evo-max", "EVO MAX Skeleton")).displayDelta).toBe(100);
    expect(octoberOfferForProduct(p, during)?.included).toEqual(["IronAI TalkX box and 60 minutes"]);
  });
  it("keeps gifts conditional, strictly over $100 for non-full-body and never cash discounts", () => {
    const facts = octoberProductFacts(product("Real Lady"));
    expect(realLadyOctoberGifts(facts, during)?.items).toEqual(["Thank-you card", "Lingerie", "Mousepad"]);
    const head = { ...facts, form: "head" as const };
    for (const amount of [undefined, 0, 100, NaN, Infinity]) expect(realLadyOctoberGifts(head, during, amount)).toBeNull();
    expect(realLadyOctoberGifts(head, during, 100.01)).toEqual({ items: ["Mousepad", "Thank-you card"], whileSuppliesLast: true });
    expect(realLadyOctoberGifts({ ...head, form: "torso" }, during, 101)?.items).toHaveLength(2);
    expect(realLadyOctoberGifts(head, new Date("2026-11-06T08:00:00Z"), 101)).toBeNull();
  });
  it.each(["157H", "161F", "163E"])("records %s LSTPE eligibility and known surcharges without guessing price", (bodyCode) => {
    const facts: OctoberProductFacts = { brand: "se", material: "tpe", fulfillment: "custom", form: "full-body", bodyCode, headMaterial: "tpe" };
    expect(seOctoberLightweightStatus(facts, during)).toMatchObject({ eligible: true, chargeReady: false, discountScope: "upgrade-surcharge", supplierSurchargeUSD: 80, suggestedMinimumRetailSurchargeUSD: 100, launchPromotionActive: true });
    expect(seOctoberLightweightStatus(facts, during).unresolved.join(" ")).not.toContain("whole qualifying order");
    expect(seOctoberLightweightStatus({ ...facts, headMaterial: "silicone", skinTone: "White" }, during).eligible).toBe(false);
    expect(seOctoberLightweightStatus({ ...facts, headMaterial: "silicone", skinTone: "Light Tan" }, during).eligible).toBe(true);
    expect(seOctoberLightweightStatus({ ...facts, bodyCode: "165F" }, during).eligible).toBe(false);
    expect(price(product("SE Doll", "TPE"), "material", paid("lstpe", "LSTPE Lightweight", 100)).displayDelta).toBe(100);
  });
  it("renders only supported menu benefits in the current light theme", () => {
    const c = config([group("ironai-talkx-box", [talk])]);
    const render = (p: OctoberProduct, clock = during.toISOString()) => renderToStaticMarkup(createElement(OctoberSupplierPdpPromotion, { product: p, promoClock: clock, context: { config: c } }));
    const full = render(product("Real Lady"));
    expect(full).toContain("IronAI TalkX box + 60 minutes included");
    expect(full).not.toContain("Second silicone head");
    expect(full).not.toContain("lingerie");
    expect(full).not.toContain("text-ivory"); expect(full).toContain("text-text");
    expect(full).not.toContain("10% off eligible custom dolls and paid options");
    expect(full).toContain("aria-expanded=\"false\""); expect(full).not.toContain("September");
    const head = render(product("Real Lady", "Silicone", "head"));
    expect(head).not.toContain("Second silicone head"); expect(head).not.toContain("lingerie");
    expect(render(product(), "2026-11-09T08:00:00Z")).toBe("");
    expect(render(product("Irontech Dolls", "TPE"))).toBe("");
  });
});
