import { describe, expect, it } from 'vitest';
import { gynoidProductFixture } from './fixtures/gynoid-product';
import { getCustomizationConfig } from '@/lib/customization/configs';
import { getDefaultSelections, resolveCustomization } from '@/lib/customization/resolve';
import { gynoidDependencyPlan } from '@/lib/cart/gynoid-dependencies';
import { exactUpgradeLines } from '@/lib/cart/exact-upgrade-lines';
import { namedUpgradeBuilds } from '@/lib/cart/named-upgrade-builds';
import type { SelectedCustomizationOption } from '@/types/customization';

const premium = 'premium-head-body-options-multiple';
function fixture(color = 'black') {
  const product = gynoidProductFixture(3), config = getCustomizationConfig(product);
  const selections = { ...getDefaultSelections(config), [premium]: ['implanted-synthetic-hair'], 'implanted-hair-color': color };
  const resolved = resolveCustomization(config, selections, 5299);
  expect(resolved.issues).toEqual([]);
  return { config, selected: resolved.selectedOptions };
}

describe('Gynoid paid hair detail ownership', () => {
  it.each(['black', 'brown', 'yellow'])('removes %s with the paid hair line and keeps independent free choices', color => {
    const { config, selected } = fixture(color), plan = gynoidDependencyPlan(config, selected, 2)!;
    expect(plan.items).toHaveLength(1);
    const item = plan.items[0];
    expect(item.amount).toBe(1198);
    expect(item.dependencyDetails?.scope).toBe('gynoid-v1');
    expect(item.dependencyDetails?.included).toHaveLength(1);
    expect(plan.included.some(option => option.groupId === 'implanted-hair-color')).toBe(false);
    expect(plan.included.some(option => option.groupId === 'skin-tone')).toBe(true);
    const binding = { parentVariantId: 'gid://shopify/ProductVariant/1', merchandiseId: 'gid://shopify/ProductVariant/2',
      group: item.group, label: item.label, unitAmount: 599, currencyCode: 'USD', productTitle: 'Gynoid - Implanted synthetic hair' };
    const lines = exactUpgradeLines({ parentVariantId: binding.parentVariantId, parentLineId: 'gid://shopify/CartLine/parent', quantity: 2,
      charge: { amount: 1198, currencyCode: 'USD', items: plan.items }, bindings: [binding],
      verifiedVariants: [{ id: binding.merchandiseId, productTitle: binding.productTitle, amount: 599, currencyCode: 'USD',
        availableForSale: true, requiresShipping: false }] });
    expect(lines).toHaveLength(1);
    const parent = { id: 'gid://shopify/CartLine/parent', quantity: 2, parentRelationship: null,
      attributes: [{ key: '_DollWOW_checkout_model', value: 'named-upgrades-v1' }, { key: 'Included: Skin tone', value: 'As shown' }],
      merchandise: { id: binding.parentVariantId, product: { title: 'Lisa' } } };
    const child = { id: 'hair', quantity: 2, attributes: lines[0].attributes, parentRelationship: { parent: { id: parent.id } },
      merchandise: { id: binding.merchandiseId, product: { title: binding.productTitle } } };
    const builds = namedUpgradeBuilds({ lines: { nodes: [parent, child], pageInfo: { hasNextPage: false } } }, [binding]);
    expect(builds[0].upgrades[0].includedChoices).toEqual(item.dependencyDetails!.included);
    const removed = namedUpgradeBuilds({ lines: { nodes: [parent], pageInfo: { hasNextPage: false } } }, [binding]);
    expect(removed[0].upgrades).toEqual([]);
    expect(removed[0].includedChoices).toEqual(parent.attributes.slice(1));
  });

  it('does not confuse a bionic selection with the inactive implanted-hair branch in the same group', () => {
    const { config } = fixture(), defaults = getDefaultSelections(config);
    const resolved = resolveCustomization(config, { ...defaults, [premium]: ['bionic-breast'] }, 5299);
    const plan = gynoidDependencyPlan(config, resolved.selectedOptions, 1)!;
    expect(plan.items).toHaveLength(1);
    expect(plan.items[0].amount).toBe(150);
    expect(plan.items[0].dependencyDetails).toBeUndefined();
  });

  it.each(['paid-detail', 'wrong-owner-price', 'unknown-detail', 'multiple-owners', 'cycle'])('fails closed for %s', failure => {
    const { config, selected } = fixture();
    const detail = selected.find(option => option.groupId === 'implanted-hair-color')!;
    const owner = selected.find(option => option.optionId === 'implanted-synthetic-hair')!;
    const group = config.groups.find(group => group.id === detail.groupId)!;
    if (failure === 'paid-detail') detail.priceDelta = 10;
    if (failure === 'wrong-owner-price') owner.priceDelta = 598;
    if (failure === 'unknown-detail') detail.optionId = 'unverified';
    if (failure === 'multiple-owners') {
      const other: SelectedCustomizationOption = { ...owner, optionId: 'bionic-breast', priceDelta: 150 };
      selected.push(other); group.visibleWhen![0].push({ groupId: other.groupId, optionId: other.optionId });
    }
    if (failure === 'cycle') group.visibleWhen![0].push({ groupId: detail.groupId, optionId: detail.optionId });
    expect(() => gynoidDependencyPlan(config, selected, 1)).toThrow();
  });
  it('does not opt another config into the dependency migration', () => {
    const { config, selected } = fixture();
    expect(gynoidDependencyPlan({ ...config, id: 'other-brand' }, selected, 1)).toBeUndefined();
  });
});
