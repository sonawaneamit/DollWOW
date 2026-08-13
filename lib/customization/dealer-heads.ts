import type { Product } from "@/types/product";
import type { CustomizationGroup, CustomizationOption } from "@/types/customization";

type DealerHeadPolicy = {
  chooseDescription: string;
  extraDescription: string;
  freeHeadLibraryMode?: "replacement" | "included-extra";
  /** Offer the same compatible library as both an included switch and one free promotional extra head. */
  freeExtraAlongsideReplacement?: boolean;
  includedExtraDescription?: string;
  additionalHeadOptions?: CustomizationOption[];
  /** Use a reviewed external library as the complete customer-facing head set. */
  authoritativeHeadOptions?: CustomizationOption[];
  /** Limit a free-extra promotion to the choices explicitly verified by its source. */
  includedExtraOptions?: CustomizationOption[];
  fallbackExtraPrice?: number;
  fallbackExtraPriceApplies?: (product: Product) => boolean;
};

const HEAD_LIBRARY = /^(an extra free head|choose a head|head)$/i;
const PAID_EXTRA_HEAD = /^(an extra head|add extra head)$/i;
const HEAD_DEPENDENCY = /for extra head/i;
const VISUAL_GROUP = /^(skin tone|hair(?:style| type| color)|eye color|lipstick color|lip color|lip finish|nail color|toe nail color|nipple color|areola color|areola size|vagina color|vagina hair type|pubic hair type|makeup options?|finishing details?|body makeup)$/i;

/**
 * Dealer forms often call a compatible head library an "extra free head".
 * Preserve that literal promotion where it is offered; otherwise expose an
 * ordinary included head switch. Paid additional heads always remain a
 * separate multi-select purchase.
 */
export function normalizeDealerHeadGroups(
  product: Product,
  importedGroups: CustomizationGroup[],
  policy: DealerHeadPolicy
) {
  const sourceLibrary = mostCompleteHeadLibrary(importedGroups);
  const libraryOptions = policy.authoritativeHeadOptions
    ? mergeHeadOptions([], policy.authoritativeHeadOptions)
    : mergeHeadOptions(sourceLibrary?.options ?? [], policy.additionalHeadOptions ?? []);
  const includedExtraOptions = policy.includedExtraOptions
    ? mergeHeadOptions([], policy.includedExtraOptions)
    : libraryOptions;
  const paidSource = importedGroups.find((group) => PAID_EXTRA_HEAD.test(group.label));
  const hasIncludedExtra = policy.freeHeadLibraryMode === "included-extra" || policy.freeExtraAlongsideReplacement;
  const includedExtra = includedExtraOptions.length && hasIncludedExtra
    ? buildIncludedExtraHead(includedExtraOptions, policy.includedExtraDescription ?? "Choose one included additional head where this product promotion offers one.")
    : undefined;
  const chooseHead = libraryOptions.length && (!includedExtra || policy.freeExtraAlongsideReplacement)
    ? buildChooseHead(libraryOptions, policy.chooseDescription)
    : undefined;
  const extraHead = buildExtraHead(product, includedExtra ? [] : libraryOptions, paidSource, policy);

  const groups = importedGroups
    .filter((group) => !HEAD_LIBRARY.test(group.label))
    .filter((group) => !PAID_EXTRA_HEAD.test(group.label))
    .filter((group) => !HEAD_DEPENDENCY.test(group.label))
    .map(normalizeDealerGroup)
    .filter((group) => group.options.length >= 2);

  return [
    ...(chooseHead ? [chooseHead] : []),
    ...(includedExtra ? [includedExtra] : []),
    ...groups,
    ...(extraHead ? [extraHead] : [])
  ];
}

function buildIncludedExtraHead(options: CustomizationOption[], description: string): CustomizationGroup | undefined {
  if (!options.length) return undefined;
  return {
    id: "included-extra-head",
    label: "Included Extra Head",
    description,
    required: false,
    selectionMode: "single",
    display: "swatches",
    options: [
      { id: "none", label: "No extra head", priceDelta: 0, priceVerified: true, purchasable: true },
      ...options.map((option) => ({
        ...option,
        id: `included-extra-${option.id}`,
        priceDelta: 0,
        priceVerified: true,
        purchasable: true,
        visualizable: false
      }))
    ]
  };
}

function mostCompleteHeadLibrary(groups: CustomizationGroup[]) {
  return groups
    .filter((group) => HEAD_LIBRARY.test(group.label))
    .map((group) => ({ ...group, options: usableHeadOptions(group.options) }))
    .filter((group) => group.options.length >= 2)
    .sort((left, right) => right.options.length - left.options.length)[0];
}

function buildChooseHead(options: CustomizationOption[], description: string): CustomizationGroup | undefined {
  if (!options.length) return undefined;
  return {
    id: "choose-head",
    label: "Choose a Head",
    description,
    required: true,
    selectionMode: "single",
    display: "swatches",
    options: [
      {
        id: "factory-default",
        label: "As shown",
        description: "Keep the head shown in the product photos.",
        priceDelta: 0,
        priceVerified: true,
        purchasable: true,
        visualizable: false
      },
      ...options.map((option) => ({
        ...option,
        id: `choose-${option.id}`,
        // Ordinary identity switches are included. Preserve a verified source
        // surcharge when the supplier marks a special head as a paid upgrade.
        priceDelta: positivePrice(option.priceDelta) ?? 0,
        priceVerified: true,
        purchasable: true,
        // Head replacement needs a dedicated identity-preserving Visualizer
        // module. Keep the photo ready without exposing it prematurely.
        visualizable: false
      }))
    ]
  };
}

function buildExtraHead(
  product: Product,
  library: CustomizationOption[],
  paidSource: CustomizationGroup | undefined,
  policy: DealerHeadPolicy
): CustomizationGroup | undefined {
  const sourceOptions = usableHeadOptions(paidSource?.options ?? []);
  const fallbackAllowed = policy.fallbackExtraPrice !== undefined &&
    (!policy.fallbackExtraPriceApplies || policy.fallbackExtraPriceApplies(product));
  const options = sourceOptions.length ? sourceOptions : fallbackAllowed ? library : [];
  if (!options.length) return undefined;

  const normalized = options.flatMap((option) => {
    const price = positivePrice(option.priceDelta) ?? (fallbackAllowed ? policy.fallbackExtraPrice : undefined);
    if (price === undefined) return [];
    return [{
      ...option,
      id: `extra-${option.id}`,
      priceDelta: price,
      priceVerified: true,
      purchasable: true,
      visualizable: false
    }];
  });
  if (!normalized.length) return undefined;

  return {
    id: "add-extra-head",
    label: "Add Extra Head",
    description: policy.extraDescription,
    selectionMode: "multiple",
    display: "swatches",
    options: [
      { id: "none", label: "No extra head", priceDelta: 0, priceVerified: true, purchasable: true },
      ...dedupeOptions(normalized)
    ]
  };
}

function normalizeDealerGroup(group: CustomizationGroup): CustomizationGroup {
  const multiple = group.selectionMode === "multiple" || /multiple|accessories|add-ons?|lingerie/i.test(group.label);
  return {
    ...group,
    selectionMode: multiple ? "multiple" : "single",
    required: multiple ? false : group.required,
    options: group.options.map((option) => {
      const priceDelta = option.priceDelta ?? (isDefaultOrFree(option) ? 0 : undefined);
      return {
        ...option,
        priceDelta,
        priceVerified: priceDelta !== undefined,
        purchasable: priceDelta !== undefined,
        visualizable: Boolean(option.swatch?.kind === "image") && VISUAL_GROUP.test(group.label)
      };
    })
  };
}

function usableHeadOptions(options: CustomizationOption[]) {
  return dedupeOptions(options.filter((option) => !isPlaceholder(option) && option.swatch?.kind === "image"));
}

function dedupeOptions(options: CustomizationOption[]) {
  const seen = new Map<string, CustomizationOption>();
  for (const option of options) {
    const key = option.label.trim().toLowerCase();
    if (!seen.has(key)) seen.set(key, option);
  }
  return [...seen.values()];
}

function mergeHeadOptions(source: CustomizationOption[], additional: CustomizationOption[]) {
  const merged = new Map<string, CustomizationOption>();
  for (const option of [...source, ...additional]) {
    if (isPlaceholder(option) || option.swatch?.kind !== "image") continue;
    const key = headIdentity(option.label);
    const existing = merged.get(key);
    // Prefer the option carrying the stronger visual reference while retaining
    // a verified source surcharge for genuinely special replacement heads.
    if (!existing || (!existing.swatch && option.swatch)) {
      merged.set(key, option);
    }
  }
  return [...merged.values()];
}

function headIdentity(label: string) {
  const normalized = label.trim().toUpperCase();
  const primaryCode = normalized.match(/\b(?:LS\d+(?:-\d+)?|SS\d+)\b/)?.[0];
  // The same sculpt code can be offered as both a standard silicone head and
  // an ROS head. Keep those as separate, truthful customer choices rather
  // than collapsing them merely because the identity code matches.
  const construction = normalized.startsWith("ROS SILICONE")
    ? "ros"
    : normalized.startsWith("STANDARD SILICONE")
      ? "standard"
      : "unspecified";
  return `${construction}:${primaryCode ?? normalized.toLowerCase()}`;
}

function positivePrice(value: number | undefined) {
  return typeof value === "number" && value > 0 ? value : undefined;
}

function isDefaultOrFree(option: Pick<CustomizationOption, "label" | "productionNote">) {
  return /\bfree\b|^(factory default|no change|no add-on|no thanks|none|standard|regular|as shown)$/i.test(option.label) ||
    /default supplier selection|no paid add-on/i.test(option.productionNote || "");
}

function isPlaceholder(option: CustomizationOption) {
  return /^(factory default|no change|no add-on|no thanks|none|as shown|other head|yes(?:,? i)? need(?: it)?(?: \(free\))?)$/i.test(option.label);
}
