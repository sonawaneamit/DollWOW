import { describe, expect, it } from 'vitest';
import { idoMdDependencyPlan, MD_CONFIGURED_HEAD_BINDINGS } from '@/lib/cart/ido-md-dependencies';
import { exactUpgradeLines } from '@/lib/cart/exact-upgrade-lines';
import { namedUpgradeBuilds } from '@/lib/cart/named-upgrade-builds';
import { IDO_MENU_TAG, MD_MENU_TAG } from '@/lib/customization/ido-md';
import type { BrandCustomizationConfig, SelectedCustomizationOption } from '@/types/customization';

const selected = (groupId: string, optionId: string, priceDelta = 0): SelectedCustomizationOption =>
  ({ groupId, groupLabel: groupId, optionId, optionLabel: optionId, priceDelta, priceConfirmed: true });
function fixture(md = true) {
  const root = md ? 'an-extra-free-head' : 'an-extra-head';
  const head = selected(root, md ? 'yes-i-need-free' : 'id2h', 599);
  const branch = selected(md ? 'extra-head-choice' : 'custom-options-for-extra-head', md ? 'm22' : 'yes-i-need');
  const type = selected(md ? 'extra-head-type' : 'head-type-for-extra-head', 'ros');
  const options = [head, branch, type, selected('skin-tone', 'tan')];
  const config: BrandCustomizationConfig = { id: (md ? MD_MENU_TAG : IDO_MENU_TAG).slice(8), brandLabel: md ? 'MD Doll' : 'IDO', leadTimeNote: '', rules: [], groups: [
    { id: root, label: root, display: 'compact', options: [] },
    { id: branch.groupId, label: branch.groupId, display: 'compact', options: [], visibleWhen: [[{ groupId: root, optionId: head.optionId }]] },
    ...[type.groupId, 'hairstyle-for-extra-head', 'premium-head-options-for-extra-head-multiple'].map(id => ({
      id, label: id, display: 'compact' as const, options: [], visibleWhen: [[{ groupId: branch.groupId, optionId: branch.optionId }]]
    }))
  ] };
  return { config, options };
}

describe('scoped IDO/MD cart dependency ownership', () => {
  it.each([true, false])('moves transitive included head details to the paid head (MD=%s)', md => {
    const { config, options } = fixture(md);
    const plan = idoMdDependencyPlan(config, options, 1)!;
    expect(plan.included.map(option => option.groupId)).toEqual(['skin-tone']);
    expect(plan.items).toHaveLength(1);
    expect(plan.items[0].amount).toBe(599);
    expect(plan.items[0].dependencyDetails?.included.map(attribute => attribute.value)).toEqual(md ? ['m22', 'ros'] : ['yes-i-need', 'ros']);
  });

  it('has exactly eleven bounded, unique MD combined binding identities', () => {
    expect(MD_CONFIGURED_HEAD_BINDINGS).toHaveLength(11);
    expect(new Set(MD_CONFIGURED_HEAD_BINDINGS.map(binding => binding.label)).size).toBe(11);
    expect(MD_CONFIGURED_HEAD_BINDINGS.map(binding => binding.unitAmount).sort((a,b) => a-b))
      .toEqual([669, 748, 798, 818, 868, 947, 1017, 1098, 1168, 1247, 1317]);
  });

  it.each(MD_CONFIGURED_HEAD_BINDINGS)('atomically removes $unitAmount configured head with all details', binding => {
    const { config, options } = fixture();
    for (const id of binding.optionKeys) {
      const [groupId, optionId] = id.split('/');
      const price = ({ 'implanted-synthetic-hair': 199, 'implanted-human-hair': 499, 'facial-freckles': 70, 'movable-eyelids': 149 } as Record<string, number>)[optionId];
      options.push(selected(groupId, optionId, price));
    }
    const plan = idoMdDependencyPlan(config, options, 2)!;
    expect(plan.items).toHaveLength(1);
    expect(plan.items[0]).toMatchObject({ group: binding.group, label: binding.label, amount: binding.unitAmount * 2 });
    const mapped = { ...binding, parentVariantId: 'gid://shopify/ProductVariant/1', merchandiseId: 'gid://shopify/ProductVariant/2' };
    const input = { parentVariantId: mapped.parentVariantId, parentLineId: 'gid://shopify/CartLine/parent', quantity: 2,
      charge: { amount: binding.unitAmount * 2, currencyCode: 'USD', items: plan.items }, bindings: [mapped],
      verifiedVariants: [{ id: mapped.merchandiseId, amount: binding.unitAmount, currencyCode: 'USD',
        productTitle: binding.productTitle, availableForSale: true, requiresShipping: false }] };
    const lines = exactUpgradeLines(input);
    expect(lines).toHaveLength(1);
    expect(lines[0].attributes.filter(attribute => attribute.key.startsWith('Configured: ')).length).toBeGreaterThan(1);
    expect(lines[0].attributes).toContainEqual({ key: 'Included: extra-head-choice', value: 'm22' });
    expect(exactUpgradeLines({ ...input, parentLineId: 'gid://shopify/CartLine/other' })[0].parent.lineId).not.toBe(lines[0].parent.lineId);
    const parent = { id: input.parentLineId, quantity: 2, parentRelationship: null,
      merchandise: { id: mapped.parentVariantId, product: { title: 'MD Doll' } },
      attributes: [{ key: '_DollWOW_checkout_model', value: 'named-upgrades-v1' }, { key: 'Included: skin-tone', value: 'tan' }] };
    const child = { id: 'child', quantity: 2, parentRelationship: { parent: { id: parent.id } }, attributes: lines[0].attributes,
      merchandise: { id: mapped.merchandiseId, product: { title: binding.productTitle } } };
    const builds = namedUpgradeBuilds({ lines: { nodes: [parent, child], pageInfo: { hasNextPage: false } } }, [mapped]);
    expect(builds[0].upgrades[0].includedChoices).toContainEqual({ key: 'Included: extra-head-choice', value: 'm22' });
    const after = namedUpgradeBuilds({ lines: { nodes: [parent], pageInfo: { hasNextPage: false } } }, [mapped]);
    expect(after[0].upgrades).toEqual([]);
    expect(after[0].includedChoices).toEqual([{ key: 'Included: skin-tone', value: 'tan' }]);
    expect(() => exactUpgradeLines({ ...input, bindings: [] })).toThrow('not verified');
    const tampered = structuredClone(input);
    tampered.charge.items[0].dependencyDetails!.included.push({ key: '_DollWOW_checkout_model', value: 'forged' });
    expect(() => exactUpgradeLines(tampered)).toThrow('Invalid dependent');
  });

  it('moves only the paid bionic conditional benefit, preserving independent campaign inclusions', () => {
    const { config } = fixture();
    const bionic = selected('premium-head-body-options-multiple', 'bionic-skin-softer-skin', 299);
    const butt = selected(bionic.groupId, 'soft-butt');
    const plan = idoMdDependencyPlan(config, [bionic, butt, selected('accessories', 'vine-talk-ai-box-free')], 1)!;
    expect(plan.items[0].dependencyDetails?.included).toEqual([{ key: `Included: ${butt.groupId}`, value: 'soft-butt' }]);
    expect(plan.included.map(key => key.optionId)).toEqual(['vine-talk-ai-box-free']);
    const october = idoMdDependencyPlan(config, [{ ...bionic, priceDelta: 0 }, butt], 1)!;
    expect(october.items).toEqual([]);
    expect(october.included).toHaveLength(2);
  });

  it('preserves other brands and rejects unreviewed selected dependencies', () => {
    const { config, options } = fixture();
    expect(idoMdDependencyPlan({ ...config, id: 'another-brand' }, options, 1)).toBeUndefined();
    config.groups.push({ id: 'unknown', label: 'Unknown', display: 'compact', options: [], visibleWhen: [[{ groupId: options[0].groupId, optionId: options[0].optionId }]] });
    expect(() => idoMdDependencyPlan(config, [...options, selected('unknown', 'detail')], 1)).toThrow('verified checkout mapping');
  });

  it('rejects changed paid dependency prices rather than losing or inventing charges', () => {
    const { config, options } = fixture();
    options.push(selected('hairstyle-for-extra-head', 'implanted-human-hair', 498));
    expect(() => idoMdDependencyPlan(config, options, 1)).toThrow('exact-price mapping');
  });
});
