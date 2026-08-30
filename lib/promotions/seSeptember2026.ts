import handleData from "@/data/promotions/dol-25/se-pdp-frees-handles.json";

export const SE_SEPTEMBER_PROMOTION = {
  brand: "SE Doll",
  brandHref: "/brands/se-doll",
  promoHref: "/promo",
  displayDates: "1–30 September 2026",
  publishesAt: "2026-08-30T00:00:00.000Z",
  startsAt: "2026-09-01T00:00:00.000Z",
  endsAt: "2026-09-30T23:59:59.999Z",
  banner: {
    hero: "/promo/sedoll/TPE-doll-1920x750-SEdoll.jpg",
    card: "/promo/sedoll/TPE-doll-800x600-SEdoll.jpg",
    portrait: "/promo/sedoll/TPE-doll-1200x1800-SEdoll.jpg",
    alt: "SE Doll TPE September 2026 promotion featuring an adult companion doll in white ruffled lingerie and the eligible factory bonuses for 1–30 September 2026."
  },
  tpeFrees: [
    "STPE upgrade",
    "EVO skeleton",
    "Gel breasts",
    "Lubricant-free vagina",
    "Realistic body painting",
    "Fixed tongue"
  ],
  siliconeProFrees: [
    "Realistic body painting",
    "Hard hands and hard feet",
    "Realistic oral structure",
    "Implanted eyebrow and eyelash",
    "Gel breasts",
    "Soft vagina",
    "Articulated or ultra-flex fingers"
  ],
  siliconeProSoftBelly: "Soft belly"
} as const;

export type SeSeptemberPdpPromotion = {
  material: "TPE / STPE" | "Silicone Pro";
  displayDates: string;
  frees: readonly string[];
  includesSoftBelly: boolean;
};

const tpeCustomHandles = new Set(handleData.tpe_custom_handles);
const siliconeProCustomHandles = new Set(handleData.silicone_pro_custom_handles);
const siliconeProSoftBellyHandles = new Set(handleData.silicone_pro_soft_belly_height_proxy_handles);

export function seSeptemberPdpPromotion(handle: string): SeSeptemberPdpPromotion | null {
  if (tpeCustomHandles.has(handle)) {
    return {
      material: "TPE / STPE",
      displayDates: SE_SEPTEMBER_PROMOTION.displayDates,
      frees: SE_SEPTEMBER_PROMOTION.tpeFrees,
      includesSoftBelly: false
    };
  }

  if (siliconeProCustomHandles.has(handle)) {
    return {
      material: "Silicone Pro",
      displayDates: SE_SEPTEMBER_PROMOTION.displayDates,
      frees: SE_SEPTEMBER_PROMOTION.siliconeProFrees,
      includesSoftBelly: siliconeProSoftBellyHandles.has(handle)
    };
  }

  return null;
}

export function isSeSeptemberPromotionPublished(at = new Date()) {
  return at >= new Date(SE_SEPTEMBER_PROMOTION.publishesAt) && at <= new Date(SE_SEPTEMBER_PROMOTION.endsAt);
}
