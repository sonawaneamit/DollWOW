import { canonicalBrandValue } from "@/lib/catalog/brands";
import type { Product } from "@/types/product";

const promotionTiming = {
  dateLabel: "7 September – 7 October 2026",
  startsAt: "2026-09-07T07:00:00.000Z",
  // Midnight US Pacific on 8 October keeps all of 7 October PT included.
  endsAt: "2026-10-08T07:00:00.000Z",
  publishAt: "2026-09-03T00:00:00.000Z"
} as const;

export const IRONTECH_AUTUMN_OFFERS = {
  siliconeFullCustom: {
    kind: "silicone_full_custom",
    title: "Irontech silicone full-body custom bonuses",
    included: [
      "Free EVO Skeleton",
      "Free IronAI TalkX Box + 60 Extra Mins AI Talk Time",
      "Softer Body",
      "Free Second Silicone Head",
      "Free ROS / ROS MAX Upgrade (on any one silicone head)",
      "Free Gel Breast & Buttocks",
      "Free Grace Fingers (GraceJoint)",
      "Free Hard Hand & Hard Feet",
      "Free Toe Joints (if available)",
      "Free S+ Makeup & S+ Body Painting"
    ]
  },
  siliconeSingleHead: {
    kind: "silicone_single_head",
    title: "Irontech silicone single-head bonus",
    included: ["Free IronAI TalkX Box + 60 Extra Mins AI Talk Time"]
  },
  tpe: {
    kind: "tpe",
    title: "Irontech TPE custom bonuses",
    included: [
      "Free EVO Skeleton",
      "Free IronAI TalkX Box + 60 Extra Mins AI Talk Time",
      "Free Second TPE Head",
      "Free Gel Breast",
      "Free Articulated Fingers",
      "Free Fixed Tongue / With Tongue"
    ]
  },
  hybrid: {
    kind: "hybrid",
    title: "Irontech hybrid custom bonuses",
    included: [
      "Free EVO Skeleton",
      "Free IronAI TalkX Box + 60 Extra Mins AI Talk Time",
      "Free Second Silicone Head (soft or hard)",
      "Free Gel Breast",
      "Free Articulated Fingers",
      "Free Fixed Tongue"
    ]
  }
} as const;

export const IRONTECH_AUTUMN_PROMOTION = {
  id: "irontech-autumn-2026",
  brand: "Irontech Dolls",
  brandHref: "/brands/irontech-dolls",
  promoHref: "/promo#irontech-autumn-2026",
  title: "Irontech autumn factory promotion",
  summary: "Factory bonuses for eligible Irontech silicone full-body custom dolls, TPE and hybrid custom dolls, and silicone single heads.",
  heroImage: "/promo/irontech-autumn-2026/8.26-activity-banner-1920x1080.jpg",
  mobileHeroImage: "/promo/irontech-autumn-2026/8.26-activity-banner-mobile.jpg",
  heroAlt: "Irontech Doll autumn 2026 factory promotion with an adult blonde companion doll in a white top and jeans, an IronAI TalkX Box, and offer panels for silicone full custom dolls, TPE and hybrid dolls, and silicone single heads.",
  bonus: "Post about the IronAI TalkX Box on TDF, Instagram, or X and tag the official account to receive an additional 60 minutes of AI Talk Time.",
  ...promotionTiming
} as const;

export type IrontechAutumnOffer = (typeof IRONTECH_AUTUMN_OFFERS)[keyof typeof IRONTECH_AUTUMN_OFFERS];

export function isIrontechAutumnPromotionVisible(now = new Date()) {
  const timestamp = now.getTime();
  return timestamp >= Date.parse(promotionTiming.publishAt) && timestamp < Date.parse(promotionTiming.endsAt);
}

export function isIrontechAutumnPromotionActive(now = new Date()) {
  const timestamp = now.getTime();
  return timestamp >= Date.parse(promotionTiming.startsAt) && timestamp < Date.parse(promotionTiming.endsAt);
}

export function irontechAutumnPromotionStatus(now = new Date()) {
  const timestamp = now.getTime();
  if (timestamp < Date.parse(promotionTiming.startsAt)) return "Starts 7 September";
  if (timestamp < Date.parse(promotionTiming.endsAt)) return "Active now";
  return "Ended";
}

export function irontechAutumnOfferForProduct(
  product: Pick<Product, "handle" | "title" | "vendor" | "productType" | "tags" | "extended">,
  now = new Date()
): IrontechAutumnOffer | null {
  if (!isIrontechAutumnPromotionVisible(now)) return null;
  if (canonicalBrandValue(product.extended.brand ?? product.vendor) !== "irontech") return null;
  if (product.extended.stockStatus !== "custom") return null;

  const text = [
    product.productType,
    product.extended.material,
    product.extended.sourceTitle,
    product.title,
    product.handle,
    ...product.tags
  ].filter(Boolean).join(" ").toLowerCase();

  if (isPartialBody(text)) return null;
  if (/\bhybrid\b|tpe\s+body\s+with\s+(?:a\s+)?silicone\s+head|silicone[- ]head\s+doll/.test(text)) {
    return IRONTECH_AUTUMN_OFFERS.hybrid;
  }
  if (isStandaloneHead(product.productType, text)) {
    return product.handle === "irontech-ironai-head-companion-doll-1v3pz"
      ? IRONTECH_AUTUMN_OFFERS.siliconeSingleHead
      : null;
  }
  if (/\btpe\b|\bstpe\b/.test(text)) return IRONTECH_AUTUMN_OFFERS.tpe;
  if (/\bsilicone\b/.test(text)) return IRONTECH_AUTUMN_OFFERS.siliconeFullCustom;
  return null;
}

function isStandaloneHead(productType: string, text: string) {
  const normalizedProductType = productType.toLowerCase();
  return /\b(replacement\s+head|standalone\s+head|doll\s+head|head\s+only|head-only|single\s+head)\b/.test(text)
    || (normalizedProductType.includes("head") && !normalizedProductType.includes("doll"))
    || (text.includes("ironai") && text.includes("head"));
}

function isPartialBody(text: string) {
  return /\b(torso|hips?|body[- ]part|body\s+only|partial\s+body|half\s+body)\b/.test(text);
}
