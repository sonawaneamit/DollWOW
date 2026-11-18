import { describe, expect, it } from 'vitest';
import { productionOrderSummary, type ProductionOrder } from '@/lib/orders/production-summary';
const money = (amount: string) => ({ shopMoney: { amount, currencyCode: 'USD' } });
function fixture(brand = 'Top Fire'): ProductionOrder {
  return { name: 'SYNTHETIC-NOT-AN-ORDER', createdAt: '2026-10-24T14:00:00Z', displayFinancialStatus: 'PAID', currencyCode: 'USD',
    subtotalPriceSet: money('2267.00'), totalDiscountsSet: money('0'), totalShippingPriceSet: money('0'), totalTaxSet: money('0'), totalPriceSet: money('2267'),
    lineItems: { pageInfo: { hasNextPage: false }, nodes: [
      { id: 'base', title: `${brand} test doll`, quantity: 1, currentQuantity: 1, discountedTotalSet: money('1808'), customAttributes: [
        { key: 'DollWow Reference Name', value: 'Body A' }, { key: 'DollWow Head', value: 'T04 Hedy (+$459)' },
        { key: 'DollWow Skin', value: 'Tan' }, { key: 'DollWow Function', value: 'Body heating' },
        { key: '_private', value: 'not-for-export' }] },
      ...['449', '10'].map((value, index) => ({ id: `charge${index}`, title: 'Selected customization', sku: `DOLLWOW-CUSTOM-OPTION-USD-${value}`, quantity: 1, currentQuantity: 1,
        discountedTotalSet: money(value), customAttributes: [{ key: 'Applies to', value: 'Body A' }, { key: 'Customization', value: 'Head - T04 Hedy' }],
        variant: { inventoryItem: { requiresShipping: index === 0 } } }))
    ] } };
}
const at = '2026-10-24T15:00:00Z';
describe('production order summaries', () => {
  it.each(['Top Fire', 'Irontech', 'WM'])('preserves recorded %s choices and reconciles split charges once', brand => {
    const summary = productionOrderSummary(fixture(brand), at);
    expect(summary.builds[0].choices).toHaveLength(3);
    expect(summary.builds[0].upgrades).toHaveLength(1);
    expect(summary.builds[0].upgrades[0].paidCents).toBe(45900);
    expect(summary.totals.paidCents).toBe(226700);
    expect(summary.status).toBe('REVIEW_REQUIRED_NOT_FACTORY_APPROVAL');
    expect(JSON.stringify(summary)).not.toContain('not-for-export');
    expect(summary.holds.join()).toContain('shipping flags');
  });
  it.each(['pagination', 'unpaid', 'refund', 'duplicate', 'changed-quantity', 'mixed-currency', 'total', 'line-total', 'fraction', 'duplicate-property'])(
    'stops on %s instead of inventing a factory specification', mode => {
      const order = fixture();
      if (mode === 'pagination') order.lineItems.pageInfo.hasNextPage = true;
      if (mode === 'unpaid') order.displayFinancialStatus = 'PENDING';
      if (mode === 'refund') order.displayFinancialStatus = 'PARTIALLY_REFUNDED';
      if (mode === 'duplicate') order.lineItems.nodes[1].id = 'base';
      if (mode === 'changed-quantity') order.lineItems.nodes[0].currentQuantity = 0;
      if (mode === 'mixed-currency') order.totalPriceSet.shopMoney.currencyCode = 'EUR';
      if (mode === 'total') order.totalPriceSet = money('2268');
      if (mode === 'line-total') order.lineItems.nodes[0].discountedTotalSet = money('1809');
      if (mode === 'fraction') order.totalPriceSet = money('2267.001');
      if (mode === 'duplicate-property') order.lineItems.nodes[0].customAttributes.push({ key: 'DollWow Skin', value: 'Other' });
      expect(() => productionOrderSummary(order, at)).toThrow();
    });
  it('does not assign charges by matching price or guess between identical parent names', () => {
    const order = fixture(); const parent = order.lineItems.nodes[0];
    order.lineItems.nodes.push({ ...parent, id: 'base2', discountedTotalSet: money('0') });
    const summary = productionOrderSummary(order, at);
    expect(summary.unmatchedCharges).toHaveLength(2);
    expect(summary.builds.every(b => !b.upgrades.length)).toBe(true);
  });
  it('keeps As shown and unknown properties on hold rather than substituting defaults', () => {
    const order = fixture(); order.lineItems.nodes[0].customAttributes.push({ key: 'DollWow Hair', value: 'As shown' }, { key: 'Unknown choice', value: 'do not guess' });
    const summary = productionOrderSummary(order, at);
    expect(summary.holds.join()).toContain('agreed reference');
    expect(summary.holds.join()).toContain('Unclassified property');
    expect(summary.builds[0].choices).toContainEqual({ label: 'Hair', value: 'As shown' });
  });
  it('associates named lines using exact build references, not current menus', () => {
    const order = fixture();
    order.lineItems.nodes[0].customAttributes.push({ key: '_DollWOW_build_id', value: 'build-a' });
    for (const line of order.lineItems.nodes.slice(1)) line.customAttributes = [{ key: '_DollWOW_build_id', value: 'build-a' }, { key: 'Customization', value: 'Recorded upgrade' }];
    expect(productionOrderSummary(order, at).builds[0].upgrades[0].paidCents).toBe(45900);
  });
  it('preserves dependent choices on paid upgrades without merging distinct configurations', () => {
    const order = fixture();
    order.lineItems.nodes[1].customAttributes.push({ key: 'Configured: Hair', value: 'Brown' });
    order.lineItems.nodes[2].customAttributes.push({ key: 'Configured: Hair', value: 'Black' });
    const upgrades = productionOrderSummary(order, at).builds[0].upgrades;
    expect(upgrades).toHaveLength(2);
    expect(upgrades.map(u => u.choices[0].value)).toEqual(['Brown', 'Black']);
  });
  it('does not collapse two named merchandise lines into one physical upgrade', () => {
    const order = fixture();
    for (const line of order.lineItems.nodes.slice(1)) {
      line.sku = 'NAMED-EXTRA-HEAD'; line.title = 'Named extra head';
      line.product = { tags: ['exact-upgrade-pilot'] };
    }
    const upgrades = productionOrderSummary(order, at).builds[0].upgrades;
    expect(upgrades).toHaveLength(2);
    expect(upgrades.map(u => u.quantity)).toEqual([1, 1]);
    expect(upgrades.every(u => !u.paymentComponents)).toBe(true);
  });
});
