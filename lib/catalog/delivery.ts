import type { Product } from "@/types/product";

export const CUSTOM_ORDER_DELIVERY_ESTIMATE = "3–4 weeks";

export function customerDeliveryEstimate(
  stockStatus: Product["extended"]["stockStatus"],
  supplierEstimate?: string
) {
  return stockStatus === "ready_to_ship" ? supplierEstimate : CUSTOM_ORDER_DELIVERY_ESTIMATE;
}
