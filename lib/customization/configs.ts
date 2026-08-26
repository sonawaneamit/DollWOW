import type { Product } from "@/types/product";
import type { BrandCustomizationConfig, CustomizationGroup, CustomizationOption, CustomizationRule } from "@/types/customization";
import { getAvantCustomizationGroups } from "@/lib/customization/avant";
import { getRosrettyCustomizationGroups } from "@/lib/customization/rosretty";
import { getStarperyCustomizationGroups, getStarperyCustomizationRules } from "@/lib/customization/starpery";
import { getIrontechCustomizationGroups, isExplicitIrontechUlwOption } from "@/lib/customization/irontech";
import { getWmCustomizationFamily, getWmCustomizationGroups } from "@/lib/customization/wm";
import {
  getAngelkissCustomizationGroups,
  getErovenusCustomizationGroups,
  getPiperCustomizationGroups,
  getHrCustomizationGroups,
  getJarlietCustomizationGroups,
  getClimaxCustomizationGroups,
  getDollsCastleCustomizationGroups,
  getRealLadyCustomizationGroups,
  getIlCustomizationGroups,
  getAiTechCustomizationGroups,
  getSeCustomizationGroups,
  getSixYeCustomizationGroups,
  getTantalyCustomizationGroups,
  getYlCustomizationGroups
} from "@/lib/customization/dealer-brands";

const skinTones: CustomizationGroup = {
  id: "skin-tone",
  label: "Skin tone",
  description: "Choose the closest factory skin reference. Final tone can vary slightly by batch and material.",
  required: true,
  display: "swatches",
  options: [
    { id: "factory", label: "Factory default", priceDelta: 0, swatch: { kind: "color", value: "#e7b98f" } },
    { id: "light", label: "Light", priceDelta: 0, swatch: { kind: "color", value: "#f0c9a5" } },
    { id: "tan", label: "Tan", priceDelta: 45, swatch: { kind: "color", value: "#c88f64" } },
    { id: "deep", label: "Deep", priceDelta: 65, swatch: { kind: "color", value: "#8d563d" } }
  ]
};

const eyeColor: CustomizationGroup = {
  id: "eye-color",
  label: "Eye color",
  description: "Use these color references to choose the eye look you prefer.",
  required: true,
  display: "swatches",
  options: [
    { id: "factory", label: "Factory default", priceDelta: 0, swatch: { kind: "color", value: "#5a3928" } },
    { id: "brown", label: "Brown", priceDelta: 0, swatch: { kind: "color", value: "#59351f" } },
    { id: "blue", label: "Blue", priceDelta: 25, swatch: { kind: "color", value: "#6d93bd" } },
    { id: "green", label: "Green", priceDelta: 25, swatch: { kind: "color", value: "#6f8f68" } }
  ]
};

const wigFinish: CustomizationGroup = {
  id: "hair-finish",
  label: "Hair finish",
  description: "Wigs are easiest to maintain. Implanted hair can limit electronic head options on some brands.",
  required: true,
  display: "cards",
  options: [
    { id: "wig", label: "Supplier wig", description: "Default removable wig.", priceDelta: 0 },
    { id: "extra-wig", label: "Extra wig", description: "Adds one alternate wig.", priceDelta: 59 },
    {
      id: "implanted",
      label: "Implanted hair",
      description: "Factory implanted hair where compatible.",
      priceDelta: 180,
      productionNote: "May add production time."
    }
  ]
};

const zelexHeadFunctions: CustomizationGroup = {
  id: "head-function",
  label: "Head function",
  description: "Electronic head functions can conflict with implanted hair because wiring runs through the head.",
  required: true,
  display: "cards",
  options: [
    { id: "none", label: "No electronic head function", description: "Standard head build.", priceDelta: 0 },
    { id: "oral-function", label: "Oral function", description: "Supplier electronic head function.", priceDelta: 350 },
    { id: "eye-movement", label: "Eye movement", description: "Supplier electronic eye movement.", priceDelta: 420 }
  ]
};

const bodyUpgrades: CustomizationGroup = {
  id: "body-upgrade",
  label: "Body upgrades",
  description: "Functional upgrades are confirmed against the selected body before production.",
  display: "cards",
  options: [
    { id: "standard", label: "Standard body", description: "No body upgrade.", priceDelta: 0 },
    { id: "standing-feet", label: "Standing feet", description: "Useful for display and assisted positioning.", priceDelta: 120 },
    { id: "body-heating", label: "Body heating", description: "Supplier heating option where compatible.", priceDelta: 280 }
  ]
};

const tpeBodyUpgrades: CustomizationGroup = {
  ...bodyUpgrades,
  options: [
    { id: "standard", label: "Standard body", description: "No body upgrade.", priceDelta: 0 },
    { id: "standing-feet", label: "Standing feet", description: "Useful for display and assisted positioning.", priceDelta: 95 },
    { id: "body-heating", label: "Body heating", description: "Supplier heating option where compatible.", priceDelta: 180 }
  ]
};

const careAddOns: CustomizationGroup = {
  id: "care-addons",
  label: "Care and storage",
  description: "Optional support items that make ownership and storage easier.",
  display: "compact",
  options: [
    { id: "none", label: "No add-on", priceDelta: 0 },
    { id: "care-kit", label: "Care kit", priceDelta: 49 },
    { id: "storage-bag", label: "Storage bag", priceDelta: 79 },
    { id: "care-storage", label: "Care kit + storage bag", priceDelta: 118 }
  ]
};

const torsoCareAddOns: CustomizationGroup = {
  ...careAddOns,
  options: [
    { id: "none", label: "No add-on", priceDelta: 0 },
    { id: "care-kit", label: "Care kit", priceDelta: 39 },
    { id: "storage-bag", label: "Compact storage bag", priceDelta: 59 }
  ]
};

const irontechUlw: CustomizationGroup = {
  id: "body-weight",
  label: "Body weight technology",
  description: "ULW is available for verified full-size Irontech silicone, TPE, and hybrid bodies and is designed to make lifting, repositioning, dressing, cleaning, and storage easier.",
  required: true,
  display: "cards",
  resources: [
    { label: "Watch the ULW demonstration", href: "/resources/irontech-ulw/irontech-ulw-demo.mp4", kind: "video" },
    { label: "Read the Irontech ULW white paper", href: "/resources/irontech-ulw/irontech-ulw-white-paper.pdf", kind: "document" },
    { label: "Irontech ULW information", href: "https://www.irontechdoll.com/ultra-lightweight-technology-ulw/", kind: "web" }
  ],
  options: [
    { id: "standard-weight", label: "Standard body weight", description: "The standard body construction and listed catalog weight.", priceDelta: 0 },
    {
      id: "ultra-lightweight",
      label: "Ultra Light Weight (ULW)",
      description: "Weight reduction varies by body and configuration. Compatibility and expected finished weight are confirmed before production.",
      priceDelta: 195,
      productionNote: "Factory compatibility and final weight are confirmed before production.",
      swatch: { kind: "image", value: "/option-swatches/irontech/ultra-lightweight.png", label: "Irontech ULW" }
    }
  ]
};

const ironAiHeadUpgrade: CustomizationGroup = {
  id: "ironai-head-upgrade",
  label: "IronAI companion head",
  description:
    "IronAI adds natural voice and text conversation, contextual and emotional responses, long-term memory, seven-language support, and online feature updates. Setup uses the IronAI app and a 2.4GHz Wi-Fi connection.",
  required: true,
  display: "cards",
  resources: [
    {
      label: "How IronAI works",
      href: "https://www.real-lady.com/products/sex-doll-ironai-heads/",
      kind: "web"
    }
  ],
  options: [
    {
      id: "standard-head",
      label: "Standard head",
      description: "Keep the head and functions shown with this model.",
      priceDelta: 0
    },
    {
      id: "ironai-head",
      label: "Upgrade to IronAI",
      description: "Includes the IronAI Core, voice and text interaction, long-term memory, Wi-Fi connectivity, and OTA updates.",
      priceDelta: 119,
      productionNote: "Head-model compatibility is confirmed before production.",
      swatch: {
        kind: "image",
        value: "https://www.real-lady.com/wp-content/uploads/2026/06/RIC_8823-scaled.jpg",
        label: "Real Lady IronAI head"
      }
    }
  ]
};

const ironAiHeadModels: CustomizationGroup = {
  id: "head",
  label: "IronAI head model",
  description: "Choose one of the IronAI-compatible Real Lady head models currently listed by the manufacturer.",
  required: true,
  selectionMode: "single",
  display: "swatches",
  resources: ironAiHeadUpgrade.resources,
  options: [
    { id: "r4-celeste", label: "R4 Celeste" },
    { id: "r8-lena", label: "R8 Lena" },
    { id: "r10-viki", label: "R10 Viki" },
    { id: "r11-alara", label: "R11 Alara" },
    { id: "r12-hailey", label: "R12 Hailey" }
  ]
};

const electronicHeadRules: CustomizationRule[] = [
  {
    id: "implanted-hair-oral-function",
    type: "incompatible",
    when: { groupId: "hair-finish", optionId: "implanted" },
    conflictsWith: { groupId: "head-function", optionId: "oral-function" },
    message: "Implanted hair cannot be combined with the electronic oral function on this brand."
  },
  {
    id: "implanted-hair-eye-movement",
    type: "incompatible",
    when: { groupId: "hair-finish", optionId: "implanted" },
    conflictsWith: { groupId: "head-function", optionId: "eye-movement" },
    message: "Implanted hair cannot be combined with eye movement because the wiring needs a clear head cavity."
  }
];

const configs = {
  zelex: {
    id: "zelex",
    brandLabel: "Zelex Dolls",
    leadTimeNote: "Ready-to-ship Zelex items keep the listed warehouse timing unless paid customization is requested.",
    groups: [skinTones, eyeColor, wigFinish, zelexHeadFunctions, bodyUpgrades, careAddOns],
    rules: electronicHeadRules
  },
  dollCastle: {
    id: "doll-castle",
    brandLabel: "Doll Castle",
    leadTimeNote: "Doll Castle production timing is confirmed for the exact build before payment.",
    groups: [skinTones, eyeColor, wigFinish, tpeBodyUpgrades, careAddOns],
    rules: []
  },
  starpery: {
    id: "starpery",
    brandLabel: "Starpery Dolls",
    leadTimeNote: "Starpery custom builds are confirmed with factory photos before production begins.",
    groups: [],
    rules: []
  },
  torso: {
    id: "torso",
    brandLabel: "Torso build",
    leadTimeNote: "Warehouse torso inventory is faster to ship, with fewer configuration dependencies.",
    groups: [skinTones, torsoCareAddOns],
    rules: []
  },
  optionsOnRequest: {
    id: "options-on-request",
    brandLabel: "Options confirmed with our team",
    leadTimeNote: "",
    groups: [],
    rules: []
  },
  generic: {
    id: "generic",
    brandLabel: "DollWow Select",
    leadTimeNote: "Custom details are reviewed by our team before production or shipment.",
    groups: [skinTones, eyeColor, wigFinish, bodyUpgrades, careAddOns],
    rules: []
  }
} satisfies Record<string, BrandCustomizationConfig>;

export function getCustomizationConfig(product: Product): BrandCustomizationConfig {
  return customizationConfig(product, "checkout");
}

/**
 * Complete known supplier option universe for audits, sourcing, and visual tools.
 * Unlike the checkout config, missing price data never erases a real option here.
 */
export function getFactoryCustomizationConfig(product: Product): BrandCustomizationConfig {
  return customizationConfig(product, "factory");
}

function customizationConfig(product: Product, purpose: "checkout" | "factory"): BrandCustomizationConfig {
  // Catalog imports are not perfectly consistent about where a brand lands.
  // Include stable product identifiers so a valid brand-specific configuration
  // never falls through to a generic or no-options experience.
  const text = [
    product.extended.brand,
    product.vendor,
    product.productType,
    product.extended.sourceTitle,
    product.title,
    product.handle,
    ...product.tags
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const importedGroups = product.extended.customizationGroups?.filter(
    (group) => Array.isArray(group.options) && group.options.length >= 2 && Boolean(group.id) && Boolean(group.label)
  );
  // IronAI is a standalone Irontech head product with a manufacturer-limited
  // model list. Keep that exact path ahead of the broader Irontech normalizer.
  if (isIronAiHeadProduct(product)) {
    const headStand = importedGroups?.find((group) => group.id === "sex-doll-head-stand");
    return {
      id: "ironai-head",
      brandLabel: "Irontech Dolls",
      leadTimeNote: "IronAI head compatibility is confirmed before production begins.",
      groups: headStand ? [ironAiHeadModels, headStand] : [ironAiHeadModels],
      rules: []
    };
  }
  if (text.includes("starpery")) {
    const groups = getStarperyCustomizationGroups(product, importedGroups);
    return {
      ...configs.starpery,
      id: "starpery-official",
      groups,
      rules: getStarperyCustomizationRules(groups)
    };
  }
  if (isIrontechProduct(product)) {
    const groups = getIrontechCustomizationGroups(product, importedGroups);
    const groupsWithImportedUlw = new Set(
      (importedGroups ?? [])
        .filter((group) => group.options.some((option) => isExplicitIrontechUlwOption(group, option)))
        .map((group) => group.id)
    );
    const availableGroups = purpose === "checkout" ? onlineCheckoutGroups(groups, groupsWithImportedUlw) : groups;
    return {
      id: "irontech-family-profile",
      brandLabel: "Irontech Dolls",
      leadTimeNote: "Irontech custom builds and compatibility are reviewed before production begins.",
      groups: uniqueCustomizationGroups(withIrontechUlw(product, availableGroups)),
      rules: []
    };
  }
  if (isWmProduct(product)) {
    const sourceGroups = importedGroups ?? [];
    const groups = getWmCustomizationGroups(product, sourceGroups);
    if (groups.length) {
      const availableGroups = purpose === "checkout" ? onlineCheckoutGroups(groups) : groups;
      return {
        id: `wm-${getWmCustomizationFamily(product, sourceGroups)}`,
        brandLabel: "WM Dolls",
        leadTimeNote: "WM custom builds and option compatibility are reviewed before production begins.",
        groups: uniqueCustomizationGroups(availableGroups),
        rules: []
      };
    }
  }
  if (isSeProduct(product) && importedGroups?.length) {
    const groups = getSeCustomizationGroups(product, importedGroups);
    return importedBrandConfig(product, purpose, "se-source-verified", "SE Doll", groups);
  }
  if (isSixYeProduct(product) && importedGroups?.length) {
    const groups = getSixYeCustomizationGroups(product, importedGroups);
    return importedBrandConfig(product, purpose, "6ye-source-verified", "6YE Dolls", groups);
  }
  if (isAngelkissProduct(product) && importedGroups?.length) {
    const groups = getAngelkissCustomizationGroups(product, importedGroups);
    return importedBrandConfig(product, purpose, "angelkiss-source-verified", "Angelkiss", groups);
  }
  if (isYlProduct(product) && importedGroups?.length) {
    return importedBrandConfig(product, purpose, "yl-source-verified", "YL Dolls", getYlCustomizationGroups(product, importedGroups));
  }
  if (isErovenusProduct(product) && importedGroups?.length) {
    return importedBrandConfig(product, purpose, "erovenus-source-verified", "Erovenus", getErovenusCustomizationGroups(product, importedGroups));
  }
  if (isPiperProduct(product) && importedGroups?.length) {
    return importedBrandConfig(product, purpose, "piper-source-verified", "Piper Dolls", getPiperCustomizationGroups(product, importedGroups));
  }
  if (isTantalyProduct(product) && importedGroups?.length) {
    return importedBrandConfig(product, purpose, "tantaly-source-verified", "Tantaly", getTantalyCustomizationGroups(product, importedGroups));
  }
  if (isHrProduct(product) && importedGroups?.length) {
    return importedBrandConfig(product, purpose, "hr-source-verified", "HR Dolls", getHrCustomizationGroups(product, importedGroups));
  }
  if (isJarlietProduct(product) && importedGroups?.length) {
    return importedBrandConfig(product, purpose, "jarliet-source-verified", "Jarliet Dolls", getJarlietCustomizationGroups(product, importedGroups));
  }
  if (isClimaxProduct(product) && importedGroups?.length) {
    return importedBrandConfig(product, purpose, "climax-source-verified", "Climax Doll", getClimaxCustomizationGroups(product, importedGroups));
  }
  if (isDollsCastleProduct(product) && importedGroups?.length) {
    return importedBrandConfig(product, purpose, "dolls-castle-source-verified", "Dolls Castle", getDollsCastleCustomizationGroups(product, importedGroups));
  }
  if (isRealLadyProduct(product) && importedGroups?.length) {
    const sourceGroups = normalizeRealLadyImportedGroups(importedGroups);
    return importedBrandConfig(product, purpose, "real-lady-source-verified", "Real Lady", getRealLadyCustomizationGroups(product, sourceGroups));
  }
  if (isIlProduct(product) && importedGroups?.length) {
    return importedBrandConfig(product, purpose, "il-source-verified", "IL Doll", getIlCustomizationGroups(product, importedGroups));
  }
  if (isAiTechProduct(product) && importedGroups?.length) {
    return importedBrandConfig(product, purpose, "ai-tech-source-verified", "Ai-Tech", getAiTechCustomizationGroups(product, importedGroups));
  }
  if (importedGroups?.length) {
    const sourceGroups = importedGroups;
    const availableGroups = purpose === "checkout" ? onlineCheckoutGroups(sourceGroups) : sourceGroups;
    const onlineGroups = withIronAi(product, withIrontechUlw(product, availableGroups));
    return {
      id: "imported",
      brandLabel: product.extended.brand ?? product.vendor,
      leadTimeNote: "Custom details are reviewed by our team before production or shipment.",
      groups: uniqueCustomizationGroups(onlineGroups),
      rules: []
    };
  }
  if (text.includes("rosretty")) {
    return {
      id: "rosretty-official",
      brandLabel: "Rosretty Dolls",
      leadTimeNote: "Rosretty selections are confirmed before production begins.",
      groups: getRosrettyCustomizationGroups(product),
      rules: []
    };
  }
  if (text.includes("torso")) return configs.torso;
  if (text.includes("avant")) {
    return {
      id: "avant-official",
      brandLabel: "Avant Doll",
      leadTimeNote: "Avant custom builds are confirmed before production begins.",
      groups: getAvantCustomizationGroups(product),
      rules: []
    };
  }
  if (text.includes("zelex")) return configs.zelex;
  if (text.includes("doll castle")) return configs.dollCastle;
  if (isRealLadyProduct(product)) {
    return {
      id: "real-lady",
      brandLabel: "Real Lady",
      leadTimeNote: "Real Lady custom builds and IronAI compatibility are confirmed before production begins.",
      groups: withIronAi(product, configs.generic.groups),
      rules: []
    };
  }
  return configs.generic;
}

function importedBrandConfig(product: Product, purpose: "checkout" | "factory", id: string, brandLabel: string, groups: CustomizationGroup[]): BrandCustomizationConfig {
  return {
    id,
    brandLabel,
    leadTimeNote: `${brandLabel} custom builds and option compatibility are reviewed before production begins.`,
    groups: uniqueCustomizationGroups(purpose === "checkout" ? onlineCheckoutGroups(groups) : groups),
    rules: []
  };
}

function withIronAi(product: Product, groups: CustomizationGroup[]) {
  if (isIronAiHeadProduct(product)) {
    const headStand = groups.find((group) => group.id === "sex-doll-head-stand");
    return headStand ? [ironAiHeadModels, headStand] : [ironAiHeadModels];
  }
  if (!isRealLadyProduct(product) || !supportsIronAiUpgrade(product) || groups.some((group) => group.id === ironAiHeadUpgrade.id)) return groups;
  return [...groups, ironAiHeadUpgrade];
}

function normalizeRealLadyImportedGroups(groups: CustomizationGroup[]) {
  const removedLegacyGroups = /custom options for extra head|head type for extra head|hairstyle for extra head|hair color for extra head|eye color for extra head|premium head options for extra head/i;

  return groups
    .filter((group) => !removedLegacyGroups.test(group.label))
    .map((group) => {
      if (/weight reduction/i.test(group.label)) {
        return {
          ...group,
          label: "Body weight",
          options: group.options.map((option) =>
            isExplicitIrontechUlwOption(group, option)
              ? { ...option, label: "Ultra Light Weight", priceDelta: 265 }
              : { ...option, priceDelta: option.priceDelta ?? 0 }
          )
        };
      }

      if (/robot option/i.test(group.label)) {
        return {
          ...group,
          label: "Robot functions",
          selectionMode: "single" as const,
          display: "cards" as const,
          options: [
            { id: "no-robot-functions", label: "No robot functions", priceDelta: 0 },
            { id: "intelligent-moaning", label: "Intelligent moaning function", priceDelta: 180 },
            { id: "electric-hip-waist", label: "Electric hip and waist", priceDelta: 280, productionNote: "Adds approximately 3 kg." },
            { id: "oral-sex-movement", label: "Oral movement function", priceDelta: 280, productionNote: "Adds approximately 4 kg." }
          ]
        };
      }

      const options = group.options
        .filter((option) => !(group.label.toLowerCase().includes("premium head & body") && option.id === "ironai"))
        .map((option) => {
          const label = option.label.toLowerCase();
          if (label.includes("implanted") && /hair(style)?/i.test(group.label)) return { ...option, priceDelta: 150 };
          if (label.includes("ros max") && /head type/i.test(group.label)) return { ...option, priceDelta: 200 };
          if ((label.includes("movable jaw") || label === "ros") && /head type/i.test(group.label)) return { ...option, priceDelta: 200 };
          if (label.includes("ultra soft butt") || label === "gel butt (free)") return { ...option, priceDelta: 150 };
          if (label.includes("ultra soft thigh")) return { ...option, priceDelta: 120 };
          if (label.includes("ultra soft belly")) return { ...option, priceDelta: 120 };
          if (label.includes("body moaning")) return { ...option, priceDelta: 180 };
          return { ...option, priceDelta: option.priceDelta ?? 0 };
        });
      return { ...group, options };
    });
}

function withIrontechUlw(product: Product, groups: CustomizationGroup[]) {
  if (!isIrontechProduct(product)) return groups;
  const withoutImportedUlw = groups.flatMap((group) => removeImportedIrontechUlw(group));
  if (!supportsIrontechUlw(product)) return withoutImportedUlw;

  const canonicalSiblings = withoutImportedUlw.filter((group) => group.id === irontechUlw.id);
  if (!canonicalSiblings.length) return [...withoutImportedUlw, irontechUlw];

  const preservedOptions = new Map<string, CustomizationOption>();
  for (const option of canonicalSiblings.flatMap((group) => group.options)) {
    preservedOptions.set(option.id, option);
  }
  const canonicalUlwOption = irontechUlw.options.find((option) => option.id === "ultra-lightweight")!;
  return [
    ...withoutImportedUlw.filter((group) => group.id !== irontechUlw.id),
    { ...irontechUlw, options: [...preservedOptions.values(), canonicalUlwOption] }
  ];
}

function removeImportedIrontechUlw(group: CustomizationGroup): CustomizationGroup[] {
  const options = group.options.filter((option) => !isExplicitIrontechUlwOption(group, option));
  if (!options.length) return [];
  return options.length === group.options.length ? [group] : [{ ...group, options }];
}


function isIrontechProduct(product: Product) {
  return [product.extended.brand, product.vendor, product.title, product.handle, ...product.tags]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes("irontech");
}

function isWmProduct(product: Product) {
  const text = [product.extended.brand, product.vendor, product.title, product.handle, ...product.tags]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return /(^|\s|-)wm(\s|-|$)|wm dolls|wmdoll/.test(text);
}

function isSeProduct(product: Product) {
  return /\bse[ -]?doll\b|\bsedoll\b/.test(productSearchText(product));
}

function isSixYeProduct(product: Product) {
  return /\b6ye\b/.test(productSearchText(product));
}

function isAngelkissProduct(product: Product) {
  return /\bangel[ -]?kiss\b|\bangelkiss\b/.test(productSearchText(product));
}

function isYlProduct(product: Product) {
  return /(^|\s|-)yl(\s|-|$)|\byl dolls?\b/.test(productSearchText(product));
}

function isErovenusProduct(product: Product) {
  return /\berovenus\b/.test(productSearchText(product));
}

function isPiperProduct(product: Product) {
  return /\bpiper dolls?\b/.test(productSearchText(product));
}

function isTantalyProduct(product: Product) {
  return /\btantaly\b/.test(productSearchText(product));
}

function isHrProduct(product: Product) {
  return /\bhr dolls?\b/.test(productSearchText(product));
}

function isJarlietProduct(product: Product) {
  return /\bjarliet(?: dolls?)?\b/.test(productSearchText(product));
}

function isClimaxProduct(product: Product) {
  return /\bclimax dolls?\b/.test(productSearchText(product));
}

function isDollsCastleProduct(product: Product) {
  return /\bdolls? castle\b/.test(productSearchText(product));
}

function isIlProduct(product: Product) {
  return /\bil dolls?\b/.test(productSearchText(product));
}

function isAiTechProduct(product: Product) {
  return /\bai[ -]?tech\b/.test(productSearchText(product));
}

function productSearchText(product: Product) {
  return [product.extended.brand, product.vendor, product.productType, product.extended.sourceTitle, product.title, product.handle, ...product.tags]
    .filter(Boolean).join(" ").toLowerCase();
}

function isRealLadyProduct(product: Product) {
  const text = [product.extended.brand, product.vendor, product.title, product.handle, ...product.tags]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return /\breal[ -]?lady\b|\breallady\b/.test(text);
}

function isIronAiHeadProduct(product: Product) {
  const text = [product.extended.brand, product.vendor, product.productType, product.title, product.handle, ...product.tags]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return text.includes("ironai") && text.includes("head");
}

function supportsIronAiUpgrade(product: Product) {
  const form = [product.productType, product.title, product.handle, ...product.tags].filter(Boolean).join(" ").toLowerCase();
  return !/\b(torso|hips?|body-part|head only|head-only)\b/.test(form);
}

function supportsIrontechUlw(product: Product) {
  const eligibility = product.extended.irontechUlwEligibility;
  const material = (product.extended.material ?? "").toLowerCase().replace(/^full\s+/, "").trim();
  const productType = product.productType.trim().toLowerCase();
  const productTypeByMaterial = new Map([
    ["silicone", "custom silicone doll"],
    ["tpe", "custom tpe doll"],
    ["hybrid", "custom hybrid doll"]
  ]);
  const irontechProductIdentity = /^irontech-/.test(product.handle.trim().toLowerCase());
  const matchingFullBodyPair = productTypeByMaterial.get(material) === productType;
  const madeToOrder = product.extended.stockStatus === "custom";
  const productionVerified = eligibility?.status === "verified" && Boolean(eligibility.bodyModel.trim());
  return irontechProductIdentity && productionVerified && matchingFullBodyPair && madeToOrder;
}

/**
 * Supplier import pages often include every factory reference option but no
 * price data. Those references are useful during internal sourcing, but a
 * customer must never be shown a choice they cannot actually select and buy.
 * Keep only online-orderable choices (priced, included/default, or explicitly
 * free) and drop a group entirely when it no longer offers a real choice.
 */
function onlineCheckoutGroups(groups: CustomizationGroup[], preserveSingleGroupIds = new Set<string>()) {
  return groups
    .map((group) => ({
      ...group,
      options: group.options.filter(isOnlineCheckoutOption)
    }))
    .filter((group) => group.options.length >= 2 || (group.options.length > 0 && preserveSingleGroupIds.has(group.id)));
}

function isOnlineCheckoutOption(option: CustomizationOption) {
  if (option.priceDelta !== undefined) return true;
  if (/\bfree\b/i.test(option.label)) return true;
  if (/^(no add-on|no thanks|none|as shown|factory default|default supplier selection)$/i.test(option.label)) return true;
  return /default supplier selection/i.test(option.productionNote || "");
}

function uniqueCustomizationGroups(groups: CustomizationGroup[]) {
  const seen = new Map<string, number>();

  return groups.map((group) => {
    const baseId = group.id || slugifyOptionGroup(group.label);
    const count = seen.get(baseId) ?? 0;
    seen.set(baseId, count + 1);
    if (count === 0) return group;

    return {
      ...group,
      id: `${baseId}-${count + 1}`
    };
  });
}

function slugifyOptionGroup(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "custom-option";
}
