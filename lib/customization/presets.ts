import {
  getDefaultSelections,
  isOptionAvailableForCheckout,
  resolveCustomization,
  selectionIds
} from "./resolve";
import {
  reviewedPresetEligibility,
  type ReviewedPresetRecipe
} from "./preset-eligibility";
import type {
  BrandCustomizationConfig,
  CustomizationSelections
} from "@/types/customization";

export type PresetId = "starter" | "popular" | "premium";

export type ConfigurationPreset = {
  id: PresetId;
  label: string;
  description: string;
  selections: CustomizationSelections;
  totalPrice: number;
  highlights: string[];
  /** Explicit recipe scope. An intentional empty list is never a match. */
  managedGroupIds?: readonly string[];
};

const sePilots = new Set([
  "sedoll-lita-b-163cm-c-cup-silicone-companion-doll-1fl7h",
  "sedoll-hinata-a-153cm-a-cup-silicone-companion-doll-1jmza"
]);
const seManaged = [
  "premium-head-body-options-multiple",
  "accessories"
] as const;
const seIncluded = [
  "loose-joint-system-free",
  "implanted-eyebrow-eyelash-free",
  "ultra-soft-vagina-free"
];

type RecipeTier = {
  id: PresetId;
  label: string;
  description: string;
  add: string[];
};

type Recipe = {
  groupId: string;
  managedOptionIds: string[];
  tiers: RecipeTier[];
  requiresMultipleSelection?: boolean;
};

function recipeFor(
  kind: ReviewedPresetRecipe,
  bespoke?: {
    groupId: string;
    managedOptionIds: string[];
    tiers: Array<{ id: PresetId; add: string[] }>;
  }
): Recipe | null {
  if (kind === "bespoke") {
    if (!bespoke) return null;
    return {
      groupId: bespoke.groupId,
      managedOptionIds: bespoke.managedOptionIds,
      requiresMultipleSelection: true,
      tiers: bespoke.tiers.map((tier) => ({
        ...tier,
        label:
          tier.id === "starter"
            ? "Starter"
            : tier.id === "popular"
              ? "Popular"
              : "Premium",
        description:
          tier.id === "starter"
            ? "Keeps the selected build simple."
            : tier.id === "popular"
              ? "Adds a popular configuration option."
              : "Adds the full selected configuration."
      }))
    };
  }
  const heatingRecipe: Recipe = {
    groupId: "premium-head-body-options",
    managedOptionIds: ["body-heating", "breathing-system"],
    tiers: [
      {
        id: "starter",
        label: "Starter",
        description: "Keeps the selected build simple.",
        add: []
      },
      {
        id: "popular",
        label: "Popular",
        description: "Adds body heating.",
        add: ["body-heating"]
      },
      {
        id: "premium",
        label: "Premium",
        description: "Adds body heating and breathing system.",
        add: ["body-heating", "breathing-system"]
      }
    ]
  };

  if (kind !== "wm-evo-safe") return heatingRecipe;

  return {
    groupId: "premium-head-body-options",
    managedOptionIds: ["breathing-system", "jitter-chest"],
    tiers: [
      {
        id: "starter",
        label: "Starter",
        description: "Keeps the selected build simple.",
        add: []
      },
      {
        id: "popular",
        label: "Popular",
        description: "Adds breathing system.",
        add: ["breathing-system"]
      },
      {
        id: "premium",
        label: "Premium",
        description: "Adds breathing system and jitter chest.",
        add: ["breathing-system", "jitter-chest"]
      }
    ]
  };
}

type SelectedOption = { groupId: string; id: string; label: string };

function selectedOptions(
  config: BrandCustomizationConfig,
  selections: CustomizationSelections
): SelectedOption[] {
  return config.groups.flatMap((group) =>
    selectionIds(selections[group.id]).map((id) => ({
      groupId: group.id,
      id,
      label: group.options.find((option) => option.id === id)?.label ?? ""
    }))
  );
}

/**
 * Owner-supplied WM caveats applied to the fully composed preset selection.
 * These guard the UI generator until equivalent configuration rules exist.
 */
export function wmPresetCompatibilityIssues(
  config: BrandCustomizationConfig,
  selections: CustomizationSelections
): string[] {
  const chosen = selectedOptions(config, selections);
  const has = (ids: readonly string[], label: string, groupId?: string) =>
    chosen.some(
      (item) =>
        (!groupId || item.groupId === groupId) &&
        (ids.includes(item.id) || item.label === label)
    );
  const heating = has(["body-heating"], "Body Heating");
  const implantedHair =
    has(["implanted-synthetic-hair", "implanted-human-hair"], "Implanted Synthetic Hair") ||
    has(["implanted-synthetic-hair", "implanted-human-hair"], "Implanted Human Hair");
  const electronicHead = chosen.some((item) =>
    [
      "head-moaning",
      "oral-heating",
      "oral-sucking",
      "blowjob-sucker",
      "auto-blowjob-sex-robot",
      "vine-talk-ai-box"
    ].includes(item.id)
  );
  const issues: string[] = [];

  if (heating && has(["gel-free", "gel-breast", "gel-breasts"], "Gel (FREE)", "breast-options")) {
    issues.push("Body Heating cannot be combined with gel-filled breasts.");
  }
  if (heating && has(["evo-free", "evo-skeleton"], "EVO (FREE)", "skeleton-type")) {
    issues.push("Body Heating cannot be combined with the EVO skeleton.");
  }
  if (heating && has(["blowjob-sucker"], "Blowjob Sucker")) {
    issues.push("Body Heating cannot be combined with the Blowjob Sucker.");
  }
  if (implantedHair && electronicHead) {
    issues.push(
      "Implanted hair with an electronic head function is unavailable pending compatibility confirmation."
    );
  }

  return issues;
}

function optionIsEligible(
  config: BrandCustomizationConfig,
  groupId: string,
  optionId: string
) {
  const group = config.groups.find((item) => item.id === groupId);
  const matches = group?.options.filter((option) => option.id === optionId) ?? [];
  const option = matches[0];

  return (
    matches.length === 1 &&
    option !== undefined &&
    option.factoryExists !== false &&
    option.priceVerified !== false &&
    isOptionAvailableForCheckout(config, groupId, optionId)
  );
}

function recipePresets(
  recipe: Recipe,
  config: BrandCustomizationConfig,
  basePrice: number,
  current: CustomizationSelections,
  enforceWmCompatibility: boolean
): ConfigurationPreset[] {
  const defaults = getDefaultSelections(config);
  const group = config.groups.find((item) => item.id === recipe.groupId);
  if (!group || (recipe.requiresMultipleSelection && group.selectionMode !== "multiple")) {
    return [];
  }

  const neutralDefaults = new Set(selectionIds(defaults[recipe.groupId]));
  const currentIds = selectionIds(current[recipe.groupId] ?? defaults[recipe.groupId]);
  const preservedIds = currentIds.filter(
    (id) => !recipe.managedOptionIds.includes(id) && !neutralDefaults.has(id)
  );
  const presets: ConfigurationPreset[] = [];

  for (const tier of recipe.tiers) {
    const groupIds = tier.add.length
      ? [...preservedIds, ...tier.add]
      : preservedIds.length
        ? preservedIds
        : selectionIds(defaults[recipe.groupId]);
    const selections = { ...defaults, ...current, [recipe.groupId]: groupIds };

    if (enforceWmCompatibility && wmPresetCompatibilityIssues(config, selections).length > 0) {
      continue;
    }
    if (!groupIds.every((optionId) => optionIsEligible(config, recipe.groupId, optionId))) {
      continue;
    }

    const resolved = resolveCustomization(config, selections, basePrice);
    if (resolved.issues.length || resolved.requiresPriceConfirmation) continue;

    presets.push({
      id: tier.id,
      label: tier.label,
      description: tier.description,
      selections,
      totalPrice: resolved.totalPrice,
      highlights: resolved.selectedOptions
        .filter(
          (option) => option.groupId === recipe.groupId && tier.add.includes(option.optionId)
        )
        .map((option) => option.optionLabel),
      managedGroupIds: [recipe.groupId]
    });
  }

  return presets;
}

function sePresets(
  config: BrandCustomizationConfig,
  basePrice: number,
  current: CustomizationSelections
): ConfigurationPreset[] {
  const tiers = [
    {
      id: "starter" as const,
      label: "Starter",
      description: "Keep it simple.",
      body: seIncluded,
      accessories: ["no-add-on"]
    },
    {
      id: "popular" as const,
      label: "Popular",
      description: "Our recommended setup.",
      body: [...seIncluded, "articulated-fingers-free"],
      accessories: ["vaginal-irrigator", "reusable-drying-rod"]
    },
    {
      id: "premium" as const,
      label: "Premium",
      description: "Detail. Movement. Extras.",
      body: [
        ...seIncluded,
        "ultra-flex-fingers",
        "real-skin-texture",
        "movable-eyelids",
        "articulated-toes"
      ],
      accessories: [
        "vaginal-irrigator",
        "reusable-drying-rod",
        "head-stand-holder"
      ]
    }
  ];
  const defaults = getDefaultSelections(config);
  const presets: ConfigurationPreset[] = [];

  for (const tier of tiers) {
    const selections = {
      ...defaults,
      ...current,
      [seManaged[0]]: [...tier.body],
      accessories: [...tier.accessories]
    };
    const valid = seManaged.every((groupId) =>
      selectionIds(selections[groupId]).every((optionId) =>
        optionIsEligible(config, groupId, optionId)
      )
    );
    const resolved = resolveCustomization(config, selections, basePrice);
    if (!valid || resolved.issues.length || resolved.requiresPriceConfirmation) return [];

    presets.push({
      id: tier.id,
      label: tier.label,
      description: tier.description,
      selections,
      totalPrice: resolved.totalPrice,
      highlights: resolved.selectedOptions
        .filter(
          (option) =>
            (option.groupId === seManaged[0] || option.groupId === seManaged[1]) &&
            option.optionId !== "no-add-on"
        )
        .map((option) => option.optionLabel),
      managedGroupIds: seManaged
    });
  }

  return presets;
}

export function configurationPresets(
  handle: string,
  config: BrandCustomizationConfig,
  basePrice: number,
  current: CustomizationSelections
): ConfigurationPreset[] {
  if (!Number.isFinite(basePrice)) return [];
  if (sePilots.has(handle)) return sePresets(config, basePrice, current);

  const eligibility = reviewedPresetEligibility[handle];
  if (!eligibility || eligibility.configId !== config.id) return [];

  const recipe = recipeFor(eligibility.recipe, eligibility.bespoke);
  if (!recipe) return [];

  return recipePresets(
    recipe,
    config,
    basePrice,
    current,
    eligibility.bespoke?.applyWmGuard ?? eligibility.recipe.startsWith("wm")
  );
}

export function matchesConfigurationPreset(
  preset: ConfigurationPreset,
  selections: CustomizationSelections
) {
  // Existing pilot objects predate managedGroupIds. Runtime recipes always set it.
  if (preset.managedGroupIds?.length === 0) return false;
  if (
    preset.managedGroupIds === undefined &&
    !seManaged.every((groupId) => groupId in preset.selections)
  ) {
    return false;
  }

  const groupIds = preset.managedGroupIds ?? seManaged;
  return groupIds.every(
    (groupId) =>
      [...selectionIds(preset.selections[groupId])].sort().join("|") ===
      [...selectionIds(selections[groupId])].sort().join("|")
  );
}
