import type {
  BrandCustomizationConfig,
  CustomizationIssue,
  CustomizationOption,
  CustomizationSelectionValue,
  CustomizationSelections,
  ResolvedCustomization,
  SelectedCustomizationOption
} from "@/types/customization";
import { hasSourceProductionNoteSignal } from "@/lib/customization/production-notes";

export function getDefaultSelections(config: BrandCustomizationConfig): CustomizationSelections {
  return Object.fromEntries(
    config.groups.map((group) => {
      if (group.selectionMode === "multiple") {
        const neutralDefault = group.options.find((option) => isNeutralDefaultOption(option.id, option.label, option.productionNote, option.sourceProductionNoteSignals));
        return [group.id, neutralDefault ? [neutralDefault.id] : []];
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
        priceConfirmed: includedByDefault || hasCheckoutPrice(option)
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
  const nextValue = group?.selectionMode === "multiple" ? nextMultipleSelection(group.options, currentValue, optionId) : optionId;
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
  if (match.option.purchasable === false) return false;
  const includedByDefault = selectionIds(getDefaultSelections(config)[groupId]).includes(optionId);
  return includedByDefault || isOptionPurchasable(match.option);
}

export function isOptionPriceVerified(option: CustomizationOption) {
  if (option.priceVerified !== undefined) return option.priceVerified;
  return hasCheckoutPrice(option);
}

export function isOptionPurchasable(option: CustomizationOption) {
  if (option.purchasable !== undefined) return option.purchasable;
  return isOptionPriceVerified(option);
}

export function defaultMultipleOptionId(options: CustomizationOption[]) {
  return options.find((option) => isNeutralDefaultOption(option.id, option.label, option.productionNote, option.sourceProductionNoteSignals))?.id ?? "";
}

export function selectionIds(value: CustomizationSelectionValue | undefined): string[] {
  if (Array.isArray(value)) return value.filter(Boolean);
  return value ? [value] : [];
}

export function nextMultipleSelection(options: CustomizationOption[], currentValue: CustomizationSelectionValue | undefined, optionId: string) {
  const current = selectionIds(currentValue);
  const neutralIds = new Set(
    options
      .filter((option) => isNeutralDefaultOption(option.id, option.label, option.productionNote, option.sourceProductionNoteSignals))
      .map((option) => option.id)
  );
  const defaultId = options.find((option) => neutralIds.has(option.id))?.id ?? "";
  if (neutralIds.has(optionId)) return [optionId];
  if (current.includes(optionId)) {
    const next = current.filter((id) => id !== optionId && !neutralIds.has(id));
    return next.length ? next : defaultId ? [defaultId] : [];
  }
  return [...current.filter((id) => !neutralIds.has(id)), optionId];
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

export function isNeutralDefaultOption(
  id: string,
  label = "",
  productionNote = "",
  sourceProductionNoteSignals?: CustomizationOption["sourceProductionNoteSignals"]
) {
  return (
    id === "no-add-on" ||
    id === "none" ||
    id === "default" ||
    id === "factory-default" ||
    /^(no add-on|no thanks|none|as shown|factory default|default supplier selection)$/i.test(label) ||
    /default supplier selection|no paid add-on/i.test(productionNote) ||
    hasSourceProductionNoteSignal({ sourceProductionNoteSignals }, "defaultSupplierSelection", "noPaidAddOn")
  );
}

export function isNoAddOnOption(
  id: string,
  label = "",
  productionNote = "",
  sourceProductionNoteSignals?: CustomizationOption["sourceProductionNoteSignals"]
) {
  return isNeutralDefaultOption(id, label, productionNote, sourceProductionNoteSignals);
}

function hasCheckoutPrice(option: CustomizationOption) {
  return option.priceDelta !== undefined || /\bfree\b/i.test(option.label) ||
    isNeutralDefaultOption(option.id, option.label, option.productionNote, option.sourceProductionNoteSignals);
}
