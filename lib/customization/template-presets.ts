import type { BrandCustomizationConfig, CustomizationSelections } from '@/types/customization';
import type { ConfigurationPreset, PresetId } from './presets';
import { wmPresetCompatibilityIssues } from './presets';
import { getDefaultSelections, isNeutralDefaultOption, isOptionAvailableForCheckout, resolveCustomization, selectionIds } from './resolve';
import { templateConfigSignature } from './template-config-signature';

type Choice = { groupId: string; optionId: string };
export type TemplateRecipeTier = {
  id: 'starter' | 'enthusiast' | 'collector';
  description: string;
  add: Choice[];
  remove: Choice[];
};
export type TemplatePresetDefinition = {
  tag: string;
  signature: string;
  tiers: TemplateRecipeTier[];
};

const tierIds: Record<TemplateRecipeTier['id'], PresetId> = { starter: 'starter', enthusiast: 'popular', collector: 'premium' };
const labels = { starter: 'Starter', enthusiast: 'Enthusiast', collector: 'Collector' };

export function presetChoiceLabel(label: string) {
  // Supplier sale badges can outlive their price. The tier total owns pricing;
  // retain construction/compatibility parentheses, not imported sale slogans.
  return label.replace(/\s*\((?:Orig\.?\s*\$[\d,.]+(?:\s*\|\s*FREE)?|FREE)\)/gi, '').trim();
}

export function templateConfigurationPresets(
  definition: TemplatePresetDefinition | null,
  catalogConfig: BrandCustomizationConfig,
  pricedConfig: BrandCustomizationConfig,
  basePrice: number,
  current: CustomizationSelections
): ConfigurationPreset[] {
  if (!definition || !Number.isFinite(basePrice) || basePrice < 0 || definition.signature !== templateConfigSignature(catalogConfig)) return [];
  if (definition.tiers.map(tier => tier.id).join(',') !== 'starter,enthusiast,collector') return [];
  const managed = new Map<string, Set<string>>();
  for (const tier of definition.tiers) for (const choice of [...tier.add, ...tier.remove]) {
    const group = pricedConfig.groups.find(g => g.id === choice.groupId);
    if (!group || group.options.filter(o => o.id === choice.optionId).length !== 1 || !isOptionAvailableForCheckout(pricedConfig, choice.groupId, choice.optionId)) return [];
    if (!managed.has(choice.groupId)) managed.set(choice.groupId, new Set());
    managed.get(choice.groupId)!.add(choice.optionId);
  }
  const defaults = getDefaultSelections(pricedConfig);
  const state: CustomizationSelections = { ...defaults, ...current };
  // Replace only recipe-owned choices, retaining independent extras in the same group.
  for (const [groupId, ids] of managed) {
    const group = pricedConfig.groups.find(g => g.id === groupId)!;
    if (group.selectionMode === 'multiple') state[groupId] = selectionIds(state[groupId]).filter(id => !ids.has(id));
    else if (selectionIds(state[groupId]).some(id => ids.has(id))) state[groupId] = defaults[groupId];
    if (definition.tag.startsWith('options:piper-') && group.label === 'Skeleton Type Add-On' && !selectionIds(state[groupId]).length) state[groupId] = defaults[groupId];
  }
  const result: ConfigurationPreset[] = [];
  for (const tier of definition.tiers) {
    for (const choice of tier.remove) {
      const group = pricedConfig.groups.find(g => g.id === choice.groupId)!;
      const selected = selectionIds(state[choice.groupId]).filter(id => id !== choice.optionId);
      state[choice.groupId] = group.selectionMode === 'multiple' ? selected : selected[0] ?? '';
    }
    for (const choice of tier.add) {
      const group = pricedConfig.groups.find(g => g.id === choice.groupId)!;
      if (group.selectionMode === 'multiple') {
        const added = group.options.find(o => o.id === choice.optionId)!;
        const selected = selectionIds(state[choice.groupId]).filter(id => {
          const option = group.options.find(o => o.id === id);
          // Imported standing menus can mark the mutually exclusive default as a checkbox.
          if (group.label === 'Standing Add-On' && /^standing\b/i.test(added.label) && /^non[ -]standing$/i.test(option?.label ?? '')) return false;
          if (definition.tag.startsWith('options:piper-') && group.label === 'Skeleton Type Add-On' && /^EVO\b/i.test(added.label) && /^Regular$/i.test(option?.label ?? '')) return false;
          return option && !isNeutralDefaultOption(option.id, option.label, option.productionNote, option.sourceProductionNoteSignals);
        });
        state[choice.groupId] = [...new Set([...selected, choice.optionId])];
      } else state[choice.groupId] = choice.optionId;
    }
    const resolved = resolveCustomization(pricedConfig, state, basePrice);
    if (definition.tag.startsWith('options:wm-') && wmPresetCompatibilityIssues(pricedConfig, state).length) return [];
    if (tier.add.some(choice => !selectionIds(resolved.selections[choice.groupId]).includes(choice.optionId))) return [];
    const expected = Object.entries(state).filter(([g]) =>
      !pricedConfig.groups.some(group => group.id === g && group.visibleWhen !== undefined) || Object.hasOwn(resolved.selections, g)
    ).flatMap(([g, value]) => selectionIds(value).map(id => `${g}/${id}`)).sort();
    const actual = resolved.selectedOptions.map(o => `${o.groupId}/${o.optionId}`).sort();
    if (resolved.issues.length || resolved.requiresPriceConfirmation || JSON.stringify(expected) !== JSON.stringify(actual)) return [];
    const highlights = resolved.selectedOptions.filter(o => managed.get(o.groupId)?.has(o.optionId)).map(o => presetChoiceLabel(o.optionLabel));
    if (!highlights.length) return [];
    result.push({
      id: tierIds[tier.id], label: labels[tier.id], description: tier.description,
      selections: structuredClone(resolved.selections), totalPrice: resolved.totalPrice,
      highlights, managedGroupIds: [...managed.keys()]
    });
  }
  return result;
}
