import type { Product } from "@/types/product";
import type { CustomizationGroup, CustomizationOption, CustomizationRule } from "@/types/customization";
import starperyHeads from "@/data/starpery-heads.json";

const rosemaryAsset = (path: string) => `https://www.rosemarydoll.com/wp-content/uploads/${path}`;

function imageOption(id: string, label: string, path: string, priceDelta = 0, description?: string): CustomizationOption {
  return {
    id,
    label,
    description,
    priceDelta,
    dollVueEnabled: true,
    priceVerified: true,
    purchasable: true,
    swatch: { kind: "image", value: rosemaryAsset(path), label }
  };
}

type StarperyHeadRecord = { id: string; label: string; imagePath: string; ros: boolean };

const currentHeadOptions: CustomizationOption[] = (starperyHeads as StarperyHeadRecord[]).map((head) => ({
  ...imageOption(head.id, head.label, head.imagePath),
  description: head.ros ? "ROS-compatible head; select ROS under Head type to add the movable-jaw construction." : undefined,
  dollVueEnabled: false
}));

const headModel: CustomizationGroup = {
  id: "head-model",
  label: "Choose a Head",
  description: "Choose exactly one head. Switching to another current Starpery head is included; ROS construction is priced separately under Head type.",
  required: true,
  selectionMode: "single",
  display: "swatches",
  options: [
    { ...imageOption("shown-head", "Keep the head shown", "2020/04/default-300x300.jpg"), dollVueEnabled: false },
    ...currentHeadOptions
  ]
};

const headConstruction: CustomizationGroup = {
  id: "head-construction",
  label: "Head type",
  description: "Factory head construction. ROS adds a movable jaw, soft tongue, and soft teeth.",
  required: true,
  display: "swatches",
  options: [
    imageOption("hard-silicone", "Hard silicone", "2023/12/Hard-Silicone.jpg", 0, "More structured facial detail; implanted brows and lashes are standard."),
    imageOption("soft-silicone", "Soft silicone", "2023/12/Soft-Silicone-50.jpg", 0, "Softer head with a simple oral cavity."),
    imageOption("ros", "ROS movable-jaw head", "2021/03/Starpery-ROS-Head.jpg", 100, "Realistic Oral Structure with movable jaw, soft tongue, and soft teeth.")
  ]
};

const skinTone: CustomizationGroup = {
  id: "skin-tone",
  label: "Skin tone",
  description: "Starpery skin-tone choices are included. Slight batch and material variation is normal.",
  required: true,
  display: "swatches",
  options: [
    imageOption("light-tan", "Light tan", "2021/03/Light-tan.jpg"),
    imageOption("tan", "Tan", "2021/03/Tan-2.jpg"),
    imageOption("wheat", "Wheat", "2021/03/Wheat.jpg"),
    imageOption("cocoa", "Cocoa", "2021/03/Cocoa-Skin.jpg"),
    imageOption("porcelain", "Porcelain", "2021/03/Porcelain-Skin.jpg")
  ]
};

const eyeColor: CustomizationGroup = {
  id: "eye-color",
  label: "Eye color",
  description: "Brown, blue, and green movable eyes are included—there is no color surcharge.",
  required: true,
  display: "swatches",
  options: [
    imageOption("brown", "Brown", "2021/04/3-1.jpg"),
    imageOption("blue", "Blue", "2021/04/4-1.jpg"),
    imageOption("green", "Green", "2021/04/2-1.jpg")
  ]
};

const eyeType: CustomizationGroup = {
  id: "eye-type",
  label: "Eye detail",
  description: "Both Starpery full-ball movable eye styles are included.",
  required: true,
  display: "swatches",
  options: [
    imageOption("standard", "Movable eyes", "2021/04/moveable-full-ball-eyes.jpg"),
    imageOption("blood-vessels", "Movable eyes with blood vessels", "2021/04/moveable-full-ball-bloody-eyes.jpg")
  ]
};

const hairFinish: CustomizationGroup = {
  id: "hair-finish",
  label: "Hair finish",
  description: "A wig is standard. Starpery recommends a hard head when choosing implanted hair.",
  required: true,
  display: "swatches",
  options: [
    imageOption("wig", "Supplier wig", "2020/04/default-300x300.jpg"),
    imageOption("synthetic", "Implanted synthetic hair", "2021/04/Implanted-Hair.jpg", 150),
    imageOption("human", "Implanted human hair", "2021/04/Implanted-Hair.jpg", 300)
  ]
};

const hairstyle: CustomizationGroup = {
  id: "hairstyle",
  label: "Wig style",
  description: "Choose the included removable wig supplied with the doll.",
  required: true,
  display: "swatches",
  options: [
    imageOption("shown-style", "Keep the style shown", "2020/04/default-300x300.jpg"),
    imageOption("style-1", "Black long", "2021/03/Black-Long.png"),
    imageOption("style-2", "Black medium", "2021/03/Black-Medium.png"),
    imageOption("style-3", "Blonde with bangs", "2021/03/Blonde-Hair-with-bang.png"),
    imageOption("style-4", "Blonde long", "2021/03/Blonde-Long.png"),
    imageOption("style-5", "Blonde short", "2021/03/Blonde-Short.png"),
    imageOption("style-6", "Brown long", "2021/03/Brown-Long.png"),
    imageOption("style-7", "Brown short", "2021/03/Brown-Short.png"),
    imageOption("style-8", "Gradient style 1", "2021/03/Gradient-hair-1.png"),
    imageOption("style-9", "Gradient style 2", "2021/03/Gradient-hair-2.png"),
    imageOption("style-10", "Green long and curly", "2021/03/Green-Long-Curly.png"),
    imageOption("style-11", "Red long and curly", "2021/03/Red-Long-Curly.png"),
    imageOption("style-12", "Red medium", "2021/03/Red-Medium.png")
  ]
};

const breastType: CustomizationGroup = {
  id: "breast-type",
  label: "Breast fill",
  description: "Both factory breast constructions are included for supported bodies.",
  required: true,
  display: "cards",
  options: [
    { id: "gel", label: "Gel breasts", priceDelta: 0, description: "Softer, gel-filled construction." },
    { id: "solid", label: "Solid breasts", priceDelta: 0, description: "Standard solid construction." }
  ]
};

const vaginaType: CustomizationGroup = {
  id: "vagina-type",
  label: "Vagina type",
  description: "Choose a fixed or removable construction where supported by this body.",
  required: true,
  display: "cards",
  options: [
    { id: "fixed", label: "Fixed", priceDelta: 0 },
    { id: "removable", label: "Removable insert", priceDelta: 0 }
  ]
};

const vaginaTexture: CustomizationGroup = {
  id: "vagina-texture",
  label: "Internal texture",
  description: "Factory texture choices are included.",
  required: true,
  display: "compact",
  options: [
    { id: "a", label: "Texture A", priceDelta: 0 },
    { id: "b", label: "Texture B", priceDelta: 0 },
    { id: "c", label: "Texture C", priceDelta: 0 }
  ]
};

const pubicHair: CustomizationGroup = {
  id: "pubic-hair",
  label: "Pubic hair",
  description: "Factory standard implanted hair is included; custom work and adhesive appliqués are optional.",
  required: true,
  display: "cards",
  options: [
    { id: "none", label: "None", priceDelta: 0 },
    { id: "standard", label: "Standard implanted style", priceDelta: 0 },
    { id: "custom", label: "Custom implanted shape", priceDelta: 100, description: "Upload or send the desired shape after ordering." },
    { id: "paster", label: "Adhesive hair appliqué", priceDelta: 80 }
  ]
};

const nailColor = (id: string, label: string): CustomizationGroup => ({
  id,
  label,
  description: "Factory nail colors are included.",
  required: true,
  display: "swatches",
  options: [
    imageOption("natural", "Natural", "2021/03/Natural-finger-nail-1.jpg"),
    imageOption("french", "French", "2021/03/French-finger-nail-1.jpg"),
    imageOption("black", "Black", "2021/03/Black-finger-nail-1.jpg"),
    imageOption("dark-green", "Dark green", "2021/03/Dark-Green-finger-nail-1.jpg"),
    imageOption("orange", "Orange", "2021/03/Orange-finger-nail-1.jpg"),
    imageOption("red", "Red", "2021/03/Red-finger-nail-1.jpg")
  ]
});

const bodyConstruction = (silicone: boolean, supportsGelBelly: boolean): CustomizationGroup => ({
  id: "body-construction",
  label: "Body construction",
  description: "Included softness and construction choices are filtered for this body.",
  selectionMode: "multiple",
  display: "cards",
  options: [
    { id: "gel-breasts", label: "Gel breasts", priceDelta: 0 },
    ...(silicone ? [{ id: "gel-butt", label: "Gel butt", priceDelta: 0 }] : []),
    ...(supportsGelBelly ? [{ id: "gel-belly", label: "Gel belly", priceDelta: 100 }] : []),
    { id: "standing-feet", label: "Standing feet with bolts", priceDelta: 0 },
    ...(silicone ? [{ id: "hard-feet", label: "Hard feet without bolts", priceDelta: 100 }] : []),
    { id: "articulated-fingers", label: "Starpery 2.0 articulated fingers", priceDelta: 165 }
  ]
});

const premiumOptions = (silicone: boolean): CustomizationGroup => ({
  id: "premium-options",
  label: "Premium functions",
  description: "Factory-supported upgrades with their current recommended website prices.",
  selectionMode: "multiple",
  display: "cards",
  options: [
    { id: "body-moaning", label: "Five-point moaning system", priceDelta: 100, productionNote: "Electronic systems are not covered by factory after-sales support once shipped." },
    { id: "heating", label: "Heating system 3.0", priceDelta: 200, productionNote: "Electronic systems are not covered by factory after-sales support once shipped." },
    ...(silicone ? [{ id: "clamping-suction", label: "Clamping and suction", priceDelta: 150, productionNote: "Requires a fixed vagina." }] : []),
    { id: "custom-face", label: "Custom face realism", priceDelta: 200 },
    { id: "custom-body", label: "Custom body realism", priceDelta: 250 },
    { id: "no-weight-reduction", label: "Full-weight body", priceDelta: 150, productionNote: "May increase shipping cost; Starpery weight reduction is otherwise standard." }
  ]
});

const additionalHead: CustomizationGroup = {
  id: "additional-head",
  label: "Add Extra Head",
  description: "Add one or more distinct Starpery heads. Standard heads are $500 each; ROS-compatible heads include the $100 ROS construction upgrade.",
  selectionMode: "multiple",
  display: "swatches",
  options: [
    { id: "none", label: "No additional head", priceDelta: 0 },
    ...(starperyHeads as StarperyHeadRecord[]).map((head) => ({
      ...imageOption(`extra-${head.id}`, head.label, head.imagePath, head.ros ? 600 : 500),
      description: head.ros ? "Includes this extra head plus ROS movable-jaw construction." : "Additional standard Starpery head ordered with the doll.",
      dollVueEnabled: false
    }))
  ]
};

const accessories: CustomizationGroup = {
  id: "accessories",
  label: "Accessories",
  description: "Optional factory accessories.",
  selectionMode: "multiple",
  display: "compact",
  options: [
    { id: "removable-insert", label: "Spare removable vagina insert", priceDelta: 15 },
    { id: "penis-adapter", label: "Penis adapter", priceDelta: 25 },
    { id: "extra-eyes", label: "Extra eyes", priceDelta: 10 },
    { id: "extra-wig", label: "Extra wig", priceDelta: 10 },
    { id: "flight-case", label: "Flight case", priceDelta: 125, productionNote: "Additional shipping may apply." }
  ]
};

export function getStarperyCustomizationGroups(product: Product, importedGroups?: CustomizationGroup[]): CustomizationGroup[] {
  const material = `${product.extended.material ?? ""} ${product.productType} ${product.title}`.toLowerCase();
  const silicone = material.includes("silicone");
  const body = `${product.extended.heightCm ?? ""}${product.extended.cupSize ?? ""} ${product.title}`.replace(/\s+/g, "").toLowerCase();
  const supportsGelBelly = silicone && (body.includes("161cmh") || body.includes("168cmh") || body.includes("161h") || body.includes("168h"));

  const profile = [
    headModel,
    headConstruction,
    skinTone,
    eyeColor,
    eyeType,
    hairstyle,
    hairFinish,
    nailColor("nail-color", "Fingernail color"),
    nailColor("toe-nail-color", "Toenail color"),
    breastType,
    vaginaType,
    vaginaTexture,
    pubicHair,
    bodyConstruction(silicone, supportsGelBelly),
    premiumOptions(silicone),
    additionalHead,
    accessories
  ];

  if (importedGroups?.length) {
    return mergeImportedStarperyGroups(importedGroups, profile);
  }

  return profile;
}

export function getStarperyCustomizationRules(groups: CustomizationGroup[]): CustomizationRule[] {
  const headGroup = groups.find((group) => group.id === "head-model" || /choose a head/i.test(group.label));
  const constructionGroup = groups.find((group) => /head type|head construction/i.test(group.label));
  if (!headGroup || !constructionGroup) return [];

  const rosHeadIds = new Set((starperyHeads as StarperyHeadRecord[]).filter((head) => head.ros).map((head) => head.id));
  const rosConstruction = constructionGroup.options.find((option) => /\bros\b|oral sex|movable jaw/i.test(option.label));
  if (!rosConstruction) return [];

  const standardConstructions = constructionGroup.options.filter((option) => option.id !== rosConstruction.id);
  const rules: CustomizationRule[] = [];

  for (const head of headGroup.options) {
    if (head.id === "shown-head") continue;
    if (rosHeadIds.has(head.id)) {
      for (const construction of standardConstructions) {
        rules.push({
          id: `starpery-${head.id}-requires-ros-${construction.id}`,
          type: "incompatible",
          when: { groupId: headGroup.id, optionId: head.id },
          conflictsWith: { groupId: constructionGroup.id, optionId: construction.id },
          message: `${head.label} is an ROS-compatible head. Select the ROS movable-jaw head type for this head.`
        });
      }
    } else {
      rules.push({
        id: `starpery-${head.id}-standard-only`,
        type: "incompatible",
        when: { groupId: headGroup.id, optionId: head.id },
        conflictsWith: { groupId: constructionGroup.id, optionId: rosConstruction.id },
        message: `${head.label} is listed as a standard head. Choose a head marked ROS before selecting the ROS movable-jaw head type.`
      });
    }
  }

  return rules;
}

const removedImportedGroups = [
  /extra (free )?head/i,
  /for extra head/i
];

function mergeImportedStarperyGroups(importedGroups: CustomizationGroup[], profile: CustomizationGroup[]) {
  const normalized = importedGroups
    .filter((group) => !removedImportedGroups.some((pattern) => pattern.test(group.label)))
    .map(normalizeImportedStarperyGroup)
    .map((group) => ({ ...group, options: group.options.filter((option) => option.priceDelta !== undefined || isIncludedDefault(option)) }))
    .filter((group) => group.options.length >= 2);

  const importedKeys = new Set(normalized.map(starperyGroupKey));
  const inherited = profile.filter((group) => !importedKeys.has(starperyGroupKey(group)));

  // A product-specific group is authoritative for that entire choice. Shared
  // profile groups only fill genuinely absent steps; they never inject extra
  // choices into a supplier-limited SKU.
  return mergeDuplicateGroups([...normalized, ...inherited]);
}

function starperyGroupKey(group: Pick<CustomizationGroup, "id" | "label">) {
  const label = group.label.trim().toLowerCase();
  if (/choose a head|head model/.test(label)) return "head-model";
  if (/head type|head construction/.test(label)) return "head-construction";
  if (/skin tone/.test(label)) return "skin-tone";
  if (/^eye color$/.test(label)) return "eye-color";
  if (/eye type|eye detail/.test(label)) return "eye-type";
  if (/wig style|^hairstyle$/.test(label)) return "hairstyle";
  if (/hair finish|hair implanted$/.test(label)) return "hair-finish";
  if (/finger.*nail|^nail color$/.test(label)) return "nail-color";
  if (/toe.*nail/.test(label)) return "toe-nail-color";
  if (/breast/.test(label)) return "breast-type";
  if (/^vagina( type)?$/.test(label)) return "vagina-type";
  if (/vagina texture|internal texture/.test(label)) return "vagina-texture";
  if (/pubic hair|vagina hair/.test(label)) return "pubic-hair";
  if (/body construction/.test(label)) return "body-construction";
  if (/premium/.test(label)) return "premium-options";
  if (/extra head|additional head/.test(label)) return "additional-head";
  if (/accessories/.test(label)) return "accessories";
  return group.id.trim().toLowerCase() || label;
}

function normalizeImportedStarperyGroup(group: CustomizationGroup): CustomizationGroup {
  const groupLabel = group.label.toLowerCase();
  const multiple = /\b(multiple|accessories)\b/i.test(group.label);
  return {
    ...group,
    selectionMode: multiple ? "multiple" : "single",
    required: multiple ? false : group.required,
    options: group.options.map((option) => normalizeImportedStarperyOption(groupLabel, option))
  };
}

function normalizeImportedStarperyOption(groupLabel: string, option: CustomizationOption): CustomizationOption {
  const label = option.label.toLowerCase();
  let priceDelta = option.priceDelta;

  // The official Starpery 2026 price list is authoritative when a dealer promotion conflicts.
  if (groupLabel === "head type") {
    priceDelta = /\bros\b|oral sex|movable jaw/.test(label) ? 100 : 0;
  } else if (groupLabel === "hair implanted") {
    if (/human/.test(label)) priceDelta = 300;
    else if (/synthetic/.test(label)) priceDelta = 150;
    else if (/no thanks|none|factory default/.test(label)) priceDelta = 0;
  } else if (/vagina hair|pubic hair/.test(groupLabel)) {
    if (/no\.\s*[123]|custom/.test(label)) priceDelta = 50;
    else if (/paster|adhesive/.test(label)) priceDelta = 80;
    else if (/none|no thanks|factory default/.test(label)) priceDelta = 0;
  } else if (/reduce weight/.test(groupLabel)) {
    if (/no need|full.?weight|without/.test(label)) priceDelta = 150;
    else if (/need|reduce|factory default|free/.test(label)) priceDelta = 0;
  } else if (/hand \/ foot skeleton/.test(groupLabel)) {
    if (/2\.0|enhanced/.test(label)) priceDelta = 165;
  } else if (/standing add-on/.test(groupLabel)) {
    if (/hard feet|no bolts/.test(label)) priceDelta = 100;
    else if (/standing|factory default|none|no thanks/.test(label)) priceDelta = 0;
  } else if (/premium head & body|premium body/.test(groupLabel)) {
    if (/moaning/.test(label)) priceDelta = 100;
    else if (/heating/.test(label)) priceDelta = 200;
    else if (/clamping|sucking/.test(label)) priceDelta = 150;
    else if (/custom face/.test(label)) priceDelta = 200;
    else if (/custom body/.test(label)) priceDelta = 250;
    else if (/gel belly/.test(label)) priceDelta = 100;
    else if (/hard hand/.test(label)) priceDelta = 100;
    else if (/finger bone 2\.0|enhanced articulated finger/.test(label)) priceDelta = 165;
    else if (/body realism(?!.*custom)/.test(label)) priceDelta = 80;
    else if (/male chest hair/.test(label)) priceDelta = 50;
  }

  if (priceDelta === undefined && includedReferenceGroup(groupLabel, label)) priceDelta = 0;

  const verified = priceDelta !== undefined;
  return {
    ...option,
    priceDelta,
    priceVerified: verified,
    purchasable: verified,
    dollVueEnabled: Boolean(option.swatch?.kind === "image") && isDollVueFriendlyOption(groupLabel, label)
  };
}

function includedReferenceGroup(groupLabel: string, optionLabel: string) {
  if (isIncludedDefault({ id: "", label: optionLabel })) return true;
  return /^(skin tone|hairstyle|hair implanted color|eye color|eye type|nail color|toe nail color|breast options|vagina|vagina texture|vagina width & depth|areola color|labia color)$/.test(groupLabel);
}

function isDollVueFriendlyOption(groupLabel: string, optionLabel: string) {
  if (/^(skin tone|hairstyle|hair implanted color|eye color|nail color|toe nail color|areola color|labia color|vagina hair|pubic hair)$/.test(groupLabel)) return true;
  if (/makeup|finishing detail|^premium\b/.test(groupLabel)) return /makeup|painting|realism|moles|freckles|bikini line/i.test(optionLabel);
  return false;
}

function isIncludedDefault(option: Pick<CustomizationOption, "id" | "label" | "productionNote">) {
  return /\bfree\b|^(no add-on|no thanks|none|no change|factory default|default supplier selection)$/i.test(option.label) ||
    /default supplier selection/i.test(option.productionNote || "");
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
