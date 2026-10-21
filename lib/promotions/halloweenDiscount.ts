import { HALLOWEEN_2026 } from "./halloween2026";

type ReviewedCampaignInput = {
  startsAt: string;
  endsAt: string;
  eligibleBaseVariantIds: string[];
};

// Payload preparation only. No Admin call, activation or product tagging occurs
// here. Callers must supply the reviewed eligibility manifest and approved dates.
export function prepareHalloweenDiscount(input: ReviewedCampaignInput) {
  const start = Date.parse(input.startsAt), end = Date.parse(input.endsAt);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) throw new Error("Approved campaign dates are required.");
  const variants = [...new Set(input.eligibleBaseVariantIds)];
  if (!variants.length || variants.some(id => !/^gid:\/\/shopify\/ProductVariant\/\d+$/.test(id))) throw new Error("Reviewed base-doll variant IDs are required.");
  const batches = Array.from({ length: Math.ceil(variants.length / 250) }, (_, i) => variants.slice(i * 250, (i + 1) * 250));
  return {
    basicCodeDiscount: {
      title: "DollWOW Halloween 2026 - $299 off full-size dolls",
      code: HALLOWEEN_2026.code,
      startsAt: new Date(start).toISOString(),
      endsAt: new Date(end).toISOString(),
      customerSelection: { all: true },
      customerGets: {
        value: { discountAmount: { amount: "299.00", appliesOnEachItem: false } },
        items: { products: { productVariantsToAdd: batches[0] } }
      },
      combinesWith: { orderDiscounts: false, productDiscounts: false, shippingDiscounts: false }
    },
    remainingVariantBatches: batches.slice(1),
    eligibleVariants: variants.length
  };
}
