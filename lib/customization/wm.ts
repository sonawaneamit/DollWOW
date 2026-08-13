import type { Product } from "@/types/product";
import type { CustomizationGroup, CustomizationOption } from "@/types/customization";

export const WM_TPE_EXTRA_HEAD_PRICE = 299;
export const WM_SILICONE_EXTRA_HEAD_PRICE = 650;

const WM_INCLUDED_IMAGE_GROUPS = [
  "material", "skin tone", "hairstyle", "eye color", "enhanced mouth add-on",
  "lip finish", "nail color", "toe nail color", "breast options", "nipple color",
  "areola size", "vagina color", "vagina type", "pubic hair", "standing feet"
] as const;

const WM_VISUALIZER_GROUPS = /^(skin tone|hairstyle|eye color|lip finish|nail color|toe nail color|nipple color|areola size|vagina color|pubic hair)$/;

// Image-backed standard TPE head catalog found in WM's current dealer form on
// 2026-08-13. It is deliberately not reused for silicone, PVC/anime, or male
// builds because those head connections and materials are different.
const WM_STANDARD_TPE_HEADS: CustomizationOption[] = [
  ["36", "2021/05/36-1.png"], ["56", "2021/05/56.jpeg"], ["70", "2021/05/70-1.png"],
  ["159", "2021/10/159.png"], ["162", "2021/10/162.png"], ["173", "2020/07/173.jpg"],
  ["198", "2021/05/198.jpeg"], ["203", "2020/07/203.jpg"], ["233", "2021/05/233-light-tan-1.png"],
  ["266", "2020/12/266.png"], ["273", "2020/12/273.webp"], ["302", "2021/05/302.png"],
  ["335", "2022/06/335.png"], ["368", "2021/05/368.png"], ["370", "2021/05/370.png"],
  ["382", "2020/12/382.png"], ["394", "2022/06/394.jpg"], ["398", "2021/06/398.jpg"],
  ["400", "2022/06/400.jpg"], ["406", "2022/06/406.jpg"], ["414", "2022/03/414.jpg"],
  ["418", "2021/11/418-1.jpg"]
].map(([head, path]) => ({
  id: `head-${head}`,
  label: `Head ${head} · TPE`,
  priceDelta: 0,
  priceVerified: true,
  purchasable: true,
  visualizable: false,
  swatch: {
    kind: "image",
    value: `https://www.rosemarydoll.com/wp-content/uploads/${path}`,
    label: `WM TPE head ${head}`
  }
}));

const HEAD_GROUP = /^(a head|an extra (free )?head|get an extra (free )?head|choose a head|add extra head)$/i;
const EXTRA_HEAD_DEPENDENCY = /for extra head/i;

/** Normalize WM dealer data into a checkout-safe, brand-aware configuration. */
export function getWmCustomizationGroups(product: Product, importedGroups?: CustomizationGroup[]) {
  if (!importedGroups?.length) return [];

  const specialFamily = isSpecialHeadFamily(product);
  const importedHead = importedGroups.find((group) => /^a head$/i.test(group.label));
  const productHeadOptions = importedHead?.options.filter((option) => !isPlaceholder(option)) ?? [];
  const standardTpe = !specialFamily && isStandardTpeBuild(product, importedGroups);
  const chosenOptions = standardTpe ? WM_STANDARD_TPE_HEADS : normalizeProductHeadOptions(productHeadOptions, 0);
  const chooseHead = buildChooseHead(chosenOptions);
  const extraHead = standardTpe
    ? buildExtraHead(WM_STANDARD_TPE_HEADS, WM_TPE_EXTRA_HEAD_PRICE)
    : buildVerifiedProductExtraHead(importedGroups);

  const groups = importedGroups
    .filter((group) => !HEAD_GROUP.test(group.label))
    .filter((group) => !EXTRA_HEAD_DEPENDENCY.test(group.label))
    .map(normalizeWmGroup)
    .filter((group) => group.options.length >= 2);

  return mergeGroups([
    ...(chooseHead ? [chooseHead] : []),
    ...groups,
    ...(extraHead ? [extraHead] : [])
  ]);
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
      { id: "factory-default", label: "As shown", description: "Keep the head shown in the product photos.", priceDelta: 0, priceVerified: true, purchasable: true, visualizable: false },
      ...options.map((option) => ({ ...option, priceDelta: option.priceDelta ?? 0, priceVerified: true, purchasable: true, visualizable: false }))
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
  return buildExtraHead(priced, 0);
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

function normalizeWmGroup(group: CustomizationGroup): CustomizationGroup {
  const label = group.label.trim().toLowerCase();
  const multiple = group.selectionMode === "multiple" || /multiple|accessories|add-ons?|lingerie/i.test(group.label);
  return {
    ...group,
    selectionMode: multiple ? "multiple" : "single",
    required: multiple ? false : group.required,
    options: group.options.map((option) => normalizeWmOption(label, option))
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
  return /\bfree\b|^(factory default|no change|no add-on|no thanks|none|standard|regular|as shown)$/i.test(option.label) ||
    /default supplier selection|no paid add-on/i.test(option.productionNote || "");
}

function isStandardTpeBuild(product: Product, groups: CustomizationGroup[]) {
  const text = productIdentity(product);
  return /\btpe\b/.test(text) && !/silicone head|hybrid|pvc|anime|\bmale\b|\bman\b/.test(text) &&
    groups.some((group) => /^(skin tone|hairstyle|eye color)$/i.test(group.label));
}

function isSpecialHeadFamily(product: Product) {
  return /\b(pvc|anime|male|man|boy|silicone head|hybrid|head-only|head only|torso|hips?)\b/.test(productIdentity(product));
}

function productIdentity(product: Product) {
  return [product.title, product.handle, product.productType, product.extended.brand, product.extended.material, product.extended.bodyType, product.extended.sourceTitle, ...product.tags]
    .filter(Boolean).join(" ").toLowerCase();
}

function isPlaceholder(option: CustomizationOption) {
  return /^(factory default|no change|no add-on|no thanks|none|as shown)$/i.test(option.label);
}

function mergeGroups(groups: CustomizationGroup[]) {
  const seen = new Map<string, CustomizationGroup>();
  for (const group of groups) {
    const key = group.label.trim().toLowerCase();
    if (!seen.has(key)) seen.set(key, group);
  }
  return [...seen.values()];
}
