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

export const ALMOST_AS_GOOD_AS_PERFECT_AVAILABILITY = "Ships in 4–8 weeks by sea from China";
export const ALMOST_AS_GOOD_AS_PERFECT_CART_SHIPPING = "Ships in 4–8 weeks";
export const ALMOST_AS_GOOD_AS_PERFECT_PANEL_HEADING = "A one-of-a-kind unit, photographed as she'll ship";
export const ALMOST_AS_GOOD_AS_PERFECT_PANEL_BODY =
  "She ships as shown, small cosmetic mark and all. After you order, pick any IDO head you like — it's included in the price.";

export function almostAsGoodAsPerfectBuyBoxDetail(deliveryEstimate?: string) {
  const timing = deliveryEstimate ? `${deliveryEstimate}. ` : "";
  return `${timing}This is the exact body in the photos. After you order, pick any IDO head you like — it's included in the price.`;
}

export function isAlmostAsGoodAsPerfectItem(
  item: {
    tags?: string[];
    productHandle?: string;
    handle?: string;
    productTitle?: string;
    productDisplayName?: string;
    title?: string;
  } | null | undefined
) {
  if (isAlmostAsGoodAsPerfect(item)) return true;
  const handle = item?.productHandle || item?.handle || "";
  const title = `${item?.productTitle || item?.title || ""} ${item?.productDisplayName || ""}`;
  return /\balmost-as-good-as-perfect\b/i.test(handle) || /almost as good as perfect/i.test(title);
}

export function cartItemShippingLabel(
  item: {
    readyToShip?: boolean;
    tags?: string[];
    productHandle?: string;
    productTitle?: string;
    productDisplayName?: string;
  },
  readyPhrase = "Ready to ship",
  customPhrase = "Reviewed before production"
) {
  if (isAlmostAsGoodAsPerfectItem(item)) return ALMOST_AS_GOOD_AS_PERFECT_CART_SHIPPING;
  return item.readyToShip ? readyPhrase : customPhrase;
}
