import type { Product } from "@/types/product";
import type { CustomizationGroup, CustomizationOption } from "@/types/customization";

const DEALER_TPE_EXTRA_HEAD_PRICE = 375;
const DEALER_SILICONE_HEAD_PRICE = 299;
const DOLLWOW_IRONAI_PRICE = 119;

export type IrontechCustomizationProfile =
  | "female-tpe"
  | "female-silicone"
  | "female-hybrid"
  | "male"
  | "special";

const IRONTECH_INCLUDED_REFERENCE_GROUPS = [
  "skin tone",
  "eye color",
  "nail color",
  "toe nail color",
  "nipple color",
  "areola color",
  "areola size",
  "vagina color",
  "vagina texture",
  "hair color",
  "implanted hair color",
  "hair",
  "version",
  "breast options",
  "standing add-on",
  "penis"
] as const;

// Current comprehensive standard TPE-head library exposed by Rosemary's live
// Irontech configurator on 2026-08-13. Keep this separate from male, Oriental,
// robotic, and other special-series head families.
const IRONTECH_STANDARD_TPE_HEADS = [
  31, 32, 33, 34, 35, 36, 37, 38, 39,
  41, 42, 43, 44, 45, 46, 47, 48, 49,
  50, 51, 52, 53, 54, 55, 56, 57, 58, 59,
  60, 61, 62, 63, 64, 65, 66, 67, 68, 69,
  70, 71, 72, 73, 74, 76, 77, 78, 79, 81,
  82, 83, 85, 86, 87, 88, 89, 90, 91, 92,
  93, 95, 97, 98, 99, 101, 102
].map((head) => ({
  id: String(head),
  label: String(head),
  priceDelta: 0,
  priceVerified: true,
  purchasable: true,
  swatch: {
    kind: "image" as const,
    value: `https://www.rosemarydoll.com/wp-content/uploads/${head <= 88 ? "2021/05" : "2021/11"}/${head}.${head <= 88 ? "png" : "jpg"}`,
    label: `Irontech TPE head ${head}`
  }
} satisfies CustomizationOption));

const IRONTECH_STANDARD_SILICONE_HEADS = [
  ["S1", "2021/12/S1.jpg"], ["S2", "2022/03/Irontech-Silicone-Head-11.jpg"],
  ["S3", "2022/03/Irontech-Silicone-Head-13.jpg"], ["S4", "2021/12/S4-1.jpg"],
  ["S5", "2022/03/Irontech-Silicone-Head-25.jpg"], ["S6", "2022/03/Irontech-Silicone-Head-27.jpg"],
  ["S7", "2022/03/Irontech-Silicone-Head-37.jpg"], ["S8", "2022/03/Irontech-Silicone-Head-39.jpg"],
  ["S9", "2022/03/Irontech-Silicone-Head-41.jpg"], ["S10", "2022/03/Irontech-Silicone-Head-51.jpg"],
  ["S11", "2022/03/Irontech-Silicone-Head-53.jpg"], ["S12", "2022/03/Irontech-Silicone-Head-55.jpg"],
  ["S13", "2022/03/Irontech-Silicone-Head-65.jpg"], ["S14", "2022/03/Irontech-Silicone-Head-67.jpg"],
  ["S15", "2022/03/Irontech-Silicone-Head-69.jpg"], ["S16", "2022/03/Irontech-Silicone-Head-79.jpg"],
  ["S16-1", "2021/12/Irontech-S16.jpg"], ["S17", "2022/03/Irontech-Silicone-Head-81.jpg"],
  ["S18", "2022/03/Irontech-Silicone-Head-83.jpg"], ["S19", "2022/03/Irontech-Silicone-Head-93.jpg"],
  ["S20", "2022/03/Irontech-Silicone-Head-95.jpg"], ["S23", "2021/12/S23-1.jpg"],
  ["S24", "2021/12/Irontech-S24.jpg"], ["S26", "2021/12/S26.jpg"],
  ["S27", "2021/12/S27.jpg"], ["S28", "2021/12/S28-1.jpg"],
  ["S29", "2021/12/S29-1-300x300.jpg"], ["S30", "2021/12/S30-1-300x300.jpg"],
  ["S31", "2021/12/Irontech-S31.jpg"], ["S32", "2021/12/Irontech-S32.jpg"],
  ["S33", "2021/12/Irontech-S33.jpg"], ["S36", "2023/05/Irontech-S36.jpg"],
  ["S37", "2021/12/S37.jpg"], ["S40", "2023/05/Irontech-S40.jpg"],
  ["S43", "2021/12/Irontech-Doll-S43.jpg"], ["S47", "2021/12/Irontech-Doll-S47.jpg"],
  ["S48", "2021/12/Irontech-Doll-S48.jpg"]
].map(([head, path]) => ({
  id: head.toLowerCase(),
  label: head,
  priceDelta: 0,
  priceVerified: true,
  purchasable: true,
  swatch: {
    kind: "image" as const,
    value: `https://www.rosemarydoll.com/wp-content/uploads/${path}`,
    label: `Irontech silicone head ${head}`
  }
} satisfies CustomizationOption));

const removedHeadGroups = [
  /^an extra (free )?(tpe )?head$/i,
  /^an extra head$/i,
  /^your custom (tpe|silicone) head$/i,
  /^head$/i,
  /for extra head/i,
  /^custom options for extra head$/i
];

/**
 * Irontech's dealer forms mix valid factory options with dealer promotions.
 * Keep product-specific availability, but normalize the public checkout model:
 * one chosen head, separately priced additional heads, and no unpriced choices.
 */
export function getIrontechCustomizationGroups(product: Product, importedGroups?: CustomizationGroup[]) {
  const sourceGroups = importedGroups?.length ? importedGroups : irontechFamilyDefaults(product);
  if (!sourceGroups.length) return [];

  const chooseHead = buildChooseHeadGroup(product, sourceGroups);
  const extraHead = buildExtraHeadGroup(product, sourceGroups);
  const groups = sourceGroups
    .filter((group) => !removedHeadGroups.some((pattern) => pattern.test(group.label)))
    .filter((group) => !isMaterialHeadTypeGroup(group))
    .map((group) => ({
      ...group,
      options: group.options.filter((option) => !isExplicitIrontechUlwOption(group, option))
    }))
    .map(normalizeIrontechGroup)
    .filter((group) => group.options.length > 0);

  return mergeDuplicateGroups([
    ...(chooseHead ? [chooseHead] : []),
    ...groups,
    ...(extraHead ? [extraHead] : [])
  ]);
}

export function isExplicitIrontechUlwGroup(group: CustomizationGroup) {
  const identity = `${group.id} ${group.label}`.toLowerCase().replace(/[^a-z0-9]+/g, " ");
  return /\bbody weight\b|\bweight reduction\b/.test(identity);
}

export function isExplicitIrontechUlwOption(group: CustomizationGroup, option: CustomizationOption) {
  if (!isExplicitIrontechUlwGroup(group)) return false;
  const identity = `${option.id} ${option.label}`.toLowerCase().replace(/[^a-z0-9]+/g, " ");
  return /\bulw\b|\bultra lightweight\b|\bultra light (?:weight|version)\b/.test(identity);
}

export function getIrontechCustomizationProfile(product: Product): IrontechCustomizationProfile {
  const identity = [product.title, product.handle, product.productType, product.extended.material, product.extended.bodyType, ...product.tags]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (/\b(male|man)\b/.test(identity)) return "male";
  if (/\b(ironai|oriental|robot|torso|hips?|head only|head-only)\b/.test(identity)) return "special";
  if (/hybrid/.test(identity) || (/silicone/.test(identity) && /\btpe\b/.test(identity))) return "female-hybrid";
  if (/silicone/.test(identity)) return "female-silicone";
  if (/\btpe\b/.test(identity)) return "female-tpe";
  return "special";
}

function irontechFamilyDefaults(product: Product): CustomizationGroup[] {
  const profile = getIrontechCustomizationProfile(product);
  if (profile === "female-tpe") return [standardTpeHeadGroup()];
  if (profile === "female-silicone") return [standardSiliconeHeadGroup()];
  if (profile === "female-hybrid") return [standardTpeHeadGroup(), standardSiliconeHeadGroup()];
  // Male and special series need their own manufacturer-confirmed head family;
  // never leak the standard female library onto those products.
  return [];
}

function buildChooseHeadGroup(product: Product, groups: CustomizationGroup[]): CustomizationGroup | undefined {
  const tpe = comprehensiveTpeHeadGroup(groups);
  const importedSilicone = findGroup(groups, /^your custom silicone head$/i);
  const silicone = importedSilicone || (supportsStandardSiliconeHeadLibrary(product, groups) ? standardSiliconeHeadGroup() : undefined);
  const fixed = findGroup(groups, /^head$/i);
  const promotional = findGroup(groups, /^an extra free head$/i);
  const options = new Map<string, CustomizationOption>();

  options.set("factory-default", {
    id: "factory-default",
    label: "As shown",
    description: "Keep the head shown in the product photos.",
    priceDelta: 0,
    priceVerified: true,
    purchasable: true,
    dollVueEnabled: false
  });

  const add = (option: CustomizationOption, family: "TPE" | "Silicone" | "Current series", priceDelta: number) => {
    if (isHeadPlaceholder(option)) return;
    const id = `${family.toLowerCase().replace(/\s+/g, "-")}-${option.id}`;
    options.set(id, {
      ...option,
      id,
      label: family === "Current series" ? option.label : `${option.label} · ${family}`,
      description:
        family === "Silicone" && priceDelta > 0
          ? "Silicone-head material upgrade; the selected head identity itself has no switching fee."
          : "Head identity switch included with this build.",
      priceDelta,
      priceVerified: true,
      purchasable: true,
      dollVueEnabled: false
    });
  };

  tpe?.options.forEach((option) => add(option, "TPE", 0));
  const siliconeSwitchPrice = importedSilicone && tpe ? DEALER_SILICONE_HEAD_PRICE : 0;
  silicone?.options.forEach((option) => add(option, "Silicone", siliconeSwitchPrice));
  fixed?.options.forEach((option) => add(option, "Current series", 0));
  // Special named families (for example Oriental/ROS heads) are deliberately
  // kept product-bound instead of being replaced with the standard numeric
  // TPE library. They still belong in the one-head selector when offered.
  if (options.size === 1) promotional?.options.forEach((option) => add(option, "Current series", 0));
  if (options.size === 1) return undefined;

  return {
    id: "choose-head",
    label: "Choose a Head",
    description:
      "Choose one compatible Irontech head for this doll. Switching the head identity is included; a different head material or special construction shows its price here.",
    required: true,
    selectionMode: "single",
    display: "swatches",
    options: [...options.values()]
  };
}

function buildExtraHeadGroup(product: Product, groups: CustomizationGroup[]): CustomizationGroup | undefined {
  const tpe = comprehensiveTpeHeadGroup(groups);
  const silicone = findGroup(groups, /^your custom silicone head$/i) ||
    (supportsStandardSiliconeHeadLibrary(product, groups) ? standardSiliconeHeadGroup() : undefined);
  const promotional = findGroup(groups, /^an extra (free )?(tpe )?head$/i);
  const promotionalIsStandardTpe = Boolean(promotional && numericHeadRatio(promotional.options) >= 0.75);
  const priced = findGroup(groups, /^an extra head$/i);
  const options = new Map<string, CustomizationOption>();

  const add = (option: CustomizationOption, family: string, fallbackPrice: number) => {
    if (isHeadPlaceholder(option)) return;
    const normalizedId = `${family.toLowerCase().replace(/\s+/g, "-")}-${option.id}`;
    const current = options.get(normalizedId);
    const priceDelta = option.priceDelta && option.priceDelta > 0 ? option.priceDelta : fallbackPrice;
    const candidate: CustomizationOption = {
      ...option,
      id: normalizedId,
      label: family === "Current series" ? option.label : `${option.label} · ${family}`,
      description: "Additional head ordered with this doll. Select more than one distinct head if needed.",
      priceDelta,
      priceVerified: true,
      purchasable: true,
      dollVueEnabled: false
    };
    if (!current || priceDelta > (current.priceDelta ?? 0)) options.set(normalizedId, candidate);
  };

  tpe?.options.forEach((option) => add(option, "TPE", DEALER_TPE_EXTRA_HEAD_PRICE));
  silicone?.options.forEach((option) => add(option, "Silicone", DEALER_SILICONE_HEAD_PRICE));
  if (!promotionalIsStandardTpe) {
    promotional?.options.forEach((option) => add(option, "Current series", DEALER_TPE_EXTRA_HEAD_PRICE));
  }
  priced?.options.forEach((option) => add(option, "Current series", option.priceDelta ?? DEALER_SILICONE_HEAD_PRICE));
  if (!options.size) return undefined;

  return {
    id: "add-extra-head",
    label: "Add Extra Head",
    description:
      "Optional paid add-on. Each selected head is charged separately and matched to the doll's chosen skin tone where supported.",
    selectionMode: "multiple",
    display: "swatches",
    options: [{ id: "none", label: "No extra head", priceDelta: 0, priceVerified: true, purchasable: true }, ...options.values()]
  };
}

function normalizeIrontechGroup(group: CustomizationGroup): CustomizationGroup {
  const groupLabel = group.label.toLowerCase();
  const multiple = group.selectionMode === "multiple" || /\bmultiple\b|accessories/i.test(group.label);
  return {
    ...group,
    selectionMode: multiple ? "multiple" : "single",
    required: multiple ? false : group.required,
    options: group.options.map((option) => normalizeIrontechOption(groupLabel, option))
  };
}

function normalizeIrontechOption(groupLabel: string, option: CustomizationOption): CustomizationOption {
  const normalizedLabel = option.label.replace(/^Natrual\b/i, "Natural");
  const label = normalizedLabel.toLowerCase();
  let priceDelta = option.priceDelta;

  if (/hairstyle/.test(groupLabel)) {
    priceDelta = /implanted/.test(label) ? 199 : 0;
  } else if (/head type/.test(groupLabel)) {
    if (/ros max|movable jaw/.test(label)) priceDelta = 180;
    else if (/enhanced mouth/.test(label)) priceDelta = 30;
    else if (/hard silicone|soft silicone/.test(label)) priceDelta = 0;
  } else if (/premium head.*body|premium body/.test(groupLabel)) {
    if (/ironai/.test(label)) priceDelta = DOLLWOW_IRONAI_PRICE;
    else if (/oral heating|oral sex/.test(label)) priceDelta = 89;
    else if (/body heating|body moaning/.test(label)) priceDelta = 100;
    else if (/moles.*freckles/.test(label)) priceDelta = 30;
    else if (/facial freckles/.test(label)) priceDelta = 70;
    else if (/bikini line/.test(label)) priceDelta = 70;
    else if (/ultra soft thigh/.test(label)) priceDelta = 90;
    else if (/ultra soft belly/.test(label)) priceDelta = 60;
    else if (/ultra soft butt/.test(label)) priceDelta = 100;
  } else if (/makeup options/.test(groupLabel)) {
    if (/semi-permanent/.test(label)) priceDelta = 50;
    else if (/hyper-realism|s\+/.test(label)) priceDelta = 0;
  } else if (/robot options?/.test(groupLabel)) {
    if (/electric hip|auto blowjob/.test(label)) priceDelta = 250;
    else if (/auto vagina/.test(label)) priceDelta = 150;
  } else if (/vagina hair/.test(groupLabel) && !/no add-on|factory default/.test(label)) {
    priceDelta = 30;
  } else if (/hair implant add-on/.test(groupLabel)) {
    if (/moustache|goatee/.test(label)) priceDelta = 90;
    else if (/chest hair|arms hair|pubic hair|armpit hair/.test(label)) priceDelta = 70;
  }

  // Current Irontech dealer forms consistently include these appearance and
  // base-construction choices at no surcharge. This is deliberately a closed
  // allowlist: paid functions and accessories never inherit a zero price.
  if (priceDelta === undefined && isIncludedReferenceGroup(groupLabel, option)) priceDelta = 0;
  if (priceDelta === undefined && isIncludedDefault(option)) priceDelta = 0;
  const verified = priceDelta !== undefined;
  return {
    ...option,
    label: normalizedLabel,
    priceDelta,
    priceVerified: verified,
    purchasable: verified,
    dollVueEnabled: Boolean(option.swatch?.kind === "image") && isDollVueFriendlyOption(groupLabel, label)
  };
}

function isIncludedReferenceGroup(groupLabel: string, option: CustomizationOption) {
  if (!IRONTECH_INCLUDED_REFERENCE_GROUPS.includes(groupLabel as (typeof IRONTECH_INCLUDED_REFERENCE_GROUPS)[number])) return false;
  // Imported dealer options use remote supplier/dealer images. A local or
  // generated swatch is not enough evidence to infer that an option is free.
  return !option.swatch || /^https?:\/\//i.test(option.swatch.value);
}

function isDollVueFriendlyOption(groupLabel: string, optionLabel: string) {
  if (/^(skin tone|hairstyle|hair color|eye color|nail color|toe nail color|nipple color|areola color|vagina color|vagina hair|pubic hair)$/.test(groupLabel)) return true;
  if (/makeup options/.test(groupLabel)) return /makeup|painting|realism/i.test(optionLabel);
  if (/^premium\b/.test(groupLabel)) return /moles|freckles|bikini line/i.test(optionLabel);
  if (/hair implant add-on/.test(groupLabel)) return /moustache|goatee|chest hair|arms hair|pubic hair|armpit hair/i.test(optionLabel);
  return false;
}

function isIncludedDefault(option: Pick<CustomizationOption, "label" | "productionNote">) {
  return /\bfree\b|^(no add-on|no thanks|none|no change|factory default|default supplier selection|regular|standard)$/i.test(option.label) ||
    /default supplier selection|no paid add-on/i.test(option.productionNote || "");
}

function isHeadPlaceholder(option: CustomizationOption) {
  return /^(no add-on|no thanks|none|yes i need|factory default|other head)$/i.test(option.label);
}

function isMaterialHeadTypeGroup(group: CustomizationGroup) {
  return /head type/i.test(group.label) && group.options.some((option) => /^tpe head$/i.test(option.label));
}

function findGroup(groups: CustomizationGroup[], pattern: RegExp) {
  return groups.find((group) => pattern.test(group.label));
}

function comprehensiveTpeHeadGroup(groups: CustomizationGroup[]) {
  const explicit = findGroup(groups, /^your custom tpe head$/i);
  const promotional = findGroup(groups, /^an extra free head$/i);
  const supportsStandardTpe = Boolean(explicit) || Boolean(promotional && numericHeadRatio(promotional.options) >= 0.75);
  if (!supportsStandardTpe) return explicit;
  return {
    ...(explicit || promotional!),
    id: "irontech-standard-tpe-heads",
    label: "Your Custom TPE Head",
    options: IRONTECH_STANDARD_TPE_HEADS
  } satisfies CustomizationGroup;
}

function standardSiliconeHeadGroup(): CustomizationGroup {
  return {
    id: "irontech-standard-silicone-heads",
    label: "Your Custom Silicone Head",
    display: "swatches",
    options: IRONTECH_STANDARD_SILICONE_HEADS
  };
}

function standardTpeHeadGroup(): CustomizationGroup {
  return {
    id: "irontech-standard-tpe-heads",
    label: "Your Custom TPE Head",
    display: "swatches",
    options: IRONTECH_STANDARD_TPE_HEADS
  };
}

function supportsStandardSiliconeHeadLibrary(product: Product, groups: CustomizationGroup[]) {
  const identity = [product.title, product.handle, product.productType, product.extended.material, product.extended.bodyType, ...product.tags]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (/\b(male|man|ironai|oriental|robot|torso|hips?|head only|head-only)\b/.test(identity)) return false;
  const siliconeBuild = /silicone/.test(identity);
  const standardFemaleForm = groups.some((group) => /^(skin tone|hairstyle|breast options|vagina color)$/i.test(group.label));
  return siliconeBuild && standardFemaleForm;
}

function numericHeadRatio(options: CustomizationOption[]) {
  const candidates = options.filter((option) => !isHeadPlaceholder(option));
  if (!candidates.length) return 0;
  return candidates.filter((option) => /^\d+$/.test(option.label.trim())).length / candidates.length;
}

function mergeDuplicateGroups(groups: CustomizationGroup[]) {
  const merged = new Map<string, CustomizationGroup>();
  for (const group of groups) {
    const key = group.label.trim().toLowerCase();
    const current = merged.get(key);
    if (!current) {
      merged.set(key, group);
      continue;
    }
    const options = new Map(current.options.map((option) => [option.label.trim().toLowerCase(), option]));
    for (const option of group.options) {
      const optionKey = option.label.trim().toLowerCase();
      const existing = options.get(optionKey);
      if (!existing || optionScore(option) > optionScore(existing)) options.set(optionKey, option);
    }
    merged.set(key, {
      ...current,
      required: current.required || group.required,
      selectionMode: current.selectionMode === "multiple" || group.selectionMode === "multiple" ? "multiple" : "single",
      options: [...options.values()]
    });
  }
  return [...merged.values()];
}

function optionScore(option: CustomizationOption) {
  return Number(option.priceDelta !== undefined) * 4 + Number(option.swatch?.kind === "image") * 2 + Number(Boolean(option.description));
}
