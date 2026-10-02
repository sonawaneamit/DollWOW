import type { BrandCustomizationConfig, CustomizationGroup, CustomizationSelections } from '@/types/customization';
import type { ExactUpgradeBinding } from '@/lib/cart/exact-upgrade-lines';
import type { Product } from '@/types/product';
import type { TemplatePresetDefinition } from './template-presets';
import { templateConfigSignature } from './template-config-signature';
import { customizationVisibility } from './visibility';

export const SUKI_PRODUCT_ID = 'gid://shopify/Product/10630580273336';
export const SUKI_VARIANT_ID = 'gid://shopify/ProductVariant/54234105675960';
export const SUKI_CONFIG_ID = 'irontech-suki-166-2-s20-ros-max-v1';
export const SUKI_TEMPLATE_TAG = 'options:irontech-female-silicone-166v2-s20-ros-max';
export const SUKI_LOCKED_SELECTIONS: Record<string, string> = {
  'choose-a-head': 'default', 'silicone-head-type': 'ros-max', 'buy-2nd-head': 'no'
};

export type SukiSourceGroup = CustomizationGroup & { defaultOptionIds: string[] };

export function getSukiCustomizationConfig(product: Product): BrandCustomizationConfig | undefined {
  if (product.id !== SUKI_PRODUCT_ID) return undefined;
  const groups = product.extended.customizationGroups;
  if (!groups?.every(g => Array.isArray((g as SukiSourceGroup).defaultOptionIds))) {
    throw new Error('The prepared Suki menu must be installed before enabling its config.');
  }
  return prepareSukiConfig(groups as SukiSourceGroup[]);
}

/** Exact selected branch only: alternative head graphs are not verified by this snapshot. */
export function prepareSukiConfig(source: SukiSourceGroup[]): BrandCustomizationConfig {
  if (source.length !== 23 || source.reduce((n, g) => n + g.options.length, 0) !== 181) {
    throw new Error('Suki source menu changed; review the exact snapshot.');
  }
  const groups = structuredClone(source);
  const locked = SUKI_LOCKED_SELECTIONS;
  if (new Set(groups.map(g => g.id)).size !== groups.length || Object.entries(locked).some(([id, optionId]) =>
    !groups.some(g => g.id === id && g.options.some(o => o.id === optionId)))) throw new Error('Invalid Suki identity groups.');
  for (const group of groups) {
    if (new Set(group.options.map(o => o.id)).size !== group.options.length) throw new Error('Duplicate Suki option.');
    if (group.defaultOptionIds.some(id => !group.options.some(o => o.id === id))) throw new Error('Unknown Suki default.');
    group.options.sort((a, b) => Number(group.defaultOptionIds.includes(b.id)) - Number(group.defaultOptionIds.includes(a.id)));
    for (const option of group.options) {
      if (!Number.isFinite(option.priceDelta) || option.priceDelta! < 0 || option.priceVerified !== true) {
        throw new Error('Suki requires explicit verified option prices.');
      }
      option.sourceProductionNoteSignals = group.defaultOptionIds.includes(option.id)
        ? { defaultSupplierSelection: true } : undefined;
      // Shopify's mapper derives trusted default signals from this existing import convention.
      option.productionNote = group.defaultOptionIds.includes(option.id) ? 'Default supplier selection.' : undefined;
      if (locked[group.id] && option.id !== locked[group.id]) {
        option.purchasable = false;
        option.displayable = false;
        option.description = undefined;
      }
      if (group.id === 'premium-head-body-options' && option.id === 'ultra-light-weight') {
        option.purchasable = true;
        option.description = 'Ultra Light Weight body option.';
      }
    }
  }
  // The selected ROS MAX snapshot contains wigs and hemisphere eyes, not implanted primary hair.
  for (const id of ['wig-style', 'hemisphere-eyes']) {
    groups.find(g => g.id === id)!.visibleWhen = [[{ groupId: 'silicone-head-type', optionId: 'ros-max' }]];
  }
  return { id: SUKI_CONFIG_ID, brandLabel: 'Irontech Dolls',
    leadTimeNote: 'Production details require supplier confirmation.', groups, rules: [] };
}

/** Hook at the start of rawDefaultSelections; undefined leaves every other product unchanged. */
export function sukiDefaultSelections(config: BrandCustomizationConfig): CustomizationSelections | undefined {
  if (config.id !== SUKI_CONFIG_ID) return undefined;
  return Object.fromEntries(config.groups.map(group => {
    const selected = group.options.filter(o => o.priceDelta === 0 && o.purchasable !== false &&
      o.sourceProductionNoteSignals?.defaultSupplierSelection).map(o => o.id);
    return [group.id, group.selectionMode === 'multiple' ? selected : selected[0] ?? group.options[0]?.id ?? ''];
  }));
}

export function sukiPresetDefinition(config: BrandCustomizationConfig): TemplatePresetDefinition {
  if (config.id !== SUKI_CONFIG_ID) throw new Error('Suki recipe requires the exact Suki config.');
  const choice = (optionId: string) => ({ groupId: 'premium-head-body-options', optionId });
  return { tag: SUKI_TEMPLATE_TAG, signature: templateConfigSignature(config), tiers: [
    { id: 'starter', description: 'S20 ROS MAX with the selected S+ makeup and body finish.',
      add: [choice('s-makeup-upgrade'), choice('s-body-painting')], remove: [] },
    { id: 'enthusiast', description: 'ULW body option with soft thigh.',
      add: [choice('ultra-light-weight'), choice('soft-thigh')], remove: [] },
    { id: 'collector', description: 'Adds body heating and soft belly to the ULW and soft-thigh build.',
      add: [choice('heating'), choice('soft-belly')], remove: [] }
  ] };
}

type RegistryBinding = Omit<ExactUpgradeBinding, 'parentVariantId'>;
type RegistryGroups = Record<string, RegistryBinding[]>;

/** Find a purchasable ancestry witness without unlocking the primary head or second head. */
function reachableChoice(config: BrandCustomizationConfig, groupId: string, optionId: string) {
  const walk = (id: string, choice: string, state: Record<string, string[]>, path: Set<string>): Record<string, string[]>[] => {
    const group = config.groups.find(g => g.id === id);
    const option = group?.options.find(o => o.id === choice);
    if (!group || !option || path.has(id) || option.purchasable === false || option.factoryExists === false ||
      option.displayable === false || option.priceVerified !== true || !Number.isFinite(option.priceDelta) || option.priceDelta! < 0 ||
      (SUKI_LOCKED_SELECTIONS[id] && SUKI_LOCKED_SELECTIONS[id] !== choice)) return [];
    const prior = state[id] ?? [];
    if (group.selectionMode !== 'multiple' && prior.some(value => value !== choice)) return [];
    const next = { ...state, [id]: [...new Set([...prior, choice])] };
    if (config.rules.some(rule => next[rule.when.groupId]?.includes(rule.when.optionId) &&
      next[rule.conflictsWith.groupId]?.includes(rule.conflictsWith.optionId))) return [];
    if (group.visibleWhen === undefined) return [next];
    return group.visibleWhen.flatMap(branch => branch.reduce<Record<string, string[]>[]>((states, parent) =>
      states.flatMap(s => walk(parent.groupId, parent.optionId, s, new Set([...path, id]))), [next]));
  };
  return walk(groupId, optionId, Object.fromEntries(Object.entries(SUKI_LOCKED_SELECTIONS).map(([g, id]) => [g, [id]])), new Set()).length > 0;
}

// Only reviewed semantic equivalences. Equal prices alone never establish identity.
const chargeAliases: Record<string, [string, string]> = {
  'premium-head-body-options/heating': ['Premium Head & Body Options (Multiple)', 'Body Heating'],
  'premium-head-body-options/oral-heating': ['Premium Head & Body Options (Multiple)', 'Oral Heating Function'],
  'premium-head-body-options/oral-auto-sucking': ['Premium Head & Body Options (Multiple)', 'Oral Sex Function'],
  'premium-head-body-options/facial-freckles': ['Premium Head & Body Options (Multiple)', 'Add Moles & Freckles'],
  'premium-head-body-options/bikini-line': ['Premium Head & Body Options (Multiple)', 'Bikini Line'],
  'premium-head-body-options/auto-blowjob': ['Robot Option', 'Auto Blowjob'],
  'ironai-bionic-vaginax/yes': ['IronAI Bionic VaginaX', 'IronAI Bionic VaginaX \u2014 anal unavailable once installed'],
  'extra-head-type/ros': ['Head Type', 'Movable Jaw (ROS | FREE)'],
  'extra-head-type/ros-max': ['Head Type', 'ROS MAX Upgrade (FREE)'],
  'extra-head-hair/implanted-synthetic-hair': ['Hairstyle', 'Implanted Synthetic Hair'],
  'extra-head-hair/implanted-long-straight-synthetic-hair': ['Hairstyle', 'Implanted Long Straight Synthetic Hair'],
  'extra-head-hair/implanted-synthetic-hair-with-dreadlocks': ['Hairstyle', 'Implanted Synthetic Hair with Dreadlocks'],
  'extra-head-premium/oral-sex-function': ['Premium Head & Body Options (Multiple)', 'Oral Sex Function'],
  'extra-head-premium/oral-heating': ['Premium Head & Body Options (Multiple)', 'Oral Heating Function'],
  'extra-head-premium/facial-freckles': ['Premium Head & Body Options (Multiple)', 'Add Moles & Freckles']
};

export function prepareSukiChargeMappings(config: BrandCustomizationConfig, registry: RegistryGroups) {
  if (config.id !== SUKI_CONFIG_ID || customizationVisibility(config, SUKI_LOCKED_SELECTIONS).issues.length) {
    throw new Error('Charge analysis requires a valid Suki conditional graph.');
  }
  type Choice = { groupId: string; optionId: string; group: string; label: string; unitAmount: number };
  const reused: Array<{ groupId: string; optionId: string; semanticIdentity: string; sourceRegistryGroup: string; binding: ExactUpgradeBinding }> = [];
  const missing: Array<Choice & { semanticIdentity: string; reason: string; existingSemanticAmounts: number[] }> = [];
  const exclusions: Array<Choice & { reason: string }> = [];
  for (const group of config.groups) for (const option of group.options) {
    if (!(option.priceDelta! > 0)) continue;
    const choice = { groupId: group.id, optionId: option.id, group: group.label, label: option.label, unitAmount: option.priceDelta! };
    if (!reachableChoice(config, group.id, option.id)) {
      exclusions.push({ ...choice, reason: option.purchasable === false
        ? option.description ?? 'Not purchasable.' : 'Unreachable under locked primary ROS MAX / no extra head.' });
      continue;
    }
    const [sourceGroup, sourceLabel] = chargeAliases[`${group.id}/${option.id}`] ?? [group.label, option.label];
    const semanticIdentity = `${sourceGroup}: ${sourceLabel}`;
    const semanticMatches = Object.entries(registry).flatMap(([key, bindings]) => bindings
      .filter(b => !b.readOnly && b.productTitle.startsWith('Irontech Dolls -') && b.group === sourceGroup &&
        (b.choiceLabels ?? [b.label]).includes(sourceLabel) && b.currencyCode === 'USD')
      .map(binding => ({ key, binding })));
    const matches = semanticMatches.filter(m => m.binding.unitAmount === option.priceDelta);
    const variants = new Set(matches.map(m => m.binding.merchandiseId));
    if (variants.size !== 1) {
      missing.push({ ...choice, semanticIdentity, reason: variants.size > 1 ? 'Ambiguous exact semantic variants' :
        semanticMatches.length ? 'Exact semantic choice exists at a different amount; do not mutate it' : 'No verified exact semantic choice',
        existingSemanticAmounts: [...new Set(semanticMatches.map(m => m.binding.unitAmount))].sort((a, b) => a - b) });
      continue;
    }
    const match = matches[0];
    reused.push({ groupId: group.id, optionId: option.id, semanticIdentity, sourceRegistryGroup: match.key,
      binding: { ...match.binding, parentVariantId: SUKI_VARIANT_ID, group: group.label, label: option.label,
        choiceLabels: [option.label] } });
  }
  return { scope: 'Purchasable paid choices reachable with locked S20 / ROS MAX / no extra head', reused, missing, exclusions };
}
