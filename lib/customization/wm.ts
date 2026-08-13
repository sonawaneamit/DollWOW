import type { Product } from "@/types/product";
import type { CustomizationGroup, CustomizationOption } from "@/types/customization";
import { WM_SILICONE_HEADS, WM_STANDARD_TPE_HEADS } from "@/lib/customization/wm-heads";

export const WM_TPE_EXTRA_HEAD_PRICE = 299;
export const WM_SILICONE_EXTRA_HEAD_PRICE = 650;

const WM_INCLUDED_IMAGE_GROUPS = [
  "material", "skin tone", "hairstyle", "eye color", "enhanced mouth add-on",
  "lip finish", "nail color", "toe nail color", "breast options", "nipple color",
  "areola size", "vagina color", "vagina type", "pubic hair", "standing feet"
] as const;

const WM_VISUALIZER_GROUPS = /^(skin tone|hairstyle|hair color|eye color|lip finish|lipstick color|nail color|toe nail color|nipple color|areola size|vagina color|vagina hair type|pubic hair)$/;
const WM_AS_SHOWN_LABEL = "As shown in product photos";

const HEAD_GROUP = /^(a head|an extra (free )?head|get an extra (free )?head|choose a head|included extra head|add extra head)$/i;
const EXTRA_HEAD_DEPENDENCY = /for extra head/i;

/** Normalize WM dealer data into a checkout-safe, brand-aware configuration. */
export function getWmCustomizationGroups(product: Product, importedGroups?: CustomizationGroup[]) {
  if (!importedGroups?.length) return [];

  const specialFamily = isSpecialHeadFamily(product);
  const importedHead = importedGroups.find((group) => /^(a head|choose a head)$/i.test(group.label));
  const importedExtraHead = importedGroups.find((group) => /^(an extra head|add extra head)$/i.test(group.label));
  const primaryHeadOptions = importedHead?.options.filter((option) => !isPlaceholder(option)) ?? [];
  const verifiedExtraHeadOptions = importedExtraHead?.options.filter((option) => !isPlaceholder(option)) ?? [];
  const standardTpe = !specialFamily && isStandardTpeBuild(product, importedGroups);
  const siliconeHeadTpe = isSiliconeHeadTpeBuild(product, importedGroups);
  const chosenOptions = siliconeHeadTpe
    ? WM_SILICONE_HEADS
    : standardTpe
    ? WM_STANDARD_TPE_HEADS
    : primaryHeadOptions.length
      ? normalizeProductHeadOptions(primaryHeadOptions, 0)
      : normalizeIncludedReplacementOptions(verifiedExtraHeadOptions);
  const chooseHead = buildChooseHead(chosenOptions);
  const includedExtraHead = standardTpe
    ? buildIncludedExtraHead(WM_STANDARD_TPE_HEADS)
    : siliconeHeadTpe
      ? buildIncludedExtraHead(WM_SILICONE_HEADS)
      : buildVerifiedIncludedExtraHead(importedGroups, {
          allowPricedSourceOptions: isCustomFullSiliconeBuild(product),
        });
  const extraHead = siliconeHeadTpe
    ? buildExtraHead(WM_SILICONE_HEADS, WM_SILICONE_EXTRA_HEAD_PRICE)
    : standardTpe
    ? buildExtraHead(WM_STANDARD_TPE_HEADS, WM_TPE_EXTRA_HEAD_PRICE)
    : buildVerifiedProductExtraHead(importedGroups);

  const groups = importedGroups
    .filter((group) => !HEAD_GROUP.test(group.label))
    .filter((group) => !EXTRA_HEAD_DEPENDENCY.test(group.label))
    .map((group) => normalizeWmGroup(product, group))
    .filter((group) => group.options.length >= 2);

  return mergeGroups([
    ...(chooseHead ? [chooseHead] : []),
    ...groups,
    ...(includedExtraHead ? [includedExtraHead] : []),
    ...(extraHead ? [extraHead] : [])
  ]);
}

function buildIncludedExtraHead(options: CustomizationOption[]): CustomizationGroup | undefined {
  if (!options.length) return undefined;
  return {
    id: "included-extra-head",
    label: "Included Extra Head",
    description: "Current WM promotion: choose one compatible extra head at no additional charge. This is separate from paid additional heads.",
    selectionMode: "single",
    display: "swatches",
    options: [
      { id: "none", label: "No included extra head", priceDelta: 0, priceVerified: true, purchasable: true },
      ...options.map((option) => ({
        ...option,
        id: `included-extra-${option.id}`,
        priceDelta: 0,
        priceVerified: true,
        purchasable: true,
        visualizable: false,
      })),
    ],
  };
}

function buildVerifiedIncludedExtraHead(
  groups: CustomizationGroup[],
  { allowPricedSourceOptions = false }: { allowPricedSourceOptions?: boolean } = {},
) {
  const source = groups.find((group) => /^(an extra free head|get an extra free head)$/i.test(group.label)) ??
    groups.find((group) => /^included extra head$/i.test(group.label)) ??
    (allowPricedSourceOptions
      ? groups.find((group) => /^(an extra head|add extra head)$/i.test(group.label))
      : undefined);
  if (!source) return undefined;
  const options = source.options.filter((option) => !isPlaceholder(option) && option.swatch?.kind === "image");
  return buildIncludedExtraHead(options);
}

function buildChooseHead(options: CustomizationOption[]): CustomizationGroup | undefined {
  if (!options.length) return undefined;
  return {
    id: "choose-head",
    label: "Choose a Head",
    description: "Choose one compatible WM head. Standard head switches are included; any verified material or special-head surcharge appears here.",
    required: true,
    selectionMode: "single",
    display: "swatches",
    options: [
      asShownOption("head", undefined),
      ...options.map((option) => ({
        ...option,
        priceDelta: option.priceDelta ?? 0,
        priceVerified: true,
        purchasable: true,
        visualizable: option.swatch?.kind === "image",
      }))
    ]
  };
}

function buildExtraHead(options: CustomizationOption[], price: number): CustomizationGroup | undefined {
  if (!options.length) return undefined;
  return {
    id: "add-extra-head",
    label: "Add Extra Head",
    description: "Optional paid add-on. Every selected head is charged separately; select more than one distinct head if needed.",
    selectionMode: "multiple",
    display: "swatches",
    options: [
      { id: "none", label: "No extra head", priceDelta: 0, priceVerified: true, purchasable: true },
      ...options.map((option) => ({
        ...option,
        id: `extra-${option.id}`,
        priceDelta: price,
        priceVerified: true,
        purchasable: true,
        visualizable: false
      }))
    ]
  };
}

function buildVerifiedProductExtraHead(groups: CustomizationGroup[]) {
  const source = groups.find((group) => /^(an extra head|add extra head)$/i.test(group.label));
  if (!source) return undefined;
  const priced = source.options.filter((option) => !isPlaceholder(option) && typeof option.priceDelta === "number" && option.priceDelta > 0);
  if (!priced.length) return undefined;
  return {
    id: "add-extra-head",
    label: "Add Extra Head",
    description: "Optional paid add-on. Every selected head is charged separately; select more than one distinct head if needed.",
    selectionMode: "multiple" as const,
    display: "swatches" as const,
    options: [
      { id: "none", label: "No extra head", priceDelta: 0, priceVerified: true, purchasable: true },
      ...priced.map((option) => ({
        ...option,
        id: `extra-${option.id}`,
        priceVerified: true,
        purchasable: true,
        visualizable: false
      }))
    ]
  };
}

function normalizeIncludedReplacementOptions(options: CustomizationOption[]) {
  return options
    .filter((option) => Boolean(option.swatch?.kind === "image" && /^https?:\/\//i.test(option.swatch.value)))
    .map((option) => ({
      ...option,
      id: `current-${option.id}`,
      priceDelta: 0,
      priceVerified: true,
      purchasable: true,
      visualizable: false
    }));
}

function normalizeProductHeadOptions(options: CustomizationOption[], fallback: number) {
  return options.map((option) => ({
    ...option,
    id: `current-${option.id}`,
    priceDelta: option.priceDelta ?? fallback,
    priceVerified: option.priceDelta !== undefined || fallback === 0,
    purchasable: option.priceDelta !== undefined || fallback === 0,
    visualizable: false
  }));
}

function normalizeWmGroup(product: Product, group: CustomizationGroup): CustomizationGroup {
  const label = group.label.trim().toLowerCase();
  const multiple = group.selectionMode === "multiple" || /multiple|accessories|add-ons?|lingerie/i.test(group.label);
  const options = group.options.map((option) => normalizeWmOption(label, option));
  const hasNeutralDefault = options.some(isNeutralDefault);
  const normalizedOptions = hasNeutralDefault
    ? options
    : multiple
      ? [noAddOnOption(group.id), ...options]
      : [asShownOption(group.id, product.featuredImage?.url), ...options];
  return {
    ...group,
    selectionMode: multiple ? "multiple" : "single",
    required: multiple ? false : group.required,
    options: normalizedOptions,
  };
}

function asShownOption(groupId: string, imageUrl?: string): CustomizationOption {
  return {
    id: `as-shown-${groupId}`,
    label: WM_AS_SHOWN_LABEL,
    description: "Keep this feature exactly as shown in the product photos.",
    priceDelta: 0,
    priceVerified: true,
    purchasable: true,
    visualizable: false,
    productionNote: "Use the photographed product configuration for this feature.",
    swatch: imageUrl ? {
      kind: "image",
      value: imageUrl,
      label: WM_AS_SHOWN_LABEL,
    } : undefined,
  };
}

function noAddOnOption(groupId: string): CustomizationOption {
  return {
    id: `no-add-on-${groupId}`,
    label: "No add-on",
    description: "Do not add an option from this group.",
    priceDelta: 0,
    priceVerified: true,
    purchasable: true,
    visualizable: false,
    productionNote: "No paid add-on selected.",
  };
}

function normalizeWmOption(groupLabel: string, option: CustomizationOption): CustomizationOption {
  let priceDelta = option.priceDelta;
  if (priceDelta === undefined && isDefaultOrFree(option)) priceDelta = 0;
  if (priceDelta === undefined && isIncludedImageOption(groupLabel, option)) priceDelta = 0;
  const verified = priceDelta !== undefined;
  return {
    ...option,
    priceDelta,
    priceVerified: verified,
    purchasable: verified,
    visualizable: Boolean(option.swatch?.kind === "image") && WM_VISUALIZER_GROUPS.test(groupLabel)
  };
}

function isIncludedImageOption(groupLabel: string, option: CustomizationOption) {
  return WM_INCLUDED_IMAGE_GROUPS.includes(groupLabel as (typeof WM_INCLUDED_IMAGE_GROUPS)[number]) &&
    option.swatch?.kind === "image" && /^https?:\/\//i.test(option.swatch.value);
}

function isDefaultOrFree(option: Pick<CustomizationOption, "label" | "productionNote">) {
  return /\bfree\b|^(factory default|no change|no add-on|no thanks|none|standard|regular|as shown|as shown in product photos)$/i.test(option.label) ||
    /default supplier selection|no paid add-on/i.test(option.productionNote || "");
}

function isNeutralDefault(option: Pick<CustomizationOption, "label" | "productionNote">) {
  return /^(factory default|no change|no add-on|no thanks|none|standard|regular|as shown|as shown in product photos|same as (?:the )?(?:website )?(?:picture|photo))$/i.test(option.label.trim()) ||
    /default supplier selection|no paid add-on|photographed product configuration/i.test(option.productionNote || "");
}

function isStandardTpeBuild(product: Product, groups: CustomizationGroup[]) {
  const text = productIdentity(product);
  return /\btpe\b/.test(text) && !isReadyStockUnit(product) &&
    !/silicone head|hybrid|pvc|anime|\bmale\b|\bman\b/.test(text) &&
    groups.some((group) => /^(skin tone|hairstyle|eye color)$/i.test(group.label));
}

function isSiliconeHeadTpeBuild(product: Product, groups: CustomizationGroup[]) {
  const text = productIdentity(product);
  const importedMaterials = groups
    .filter((group) => /^material$/i.test(group.label))
    .flatMap((group) => group.options.map((option) => option.label))
    .join(" ")
    .toLowerCase();
  return /silicone head/.test(text) && !isReadyStockUnit(product) &&
    (/\btpe\b|s-tpe|hybrid/.test(text) || /\btpe\b|s-tpe/.test(importedMaterials)) &&
    !/pvc|anime|\bmale\b|\bman\b|torso|hips?/.test(text) &&
    groups.some((group) => /^(skin tone|hairstyle|eye color)$/i.test(group.label));
}

function isCustomFullSiliconeBuild(product: Product) {
  const text = productIdentity(product);
  return /silicone/.test(text) && !isReadyStockUnit(product) &&
    !/silicone head.*(?:tpe|s-tpe)|(?:tpe|s-tpe).*silicone head|hybrid|pvc|anime|\bmale\b|\bman\b|torso|hips?/.test(text);
}

function isReadyStockUnit(product: Product) {
  if (product.extended.stockStatus === "ready_to_ship") return true;
  return /\b(?:ready[- ]?to[- ]?ship|in[- ]?stock|warehouse)\b/.test(productIdentity(product));
}

function isSpecialHeadFamily(product: Product) {
  return /\b(pvc|anime|male|man|boy|silicone head|hybrid|head-only|head only|torso|hips?)\b/.test(productIdentity(product));
}

function productIdentity(product: Product) {
  return [product.title, product.handle, product.productType, product.extended.brand, product.extended.material, product.extended.bodyType, product.extended.sourceTitle, ...product.tags]
    .filter(Boolean).join(" ").toLowerCase();
}

function isPlaceholder(option: CustomizationOption) {
  return /^(factory default|no change|no add-on|no thanks|none|as shown|other head)$/i.test(option.label);
}

function mergeGroups(groups: CustomizationGroup[]) {
  const seen = new Map<string, CustomizationGroup>();
  for (const group of groups) {
    const key = group.label.trim().toLowerCase();
    if (!seen.has(key)) seen.set(key, group);
  }
  return [...seen.values()];
}
