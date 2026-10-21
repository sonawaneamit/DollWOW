import { HALLOWEEN_2026 } from "./halloween2026";

type ReviewedCampaignInput = {
  startsAt: string;
  endsAt: string;
  eligibleBaseVariantIds: string[];
  eligibleCollectionId: string;
};

// Payload preparation only. No Admin call, activation or product tagging occurs
// here. A private manual collection avoids Shopify's 100-selected-variant limit.
// Its exact products and single base variants must match the reviewed manifest.
export function prepareHalloweenDiscount(input: ReviewedCampaignInput) {
  const start = Date.parse(input.startsAt), end = Date.parse(input.endsAt);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) throw new Error("Approved campaign dates are required.");
  const variants = [...new Set(input.eligibleBaseVariantIds)];
  if (!variants.length || variants.some(id => !/^gid:\/\/shopify\/ProductVariant\/\d+$/.test(id))) throw new Error("Reviewed base-doll variant IDs are required.");
  if (!/^gid:\/\/shopify\/Collection\/\d+$/.test(input.eligibleCollectionId)) throw new Error("Reviewed eligibility collection is required.");
  return {
    basicCodeDiscount: {
      title: "DollWOW Halloween 2026 - $299 off full-size dolls",
      code: HALLOWEEN_2026.code,
      startsAt: new Date(start).toISOString(),
      endsAt: new Date(end).toISOString(),
      context: { all: "ALL" },
      customerGets: {
        value: { discountAmount: { amount: "299.00", appliesOnEachItem: false } },
        items: { collections: { add: [input.eligibleCollectionId] } }
      },
      combinesWith: { orderDiscounts: false, productDiscounts: false, shippingDiscounts: false }
    },
    expectedVariantIds: variants,
    eligibleVariants: variants.length
  };
}
