import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { sampleProducts } from "@/lib/data/sample-products";
import { oralGuideExampleMatches, oralGuideExamples, oralGuideFaqSchema, oralGuideOptionPrice, oralGuideQuestions, oralGuideSources } from "@/lib/learn/oralGuide";
import type { BrandCustomizationConfig, CustomizationOption } from "@/types/customization";
import { canonicalBrandValue } from "@/lib/catalog/brands";

const example = oralGuideExamples[0];
const product = { ...sampleProducts[0], id: example.id, handle: example.handle, tags: [], extended: { ...sampleProducts[0].extended, brand: "Irontech Dolls", stockStatus: "custom" as const } };
function config(patch: Partial<CustomizationOption> = {}): BrandCustomizationConfig {
  return { id: "test", brandLabel: "Irontech", leadTimeNote: "", rules: [], groups: [{
    id: "premium-head-body-options", label: "Premium", selectionMode: "multiple", display: "cards",
    options: [{ id: "oral-auto-sucking", label: "Oral Auto-Sucking", priceDelta: 89, priceVerified: true, ...patch }]
  }] };
}
const quote = (value = config()) => oralGuideOptionPrice(product, value, example, "premium-head-body-options", "oral-auto-sucking");

describe("fresh oral guide catalog examples", () => {
  it("quotes only the explicitly reviewed exact identity and option", () => {
    expect(quote()).toBe(89);
    expect(oralGuideOptionPrice({ ...product, id: "other" }, config(), example, "premium-head-body-options", "oral-auto-sucking")).toBeNull();
    expect(oralGuideOptionPrice({ ...product, handle: "other" }, config(), example, "premium-head-body-options", "oral-auto-sucking")).toBeNull();
    expect(oralGuideOptionPrice(product, config(), example, "premium-head-body-options", "auto-blowjob")).toBeNull();
  });
  it.each([
    { priceDelta: undefined }, { priceDelta: NaN }, { priceDelta: Infinity }, { priceDelta: -1 },
    { priceVerified: undefined }, { priceVerified: false }, { purchasable: false }, { displayable: false }, { factoryExists: false }
  ])("omits an unsupported price: %j", patch => {
    expect(quote(config(patch))).toBeNull();
  });
  it("allows a verified free option without converting unknown prices to free", () => {
    expect(quote(config({ priceDelta: 0 }))).toBe(0);
  });
  it("omits conditional, duplicate and compatibility-dependent prices", () => {
    const conditional = config(); conditional.groups[0].visibleWhen = [];
    expect(quote(conditional)).toBeNull();
    const duplicate = config(); duplicate.groups.push(structuredClone(duplicate.groups[0]));
    expect(quote(duplicate)).toBeNull();
    const duplicateOption = config(); duplicateOption.groups[0].options.push(structuredClone(duplicateOption.groups[0].options[0]));
    expect(quote(duplicateOption)).toBeNull();
    const ruled = config(); ruled.rules.push({ id: "conflict", type: "incompatible", when: { groupId: "premium-head-body-options", optionId: "oral-auto-sucking" }, conflictsWith: { groupId: "hair", optionId: "implanted" }, message: "Conflict" });
    expect(quote(ruled)).toBeNull();
  });
  it("does not describe Chiku's vaginal suction as powered oral suction", () => {
    const chiku = oralGuideExamples.find(item => item.name === "Chiku")!;
    expect(chiku.options).toEqual([]);
    expect(chiku.category).toBe("Manual oral structure");
    expect(chiku.description).toContain("not removable");
  });
  it("keeps primary source links and no unsupported universal or warehouse promise", () => {
    expect(oralGuideSources).toHaveLength(9);
    expect(oralGuideSources.every(source => new URL(source.href).protocol === "https:")).toBe(true);
    expect(oralGuideQuestions.map(item => item.answer).join(" ")).toContain("Not necessarily");
    expect(new Set(oralGuideExamples.map(item => item.id)).size).toBe(oralGuideExamples.length);
  });
  it("requires the reviewed zero-price ROS prerequisite without inventing head entitlement", () => {
    const mary = oralGuideExamples.find(item => item.name === "Mary")!;
    const source = { ...product, id: mary.id, handle: mary.handle, extended: { ...product.extended, brand: "MD Doll" } };
    const value = config();
    value.groups = [
      { id: "head-type", label: "Head type", display: "cards", options: [{ id: "ros-head-movable-jaw", label: "ROS", priceDelta: 0, priceVerified: true }] },
      { id: "premium-head-body-options-multiple", label: "Upgrades", display: "cards", options: [{ id: "auto-blowjob", label: "Auto Blowjob", priceDelta: 249, priceVerified: true }] }
    ];
    const price = () => oralGuideOptionPrice(source, value, mary, "premium-head-body-options-multiple", "auto-blowjob");
    expect(price()).toBe(249);
    value.groups[0].options[0].priceVerified = false;
    expect(price()).toBeNull();
    value.groups[0].options[0].priceVerified = true;
    value.groups[0].options[0].priceDelta = 20;
    expect(price()).toBeNull();
    value.groups.shift();
    expect(price()).toBeNull();
  });
  it("generates FAQ schema only from the same questions and answers rendered visibly", () => {
    const schema = oralGuideFaqSchema();
    expect(schema["@type"]).toBe("FAQPage");
    expect(schema.mainEntity.map(item => [item.name, item.acceptedAnswer.text])).toEqual(oralGuideQuestions.map(item => [item.question, item.answer]));
    expect(JSON.stringify(schema)).not.toMatch(/Offer|AggregateRating|Review|datePublished/);
  });
  it("never infers installed warehouse equipment from a general add-on menu", () => {
    expect(oralGuideOptionPrice({ ...product, extended: { ...product.extended, stockStatus: "ready_to_ship" } }, config(), example, "premium-head-body-options", "oral-auto-sucking")).toBeNull();
    for (const tag of ["ready_to_ship", "in-stock", "warehouse-united-states"]) {
      expect(oralGuideOptionPrice({ ...product, tags: [tag] }, config(), example, "premium-head-body-options", "oral-auto-sucking")).toBeNull();
    }
  });
  it("fails closed on held records and brand drift without conflating YL with Yeloly", () => {
    expect(canonicalBrandValue("YL")).toBe("yl");
    expect(canonicalBrandValue("Yeloly")).not.toBe("yl");
    for (const tag of ["catalog-review-hold", "source-hold", "safety:hold", "content-hold", "dollwow-test"]) {
      expect(oralGuideExampleMatches({ ...product, tags: [tag] }, example)).toBe(false);
    }
    expect(oralGuideExampleMatches({ ...product, extended: { ...product.extended, brand: "YL" } }, example)).toBe(false);
    expect(oralGuideExampleMatches({ ...product, extended: { ...product.extended, brand: "Yeloly" } }, example)).toBe(false);
  });
  it("keeps the working route private, noindex, live-card linked and separate from the rejected route", () => {
    const page = readFileSync("app/review/oral-features/page.tsx", "utf8");
    expect(page).toContain('process.env.VERCEL_ENV === "production"');
    expect(page).toContain('process.env.DOL288_GUIDE_REDO !== "1"');
    expect(page).toContain('robots: { index: false, follow: false }');
    expect(page).toContain("https://dollwow.com/products/");
    expect(page).toContain('strict: true');
    expect(page).not.toMatch(/Gallery|createCart|poweredFeatureComparison|ProductBuyActions/);
  });
});
