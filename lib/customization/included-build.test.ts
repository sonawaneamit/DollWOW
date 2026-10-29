import { describe, expect, it } from "vitest";
import type { CustomizationGroup, CustomizationOption, CustomizationRule } from "@/types/customization";
import { verifiedFixedBuildFacts } from "./included-build";

const group = (patch: Partial<CustomizationGroup> = {}): CustomizationGroup => ({
  id: "skeleton", label: "Skeleton", required: true, selectionMode: "single", display: "compact",
  options: [{ id: "evo", label: "EVO skeleton", priceDelta: 0, priceVerified: true }], ...patch
});
const option = (patch: Partial<CustomizationOption>) => group({ options: [{ ...group().options[0], ...patch }] });

describe("verified fixed build facts (display-only preparation)", () => {
  it("preserves both group and option context without generating entitlements", () => {
    expect(verifiedFixedBuildFacts([group()], [])).toEqual([
      { groupId: "skeleton", optionId: "evo", groupLabel: "Skeleton", optionLabel: "EVO skeleton" }
    ]);
  });
  it.each([
    group({ required: false }), group({ required: undefined }), group({ selectionMode: "multiple" }),
    group({ visibleWhen: [] }), group({ visibleWhen: [[{ groupId: "head", optionId: "a" }]] }),
    group({ options: [] }), group({ options: [group().options[0], { id: "other", label: "Other", priceDelta: 0 }] }),
    group({ id: " " }), group({ label: " " }),
    option({ priceDelta: undefined }), option({ priceDelta: 90 }), option({ priceDelta: -10 }),
    option({ priceDelta: NaN }), option({ priceVerified: undefined }), option({ priceVerified: false }),
    option({ factoryExists: false }), option({ displayable: false }), option({ purchasable: false }),
    option({ id: " " }), option({ label: " " })
  ])("excludes optional, conditional, unavailable or unverified records %#", (candidate) => {
    expect(verifiedFixedBuildFacts([candidate], [])).toEqual([]);
  });
  it.each(["None", "No heating", "Default", "Factory default", "As pictured", "Standard", "Yes", "Included", "Without", "N/A"])("does not turn placeholder %s into a feature", (label) => {
    expect(verifiedFixedBuildFacts([option({ label })], [])).toEqual([]);
  });
  it("excludes ambiguous duplicate group identities", () => {
    expect(verifiedFixedBuildFacts([group(), group()], [])).toEqual([]);
  });
  it("excludes both sides of a compatibility rule", () => {
    const rule: CustomizationRule = { id: "conflict", type: "incompatible", when: { groupId: "head", optionId: "a" }, conflictsWith: { groupId: "skeleton", optionId: "evo" }, message: "Conflict" };
    expect(verifiedFixedBuildFacts([group(), group({ id: "head" })], [rule])).toEqual([]);
  });
  it("leaves source groups, option prices and rules unchanged", () => {
    const groups = [group()];
    const before = structuredClone(groups);
    Object.freeze(groups[0].options[0]); Object.freeze(groups[0].options); Object.freeze(groups[0]); Object.freeze(groups);
    verifiedFixedBuildFacts(groups, Object.freeze([]));
    expect(groups).toEqual(before);
  });
});
