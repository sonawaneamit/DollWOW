import type { Product } from "@/types/product";
import type { BrandCustomizationConfig, CustomizationGroup, CustomizationRule } from "@/types/customization";

const skinTones: CustomizationGroup = {
  id: "skin-tone",
  label: "Skin tone",
  description: "Choose the closest factory skin reference. Final tone can vary slightly by batch and material.",
  required: true,
  display: "swatches",
  options: [
    { id: "factory", label: "Factory default", swatch: { kind: "color", value: "#e7b98f" } },
    { id: "light", label: "Light", swatch: { kind: "color", value: "#f0c9a5" } },
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
    { id: "factory", label: "Factory default", swatch: { kind: "color", value: "#5a3928" } },
    { id: "brown", label: "Brown", swatch: { kind: "color", value: "#59351f" } },
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
    { id: "none", label: "No electronic head function", description: "Standard head build." },
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
    { id: "standard", label: "Standard body", description: "No body upgrade." },
    { id: "standing-feet", label: "Standing feet", description: "Useful for display and assisted positioning.", priceDelta: 120 },
    { id: "body-heating", label: "Body heating", description: "Supplier heating option where compatible.", priceDelta: 280 }
  ]
};

const tpeBodyUpgrades: CustomizationGroup = {
  ...bodyUpgrades,
  options: [
    { id: "standard", label: "Standard body", description: "No body upgrade." },
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
    { id: "none", label: "No add-on" },
    { id: "care-kit", label: "Care kit", priceDelta: 49 },
    { id: "storage-bag", label: "Storage bag", priceDelta: 79 },
    { id: "care-storage", label: "Care kit + storage bag", priceDelta: 118 }
  ]
};

const torsoCareAddOns: CustomizationGroup = {
  ...careAddOns,
  options: [
    { id: "none", label: "No add-on" },
    { id: "care-kit", label: "Care kit", priceDelta: 39 },
    { id: "storage-bag", label: "Compact storage bag", priceDelta: 59 }
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
    leadTimeNote: "Doll Castle custom builds are usually confirmed before a 4-8 week production window.",
    groups: [skinTones, eyeColor, wigFinish, tpeBodyUpgrades, careAddOns],
    rules: []
  },
  starpery: {
    id: "starpery",
    brandLabel: "Starpery Dolls",
    leadTimeNote: "Starpery custom builds are confirmed with factory photos before production begins.",
    groups: [skinTones, eyeColor, wigFinish, bodyUpgrades, careAddOns],
    rules: []
  },
  torso: {
    id: "torso",
    brandLabel: "Torso build",
    leadTimeNote: "Warehouse torso inventory is faster to ship, with fewer configuration dependencies.",
    groups: [skinTones, torsoCareAddOns],
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
  const text = [product.extended.brand, product.vendor, product.productType, ...product.tags].join(" ").toLowerCase();
  const importedGroups = product.extended.customizationGroups?.filter((group) => group.options.length >= 2);
  if (importedGroups?.length) {
    return {
      id: "imported",
      brandLabel: product.extended.brand ?? product.vendor,
      leadTimeNote: "Custom details are reviewed by our team before production or shipment.",
      groups: uniqueCustomizationGroups(importedGroups),
      rules: []
    };
  }
  if (text.includes("torso")) return configs.torso;
  if (text.includes("zelex")) return configs.zelex;
  if (text.includes("doll castle")) return configs.dollCastle;
  if (text.includes("starpery")) return configs.starpery;
  return configs.generic;
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
