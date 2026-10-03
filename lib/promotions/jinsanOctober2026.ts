import { canonicalBrandValue } from "@/lib/catalog/brands";
import type { Product } from "@/types/product";

// Use the same US Pacific campaign clock as existing factory promotions.
export const JINSAN_OCTOBER_TIMING = {
  startsAt: "2026-10-01T07:00:00.000Z",
  endsAt: "2026-11-01T07:00:00.000Z",
  dateLabel: "1-31 October 2026"
} as const;

export const JINSAN_OCTOBER_OFFERS = {
  lusandy: {
    id: "lusandy-october-2026", brand: "Lusandy",
    image: "/promo/jinsan-october-2026/lusandy.jpg", width: 1280, height: 671,
    scope: "Custom full-size silicone dolls. Ready-to-ship dolls and body parts are excluded.",
    included: ["Super weight reduction", "Anti-puncture fingers", "Movable jaw ROS", "Realistic head painting", "Realistic body painting", "Implanted eyebrows", "Implanted eyelashes", "Extra-soft vagina"],
    standard: ["Gel breasts", "Wire toes", "Articulated fingers", "Hard hands", "Hard feet", "EVO skeleton"],
    discounts: [] as string[]
  },
  wm: {
    id: "wm-october-2026", brand: "WM Doll",
    image: "/promo/jinsan-october-2026/wm.jpg", width: 1280, height: 720,
    scope: "Eligible custom TPE/STPE and hybrid full-size dolls. Ready-to-ship dolls and body parts are excluded. Confirm additional-head compatibility with our team.",
    included: ["Body makeup", "Gel breasts", "One extra wig (factory-selected)", "Fixed tongue", "Standing feet", "One compatible STPE head", "Ball-jointed hand skeleton", "Sway-pivot adaptor", "Breathing system (DollWOW October offer)"],
    standard: [] as string[],
    discounts: ["Suction feature: 20% off"]
  }
} as const;
export type JinsanOctoberBrand = keyof typeof JINSAN_OCTOBER_OFFERS;

export function isJinsanOctoberActive(now: Date) {
  return now.getTime() >= Date.parse(JINSAN_OCTOBER_TIMING.startsAt)
    && now.getTime() < Date.parse(JINSAN_OCTOBER_TIMING.endsAt);
}

export function jinsanOctoberBrandForProduct(
  product: Pick<Product, "title" | "handle" | "vendor" | "productType" | "tags" | "extended">,
  now: Date
): JinsanOctoberBrand | null {
  if (!isJinsanOctoberActive(now) || product.extended.stockStatus !== "custom") return null;
  const identity = product.extended.brand ?? product.vendor;
  const brand = identity.trim().toLowerCase() === "lusandy" ? "lusandy" : canonicalBrandValue(identity);
  if (brand !== "lusandy" && brand !== "wm") return null;
  const text = [product.title, product.handle, product.productType, ...product.tags].join(" ").toLowerCase();
  if (/\b(torso|hips?|body[- ]part|body[- ]only|half[- ]body|head[- ]only|single[- ]head|replacement[- ]head|anime)\b/.test(text)) return null;
  const material = product.extended.material?.toLowerCase() ?? "";
  if (brand === "lusandy") return /silicone/.test(material) ? brand : null;
  if (!product.extended.heightCm || product.extended.heightCm <= 140) return null;
  return /\b(s?tpe|hybrid)\b/.test(material) ? brand : null;
}
