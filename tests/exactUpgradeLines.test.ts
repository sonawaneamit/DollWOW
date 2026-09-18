import { describe, expect, it } from 'vitest';
import { exactUpgradeLines, type ExactUpgradeBinding } from '@/lib/cart/exact-upgrade-lines';

const parentVariantId = 'gid://shopify/ProductVariant/1';
const parentLineId = 'gid://shopify/CartLine/build-a';
function fixture(amount = 150, quantity = 1) {
  const binding: ExactUpgradeBinding = {
    parentVariantId, group: 'Body', label: 'Body heating', unitAmount: amount,
    currencyCode: 'USD', merchandiseId: 'gid://shopify/ProductVariant/2', productTitle: 'Body heating'
  };
  return {
    parentVariantId, parentLineId, quantity,
    charge: { amount: amount * quantity, currencyCode: 'USD', title: 'Example doll',
      items: [{ group: 'Body', label: 'Body heating', amount: amount * quantity }] },
    bindings: [binding],
    verifiedVariants: [{ id: binding.merchandiseId, productTitle: binding.productTitle, amount,
      currencyCode: 'USD', availableForSale: true, requiresShipping: false }]
  };
}

describe('exact-price upgrade pilot (not live checkout proof)', () => {
  it('represents a $150 upgrade once, not as $100 + $50', () => {
    expect(exactUpgradeLines(fixture())).toEqual([{
      merchandiseId: 'gid://shopify/ProductVariant/2', quantity: 1,
      parent: { lineId: parentLineId },
      attributes: [{ key: 'Applies to', value: 'Example doll' }, { key: 'Customization', value: 'Body: Body heating' }]
    }]);
  });
  it('supports cents exactly without smaller denomination products', () => {
    expect(exactUpgradeLines(fixture(57.3))).toHaveLength(1);
  });
  it('uses doll quantity rather than decomposing a multiplied amount', () => {
    expect(exactUpgradeLines(fixture(57.3, 2))[0].quantity).toBe(2);
  });
  it('binds different builds of the same doll to their actual parent lines', () => {
    const a = fixture(), b = { ...fixture(), parentLineId: 'gid://shopify/CartLine/build-b' };
    expect(exactUpgradeLines(a)[0].parent).not.toEqual(exactUpgradeLines(b)[0].parent);
  });
  it('does not match another upgrade merely because it has the same price', () => {
    const input = fixture(); input.bindings[0].label = 'Breathing';
    expect(() => exactUpgradeLines(input)).toThrow('not verified');
  });
  it('does not reuse another doll binding without review', () => {
    const input = fixture(); input.bindings[0].parentVariantId = 'gid://shopify/ProductVariant/3';
    expect(() => exactUpgradeLines(input)).toThrow('not verified');
  });
  it.each(['amount', 'productTitle', 'currencyCode', 'availableForSale', 'requiresShipping'] as const)(
    'rejects changed live %s', field => {
      const input = fixture();
      const changed = { amount: 151, productTitle: 'Selected customization', currencyCode: 'EUR', availableForSale: false, requiresShipping: true };
      input.verifiedVariants[0] = { ...input.verifiedVariants[0], [field]: changed[field] };
      expect(() => exactUpgradeLines(input)).toThrow('changed');
    }
  );
  it('does not fall back to denominations when a price is missing', () => {
    const input = fixture(); input.bindings = [];
    expect(() => exactUpgradeLines(input)).toThrow('not verified');
  });
  it('rejects ambiguous bindings', () => {
    const input = fixture(); input.bindings.push({ ...input.bindings[0] });
    expect(() => exactUpgradeLines(input)).toThrow('not verified');
  });
  it('rejects duplicate selected upgrades', () => {
    const input = fixture(); input.charge.amount *= 2; input.charge.items.push({ ...input.charge.items[0] });
    expect(() => exactUpgradeLines(input)).toThrow('Duplicate');
  });
  it('rejects unitemized totals', () => {
    const input = fixture(); input.charge.items = [];
    expect(() => exactUpgradeLines(input)).toThrow('do not match');
  });
  it('rejects sub-cent amounts', () => {
    expect(() => exactUpgradeLines(fixture(10.001))).toThrow('exact currency');
  });
  it('rejects itemized total disagreement', () => {
    const input = fixture(); input.charge.amount += 1;
    expect(() => exactUpgradeLines(input)).toThrow('do not match');
  });
  it('rejects a nonintegral per-unit price', () => {
    const input = fixture(); input.quantity = 7;
    expect(() => exactUpgradeLines(input)).toThrow('exact unit price');
  });
  it('returns no paid lines for included upgrades', () => {
    expect(exactUpgradeLines({ ...fixture(), charge: undefined })).toEqual([]);
  });
  it('plans the observed Lita Enthusiast upgrades as three lines totaling $285', () => {
    const input = fixture();
    const options = [
      { group: 'Add Extra Head', label: '#134SC', amount: 225, title: 'SE Doll extra head #134SC' },
      { group: 'Accessories', label: 'Vaginal Irrigator', amount: 35, title: 'Vaginal irrigator' },
      { group: 'Accessories', label: 'Reusable Drying Rod', amount: 25, title: 'Reusable drying rod' }
    ];
    input.charge = { amount: 285, currencyCode: 'USD', title: 'Lita B', items: options };
    input.bindings = options.map((option, index) => ({
      parentVariantId, group: option.group, label: option.label, unitAmount: option.amount,
      currencyCode: 'USD', merchandiseId: `gid://shopify/ProductVariant/${index + 10}`, productTitle: option.title
    }));
    input.verifiedVariants = input.bindings.map(binding => ({
      id: binding.merchandiseId, productTitle: binding.productTitle, amount: binding.unitAmount,
      currencyCode: 'USD', availableForSale: true, requiresShipping: false
    }));
    const lines = exactUpgradeLines(input);
    expect(lines).toHaveLength(3);
    expect(lines.reduce((sum, line) => sum + line.quantity, 0)).toBe(3);
    expect(lines.reduce((sum, line) => sum + input.verifiedVariants.find(v => v.id === line.merchandiseId)!.amount * line.quantity, 0)).toBe(285);
  });
});
