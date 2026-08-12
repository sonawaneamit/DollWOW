import type { Product } from "@/types/product";

const LEGACY_DELIVERY_DEFAULTS = new Set([
  "4-8 weeks",
  "usually 3-5 weeks from order to delivery",
  "fast shipping after stock confirmation",
  "ships within 1-3 business days after stock confirmation",
  "3-5 weeks from order to delivery"
]);

export function customerDeliveryEstimate(
  _stockStatus: Product["extended"]["stockStatus"],
  supplierEstimate?: string
) {
  const estimate = supplierEstimate?.trim();
  if (!estimate) return undefined;
  const normalized = estimate.toLowerCase().replaceAll("–", "-").replace(/\s+/g, " ");
  return LEGACY_DELIVERY_DEFAULTS.has(normalized) ? undefined : estimate;
}
