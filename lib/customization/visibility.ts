import type { BrandCustomizationConfig, CustomizationIssue, CustomizationSelections } from '@/types/customization';

/** Shared by the configurator and server. Invalid conditional menus cannot be purchased. */
export function customizationVisibility(config: BrandCustomizationConfig, selections: CustomizationSelections) {
  const issues: CustomizationIssue[] = [];
  const all = new Set(config.groups.map(group => group.id));
  if (!config.groups.some(group => group.visibleWhen !== undefined)) return { activeGroupIds: all, issues };
  const groups = new Map(config.groups.map(group => [group.id, group]));
  const invalid = () => { throw new Error('These configuration options need review before checkout. Please contact us.'); };
  try {
    if (groups.size !== config.groups.length) invalid();
    const visited = new Set<string>(), visiting = new Set<string>();
    const check = (id: string) => {
      if (visited.has(id)) return;
      if (visiting.has(id)) invalid();
      visiting.add(id);
      const group = groups.get(id)!;
      if (new Set(group.options.map(option => option.id)).size !== group.options.length) invalid();
      if (group.visibleWhen !== undefined) {
        if (!Array.isArray(group.visibleWhen) || !group.visibleWhen.length) invalid();
        for (const branch of group.visibleWhen) {
          if (!Array.isArray(branch) || !branch.length) invalid();
          for (const rule of branch) {
            if (!rule || typeof rule.groupId !== 'string' || typeof rule.optionId !== 'string') invalid();
            const parent = groups.get(rule.groupId);
            if (!parent?.options.some(option => option.id === rule.optionId)) invalid();
            check(rule.groupId);
          }
        }
      }
      visiting.delete(id);
      visited.add(id);
    };
    config.groups.forEach(group => check(group.id));
    const visible = new Map<string, boolean>();
    const isVisible = (id: string): boolean => {
      if (visible.has(id)) return visible.get(id)!;
      const group = groups.get(id)!;
      const result = group.visibleWhen === undefined || group.visibleWhen.some(branch => branch.every(rule => {
        const value = selections[rule.groupId];
        const ids = Array.isArray(value) ? value : value ? [value] : [];
        return isVisible(rule.groupId) && ids.includes(rule.optionId);
      }));
      visible.set(id, result);
      return result;
    };
    return { activeGroupIds: new Set(config.groups.filter(group => isVisible(group.id)).map(group => group.id)), issues };
  } catch {
    issues.push({ message: 'These configuration options need review before checkout. Please contact us.' });
    return { activeGroupIds: new Set<string>(), issues };
  }
}
