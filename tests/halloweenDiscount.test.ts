import { describe, expect, it } from "vitest";
import { prepareHalloweenDiscount } from "@/lib/promotions/halloweenDiscount";

const campaign = { startsAt: "2026-10-24T00:00:00Z", endsAt: "2026-11-02T08:00:00Z", eligibleBaseVariantIds: ["gid://shopify/ProductVariant/123"] };

describe("Halloween discount payload preparation", () => {
  it("uses one fixedUSD amount across the eligible items, not per quantity or a percentage", () => {
    const plan = prepareHalloweenDiscount(campaign);
    expect(plan.basicCodeDiscount.customerGets.value).toEqual({ discountAmount: { amount: "299.00", appliesOnEachItem: false } });
    expect(plan.basicCodeDiscount.customerGets.items.products.productVariantsToAdd).toEqual(campaign.eligibleBaseVariantIds);
    expect(plan.basicCodeDiscount).not.toHaveProperty("usageLimit", 1);
    expect(plan.eligibleVariants).toBe(1);
  });
  it("rejects missing dates, reversed dates, empty eligibility and unreviewed non-variant identifiers", () => {
    expect(() => prepareHalloweenDiscount({ ...campaign, endsAt: campaign.startsAt })).toThrow();
    expect(() => prepareHalloweenDiscount({ ...campaign, startsAt: "TBD" })).toThrow();
    expect(() => prepareHalloweenDiscount({ ...campaign, eligibleBaseVariantIds: [] })).toThrow();
    expect(() => prepareHalloweenDiscount({ ...campaign, eligibleBaseVariantIds: ["all-products"] })).toThrow();
  });
  it("deduplicates and prepares bounded update batches rather than dropping products past250", () => {
    const ids = Array.from({ length: 601 }, (_, i) => `gid://shopify/ProductVariant/${i + 1}`);
    const plan = prepareHalloweenDiscount({ ...campaign, eligibleBaseVariantIds: [...ids, ids[0]] });
    expect(plan.eligibleVariants).toBe(601);
    expect(plan.basicCodeDiscount.customerGets.items.products.productVariantsToAdd).toHaveLength(250);
    expect(plan.remainingVariantBatches.map(b => b.length)).toEqual([250, 101]);
    expect([plan.basicCodeDiscount.customerGets.items.products.productVariantsToAdd, ...plan.remainingVariantBatches].flat()).toEqual(ids);
  });
});
