import type { ParsedListing, PriceMatchDecision } from "@/types/comparison";
import type { Product } from "@/types/product";
import { defaultPriceMatchRules, fallbackApprovedVendors, type ApprovedVendorConfig, type PriceMatchRuleConfig } from "./config";

function isFresh(checkedAt: string, freshnessHours: number) {
  const ageMs = Date.now() - new Date(checkedAt).getTime();
  return ageMs <= freshnessHours * 60 * 60 * 1000;
}

export function decidePriceMatch(input: {
  parsed: ParsedListing | null;
  product?: Product | null;
  confidence: "high" | "medium" | "low";
  estimatedCost?: number;
  approvedVendors?: ApprovedVendorConfig[];
  rules?: PriceMatchRuleConfig;
}): PriceMatchDecision {
  const reasons: string[] = [];
  const parsed = input.parsed;
  const rules = input.rules ?? defaultPriceMatchRules;
  const approvedVendors = input.approvedVendors ?? fallbackApprovedVendors;

  if (!parsed) reasons.push("The listing could not be parsed.");
  if (!rules.enabled) reasons.push("Automatic price matching is currently paused.");
  const vendor = parsed ? approvedVendors.find((item) => item.domain === parsed.sourceDomain.replace(/^www\./, "").toLowerCase()) : null;
  if (!vendor?.allowedForPriceMatch) reasons.push("This vendor is not approved for automatic price matching yet.");
  if (vendor?.allowedForPriceMatch && !vendor.autoMatchEnabled) reasons.push("This vendor is approved for team review, but not automatic codes yet.");
  if (input.confidence !== "high") reasons.push("The match needs a team check.");
  const competitorPrice = parsed?.salePrice ?? parsed?.price;
  if (!competitorPrice) reasons.push("The competitor total price is not clear.");
  if (parsed && !isFresh(parsed.lastCheckedAt, rules.freshnessHours)) reasons.push("The competitor price is not fresh enough.");
  const variant = input.product?.variants.find((item) => item.availableForSale);
  if (!variant) reasons.push("The DollWow product is not available for checkout.");
  if (parsed && hasAmbiguousPromo(parsed) && !vendor?.allowPromoAutoMatch) {
    reasons.push("The listing has promo or freebie details that need a team review.");
  }

  if (reasons.length || !competitorPrice || !variant) {
    return { allowed: false, reasons } satisfies PriceMatchDecision;
  }

  const dollwowPrice = Number(variant.price.amount);
  const neededDiscount = Math.max(0, dollwowPrice - competitorPrice);
  const discountPercent = Math.min(rules.maxDiscountPercent, Math.ceil((neededDiscount / dollwowPrice) * 100));
  const estimatedCost = input.estimatedCost ?? dollwowPrice * 0.55;
  const marginAfterDiscount = (dollwowPrice * (1 - discountPercent / 100) - estimatedCost) / (dollwowPrice * (1 - discountPercent / 100));

  if (discountPercent <= 0) reasons.push("DollWow is already at or below the competitor price.");
  if (discountPercent > rules.maxDiscountPercent) reasons.push("The requested discount is above the launch safety limit.");
  if (marginAfterDiscount < rules.minGrossMargin) reasons.push("The margin would fall below the launch safety limit.");

  return {
    allowed: reasons.length === 0,
    reasons,
    discountPercent: reasons.length === 0 ? discountPercent : undefined,
    expiresAt: reasons.length === 0 ? new Date(Date.now() + rules.expiryHours * 60 * 60 * 1000).toISOString() : undefined
  } satisfies PriceMatchDecision;
}

function hasAmbiguousPromo(parsed: ParsedListing) {
  return Boolean(
    parsed.couponCode ||
      parsed.couponPercent ||
      parsed.couponFixedAmount ||
      parsed.freebies?.length ||
      parsed.promoText?.length
  );
}
