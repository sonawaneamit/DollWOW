import { canonicalBrandValue } from "@/lib/catalog/brands";
import type { CustomizationGroup, CustomizationOption } from "@/types/customization";
import type { Product } from "@/types/product";

const promotionTiming = {
  dateLabel: "1–30 September 2026",
  startsAt: "2026-09-01T07:00:00.000Z",
  // Midnight US Pacific on 1 October keeps all of 30 September PT included.
  endsAt: "2026-10-01T07:00:00.000Z"
} as const;

export const FANREAL_SEPTEMBER_FREEBIES = [
  "Extra Silicone Head"
] as const;

export const FANREAL_SEPTEMBER_PROMOTION = {
  id: "fanreal-september-2026",
  brand: "Fanreal",
  title: "Fanreal September factory promotion",
  dateLabel: promotionTiming.dateLabel,
  heroImage: "/promo/fanreal-september-2026/banner-desktop.jpg",
  mobileHeroImage: "/promo/fanreal-september-2026/banner-mobile.png",
  heroAlt: "Fanreal September 2026 factory promotion for eligible custom silicone dolls.",
  startsAt: promotionTiming.startsAt,
  endsAt: promotionTiming.endsAt
} as const;

type PromotionProduct = Pick<Product, "handle" | "title" | "vendor" | "productType" | "tags" | "extended">;

export function isFanrealSeptemberPromotionActive(now = new Date()) {
  const timestamp = now.getTime();
  return timestamp >= Date.parse(promotionTiming.startsAt) && timestamp < Date.parse(promotionTiming.endsAt);
}

export function fanrealSeptemberOfferForProduct(product: PromotionProduct, now = new Date()) {
  if (!isFanrealSeptemberPromotionActive(now)) return null;
  if (canonicalBrandValue(product.extended.brand ?? product.vendor) !== "fanreal") return null;
  if (product.extended.stockStatus !== "custom") return null;

  const identity = [product.productType, product.extended.material, product.title, product.handle, ...product.tags]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (!/silicone/.test(identity)) return null;
  if (/\b(hips?|head[- ]?only|standalone head|replacement head|accessor(?:y|ies))\b/.test(identity)) return null;

  return { kind: "silicone_custom", included: FANREAL_SEPTEMBER_FREEBIES } as const;
}

export function matchesFanrealSeptemberOption(
  group: Pick<CustomizationGroup, "id" | "label">,
  option: CustomizationOption
) {
  if (/^(no thanks|no add-on|none|as shown|factory default)$/i.test(option.label.trim())) return false;
  // MAP-backed September freebie lock: Extra Silicone Head only.
  if (option.id !== "extra-silicone-head") return false;
  return group.id === "fanreal-sept-free-add-ons";
}
