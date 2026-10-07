import type { BrandCustomizationConfig, CustomizationGroup } from '@/types/customization';
import { getDefaultSelections } from '@/lib/customization/resolve';
import { customizationVisibility } from '@/lib/customization/visibility';
import { classifyAppearance } from './appearance';

/** A preview preserves its source head; it never carries a replacement-head selection. */
export function isDollVueGroupVisible(config: BrandCustomizationConfig, group: CustomizationGroup,
  selectableGroupIds: ReadonlySet<string>): boolean {
  if (group.visibleWhen === undefined) return true;
  if (group.id !== 'eye-color' || selectableGroupIds.has('head')) return false;
  if (!group.options.some(option => {
    const meaning = classifyAppearance(group, option);
    return meaning.status === 'candidate' && meaning.attribute === 'eye-color';
  })) return false;
  const head = config.groups.find(item => item.id === 'head');
  if (!head || head.visibleWhen !== undefined || head.selectionMode === 'multiple') return false;
  const defaults = getDefaultSelections(config);
  const visibility = customizationVisibility(config, defaults);
  if (visibility.issues.length || defaults.head !== 'no-change' ||
    !visibility.activeGroupIds.has('head') || !visibility.activeGroupIds.has(group.id)) return false;
  const sourceHead = head.options.find(option => option.id === 'no-change');
  if (!sourceHead || sourceHead.factoryExists === false || sourceHead.displayable === false || sourceHead.purchasable === false) return false;
  // Graph validation above rejects malformed branches; nested/other dependencies remain unsupported.
  return group.visibleWhen.every(branch => branch.every(condition => condition.groupId === 'head'));
}
