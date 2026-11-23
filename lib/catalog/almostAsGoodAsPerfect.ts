import type { Product } from "@/types/product";

export const ALMOST_AS_GOOD_AS_PERFECT_TAG = "almost-as-good-as-perfect";
export const ALMOST_AS_GOOD_AS_PERFECT_LABEL = "Almost as Good as Perfect";
export const ALMOST_AS_GOOD_AS_PERFECT_COLLECTION_HANDLE = "almost-as-good-as-perfect";

export function isAlmostAsGoodAsPerfect(product: { tags?: string[] } | null | undefined) {
  return Boolean(product?.tags?.some((tag) => tag.toLowerCase() === ALMOST_AS_GOOD_AS_PERFECT_TAG));
}

export function almostAsGoodAsPerfectNote(product: Product) {
  if (!isAlmostAsGoodAsPerfect(product)) return undefined;
  const note = product.extended.qcNote?.replace(/\s+/g, " ").trim();
  return note || undefined;
}

export function shouldSkipWarehouseDeliveryDate(deliveryEstimate?: string) {
  return /\bweeks?\b/i.test(deliveryEstimate || "");
}
