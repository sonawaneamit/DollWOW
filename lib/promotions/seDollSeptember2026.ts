import handleData from "@/data/promotions/se-doll-september-2026-handles.json";
import type { Product } from "@/types/product";

export const SE_DOLL_SEPTEMBER_PROMOTION = {
  id: "se-doll-tpe-september-2026",
  brand: "SE Doll",
  brandHref: "/brands/se-doll",
  promoHref: "/promo",
  title: "SE Doll September custom-order bonuses",
  shortTitle: "SE Doll TPE custom-order bonuses",
  summary:
    "SE Doll custom TPE and STPE orders placed during September include six factory bonus upgrades.",
  dateLabel: "1–30 September 2026",
  startsAt: "2026-09-01T00:00:00.000Z",
  // Cutoff is midnight 1 October US Pacific time for US customers.
  endsAt: "2026-10-01T07:00:00.000Z",
  publishAt: "2026-08-30T00:00:00.000Z",
  heroImage: "/promo/se-doll/TPE-doll-1920x750-SEdoll.jpg",
  cardImage: "/promo/se-doll/TPE-doll-800x600-SEdoll.jpg",
  portraitImage: "/promo/se-doll/TPE-doll-1200x1800-SEdoll.jpg",
  heroAlt:
    "SE Doll TPE September 2026 factory promotion featuring an adult companion doll in white ruffled lingerie and the six included TPE custom-order bonuses, valid 1–30 September 2026.",
  cardAlt:
    "SE Doll TPE September 2026 factory promotion card featuring an adult companion doll and the included TPE custom-order bonuses.",
  tpeFreebies: [
    "Free STPE upgrade",
    "Free EVO skeleton",
    "Free gel breasts",
    "Free lubricant-free vagina",
    "Free realistic body painting",
    "Free fixed tongue"
  ],
  siliconeProFreebies: [
    "Free realistic body painting",
    "Free hard hands and hard feet",
    "Free realistic oral structure",
    "Free implanted eyebrow and eyelash",
    "Free gel breasts",
    "Free soft vagina",
    "Free articulated or ultra-flex fingers"
  ]
} as const;

export type SeDollSeptemberFreebieSet = {
  material: "TPE / STPE" | "Silicone Pro";
  freebies: readonly string[];
  includesSoftBelly: boolean;
};

const tpeCustomHandles = new Set(handleData.tpe_custom_handles);
const siliconeProCustomHandles = new Set(handleData.silicone_pro_custom_handles);
const softBellyProxyHandles = new Set(handleData.silicone_pro_soft_belly_height_proxy_handles);
const softBellyBodyCodes = new Set(["T148", "T155", "T159", "T165", "T175"]);

export const SE_DOLL_PROMOTION_HANDLE_COUNTS = handleData.counts;

export function isSeDollSeptemberPromotionVisible(now = new Date()) {
  const timestamp = now.getTime();
  return timestamp >= Date.parse(SE_DOLL_SEPTEMBER_PROMOTION.publishAt) && timestamp < Date.parse(SE_DOLL_SEPTEMBER_PROMOTION.endsAt);
}

export function seDollSeptemberPromotionStatus(now = new Date()) {
  const timestamp = now.getTime();
  if (timestamp < Date.parse(SE_DOLL_SEPTEMBER_PROMOTION.startsAt)) return "Starts 1 September";
  if (timestamp < Date.parse(SE_DOLL_SEPTEMBER_PROMOTION.endsAt)) return "Active now";
  return "Ended";
}

export function seDollSeptemberFreebiesForProduct(
  product: Pick<Product, "handle" | "extended">,
  now = new Date()
): SeDollSeptemberFreebieSet | null {
  if (!isSeDollSeptemberPromotionVisible(now) || product.extended.stockStatus !== "custom") return null;

  if (tpeCustomHandles.has(product.handle)) {
    return {
      material: "TPE / STPE",
      freebies: SE_DOLL_SEPTEMBER_PROMOTION.tpeFreebies,
      includesSoftBelly: false
    };
  }

  if (!siliconeProCustomHandles.has(product.handle)) return null;

  const bodyCode = normalizeBodyCode(product.extended.bodyCode);
  const includesSoftBelly = bodyCode
    ? softBellyBodyCodes.has(bodyCode)
    : softBellyProxyHandles.has(product.handle);

  return {
    material: "Silicone Pro",
    freebies: SE_DOLL_SEPTEMBER_PROMOTION.siliconeProFreebies,
    includesSoftBelly
  };
}

function normalizeBodyCode(value: string | undefined) {
  if (!value) return undefined;
  return value.toUpperCase().match(/\bT(?:148|155|159|165|175)\b/)?.[0] ?? value.trim().toUpperCase();
}
