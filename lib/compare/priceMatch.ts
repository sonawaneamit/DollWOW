import type { ParsedListing, PriceMatchDecision } from "@/types/comparison";
import type { Product } from "@/types/product";

const DEFAULTS = {
  minGrossMargin: 0.35,
  maxDiscountPercent: 15,
  freshnessHours: 72,
  expiryHours: 48
};

export type ApprovedVendor = {
  domain: string;
  allowedForPriceMatch: boolean;
};

export const approvedVendors: ApprovedVendor[] = [];

function isFresh(checkedAt: string) {
  const ageMs = Date.now() - new Date(checkedAt).getTime();
  return ageMs <= DEFAULTS.freshnessHours * 60 * 60 * 1000;
}

export function decidePriceMatch(input: {
  parsed: ParsedListing | null;
  product?: Product | null;
  confidence: "high" | "medium" | "low";
  estimatedCost?: number;
}): PriceMatchDecision {
  const reasons: string[] = [];
  const parsed = input.parsed;

  if (!parsed) reasons.push("The listing could not be parsed.");
  const vendor = parsed ? approvedVendors.find((item) => item.domain === parsed.sourceDomain) : null;
  if (!vendor?.allowedForPriceMatch) reasons.push("This vendor is not approved for automatic price matching yet.");
  if (input.confidence !== "high") reasons.push("The match needs a human check.");
  if (!parsed?.price) reasons.push("The competitor total price is not clear.");
  if (parsed && !isFresh(parsed.lastCheckedAt)) reasons.push("The competitor price is not fresh enough.");
  const variant = input.product?.variants.find((item) => item.availableForSale);
  if (!variant) reasons.push("The DollWow product is not available for checkout.");

  if (reasons.length || !parsed?.price || !variant) {
    return { allowed: false, reasons } satisfies PriceMatchDecision;
  }

  const dollwowPrice = Number(variant.price.amount);
  const neededDiscount = Math.max(0, dollwowPrice - parsed.price);
  const discountPercent = Math.min(DEFAULTS.maxDiscountPercent, Math.ceil((neededDiscount / dollwowPrice) * 100));
  const estimatedCost = input.estimatedCost ?? dollwowPrice * 0.55;
  const marginAfterDiscount = (dollwowPrice * (1 - discountPercent / 100) - estimatedCost) / (dollwowPrice * (1 - discountPercent / 100));

  if (discountPercent <= 0) reasons.push("DollWow is already at or below the competitor price.");
  if (discountPercent > DEFAULTS.maxDiscountPercent) reasons.push("The requested discount is above the launch safety limit.");
  if (marginAfterDiscount < DEFAULTS.minGrossMargin) reasons.push("The margin would fall below the launch safety limit.");

  return {
    allowed: reasons.length === 0,
    reasons,
    discountPercent: reasons.length === 0 ? discountPercent : undefined,
    expiresAt: reasons.length === 0 ? new Date(Date.now() + DEFAULTS.expiryHours * 60 * 60 * 1000).toISOString() : undefined
  } satisfies PriceMatchDecision;
}
