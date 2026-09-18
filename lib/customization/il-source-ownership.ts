import type { CustomizationGroup } from '@/types/customization';
import type { Product } from '@/types/product';
import evidence from './evidence/il-extra-head-ownership.json';

function project(group: CustomizationGroup) {
  return {
    id: group.id, label: group.label, required: Boolean(group.required), selectionMode: group.selectionMode ?? 'single',
    options: group.options.map(option => ({
      id: option.id, label: option.label, priceDelta: option.priceDelta ?? null,
      priceVerified: option.priceVerified ?? null, purchasable: option.purchasable ?? null
    }))
  };
}

export function restoreIlExtraHeadOwnership(product: Product, groups: CustomizationGroup[]): CustomizationGroup[] {
  const reviewed = evidence.products.find(row => row.handle === product.handle && row.productId === product.id);
  if (!reviewed || product.extended.brand !== 'IL Doll') return groups;
  if (JSON.stringify(groups.map(group => group.id)) !== JSON.stringify(evidence.expectedGroupIds)) return groups;
  if (JSON.stringify(evidence.indexes.map(index => project(groups[index]))) !== JSON.stringify(evidence.expectedGroups)) return groups;
  // The reviewed dealer form makes these controls depend on an extra head.
  // Restore ownership so the existing dependency policy cannot bill them as body options.
  return groups.map((group, index) => index === 22 || index === 23
    ? { ...group, label: `${group.label} For Extra Head` }
    : group);
}
