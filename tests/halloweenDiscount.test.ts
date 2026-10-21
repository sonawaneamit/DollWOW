import { describe, expect, it } from "vitest";
import { prepareHalloweenDiscount } from "@/lib/promotions/halloweenDiscount";

const campaign = { startsAt: "2026-10-24T00:00:00Z", endsAt: "2026-11-02T08:00:00Z", eligibleCollectionId: "gid://shopify/Collection/456", eligibleBaseVariantIds: ["gid://shopify/ProductVariant/123"] };

describe("Halloween discount payload preparation", () => {
  it("uses one fixedUSD amount across the eligible items, not per quantity or a percentage", () => {
    const plan = prepareHalloweenDiscount(campaign);
    expect(plan.basicCodeDiscount.customerGets.value).toEqual({ discountAmount: { amount: "299.00", appliesOnEachItem: false } });
    expect(plan.basicCodeDiscount.customerGets.items.collections.add).toEqual([campaign.eligibleCollectionId]);
    expect(plan.basicCodeDiscount.context).toEqual({ all: "ALL" });
    expect(plan.basicCodeDiscount).not.toHaveProperty("usageLimit", 1);
    expect(plan.eligibleVariants).toBe(1);
  });
  it("rejects missing dates, reversed dates, empty eligibility and unreviewed non-variant identifiers", () => {
    expect(() => prepareHalloweenDiscount({ ...campaign, endsAt: campaign.startsAt })).toThrow();
    expect(() => prepareHalloweenDiscount({ ...campaign, startsAt: "TBD" })).toThrow();
    expect(() => prepareHalloweenDiscount({ ...campaign, eligibleBaseVariantIds: [] })).toThrow();
    expect(() => prepareHalloweenDiscount({ ...campaign, eligibleBaseVariantIds: ["all-products"] })).toThrow();
  });
  it("retains the complete manifest for collection readback instead of truncating eligibility", () => {
    const ids = Array.from({ length: 601 }, (_, i) => `gid://shopify/ProductVariant/${i + 1}`);
    const plan = prepareHalloweenDiscount({ ...campaign, eligibleBaseVariantIds: [...ids, ids[0]] });
    expect(plan.eligibleVariants).toBe(601);
    expect(plan.expectedVariantIds).toEqual(ids);
    expect(plan.basicCodeDiscount.customerGets.items).not.toHaveProperty("products");
    expect(() => prepareHalloweenDiscount({ ...campaign, eligibleCollectionId: "all" })).toThrow();
  });
});
