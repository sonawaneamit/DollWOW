import type {
  BrandCustomizationConfig,
  CustomizationIssue,
  CustomizationSelections,
  ResolvedCustomization,
  SelectedCustomizationOption
} from "@/types/customization";

export function getDefaultSelections(config: BrandCustomizationConfig): CustomizationSelections {
  return Object.fromEntries(config.groups.map((group) => [group.id, group.options[0]?.id ?? ""]));
}

function findOption(config: BrandCustomizationConfig, groupId: string, optionId: string) {
  const group = config.groups.find((item) => item.id === groupId);
  const option = group?.options.find((item) => item.id === optionId);
  return group && option ? { group, option } : null;
}

function normalizedSelections(config: BrandCustomizationConfig, selections: CustomizationSelections) {
  const defaults = getDefaultSelections(config);
  return { ...defaults, ...selections };
}

export function resolveCustomization(
  config: BrandCustomizationConfig,
  selections: CustomizationSelections,
  basePrice: number
): ResolvedCustomization {
  const normalized = normalizedSelections(config, selections);
  const issues: CustomizationIssue[] = [];
  const selectedOptions: SelectedCustomizationOption[] = [];

  for (const group of config.groups) {
    const optionId = normalized[group.id];
    const option = group.options.find((item) => item.id === optionId);
    if (group.required && !option) {
      issues.push({ groupId: group.id, message: `${group.label} is required.` });
      continue;
    }
    if (!option) continue;
    selectedOptions.push({
      groupId: group.id,
      groupLabel: group.label,
      optionId: option.id,
      optionLabel: option.label,
      priceDelta: option.priceDelta ?? 0,
      productionNote: option.productionNote
    });
  }

  for (const rule of config.rules) {
    const whenSelected = normalized[rule.when.groupId] === rule.when.optionId;
    const conflictSelected = normalized[rule.conflictsWith.groupId] === rule.conflictsWith.optionId;
    if (whenSelected && conflictSelected) {
      issues.push({
        ruleId: rule.id,
        groupId: rule.conflictsWith.groupId,
        optionId: rule.conflictsWith.optionId,
        message: rule.message
      });
    }
  }

  const optionPriceDelta = selectedOptions.reduce((sum, option) => sum + option.priceDelta, 0);
  const cartAttributes = selectedOptions.map((option) => ({
    key: `DollWow ${option.groupLabel}`,
    value: option.priceDelta ? `${option.optionLabel} (+$${option.priceDelta})` : option.optionLabel
  }));

  return {
    selections: normalized,
    selectedOptions,
    optionPriceDelta,
    totalPrice: basePrice + optionPriceDelta,
    issues,
    cartAttributes: [
      { key: "DollWow Config ID", value: config.id },
      ...cartAttributes,
      { key: "DollWow Option Delta", value: `$${optionPriceDelta}` }
    ]
  };
}

export function getOptionConflict(
  config: BrandCustomizationConfig,
  selections: CustomizationSelections,
  groupId: string,
  optionId: string
) {
  const nextSelections = normalizedSelections(config, { ...selections, [groupId]: optionId });
  const conflict = config.rules.find((rule) => {
    const whenSelected = nextSelections[rule.when.groupId] === rule.when.optionId;
    const conflictSelected = nextSelections[rule.conflictsWith.groupId] === rule.conflictsWith.optionId;
    return whenSelected && conflictSelected;
  });
  return conflict?.message ?? null;
}

export function describeOption(config: BrandCustomizationConfig, groupId: string, optionId: string) {
  const match = findOption(config, groupId, optionId);
  if (!match) return null;
  return `${match.group.label}: ${match.option.label}`;
}
