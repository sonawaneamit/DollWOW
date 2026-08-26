import type { Product } from "@/types/product";

const LEGACY_DELIVERY_DEFAULTS = new Set([
  "4-8 weeks",
  "usually 3-5 weeks from order to delivery",
  "fast shipping after stock confirmation",
  "ships within 1-3 business days after stock confirmation",
  "3-5 weeks from order to delivery"
]);

export function customerDeliveryEstimate(
  stockStatus: Product["extended"]["stockStatus"],
  supplierEstimate?: string,
  material?: string
) {
  const estimate = supplierEstimate?.trim();
  if (estimate && !LEGACY_DELIVERY_DEFAULTS.has(estimate.toLowerCase().replaceAll("–", "-").replace(/\s+/g, " "))) {
    return estimate;
  }

  if (stockStatus === "ready_to_ship") {
    return "Typically 3–5 business days after we confirm the unit";
  }

  if (stockStatus === "custom" && material) {
    const normalizedMaterial = material.toLowerCase();
    const isSiliconeOrHybrid = 
      normalizedMaterial.includes("silicone") || 
      normalizedMaterial.includes("hybrid");
    
    if (isSiliconeOrHybrid) {
      return "Typically 4–7 weeks from order to delivery";
    }
    
    if (normalizedMaterial.includes("tpe")) {
      return "Typically 2–4 weeks from order to delivery";
    }
  }

  return undefined;
}
