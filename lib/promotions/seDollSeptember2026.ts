import handleData from "@/data/promotions/se-doll-september-2026-handles.json";
import type { Product } from "@/types/product";

const promotionTiming = {
  dateLabel: "1–30 September 2026",
  startsAt: "2026-09-01T00:00:00.000Z",
  // Cutoff is midnight 1 October US Pacific time for US customers.
  endsAt: "2026-10-01T07:00:00.000Z",
  publishAt: "2026-08-30T00:00:00.000Z"
} as const;

export const SE_DOLL_WAREHOUSE_STPE_MAKEUP_NOTE =
  "STPE dolls from the US and EU warehouses are sold at the price without body makeup, whether the unit has makeup or not. If a warehouse STPE already has body makeup, that makeup is included at no extra cost.";

export const SE_DOLL_LOOSE_JOINT_SYSTEM = {
  title: "Free Loose Joint System",
  summary: "Lower-resistance shoulder, elbow, hip, and knee joints make the limbs easier to reposition and give them a more relaxed feel.",
  note: "Choose this instead of standard joint tension. Loose joints are easier to move but provide less support for unsupported standing, sitting, and held poses.",
  heroImage: "/promo/se-doll/factory-Loose-Joints-1920x750.jpg",
  mobileHeroImage: "/promo/se-doll/factory-Loose-Joints-1080x1350.jpg",
  heroAlt: "SE Doll factory promotion for the 4-Limb Loose Joint System, showing the flexible shoulder, elbow, hip, and knee joints."
} as const;

export const SE_DOLL_SEPTEMBER_OFFERS = {
  tpeCustom: {
    id: "se-doll-tpe-custom-september-2026",
    kind: "tpe_custom",
    shortTitle: "SE Doll TPE / STPE custom-order bonuses",
    summary: "Seven free factory upgrades on eligible custom TPE and STPE full-doll orders.",
    heroImage: "/promo/se-doll/TPE-doll-1920x750-SEdoll.jpg",
    heroAlt: "SE Doll TPE September 2026 factory promotion with an adult companion doll in white lingerie and seven custom-order bonuses, valid 1–30 September 2026.",
    includedTitle: "Free on eligible custom TPE and STPE full dolls",
    included: [
      "Free STPE upgrade",
      "Free EVO skeleton",
      "Free gel breasts",
      "Free fixed tongue",
      "Free lubricant-free vagina",
      "Free realistic body painting",
      SE_DOLL_LOOSE_JOINT_SYSTEM.title
    ],
    discounts: [],
    note: "Custom full dolls only. Ready-to-ship dolls and torsos are not eligible."
  },
  siliconeCustom: {
    id: "se-doll-silicone-pro-custom-september-2026",
    kind: "silicone_custom",
    shortTitle: "SE Doll Silicone Pro custom offer",
    summary: "Factory bonuses and option discounts on eligible custom Silicone Pro full-doll orders.",
    heroImage: "/promo/se-doll/Silicone-doll-1920x750-SEdoll.jpg",
    heroAlt: "SE Doll Silicone Pro September 2026 promotion with an adult blonde companion doll in athletic wear, free custom upgrades, and option discounts.",
    includedTitle: "Free on eligible custom Silicone Pro full dolls",
    included: [
      "Free realistic body painting",
      "Free hard hands & feet",
      "Free ROS",
      "Free implanted brow/lash",
      "Free gel breasts",
      "Free soft vagina",
      "Free articulated or ultra-flex fingers",
      SE_DOLL_LOOSE_JOINT_SYSTEM.title
    ],
    discounts: [
      "10% off master makeup",
      "30% off movable eyelids",
      "50% off gel butt",
      "50% off realistic skin texture"
    ],
    note: "Custom Silicone Pro full dolls only. Free soft belly is also included on eligible T148, T155, T159, T165, and T175 bodies."
  },
  siliconeTorsoCustom: {
    id: "se-doll-silicone-torso-custom-september-2026",
    kind: "silicone_torso_custom",
    shortTitle: "SE Doll silicone torso custom offer",
    summary: "Factory option discounts for eligible custom silicone torso orders.",
    heroImage: "/promo/se-doll/Silicone-torso-1920x750-SEdoll.jpg",
    heroAlt: "SE Doll silicone torso September 2026 promotion with an adult blonde torso figure in black lace and discounts on movable eyelids and gel butt.",
    includedTitle: "Discounted custom options",
    included: [],
    discounts: ["30% off movable eyelids", "50% off gel butt"],
    note: "No eligible SE Doll silicone torso product page is currently live. Ask our team for availability."
  },
  warehouse: {
    id: "se-doll-warehouse-september-2026",
    kind: "warehouse",
    shortTitle: "SE Doll US / EU warehouse offer",
    summary: "Factory savings on eligible SE Doll ready-to-ship stock in US and EU warehouses.",
    heroImage: "/promo/se-doll/US-EU-stock-1920x750-SEdoll.jpg",
    heroAlt: "SE Doll September 2026 US and EU warehouse promotion with four adult companion dolls and separate Silicone Pro and STPE ready-to-ship offers.",
    includedTitle: "Eligible ready-to-ship warehouse offers",
    included: [
      "Silicone Pro: 10% off + free realistic skin texture",
      "TPE / STPE: 15% off"
    ],
    discounts: [],
    note: SE_DOLL_WAREHOUSE_STPE_MAKEUP_NOTE
  }
} as const;

export const SE_DOLL_SEPTEMBER_PROMOTION = {
  id: "se-doll-september-2026",
  brand: "SE Doll",
  brandHref: "/brands/se-doll",
  promoHref: "/promo",
  title: "SE Doll September factory offers",
  shortTitle: "Four SE Doll September factory offers",
  summary: "Custom TPE/STPE, custom Silicone Pro, silicone torso, and US/EU warehouse offers from SE Doll.",
  ...promotionTiming,
  heroImage: SE_DOLL_SEPTEMBER_OFFERS.tpeCustom.heroImage,
  heroAlt: SE_DOLL_SEPTEMBER_OFFERS.tpeCustom.heroAlt
} as const;

type SeDollSeptemberOfferKind =
  | "tpe_custom"
  | "silicone_custom"
  | "silicone_torso_custom"
  | "warehouse_silicone"
  | "warehouse_tpe_stpe";

export type SeDollSeptemberProductOffer = {
  kind: SeDollSeptemberOfferKind;
  title: string;
  material: "TPE / STPE" | "Silicone Pro" | "Silicone torso";
  image: string;
  imageAlt: string;
  included: readonly string[];
  discounts: readonly string[];
  includesLooseJointSystem: boolean;
  includesSoftBelly: boolean;
  makeupPriceNote?: string;
};

const tpeCustomHandles = new Set(handleData.tpe_custom_handles);
const siliconeProCustomHandles = new Set(handleData.silicone_pro_custom_handles);
const softBellyProxyHandles = new Set(handleData.silicone_pro_soft_belly_height_proxy_handles);
const siliconeRtsHandles = new Set(handleData.silicone_rts_handles);
const tpeRtsHandles = new Set(handleData.tpe_rts_handles);
const softBellyBodyCodes = new Set(["T148", "T155", "T159", "T165", "T175"]);

export const SE_DOLL_PROMOTION_HANDLE_COUNTS = handleData.counts;

export function isSeDollSeptemberPromotionVisible(now = new Date()) {
  const timestamp = now.getTime();
  return timestamp >= Date.parse(promotionTiming.publishAt) && timestamp < Date.parse(promotionTiming.endsAt);
}

export function seDollSeptemberPromotionStatus(now = new Date()) {
  const timestamp = now.getTime();
  if (timestamp < Date.parse(promotionTiming.startsAt)) return "Starts 1 September";
  if (timestamp < Date.parse(promotionTiming.endsAt)) return "Active now";
  return "Ended";
}

export function seDollSeptemberOfferForProduct(
  product: Pick<Product, "handle" | "extended">,
  now = new Date()
): SeDollSeptemberProductOffer | null {
  if (!isSeDollSeptemberPromotionVisible(now)) return null;

  // The authoritative warehouse lists win over mutable catalog metadata so every listed PDP keeps its offer copy.
  if (tpeRtsHandles.has(product.handle)) {
    return {
      kind: "warehouse_tpe_stpe",
      title: "15% off SE Doll warehouse TPE / STPE",
      material: "TPE / STPE",
      image: SE_DOLL_SEPTEMBER_OFFERS.warehouse.heroImage,
      imageAlt: SE_DOLL_SEPTEMBER_OFFERS.warehouse.heroAlt,
      included: [],
      discounts: ["15% off this ready-to-ship warehouse doll"],
      includesLooseJointSystem: false,
      includesSoftBelly: false,
      makeupPriceNote: SE_DOLL_WAREHOUSE_STPE_MAKEUP_NOTE
    };
  }

  if (siliconeRtsHandles.has(product.handle)) {
    return {
      kind: "warehouse_silicone",
      title: "SE Doll warehouse Silicone Pro offer",
      material: "Silicone Pro",
      image: SE_DOLL_SEPTEMBER_OFFERS.warehouse.heroImage,
      imageAlt: SE_DOLL_SEPTEMBER_OFFERS.warehouse.heroAlt,
      included: ["Free realistic skin texture"],
      discounts: ["10% off this ready-to-ship warehouse doll"],
      includesLooseJointSystem: false,
      includesSoftBelly: false
    };
  }

  if (product.extended.stockStatus !== "custom") return null;

  if (isSeDollSiliconeTorso(product)) {
    return {
      kind: "silicone_torso_custom",
      title: "Silicone torso custom factory discounts",
      material: "Silicone torso",
      image: SE_DOLL_SEPTEMBER_OFFERS.siliconeTorsoCustom.heroImage,
      imageAlt: SE_DOLL_SEPTEMBER_OFFERS.siliconeTorsoCustom.heroAlt,
      included: [],
      discounts: SE_DOLL_SEPTEMBER_OFFERS.siliconeTorsoCustom.discounts,
      includesLooseJointSystem: false,
      includesSoftBelly: false
    };
  }

  if (tpeCustomHandles.has(product.handle)) {
    return {
      kind: "tpe_custom",
      title: "Free TPE / STPE custom-order upgrades",
      material: "TPE / STPE",
      image: SE_DOLL_SEPTEMBER_OFFERS.tpeCustom.heroImage,
      imageAlt: SE_DOLL_SEPTEMBER_OFFERS.tpeCustom.heroAlt,
      included: SE_DOLL_SEPTEMBER_OFFERS.tpeCustom.included,
      discounts: [],
      includesLooseJointSystem: true,
      includesSoftBelly: false
    };
  }

  if (!siliconeProCustomHandles.has(product.handle)) return null;

  const bodyCode = normalizeBodyCode(product.extended.bodyCode);
  const includesSoftBelly = bodyCode
    ? softBellyBodyCodes.has(bodyCode)
    : softBellyProxyHandles.has(product.handle);

  return {
    kind: "silicone_custom",
    title: "Silicone Pro custom factory extras",
    material: "Silicone Pro",
    image: SE_DOLL_SEPTEMBER_OFFERS.siliconeCustom.heroImage,
    imageAlt: SE_DOLL_SEPTEMBER_OFFERS.siliconeCustom.heroAlt,
    included: SE_DOLL_SEPTEMBER_OFFERS.siliconeCustom.included,
    discounts: SE_DOLL_SEPTEMBER_OFFERS.siliconeCustom.discounts,
    includesLooseJointSystem: true,
    includesSoftBelly
  };
}

// Compatibility alias for existing imports; product offers now also include discounts.
export const seDollSeptemberFreebiesForProduct = seDollSeptemberOfferForProduct;

function normalizeBodyCode(value: string | undefined) {
  if (!value) return undefined;
  return value.toUpperCase().match(/\bT(?:148|155|159|165|175)\b/)?.[0] ?? value.trim().toUpperCase();
}

function isSeDollSiliconeTorso(product: Pick<Product, "handle" | "extended">) {
  const isSeDoll = product.handle.startsWith("sedoll-") || product.extended.brand?.toLowerCase() === "se doll";
  if (!isSeDoll) return false;

  return [product.extended.bodyCode, product.extended.sourceTitle, product.extended.displayName, product.handle]
    .filter((value): value is string => Boolean(value))
    .some((value) => /(?:^|[-\s])SET[-\s]?\d+/i.test(value));
}
