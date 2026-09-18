import type { BrandCustomizationConfig, CustomizationSelections } from "@/types/customization";
import type { ConfigurationPreset } from "./presets";
import { getOptionConflict, isOptionAvailableForCheckout, resolveCustomization, selectionIds } from "./resolve";

export type PresetChoiceSlot = {
  groupId: string;
  emptyOptionId: string;
  label: string;
  title: string;
  excludedOptionIds?: readonly string[];
};

export type ChoiceConfigurationPreset = ConfigurationPreset & {
  choiceSlots: PresetChoiceSlot[];
  pendingChoices: PresetChoiceSlot[];
};

// Shared SE extra-head group. Other brands' choice roles need separate review.
export const litaHeadChoice: PresetChoiceSlot = {
  groupId: "add-extra-head", emptyOptionId: "none", label: "Extra head", title: "Choose your extra head",
  excludedOptionIds: ["extra-other-heads"]
};

export function presetChoiceOptions(config: BrandCustomizationConfig, selections: CustomizationSelections, slot: PresetChoiceSlot) {
  const group = config.groups.find(item => item.id === slot.groupId);
  if (!group) return [];
  return group.options.filter(option => option.id !== slot.emptyOptionId &&
    !slot.excludedOptionIds?.includes(option.id) &&
    Number.isFinite(option.priceDelta) && option.priceDelta! >= 0 &&
    isOptionAvailableForCheckout(config, group.id, option.id) &&
    !getOptionConflict(config, selections, group.id, option.id));
}

export function replacePresetChoice(config: BrandCustomizationConfig, selections: CustomizationSelections, slot: PresetChoiceSlot, optionId: string): CustomizationSelections {
  const group = config.groups.find(item => item.id === slot.groupId);
  const otherChoices = selectionIds(selections[slot.groupId]).filter(id => id !== slot.emptyOptionId).slice(1);
  return { ...selections, [slot.groupId]: group?.selectionMode === "multiple"
    ? [...new Set([optionId, ...otherChoices])].filter(id => id !== slot.emptyOptionId || !otherChoices.length)
    : optionId };
}

/** Reserve the upgrade cost without silently selecting its appearance. */
export function withPresetChoices(
  presets: ConfigurationPreset[], config: BrandCustomizationConfig, basePrice: number,
  current: CustomizationSelections, slots: PresetChoiceSlot[], presetOwnedGroupIds: readonly string[] = []
): ChoiceConfigurationPreset[] {
  return presets.flatMap(preset => {
    const selections = { ...preset.selections };
    const choiceSlots = slots.filter(slot => selectionIds(preset.selections[slot.groupId]).some(id => id !== slot.emptyOptionId));
    for (const slot of slots) {
      const group = config.groups.find(item => item.id === slot.groupId);
      const eligible = presetChoiceOptions(config, selections, slot);
      const removePresetUpgrade = presetOwnedGroupIds.includes(slot.groupId) && !choiceSlots.some(choice => choice.groupId === slot.groupId);
      const existing = removePresetUpgrade ? [] : selectionIds(current[slot.groupId]).filter(id => eligible.some(option => option.id === id));
      selections[slot.groupId] = group?.selectionMode === "multiple" ? (existing.length ? existing : [slot.emptyOptionId]) : existing[0] ?? slot.emptyOptionId;
    }
    const resolved = resolveCustomization(config, selections, basePrice);
    if (resolved.issues.length || resolved.requiresPriceConfirmation) return [];
    const pendingChoices = choiceSlots.filter(slot => selectionIds(selections[slot.groupId]).every(id => id === slot.emptyOptionId));
    let reservation = 0;
    for (const slot of pendingChoices) {
      const options = presetChoiceOptions(config, selections, slot);
      if (!options.length) return [];
      reservation += Math.min(...options.map(option => option.priceDelta!));
    }
    const appearanceLabels = new Set(config.groups.filter(group => slots.some(slot => slot.groupId === group.id))
      .flatMap(group => group.options.map(option => option.label)));
    return [{ ...preset, selections: resolved.selections, choiceSlots, pendingChoices,
      description: preset.id === "popular" && choiceSlots.some(slot => slot.groupId === "add-extra-head")
        ? "Extra head of your choice, with selected upgrades." : preset.description,
      totalPrice: Math.round((resolved.totalPrice + reservation) * 100) / 100,
      highlights: [...preset.highlights.filter(label => !appearanceLabels.has(label)),
        ...choiceSlots.map(slot => `${slot.label}: your choice`)]
    }];
  });
}
