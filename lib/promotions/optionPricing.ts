import {
  irontechAutumnOfferForProduct,
  isIrontechAutumnPromotionActive,
  type IrontechAutumnOffer
} from "@/lib/promotions/irontechAutumn2026";
import {
  isSeDollSeptemberPromotionActive,
  seDollSeptemberOfferForProduct,
  type SeDollSeptemberProductOffer
} from "@/lib/promotions/seDollSeptember2026";
import type { BrandCustomizationConfig, CustomizationGroup, CustomizationOption } from "@/types/customization";
import type { Product } from "@/types/product";

type PromotionProduct = Pick<Product, "handle" | "title" | "vendor" | "productType" | "tags" | "extended">;

export type PromotionOptionPrice = {
  catalogDelta: number;
  displayDelta: number;
  strike: boolean;
  promoLabel: string | null;
  active: boolean;
  eligible: boolean;
  displayLabel: string;
};

const IRONTECH_TALKX_PROMO_LABEL = "IronAI TalkX Box + 60 extra mins AI Talk Time";

/**
 * Keeps Shopify/catalog priceDelta authoritative, and derives only the price
 * shown and charged for a currently active factory promotion.
 */
export function promotionOptionPrice(
  product: PromotionProduct,
  group: Pick<CustomizationGroup, "id" | "label">,
  option: CustomizationOption,
  now = new Date()
): PromotionOptionPrice {
  const catalogDelta = option.priceDelta ?? 0;
  const irontechOffer = irontechAutumnOfferForProduct(product, activeIrontechReferenceDate(now));
  const seOffer = seDollSeptemberOfferForProduct(product, activeSeReferenceDate(now));
  const irontechEligible = Boolean(irontechOffer && matchesIrontechOption(irontechOffer, group, option));
  const seEligible = Boolean(seOffer && matchesSeOption(seOffer, group, option));
  const irontechActive = irontechEligible && isIrontechAutumnPromotionActive(now);
  const seActive = seEligible && isSeDollSeptemberPromotionActive(now);
  const active = irontechActive || seActive;
  const talkX = irontechEligible && isTalkXOption(group, option);

  return {
    catalogDelta,
    displayDelta: active ? 0 : catalogDelta,
    strike: active && catalogDelta > 0,
    promoLabel: active
      ? talkX
        ? IRONTECH_TALKX_PROMO_LABEL
        : irontechActive
          ? "Irontech autumn offer"
          : "SE Doll September offer"
      : null,
    active,
    eligible: irontechEligible || seEligible,
    displayLabel: talkX ? "IronAI TalkX Box" : option.label
  };
}

export function withPromotionOptionPricing(
  product: PromotionProduct,
  config: BrandCustomizationConfig,
  now = new Date()
): BrandCustomizationConfig {
  return {
    ...config,
    groups: config.groups.map((group) => {
      const optionPrices = group.options.map((option) => promotionOptionPrice(product, group, option, now));
      const onePromotionalHead = optionPrices.some((pricing) => pricing.active)
        && /\b(add|extra|second)\b.*\bhead\b/i.test(`${group.id} ${group.label}`);
      return {
        ...group,
        selectionMode: onePromotionalHead ? "single" : group.selectionMode,
        description: onePromotionalHead
          ? "Choose one additional head. One eligible second head is included during the promotion."
          : group.description,
        options: group.options.map((option, index) => {
          const pricing = optionPrices[index];
          if (!pricing.active && pricing.displayLabel === option.label && !onePromotionalHead) return option;
          return {
            ...option,
            label: pricing.displayLabel,
            ...(onePromotionalHead && !isNeutral(option)
              ? { description: pricing.active ? "One additional head included with this promotional build." : "One additional head ordered with this doll." }
              : {}),
            ...(pricing.active
              ? { priceDelta: pricing.displayDelta, priceVerified: true, purchasable: true }
              : {})
          };
        })
      };
    })
  };
}

/** Only Vercel preview deployments may freeze the customizer's display clock. */
export function previewPromotionClock(value: string | string[] | undefined, vercelEnvironment = process.env.VERCEL_ENV) {
  if (vercelEnvironment !== "preview" || typeof value !== "string") return undefined;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : undefined;
}

function matchesIrontechOption(
  offer: IrontechAutumnOffer,
  group: Pick<CustomizationGroup, "id" | "label">,
  option: CustomizationOption
) {
  const identity = optionIdentity(group, option);
  if (isNeutral(option) || isLegacySuctionVersion(option)) return false;
  if (isTalkXOption(group, option)) return true;
  if (offer.kind === "silicone_single_head") return false;

  const evoSkeleton = /\bevo\b.*\bskeleton\b|\bskeleton\b.*\bevo\b/.test(identity);
  const gelBreast = /\bgel\b.*\bbreasts?\b|\bbreasts?\b.*\bgel\b/.test(identity);
  const articulatedFingers = /\barticulated\b.*\bfingers?\b|\bfingers?\b.*\barticulated\b/.test(identity);
  const fixedTongue = /\bfixed\b.*\btongue\b|\btongue\b.*\bfixed\b/.test(identity);
  const extraHead = /\b(add|extra|second)\b.*\bhead\b/.test(identity);
  const siliconeHead = extraHead && /\bsilicone\b/.test(identity);
  const tpeHead = extraHead && /\btpe\b/.test(identity);

  if (offer.kind === "tpe") {
    return evoSkeleton || tpeHead || gelBreast || articulatedFingers || fixedTongue || /\bwith\b.*\btongue\b/.test(identity);
  }
  if (offer.kind === "hybrid") {
    return evoSkeleton || siliconeHead || gelBreast || articulatedFingers || fixedTongue;
  }

  const gelButtocks = /\bgel\b.*\b(butt|buttocks)\b|\b(butt|buttocks)\b.*\bgel\b/.test(identity);
  const graceFingers = !/\bgraceful\s+daisy\b/.test(identity) && (/\bgracejoint\b/.test(identity) || /\bgrace\b.*\bfingers?\b/.test(identity));
  const hardHandsFeet = /\bhard\b.*\b(hands?|feet|foot)\b/.test(identity);
  return evoSkeleton
    || /\bsofter\b.*\bbody\b/.test(identity)
    || siliconeHead
    || /\bros\s*max\b|\brosmax\b|\bros\b.*\b(upgrade|head)\b|\bhead\b.*\bros\b/.test(identity)
    || gelBreast
    || gelButtocks
    || graceFingers
    || hardHandsFeet
    || /\btoe\b.*\bjoints?\b/.test(identity)
    || /\bs\s*\+.*\b(makeup|body painting|painting)\b|\b(makeup|body painting|painting)\b.*\bs\s*\+/.test(identity);
}

function matchesSeOption(
  offer: SeDollSeptemberProductOffer,
  group: Pick<CustomizationGroup, "id" | "label">,
  option: CustomizationOption
) {
  if (isNeutral(option) || offer.kind === "warehouse_silicone" || offer.kind === "warehouse_tpe_stpe" || offer.kind === "silicone_torso_custom") return false;
  const identity = optionIdentity(group, option);
  const bodyPainting = /\b(realistic\s+|hyper\s*realism\s+)?body\s+painting\b/.test(identity) && !/\bfreckles?\b/.test(identity);
  const common = bodyPainting || /\bloose\b.*\bjoints?\b/.test(identity);
  if (offer.kind === "tpe_custom") {
    return common
      || /\bstpe\b.*\bupgrade\b|\bupgrade\b.*\bstpe\b|\bstpe\b$/.test(identity)
      || /\bevo\b.*\bskeleton\b|\bskeleton\b.*\bevo\b/.test(identity)
      || /\bgel\b.*\bbreasts?\b|\bbreasts?\b.*\bgel\b/.test(identity)
      || /\bfixed\b.*\btongue\b|\btongue\b.*\bfixed\b/.test(identity)
      || /\blubricant\s*free\b.*\bvagina\b|\bvagina\b.*\blubricant\s*free\b/.test(identity);
  }

  return common
    || /\bhard\b.*\b(hands?|feet|foot)\b/.test(identity)
    || /\bros\b(?!\s*max)/.test(identity)
    || /\bimplanted\b.*\b(brows?|eyebrows?|lashes?|eyelashes?)\b/.test(identity)
    || /\bgel\b.*\bbreasts?\b|\bbreasts?\b.*\bgel\b/.test(identity)
    || /\bsoft\b.*\bvagina\b/.test(identity)
    || /\b(articulated|ultra\s*flex)\b.*\bfingers?\b/.test(identity)
    || (offer.includesSoftBelly && /\bsoft\b.*\bbelly\b/.test(identity));
}

function isTalkXOption(group: Pick<CustomizationGroup, "id" | "label">, option: CustomizationOption) {
  if (isLegacySuctionVersion(option)) return false;
  const identity = optionIdentity(group, option);
  return /\btalk\s*x\b/.test(identity) || /\biron\s*ai\s+box\b/.test(identity);
}

function isLegacySuctionVersion(option: CustomizationOption) {
  return /\b(internal|external)\s+version\b|^version$/i.test(option.label.trim());
}

function isNeutral(option: CustomizationOption) {
  return /^(no thanks|no add-on|none|as shown|factory default)$/i.test(option.label.trim()) || /^(none|no-add-on|factory-default)$/.test(option.id);
}

function optionIdentity(group: Pick<CustomizationGroup, "id" | "label">, option: CustomizationOption) {
  return `${group.id} ${group.label} ${option.id} ${option.label}`.toLowerCase().replace(/[^a-z0-9+]+/g, " ").trim();
}

// Offer classification is independent of the current active state. Reference
// dates let checkout filtering retain known promo options without making them free.
function activeIrontechReferenceDate(now: Date) {
  return isIrontechAutumnPromotionActive(now) ? now : new Date("2026-09-15T12:00:00.000Z");
}

function activeSeReferenceDate(now: Date) {
  return isSeDollSeptemberPromotionActive(now) ? now : new Date("2026-09-15T12:00:00.000Z");
}
