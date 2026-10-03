import { canonicalBrandValue } from "@/lib/catalog/brands";
import {
  OCTOBER_CAMPAIGNS, OCTOBER_OPTION_RULES, SE_LIGHTWEIGHT_DRAFT,
  inFactoryDateWindow, octoberOfferCandidate, seLightweightCandidate, type OctoberProductFacts
} from "@/lib/promotions/october2026Draft";
import type { Product } from "@/types/product";
import type { BrandCustomizationConfig, CustomizationGroup, CustomizationOption, CustomizationSelections } from "@/types/customization";
import { getOptionConflict } from "@/lib/customization/resolve";
import seReviewedHandles from "@/data/promotions/se-doll-september-2026-handles.json";
import seOctoberReviewed from '@/data/promotions/se-october-2026-reviewed.json';

const reviewedSeSiliconePro = new Set(seReviewedHandles.silicone_pro_custom_handles);

export type OctoberProduct = Pick<Product, "handle" | "title" | "vendor" | "productType" | "tags" | "extended">;
export type OctoberPricingContext = { config: BrandCustomizationConfig; selections?: CustomizationSelections };
export const OCTOBER_CAMPAIGN_TIME_ZONE = "America/Los_Angeles";
const campaignDateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: OCTOBER_CAMPAIGN_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit"
});

// Runtime callers use promotionPricingForSelections with the original menu.
// Server routes use their own clock; preview clocks are display-only.

// Same Pacific campaign clock as Irontech September. Intl handles November DST.
export function octoberCampaignDay(now: Date) {
  if (!Number.isFinite(now.getTime())) return "";
  const parts = campaignDateFormatter.formatToParts(now);
  const part = (type: string) => parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function octoberProductFacts(product: OctoberProduct): OctoberProductFacts {
  const brand = canonicalBrandValue(product.extended.brand ?? product.vendor);
  const text = [product.productType, product.title, product.handle, product.extended.sourceTitle, ...product.tags].join(" ").toLowerCase();
  const material = (product.extended.material ?? "").toLowerCase();
  const hybrid = /hybrid|silicone[- ]head[- ]doll/.test(`${material} ${text}`) || /\btpe\b/.test(`${material} ${text}`) && /\bsilicone\b/.test(`${material} ${text}`);
  const partial = /\b(torso|hips?|partial|half[- ]body|body[- ]only|body[- ]part)\b/.test(text);
  const head = /\b(head[- ]only|standalone[- ]head|single[- ]head|replacement[- ]head|doll[- ]head|ironai[- ]head)\b/.test(text)
    || /^(?:custom )?(?:silicone )?head$/i.test(product.productType);
  const fullBody = /^(?:custom )?(?:full[- ]body )?(?:silicone|tpe|stpe|silicone pro) doll$/i.test(product.productType)
    || /\bfull[- ]body\b/.test(text);
  return {
    brand: brand === "sedoll" ? "se" : brand === "irontech" || brand === "real-lady" ? brand : "other",
    material: hybrid ? "hybrid" : /^(?:full )?silicone(?: pro)?$/.test(material) ? "silicone" : /^(?:s?tpe|lstpe)$/.test(material) ? "tpe" : "unknown",
    fulfillment: product.extended.stockStatus === "custom" ? "custom" : "unknown",
    form: partial ? (/\btorso\b/.test(text) ? "torso" : "unknown") : fullBody ? "full-body" : head ? "head" : "unknown",
    // Reuse verified series identity, not September's expired campaign dates.
    series: /\bsilicone[- ]pro\b/.test(`${material} ${text}`)
      || brand === "sedoll" && material === "silicone" && reviewedSeSiliconePro.has(product.handle)
      ? "Silicone Pro" : undefined,
    bodyCode: product.extended.bodyCode
  };
}

export function octoberOfferForProduct(product: OctoberProduct, now = new Date()) {
  const facts = octoberProductFacts(product);
  const kind = octoberOfferCandidate(facts, octoberCampaignDay(now));
  if (!kind || facts.brand === "other") return null;
  const campaign = OCTOBER_CAMPAIGNS[facts.brand];
  const brandLabel = { se: "SE Doll", irontech: "Irontech", "real-lady": "Real Lady" }[facts.brand];
  const full = kind === "irontech-silicone-full-body" || kind === "real-lady-silicone-full-body";
  const included: string[] = kind === "se-tpe-full-body" ? [...OCTOBER_OPTION_RULES.seTpe.free]
    : kind === "se-silicone-pro-full-body" ? [...OCTOBER_OPTION_RULES.seSiliconePro.free]
    : kind === "irontech-silicone-full-body" ? [...OCTOBER_OPTION_RULES.irontech.free]
    : kind === "real-lady-silicone-full-body" ? [...OCTOBER_OPTION_RULES.realLady.free]
    : kind === "real-lady-head-talkx-only" || kind === 'irontech-head-talkx-only' ? [...OCTOBER_OPTION_RULES.realLady.headOnlyBenefits] : [];
  if (full) included.push("ROS or ROS MAX upgrade on ONE silicone head only");
  if (kind === "irontech-silicone-full-body") included.push("Toe joints where supported");
  if (kind === "se-silicone-pro-full-body" && softBelly(facts)) included.push("Soft belly");
  const discounts = kind === "se-silicone-pro-full-body"
    ? ["10% off master makeup", "30% off movable eyelids on compatible ROS heads", "50% off gel butt", "50% off realistic skin texture"]
    : kind === "se-silicone-torso" ? ["30% off movable eyelids on compatible ROS heads", "50% off gel butt"] : [];
  return { kind, facts, campaign, title: `${brandLabel} October factory offer`, included, discounts,
    label: `${brandLabel} Limited Time Promo (Ends: ${campaign.endsOn})` };
}

function softBelly(facts: OctoberProductFacts) {
  return (OCTOBER_OPTION_RULES.seSiliconePro.softBellyBodyCodes as readonly string[]).includes(facts.bodyCode?.trim().toUpperCase() ?? "");
}

// Closed option identities, not substring matches. Combined paid options do not
// inherit a benefit just because their label contains a free option's name.
const commonGroups = new Set([
  "premium-body-options-multiple", "premium-head-body-options-multiple", "premium-head-body-options",
  "premium-body-options", "makeup-options", "breast-options", "skeleton", "skeleton-type", "skeleton-type-add-on",
  "standing-add-on", "body", "hands", "feet", "fingers", "makeup", "enhanced-mouth-add-on",
  "material", "body-material", "vagina-type", "vagina-options", "mouth", "tongue", "body-makeup", "body-skeleton"
]);
const tpeFree = new Set(["stpe upgrade", "stpe", "evo skeleton", "evo", "gel breasts", "gel breast", "fixed tongue", "lubricant free vagina", "realistic body painting", "hyper realism body painting"]);
const siliconeFree = new Set(["realistic body painting", "hyper realism body painting", "hard hands", "hard hand", "hard feet", "hard hands hard feet", "implanted eyebrows", "implanted eyebrow eyelash", "implanted eyebrows and eyelashes", "gel breasts", "gel breast", "soft vagina"]);
const ironFree = new Set(["evo skeleton", "evo", "softer body", "gel breasts", "gel breast", "gel butt", "gel buttocks", "gracejoint", "gracejoint fingers", "grace fingers", "hard hands", "hard hand", "hard hands upgrade", "hard feet", "s makeup", "s makeup upgrade", "s body painting"]);
const realFree = new Set(["ss makeup", "ss makeup upgrade", "ss body painting", "hyper realistic skin structure", "evo max skeleton", "gracejoint", "gracejoint hand skeleton", "grace joint hand skeleton", "toe joints", "gel breasts", "gel breast", "hard hand", "hard hands", "standing feet without bolts", "gel butt"]);

function name(option: CustomizationOption) {
  return option.label.toLowerCase().replace(/\(free\)/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

function safeOption(option: CustomizationOption) {
  return option.factoryExists !== false && option.displayable !== false && option.purchasable !== false
    && option.priceVerified !== false && typeof option.priceDelta === "number"
    && Number.isFinite(option.priceDelta) && option.priceDelta >= 0;
}

function limitedGroup(context: OctoberPricingContext | undefined, groupId: string, candidate: (group: CustomizationGroup) => boolean) {
  if (!context || context.config.groups.some((group) => group.visibleWhen !== undefined)) return false;
  const groups = context.config.groups.filter(candidate);
  return groups.length === 1 && groups[0].id === groupId;
}

function selectedRosHead(context?: OctoberPricingContext) {
  if (!context || context.config.groups.some((g) => g.visibleWhen !== undefined)) return false;
  const heads = context.config.groups.filter((g) => /head.*(type|function)/i.test(g.id));
  if (heads.length !== 1) return false;
  const selected = context.selections?.[heads[0].id];
  if (typeof selected !== "string") return false;
  const option = heads[0].options.find((o) => o.id === selected);
  return Boolean(option && safeOption(option) && ["ros", "realistic oral structure", "movable jaw ros"].includes(name(option)));
}

/** Calculation evidence only. Paid reductions require parent-specific checkout release. */
export function octoberCandidateOptionAdjustment(product: OctoberProduct, group: Pick<CustomizationGroup, "id" | "label">,
  option: CustomizationOption, now = new Date(), context?: OctoberPricingContext) {
  if (context?.config.groups.some((g) => g.visibleWhen !== undefined) && option.priceDelta !== 0) return null;
  const offer = octoberOfferForProduct(product, now);
  if (!offer || !safeOption(option)) return null;
  const value = name(option);
  const kind = offer.kind;
  const full = kind === "irontech-silicone-full-body" || kind === "real-lady-silicone-full-body";
  let percentage = 0;
  let single = false;
  if ((full || kind === "real-lady-head-talkx-only" || kind === 'irontech-head-talkx-only') && ["ironai-talkx-box", "ironai"].includes(group.id)
    && ["ironai-talkx-box-free", "ironai-talkx-box", "talkx-box"].includes(option.id)
    && ["ironai talkx box", "talkx box"].includes(value)) percentage = 100;
  if (full && group.id === "add-extra-head" && /^silicone-[a-z0-9-]+$/.test(option.id)
    && /^[a-z]+\d+(?: \d+)? silicone$/.test(value)
    && limitedGroup(context, group.id, (g) => /\b(extra|second|additional)\b.*\bhead\b/i.test(`${g.id.replaceAll("-", " ")} ${g.label}`))) {
    percentage = 100; single = true;
  }
  // One exclusive function group is safe; separate primary/extra-head function
  // groups and bundled ROS heads require selection-aware allocation before release.
  if (full && ["head-type", "head-function"].includes(group.id)
    && ["movable jaw ros", "ros", "ros upgrade", "ros max upgrade"].includes(value)
    && limitedGroup(context, group.id, (g) => /head.*(type|function)/i.test(g.id)
      || g.options.some((o) => /\bros\b/i.test(o.label)))) {
    percentage = 100; single = true;
  }
  if (kind === "se-silicone-pro-full-body" && ["head-type", "head-function"].includes(group.id)
    && ["ros", "realistic oral structure", "movable jaw ros"].includes(value)
    && limitedGroup(context, group.id, (g) => /head.*(type|function)/i.test(g.id))) {
    percentage = 100; single = true;
  }
  if (kind === "se-silicone-pro-full-body" && ["fingers", "finger-options"].includes(group.id)
    && ["articulated fingers", "ultra flex fingers"].includes(value)
    && limitedGroup(context, group.id, (g) => g.options.some((o) => /articulated|ultra.flex/i.test(o.label)))) {
    percentage = 100; single = true;
  }
  if (kind === "real-lady-silicone-full-body" && group.id === "sway-pivot-adaptor"
    && value === "sway pivot adaptor" && limitedGroup(context, group.id, (g) => g.options.some((o) => /sway.*pivot/i.test(o.label)))) {
    percentage = 100; single = true;
  }
  if (commonGroups.has(group.id)) {
    if (kind === "se-tpe-full-body" && tpeFree.has(value)) percentage = 100;
    if (kind === "se-silicone-pro-full-body" && (siliconeFree.has(value) || value === "soft belly" && softBelly(offer.facts))) percentage = 100;
    if (kind === "irontech-silicone-full-body" && ironFree.has(value)) percentage = 100;
    if (kind === "real-lady-silicone-full-body" && realFree.has(value)) percentage = 100;
    if (value === "gel" && group.id === "breast-options" && kind !== "se-silicone-torso" && kind !== "real-lady-head-talkx-only" && kind !== 'irontech-head-talkx-only') percentage = 100;
    // Presence alone is not production compatibility evidence for conditional toes.
    if (kind === "irontech-silicone-full-body" && value === "toe joints" && option.factoryExists === true) percentage = 100;
  }
  if (kind === "se-silicone-pro-full-body" || kind === "se-silicone-torso") {
    if (commonGroups.has(group.id) && option.id === "gel-butt-free" && value === "gel butt") percentage = 50;
    if (kind === "se-silicone-pro-full-body" && commonGroups.has(group.id)) {
      if (option.id === "master-body-makeup" && value === "master body makeup") percentage = 10;
      if (option.id === "real-skin-texture" && value === "real skin texture") percentage = 50;
    }
    // Movable eyelids need the selected ROS head, not a ROS word in the PDP title.
    if (commonGroups.has(group.id) && option.id === "movable-eyelids" && value === "movable eyelids"
      && option.factoryExists === true && selectedRosHead(context)) percentage = 30;
  }
  if (!percentage) return null;
  return { displayDelta: Math.round(option.priceDelta! * (100 - percentage)) / 100, label: offer.label, single, percentage };
}

export const OCTOBER_PAID_OPTION_RELEASE_HOLD =
  "SE partial discounts require exact parent/group/choice/currency/unitAmount bindings and live checkout validation.";

export function octoberOptionAdjustment(product: OctoberProduct, group: Pick<CustomizationGroup, "id" | "label">,
  option: CustomizationOption, now = new Date(), context?: OctoberPricingContext) {
  const offer = octoberOfferForProduct(product, now);
  if (offer?.kind === 'se-tpe-full-body' && Object.hasOwn(seOctoberReviewed.lightweight, product.handle)
    && group.id === 'body-weight' && group.label === 'Body Weight' && option.id === 'lstpe-lightweight'
    && option.label === 'LSTPE Lightweight Upgrade' && option.priceDelta === 100 && safeOption(option)) {
    return {displayDelta:90,label:offer.label,single:false,percentage:10};
  }
  const candidate = octoberCandidateOptionAdjustment(product, group, option, now, context);
  const approved = (seOctoberReviewed.paid as Record<string, Array<{groupId:string;groupLabel:string;optionId:string;label:string;catalog:number;promo:number}>>)[product.handle];
  if (candidate && approved?.some(row => row.groupId === group.id && row.groupLabel === group.label
    && row.optionId === option.id && row.label === option.label && row.catalog === option.priceDelta
    && row.promo === candidate.displayDelta)) return candidate;
  // No fallback charge or second reduction of already-discounted catalog amounts.
  // Keep every paid option at its current amount until its named charge is released.
  return candidate?.percentage === 100 ? candidate : null;
}

/** Customer copy is a projection of supported adjustments, not the factory list. */
export function octoberSupportedBenefits(product: OctoberProduct, context: OctoberPricingContext, now: Date) {
  const benefits = new Set<string>();
  for (const group of context.config.groups) {
    const exclusiveLabels: string[] = [];
    for (const option of group.options) {
      const adjustment = octoberOptionAdjustment(product, group, option, now, context);
      if (!adjustment || getOptionConflict(context.config, context.selections ?? {}, group.id, option.id)) continue;
      const label = option.label.replace(/\s*\(FREE\)/gi, "").trim();
      if (group.id === "add-extra-head") benefits.add("One additional silicone head from the eligible choices");
      else if (adjustment.single) exclusiveLabels.push(label);
      else if (/talkx/i.test(option.id)) benefits.add("IronAI TalkX box + 60 minutes included");
      else benefits.add(adjustment.percentage === 100 ? `${label} included` : `${adjustment.percentage}% off ${label}`);
    }
    if (exclusiveLabels.length) benefits.add(`One ${group.label.toLowerCase()} choice included: ${exclusiveLabels.join(" or ")}`);
  }
  return [...benefits];
}

export function seOctoberLightweightStatus(facts: OctoberProductFacts, now = new Date()) {
  return {
    eligible: seLightweightCandidate(facts),
    launchPromotionActive: octoberCampaignDay(now) >= "2026-10-01" && octoberCampaignDay(now) <= "2026-10-31",
    supplierSurchargeUSD: SE_LIGHTWEIGHT_DRAFT.supplierSurchargeUSD,
    suggestedMinimumRetailSurchargeUSD: SE_LIGHTWEIGHT_DRAFT.suggestedMinimumRetailSurchargeUSD,
    siliconeHeadRetailSurchargeUSD: SE_LIGHTWEIGHT_DRAFT.siliconeHeadRetailSurchargeUSD,
    combinedRetailSurchargeUSD: SE_LIGHTWEIGHT_DRAFT.combinedRetailSurchargeUSD,
    upgradesChargedSeparately: SE_LIGHTWEIGHT_DRAFT.upgradesChargedSeparately,
    octoberSupplierSurchargeUSD: SE_LIGHTWEIGHT_DRAFT.octoberSupplierSurchargeUSD,
    octoberRetailSurchargeUSD: SE_LIGHTWEIGHT_DRAFT.octoberRetailSurchargeUSD,
    octoberCombinedRetailSurchargeUSD: SE_LIGHTWEIGHT_DRAFT.octoberCombinedRetailSurchargeUSD,
    // Factory DOCX interpretation: docs/catalog/catalog-ops-five-updates-2026-09-30.md, lines 7/17.
    discountScope: "upgrade-surcharge" as const,
    chargeReady: false as const,
    unresolved: [
      "Exact eligible product menu, named checkout charge and automatic expiry verification"
    ]
  };
}

export function realLadyOctoberGifts(facts: OctoberProductFacts, now: Date, orderUSD?: number) {
  const kind = octoberOfferCandidate(facts, octoberCampaignDay(now));
  if (kind === "real-lady-silicone-full-body") return { items: OCTOBER_OPTION_RULES.realLady.fullBodyGifts, whileSuppliesLast: true };
  if (facts.brand === "real-lady" && facts.material === "silicone" && facts.fulfillment === "custom"
    && ["head", "torso"].includes(facts.form)
    && inFactoryDateWindow(octoberCampaignDay(now), "2026-10-05", "2026-11-05")
    && typeof orderUSD === "number" && Number.isFinite(orderUSD) && orderUSD > 100)
    return { items: OCTOBER_OPTION_RULES.realLady.nonFullBodyGifts, whileSuppliesLast: true };
  return null;
}
