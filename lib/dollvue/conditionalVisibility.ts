import type { BrandCustomizationConfig, CustomizationGroup } from '@/types/customization';
import { getDefaultSelections } from '@/lib/customization/resolve';
import { customizationVisibility } from '@/lib/customization/visibility';
import { classifyAppearance } from './appearance';

/** A preview preserves its source head; it never carries a replacement-head selection. */
export function isDollVueGroupVisible(config: BrandCustomizationConfig, group: CustomizationGroup,
  selectableGroupIds: ReadonlySet<string>): boolean {
  if (group.visibleWhen === undefined) return true;
  // Fanreal's reviewed wig style belongs to its existing default wig service.
  // Do not silently select a paid implantation service or expose its inactive styles.
  if(group.id==='wig' && group.label==='Wig Style' && !selectableGroupIds.has('hair-options')) {
    const service=config.groups.find(item=>item.id==='hair-options');
    const defaults=getDefaultSelections(config);
    const visible=customizationVisibility(config,defaults);
    return Boolean(service && service.visibleWhen===undefined && service.selectionMode!=='multiple' &&
      defaults['hair-options']==='wig-cover' && !visible.issues.length && visible.activeGroupIds.has(group.id) &&
      service.options.some(option=>option.id==='wig-cover' && option.factoryExists!==false && option.displayable!==false && option.purchasable!==false) &&
      group.visibleWhen.length===1 && group.visibleWhen[0].length===1 &&
      group.visibleWhen[0][0].groupId==='hair-options' && group.visibleWhen[0][0].optionId==='wig-cover');
  }
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
