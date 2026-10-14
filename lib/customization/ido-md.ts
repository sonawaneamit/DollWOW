import type { Product } from '@/types/product';
import type { BrandCustomizationConfig, CustomizationGroup, CustomizationRule, CustomizationSelections } from '@/types/customization';
import { hasSourceProductionNoteSignal } from './production-notes';
import { mdRosRules } from './md-ros';

export const IDO_MENU_TAG = 'options:ido-silicone-included-manual-v1';
export const MD_MENU_TAG = 'options:md-silicone-body-mvp-v1';

// Factory standard construction, not optional promotional upgrades.
const fixedIds: Record<string, Record<string, string[]>> = {
  [IDO_MENU_TAG.slice(8)]: {
    'makeup-options': ['realistic-body-painting-free', 'real-skin-texture'],
    'premium-head-body-options-multiple': ['implanted-eyebrows-eyelashes-free', 'super-weight-reduction-free',
      'advanced-finger-joints-free', 'hard-hands-free', 'softer-butt-free', 'wire-toes-free']
  },
  [MD_MENU_TAG.slice(8)]: {
    'premium-head-body-options-multiple': ['hyper-realism-body-painting-free', 'articulated-fingers-free', 'hard-hand', 'real-skin-texture']
  }
};

export function isIdoMdFixedInclusion(config: BrandCustomizationConfig, groupId: string, optionId: string): boolean {
  const option = config.groups.find(group => group.id === groupId)?.options.find(option => option.id === optionId);
  if (config.id === IDO_MENU_TAG.slice(8) && groupId === 'ido-october-gifts' && optionId === 'lingerie-set') return option?.priceDelta === 0;
  if (config.id === MD_MENU_TAG.slice(8) && config.groups.some(group => group.id === 'md-october-gifts') &&
    (groupId === 'md-october-gifts' || groupId === 'accessories' && optionId === 'vine-talk-ai-box-free')) return option?.priceDelta === 0;
  return Boolean(fixedIds[config.id]?.[groupId]?.includes(optionId) && option?.priceDelta === 0);
}

export function getIdoMdCustomizationConfig(product: Product): BrandCustomizationConfig | undefined {
  const tags = [IDO_MENU_TAG, MD_MENU_TAG].filter(tag => product.tags.includes(tag));
  if (tags.length !== 1) return undefined;
  const tag = tags[0];
  const brand = (product.extended.brand || product.vendor).toLowerCase().replace(/[\s-]/g, '');
  if (tag === IDO_MENU_TAG ? !['ido', 'idodoll', 'idodolls'].includes(brand) : !['md', 'mddoll', 'mddolls'].includes(brand)) return undefined;
  const supplied = product.extended.customizationGroups;
  if (!supplied?.length || supplied.some(group => !group.id || !group.label || !group.options?.length)) return undefined;
  // The Shopify mapper intentionally strips saved signals. Restore only exact
  // factory inclusions here; never change the global mapper or infer from FREE.
  const groups = supplied.map(group => ({ ...group, options: group.options.map(option =>
    fixedIds[tag.slice(8)]?.[group.id]?.includes(option.id) && option.priceDelta === 0
      ? { ...option, sourceProductionNoteSignals: { ...option.sourceProductionNoteSignals, defaultSupplierSelection: true as const } }
      : option
  ) }));
  const rules: CustomizationRule[] = [];
  const has = (groupId: string, optionId: string) => groups.some(group => group.id === groupId && group.options.some(option => option.id === optionId));
  // Exact reviewed IDO constraint; MD's supplied conditional graph is retained unchanged.
  if (tag === IDO_MENU_TAG && has('accessories', 'replaceable-vagina-insert') && has('vagina', 'fixed')) {
    rules.push({
      id: 'ido-replaceable-insert-removable-only', type: 'incompatible',
      when: { groupId: 'accessories', optionId: 'replaceable-vagina-insert' },
      conflictsWith: { groupId: 'vagina', optionId: 'fixed' },
      message: 'A replacement insert requires the removable configuration.'
    });
  }
  if (tag === MD_MENU_TAG) rules.push(...mdRosRules(groups, product.extended.headModel));
  return {
    id: tag.slice('options:'.length), brandLabel: tag === IDO_MENU_TAG ? 'IDO' : 'MD Doll',
    leadTimeNote: 'Custom details and compatibility are reviewed before production begins.',
    groups, rules
  };
}

export function idoMdIncludedDefaults(config: BrandCustomizationConfig, group: CustomizationGroup): string[] | undefined {
  if (![IDO_MENU_TAG.slice(8), MD_MENU_TAG.slice(8)].includes(config.id) || group.selectionMode !== 'multiple') return undefined;
  const included = group.options.filter(option => option.priceDelta === 0 && option.priceVerified === true &&
    option.purchasable !== false && option.factoryExists !== false && option.displayable !== false &&
    hasSourceProductionNoteSignal(option, 'defaultSupplierSelection'));
  return included.length ? included.map(option => option.id) : undefined;
}

export function idoMdFixedSelection(config: BrandCustomizationConfig, group: CustomizationGroup, value: string | string[]): string[] | undefined {
  if (group.selectionMode !== 'multiple' || !group.options.some(option => isIdoMdFixedInclusion(config, group.id, option.id))) return undefined;
  const fixed = group.options.filter(option => isIdoMdFixedInclusion(config, group.id, option.id) && option.priceDelta === 0).map(option => option.id);
  return [...new Set([...fixed, ...(Array.isArray(value) ? value : [value]).filter(Boolean)])];
}

export function mdIncludedSoftButt(config: BrandCustomizationConfig, selections: CustomizationSelections, groupId: string, optionId: string): boolean {
  const body = 'premium-head-body-options-multiple';
  const selected = selections[body];
  return config.id === MD_MENU_TAG.slice(8) && groupId === body && optionId === 'soft-butt' &&
    Array.isArray(selected) && selected.includes('bionic-skin-softer-skin');
}
