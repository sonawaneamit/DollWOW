import type { CustomizationGroup } from '@/types/customization';

/** Source Pink_1 and Pink_3 were collapsed to the same imported slug. */
export function normalizeImportedBrandColorIdentities(groups: CustomizationGroup[], brand: string): CustomizationGroup[] {
  if (!['6ye', 'hr'].includes(brand)) return groups;
  return groups.map(group => {
    if (group.id !== 'vagina-color' || group.options.length !== 5 || group.visibleWhen ||
        groups.some(candidate => candidate.visibleWhen?.some(branch => branch.some(condition => condition.groupId === group.id)))) return group;
    const expected = ['no-change', 'pink', 'light-brown', 'pink', 'dark-brown'];
    if (!group.options.every((option, index) => option.id === expected[index])) return group;
    const paths = ['/wp-content/uploads/2020/08/Pink-1-2.jpg', '/wp-content/uploads/2020/08/Dark-Brown-1-1.jpg'];
    if (![1, 3].every((index, i) => {
      const option = group.options[index];
      if (option.label !== 'Pink' || option.priceDelta !== 0 || option.swatch?.kind !== 'image') return false;
      try {
        const url = new URL(option.swatch.value);
        return ['rosemarydoll.com', 'www.rosemarydoll.com'].includes(url.hostname) && url.pathname === paths[i];
      } catch { return false; }
    })) return group;
    return {...group, options: group.options.map((option, index) =>
      index === 1 || index === 3 ? {...option, id: `${brand}-pink-source-${index}`} : option)};
  });
}

/** Repair the known lossy case-size slug without rewriting conditional imports. */
export function normalizeImportedCaseIdentities(groups: CustomizationGroup[]): CustomizationGroup[] {
  return groups.map(group => {
    if (group.id !== 'upgraded-flight-case-add-on') return group;
    if (new Set(group.options.map(option => option.id)).size === group.options.length) return group;
    if (group.visibleWhen || groups.some(candidate => candidate.visibleWhen?.some(branch => branch.some(condition => condition.groupId === group.id)))) return group;
    const options = group.options.map(option => {
      if (option.label === 'Flight Case (Doll Weight < 40kg)' || option.label === 'Flight Case (Doll Weight &lt; 40kg)') return {...option, id: 'flight-case-under-40kg'};
      if (option.label === 'Flight Case (Doll Weight ≥ 40kg)') return {...option, id: 'flight-case-40kg-and-over'};
      return option;
    });
    // Unknown collisions remain visible to the audit instead of acquiring guessed IDs.
    return new Set(options.map(option => option.id)).size === options.length ? {...group, options} : group;
  });
}
