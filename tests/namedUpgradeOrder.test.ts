import { describe, expect, it } from 'vitest';
import { namedUpgradeFactoryPacket, namedUpgradeOrderBuilds, type NamedUpgradeOrder } from '@/lib/orders/named-upgrade-order';
import type { ExactUpgradeBinding } from '@/lib/cart/exact-upgrade-lines';

const binding: ExactUpgradeBinding = { parentVariantId: 'doll', merchandiseId: 'head', productTitle: 'Extra head #134SC',
  group: 'Extra head', label: '#134SC', unitAmount: 225, currencyCode: 'USD' };
function orderFixture(): NamedUpgradeOrder {
  return { id: 'fixture-order', name: 'TEST-NOT-A-REAL-ORDER', displayFinancialStatus: 'PAID',
    lineItems: { pageInfo: { hasNextPage: false }, nodes: [
      { id: 'doll-a', title: 'Lita', quantity: 1, currentQuantity: 1, variant: { id: 'doll' }, product: { tags: [] },
        customAttributes: [
          { key: '_DollWOW_checkout_model', value: 'named-upgrades-v1' }, { key: '_DollWOW_build_id', value: 'build-a' },
          { key: 'Included: Skin tone', value: 'Tan' }, { key: 'Build', value: 'Enthusiast with head #134SC' }
        ] },
      { id: 'head-a', title: binding.productTitle, quantity: 1, currentQuantity: 1, variant: { id: 'head' },
        product: { tags: ['dollwow-system', 'custom-option-charge'] }, customAttributes: [{ key: '_DollWOW_build_id', value: 'build-a' }] }
    ] }
  };
}
describe('named order to factory handoff', () => {
  it('lists only actual purchased merchandise and included choices, not stale build promises', () => {
    const order = orderFixture();
    const packet = namedUpgradeFactoryPacket(order, [binding]);
    expect(packet.status).toBe('REVIEW_REQUIRED_NOT_FACTORY_APPROVAL');
    expect(packet.builds[0].purchasedUpgrades[0].title).toBe(binding.productTitle);
    order.lineItems.nodes.pop();
    const after = namedUpgradeFactoryPacket(order, [binding]);
    expect(after.builds[0].purchasedUpgrades).toEqual([]);
    expect(JSON.stringify(after)).not.toContain('#134SC');
    expect(after.builds[0].includedChoices).toEqual(packet.builds[0].includedChoices);
  });
  it('excludes fully refunded/removed additions instead of restoring the original selection', () => {
    const order = orderFixture(); order.displayFinancialStatus = 'PARTIALLY_REFUNDED';
    order.lineItems.nodes[1].currentQuantity = 0;
    expect(namedUpgradeOrderBuilds(order, [binding])[0].upgrades).toEqual([]);
  });
  it('keeps two different builds of the same doll separate', () => {
    const order = orderFixture();
    order.lineItems.nodes.push({ ...order.lineItems.nodes[0], id: 'doll-b', customAttributes: [
      { key: '_DollWOW_checkout_model', value: 'named-upgrades-v1' }, { key: '_DollWOW_build_id', value: 'build-b' }
    ] });
    expect(namedUpgradeOrderBuilds(order, [binding]).map(build => build.upgrades.length)).toEqual([1, 0]);
  });
  it('explicitly lists unrelated order lines rather than silently presenting a partial packet as complete', () => {
    const order = orderFixture();
    order.lineItems.nodes.push({ id: 'ordinary-item', title: 'Separate purchase', quantity: 1, currentQuantity: 1,
      variant: { id: 'unrelated' }, product: { tags: [] }, customAttributes: [] });
    expect(namedUpgradeFactoryPacket(order, [binding])).toMatchObject({ scope: 'NAMED_UPGRADE_BUILDS_ONLY', otherOrderLineIds: ['ordinary-item'] });
  });
  it.each(['unpaid', 'truncated', 'duplicate-reference', 'missing-reference', 'wrong-parent', 'quantity', 'unknown-variant', 'ambiguous-attribute', 'missing-current-quantity'])(
    'holds %s instead of guessing a factory build', mode => {
      const order = orderFixture(); const [parent, child] = order.lineItems.nodes;
      if (mode === 'unpaid') order.displayFinancialStatus = 'PENDING';
      if (mode === 'truncated') order.lineItems.pageInfo.hasNextPage = true;
      if (mode === 'duplicate-reference') order.lineItems.nodes.push({ ...parent, id: 'doll-b' });
      if (mode === 'missing-reference') child.customAttributes = [];
      if (mode === 'wrong-parent') child.customAttributes[0].value = 'other-build';
      if (mode === 'quantity') { parent.quantity = 2; parent.currentQuantity = 2; }
      if (mode === 'unknown-variant') child.variant!.id = 'other-head';
      if (mode === 'ambiguous-attribute') child.customAttributes.push({ ...child.customAttributes[0] });
      if (mode === 'missing-current-quantity') child.currentQuantity = NaN;
      expect(() => namedUpgradeFactoryPacket(order, [binding])).toThrow();
    }
  );
});
