import { expect, test } from 'vitest';
import { exactUpgradeLines } from '../lib/cart/exact-upgrade-lines';
import { namedUpgradeFactoryPacket } from '../lib/orders/named-upgrade-order';

const binding = { parentVariantId: 'gid://shopify/ProductVariant/1', merchandiseId: 'gid://shopify/ProductVariant/2',
  group: 'Tattoo', label: 'Tattoo', productTitle: 'SE Doll tattoo', unitAmount: 59, currencyCode: 'USD',
  choiceLabels: ['#1', '#2', '#3', '#4', '#5'], tattooPositions: ['Lower Belly', 'Lower Back', 'Front Left Thigh', 'Front Right Thigh'] };
const verifiedVariants = [{ id: binding.merchandiseId, productTitle: binding.productTitle, amount: 59,
  currencyCode: 'USD', availableForSale: true, requiresShipping: false }];
function lines(choice: string, tattooPosition: string | undefined, quantity = 1) {
  return exactUpgradeLines({ parentVariantId: binding.parentVariantId, parentLineId: 'gid://shopify/CartLine/parent', quantity,
    bindings: [binding], verifiedVariants, charge: { amount: 59 * quantity, currencyCode: 'USD',
      items: [{ group: 'Tattoo', label: choice, amount: 59 * quantity, tattooPosition }] } });
}
test('all tattoo styles/positions retain placement on the purchased line, not the doll', () => {
  for (const choice of binding.choiceLabels) for (const position of binding.tattooPositions) for (const quantity of [1, 2]) {
    const child = lines(choice, position, quantity)[0];
    const parent = { id: 'parent', title: 'Lita', quantity, currentQuantity: quantity, variant: { id: binding.parentVariantId },
      customAttributes: [{ key: '_DollWOW_checkout_model', value: 'named-upgrades-v1' }, { key: '_DollWOW_build_id', value: 'build' }] };
    const order = { id: 'order', name: 'fixture', displayFinancialStatus: 'PAID', lineItems: { pageInfo: { hasNextPage: false }, nodes: [parent,
      { id: 'tattoo', title: binding.productTitle, quantity, currentQuantity: quantity, variant: { id: binding.merchandiseId },
        customAttributes: [...child.attributes, { key: '_DollWOW_build_id', value: 'build' }] }] } };
    const packet = namedUpgradeFactoryPacket(order, [binding]);
    expect(packet.builds[0].purchasedUpgrades[0]).toMatchObject({ choice, tattooPosition: position, quantity });
    expect(packet.builds[0].includedChoices).toEqual([]);
    order.lineItems.nodes[1].currentQuantity = 0;
    expect(namedUpgradeFactoryPacket(order, [binding]).builds[0].purchasedUpgrades).toEqual([]);
  }
});
test('missing and invented placement cannot create a charge', () => {
  expect(() => lines('#1', undefined)).toThrow('placement');
  expect(() => lines('#1', 'Unapproved location')).toThrow('placement');
});
