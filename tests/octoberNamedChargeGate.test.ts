import { describe, expect, it } from "vitest";
import registry from "@/lib/cart/evidence/named-upgrades-release.json";
import { exactUpgradeLines, type ExactUpgradeBinding } from "@/lib/cart/exact-upgrade-lines";
import { octoberCandidateOptionAdjustment, octoberSupportedBenefits, type OctoberProduct } from "@/lib/promotions/october2026";
import { promotionOptionPrice, promotionPricingForSelections } from "@/lib/promotions/optionPricing";
import type { BrandCustomizationConfig } from "@/types/customization";

const during = new Date("2026-10-15T12:00:00Z");
const product: OctoberProduct = { handle: "sedoll-reviewed", title: "SE Doll Silicone Pro full-body doll", vendor: "SE Doll",
  productType: "Custom silicone doll", tags: [], extended: { brand: "SE Doll", material: "Silicone Pro", stockStatus: "custom" } };
const groups = registry.payload.groups as Record<string, Omit<ExactUpgradeBinding, "parentVariantId">[]>;
const bindings: ExactUpgradeBinding[] = Object.entries(registry.payload.parents).flatMap(([parentVariantId, key]) =>
  groups[key].map(binding => ({ ...binding, parentVariantId })));
const se = bindings.filter(binding => /^SE Doll/.test(binding.productTitle) && !binding.readOnly);

describe("October named-charge release gate", () => {
  it("records existing SE amounts without interpreting them as approval of another discount", () => {
    expect(new Set(se.filter(b => b.label === "Master Body Makeup").map(b => b.unitAmount))).toEqual(new Set([135, 150]));
    expect(new Set(se.filter(b => b.label === "Movable Eyelids").map(b => b.unitAmount))).toEqual(new Set([62.3, 89]));
    expect(se.filter(b => /gel butt/i.test([b.label, ...(b.choiceLabels ?? [])].join(" ")))).toHaveLength(0);
  });

  it("preserves a registry-compatible catalog charge and prevents a second, unmapped reduction", () => {
    const binding = se.find(b => b.label === "Master Body Makeup")!;
    const option = { id: "master-body-makeup", label: binding.label, priceDelta: binding.unitAmount };
    const config: BrandCustomizationConfig = { id: "se-charge-gate", brandLabel: "SE Doll", leadTimeNote: "", rules: [], groups: [
      { id: "body-makeup", label: binding.group, display: "cards", options: [option] }
    ] };
    const pricing = promotionPricingForSelections(product, config, { "body-makeup": option.id }, during);
    expect(pricing.config.groups[0].options[0].priceDelta).toBe(135);
    expect(promotionOptionPrice(product, config.groups[0], option, during, true, pricing.context).active).toBe(false);
    expect(octoberSupportedBenefits(product, pricing.context, during)).toEqual([]);
    const candidate = octoberCandidateOptionAdjustment(product, config.groups[0], option, during, pricing.context)!;
    expect(candidate.displayDelta).toBe(121.5);
    const makeLines = (amount: number) => exactUpgradeLines({
      parentVariantId: binding.parentVariantId, parentLineId: "gid://shopify/CartLine/review-only", quantity: 1,
      charge: { amount, currencyCode: "USD", items: [{ group: binding.group, label: binding.label, amount }] },
      bindings: se.filter(b => b.parentVariantId === binding.parentVariantId),
      // Synthetic readback proves the local exact-price contract, NOT live availability.
      verifiedVariants: [{ id: binding.merchandiseId, productTitle: binding.productTitle, amount: 135,
        currencyCode: "USD", availableForSale: true, requiresShipping: false }]
    });
    expect(makeLines(135)).toHaveLength(1);
    expect(() => makeLines(candidate.displayDelta)).toThrow("An exact checkout item is not verified");
  });

  it("holds percentages even when a hypothetical catalog price produces an existing registry amount", () => {
    const option = { id: "master-body-makeup", label: "Master Body Makeup", priceDelta: 150 };
    const group = { id: "body-makeup", label: "Body Makeup" };
    expect(octoberCandidateOptionAdjustment(product, group, option, during)?.displayDelta).toBe(135);
    expect(promotionOptionPrice(product, group, option, during)).toMatchObject({ displayDelta: 150, active: false });
  });
});
