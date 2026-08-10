import type {
  BrandCustomizationConfig,
  CustomizationIssue,
  CustomizationOption,
  CustomizationSelectionValue,
  CustomizationSelections,
  ResolvedCustomization,
  SelectedCustomizationOption
} from "@/types/customization";

export function getDefaultSelections(config: BrandCustomizationConfig): CustomizationSelections {
  return Object.fromEntries(
    config.groups.map((group) => {
      if (group.selectionMode === "multiple") {
        const selectedDefaults = group.options.filter((option) => /default supplier selection/i.test(option.productionNote || "")).map((option) => option.id);
        if (selectedDefaults.length) return [group.id, selectedDefaults];
        const noAddOn = group.options.find((option) => isNoAddOnOption(option.id, option.label));
        return [group.id, noAddOn ? [noAddOn.id] : []];
      }
      return [group.id, group.options[0]?.id ?? ""];
    })
  );
}

function findOption(config: BrandCustomizationConfig, groupId: string, optionId: string) {
  const group = config.groups.find((item) => item.id === groupId);
  const option = group?.options.find((item) => item.id === optionId);
  return group && option ? { group, option } : null;
}

function normalizedSelections(config: BrandCustomizationConfig, selections: CustomizationSelections) {
  const defaults = getDefaultSelections(config);
  return Object.fromEntries(
    config.groups.map((group) => {
      const defaultValue = defaults[group.id] ?? (group.selectionMode === "multiple" ? [] : "");
      const value = selections[group.id] ?? defaultValue;
      const allowedIds = selectionIds(value).filter((optionId) => isOptionAvailableForCheckout(config, group.id, optionId));
      if (group.selectionMode === "multiple") return [group.id, allowedIds.length ? allowedIds : selectionIds(defaultValue)];
      return [group.id, allowedIds[0] ?? selectionIds(defaultValue)[0] ?? ""];
    })
  );
}

export function resolveCustomization(
  config: BrandCustomizationConfig,
  selections: CustomizationSelections,
  basePrice: number
): ResolvedCustomization {
  const normalized = normalizedSelections(config, selections);
  const defaults = getDefaultSelections(config);
  const issues: CustomizationIssue[] = [];
  const selectedOptions: SelectedCustomizationOption[] = [];

  for (const group of config.groups) {
    const optionIds = selectionIds(normalized[group.id]);
    const options = optionIds.map((optionId) => group.options.find((item) => item.id === optionId)).filter((option): option is CustomizationOption => Boolean(option));
    if (group.required && !options.length) {
      issues.push({ groupId: group.id, message: `${group.label} is required.` });
      continue;
    }
    for (const option of options) {
      const includedByDefault = selectionIds(defaults[group.id]).includes(option.id);
      selectedOptions.push({
        groupId: group.id,
        groupLabel: group.label,
        optionId: option.id,
        optionLabel: option.label,
        priceDelta: option.priceDelta ?? 0,
        priceConfirmed: includedByDefault || hasCheckoutPrice(option),
        productionNote: option.productionNote
      });
    }
  }

  for (const rule of config.rules) {
    const whenSelected = selectionIds(normalized[rule.when.groupId]).includes(rule.when.optionId);
    const conflictSelected = selectionIds(normalized[rule.conflictsWith.groupId]).includes(rule.conflictsWith.optionId);
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
  const requiresPriceConfirmation = selectedOptions.some((option) => !option.priceConfirmed);
  const cartAttributes = groupedCartAttributes(selectedOptions);

  return {
    selections: normalized,
    selectedOptions,
    optionPriceDelta,
    totalPrice: basePrice + optionPriceDelta,
    requiresPriceConfirmation,
    issues,
    cartAttributes: [
      { key: "DollWow Config ID", value: config.id },
      ...cartAttributes,
      ...(requiresPriceConfirmation
        ? [{ key: "DollWow Price Status", value: "Selected options need final price confirmation" }]
        : []),
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
  const group = config.groups.find((item) => item.id === groupId);
  const currentValue = selections[groupId] ?? getDefaultSelections(config)[groupId];
  const nextValue = group?.selectionMode === "multiple" ? nextMultipleSelection(defaultMultipleOptionId(group.options), currentValue, optionId) : optionId;
  const nextSelections = normalizedSelections(config, { ...selections, [groupId]: nextValue });
  const conflict = config.rules.find((rule) => {
    const whenSelected = selectionIds(nextSelections[rule.when.groupId]).includes(rule.when.optionId);
    const conflictSelected = selectionIds(nextSelections[rule.conflictsWith.groupId]).includes(rule.conflictsWith.optionId);
    return whenSelected && conflictSelected;
  });
  return conflict?.message ?? null;
}

export function describeOption(config: BrandCustomizationConfig, groupId: string, optionId: string) {
  const match = findOption(config, groupId, optionId);
  if (!match) return null;
  return `${match.group.label}: ${match.option.label}`;
}

export function isOptionAvailableForCheckout(config: BrandCustomizationConfig, groupId: string, optionId: string) {
  const match = findOption(config, groupId, optionId);
  if (!match) return false;
  const includedByDefault = selectionIds(getDefaultSelections(config)[groupId]).includes(optionId);
  return includedByDefault || hasCheckoutPrice(match.option);
}

export function defaultMultipleOptionId(options: CustomizationOption[]) {
  return (
    options.find((option) => isNoAddOnOption(option.id, option.label) || /default supplier selection/i.test(option.productionNote || ""))?.id ??
    ""
  );
}

export function selectionIds(value: CustomizationSelectionValue | undefined): string[] {
  if (Array.isArray(value)) return value.filter(Boolean);
  return value ? [value] : [];
}

export function nextMultipleSelection(firstOptionId: string, currentValue: CustomizationSelectionValue | undefined, optionId: string) {
  const current = selectionIds(currentValue);
  const noAddOnId = current.find((id) => isNoAddOnOption(id)) || (isNoAddOnOption(firstOptionId) ? firstOptionId : "");
  if (noAddOnId && optionId === noAddOnId) return [noAddOnId];
  if (current.includes(optionId)) {
    const next = current.filter((id) => id !== optionId);
    return next.length ? next : noAddOnId ? [noAddOnId] : [];
  }
  return [...current.filter((id) => id !== noAddOnId), optionId];
}

function groupedCartAttributes(selectedOptions: SelectedCustomizationOption[]) {
  const byGroup = new Map<string, SelectedCustomizationOption[]>();
  for (const option of selectedOptions) {
    const key = option.groupLabel;
    byGroup.set(key, [...(byGroup.get(key) || []), option]);
  }
  return [...byGroup.entries()].map(([groupLabel, options]) => ({
    key: `DollWow ${groupLabel}`,
    value: options
      .map((option) =>
        !option.priceConfirmed ? `${option.optionLabel} (price to confirm)` : option.priceDelta ? `${option.optionLabel} (+$${option.priceDelta})` : option.optionLabel
      )
      .join(", ")
  }));
}

function isNoAddOnOption(id: string, label = "") {
  return (
    id === "no-add-on" ||
    id === "none" ||
    id === "default" ||
    id === "factory-default" ||
    /^(no add-on|no thanks|none|factory default|default supplier selection)$/i.test(label)
  );
}

function hasCheckoutPrice(option: CustomizationOption) {
  return option.priceDelta !== undefined || /\bfree\b/i.test(option.label) || isNoAddOnOption(option.id, option.label);
}
