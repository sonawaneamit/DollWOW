type Money = { shopMoney: { amount: string; currencyCode: string } };
type Property = { key: string; value: string };
export type ProductionOrderLine = {
  id: string; title: string; sku?: string | null; quantity: number; currentQuantity: number;
  customAttributes: Property[]; discountedTotalSet: Money;
  product?: { tags: string[] } | null;
  variant?: { inventoryItem?: { requiresShipping: boolean } | null } | null;
};
export type ProductionOrder = {
  name: string; createdAt: string; displayFinancialStatus: string; currencyCode: string;
  subtotalPriceSet: Money; totalDiscountsSet: Money; totalShippingPriceSet: Money;
  totalTaxSet: Money; totalPriceSet: Money;
  lineItems: { nodes: ProductionOrderLine[]; pageInfo: { hasNextPage: boolean } };
};

function cents(money: Money, currency: string) {
  const { amount, currencyCode } = money.shopMoney;
  if (currencyCode !== currency || !/^\d+(?:\.\d{1,2})?$/.test(amount)) {
    throw new Error('Unsupported currency or invalid order money.');
  }
  const [whole, fraction = ''] = amount.split('.');
  const value = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(value)) throw new Error('Order amount is too large.');
  return value;
}

function property(line: ProductionOrderLine, key: string) {
  const values = line.customAttributes.filter(p => p.key.toLowerCase() === key.toLowerCase());
  if (values.length > 1) throw new Error(`Ambiguous order property: ${key}.`);
  return values[0]?.value.trim();
}

function isCharge(line: ProductionOrderLine) {
  return /^DOLLWOW-CUSTOM-OPTION-/i.test(line.sku ?? '') ||
    line.product?.tags.some(tag => ['custom-option-charge', 'exact-upgrade-pilot'].includes(tag.toLowerCase())) ||
    Boolean(property(line, 'Customization') && property(line, 'Applies to'));
}

function choices(line: ProductionOrderLine, holds: string[], charge = false) {
  const seen = new Set<string>();
  return line.customAttributes.flatMap(p => {
    if (p.key.startsWith('_') || /^(DollWow (Reference Name|Config ID|Option Delta)|Build)$/i.test(p.key)) return [];
    if (charge && /^(Applies to|Customization)$/i.test(p.key)) return [];
    if (!/^(DollWow |Included: |Configured: |Selected configuration$)/i.test(p.key)) {
      holds.push(`Unclassified property on ${line.title}: ${p.key}. Review the original order.`);
      return [];
    }
    const label = p.key.replace(/^DollWow /i, '').trim();
    if (seen.has(label.toLowerCase()) || !label || !p.value.trim()) {
      throw new Error('Duplicate or empty recorded choice.');
    }
    seen.add(label.toLowerCase());
    if (/^as shown$/i.test(p.value.trim())) holds.push(`${label} is "As shown"; attach the agreed reference before factory release.`);
    return [{ label, value: p.value }];
  });
}

/** Only recorded Admin order values; never infer a choice from a current menu or SKU price. */
export function productionOrderSummary(order: ProductionOrder, capturedAt: string) {
  if (order.lineItems.pageInfo.hasNextPage) throw new Error('Load every order line before exporting.');
  if (order.displayFinancialStatus !== 'PAID') throw new Error('Refunded or unpaid orders need a separate reconciliation.');
  if (!['USD', 'EUR', 'GBP', 'CAD', 'AUD'].includes(order.currencyCode)) throw new Error('Unsupported currency precision.');
  if (!Number.isFinite(Date.parse(order.createdAt)) || !Number.isFinite(Date.parse(capturedAt))) throw new Error('Invalid evidence timestamp.');
  const lines = order.lineItems.nodes;
  if (!lines.length || new Set(lines.map(l => l.id)).size !== lines.length || lines.some(l =>
    !l.id || !l.title.trim() || !Number.isInteger(l.quantity) || l.quantity < 1 || l.currentQuantity !== l.quantity)) {
    throw new Error('Missing, duplicate, removed or changed order quantities.');
  }
  const currency = order.currencyCode;
  const amounts = new Map(lines.map(l => [l.id, cents(l.discountedTotalSet, currency)]));
  const subtotal = cents(order.subtotalPriceSet, currency);
  const shipping = cents(order.totalShippingPriceSet, currency);
  const tax = cents(order.totalTaxSet, currency);
  const total = cents(order.totalPriceSet, currency);
  if ([...amounts.values()].reduce((a, b) => a + b, 0) !== subtotal || subtotal + shipping + tax !== total) {
    throw new Error('Order totals do not reconcile; do not prepare a factory packet.');
  }
  const holds: string[] = [];
  const parents = lines.filter(l => !isCharge(l));
  const builds = parents.map(parent => ({
    lineId: parent.id, productTitle: parent.title, quantity: parent.currentQuantity,
    basePaidCents: amounts.get(parent.id)!, choices: choices(parent, holds),
    upgrades: [] as Array<{ label: string; quantity: number | null; paymentComponents: boolean; choices: Array<{ label: string; value: string }>; paidCents: number; parts: Array<{ lineId: string; paidCents: number; requiresShipping: boolean | null }> }>
  }));
  const unmatchedCharges: Array<{ label: string; paidCents: number }> = [];
  for (const charge of lines.filter(isCharge)) {
    const reference = property(charge, '_DollWOW_build_id');
    const appliesTo = property(charge, 'Applies to');
    const candidates = parents.filter(p => reference
      ? property(p, '_DollWOW_build_id') === reference
      : Boolean(appliesTo) && (property(p, 'DollWow Reference Name') === appliesTo || p.title === appliesTo));
    const label = property(charge, 'Customization') || (!/^Selected customization$/i.test(charge.title) ? charge.title : 'Unlabelled paid option');
    const paidCents = amounts.get(charge.id)!;
    const chargeChoices = choices(charge, holds, true);
    const paymentComponents = /^DOLLWOW-CUSTOM-OPTION-/i.test(charge.sku ?? '');
    if (candidates.length !== 1 || label === 'Unlabelled paid option') {
      holds.push('A paid option cannot be assigned uniquely to a product and choice.');
      unmatchedCharges.push({ label, paidCents });
      continue;
    }
    const build = builds.find(b => b.lineId === candidates[0].id)!;
    // Only legacy denomination lines are payment fragments; named merchandise keeps its quantity.
    let upgrade = paymentComponents ? build.upgrades.find(u => u.paymentComponents && u.label === label && JSON.stringify(u.choices) === JSON.stringify(chargeChoices)) : undefined;
    if (!upgrade) { upgrade = { label, quantity: paymentComponents ? null : charge.currentQuantity, paymentComponents, choices: chargeChoices, paidCents: 0, parts: [] }; build.upgrades.push(upgrade); }
    upgrade.paidCents += paidCents;
    upgrade.parts.push({ lineId: charge.id, paidCents, requiresShipping: charge.variant?.inventoryItem?.requiresShipping ?? null });
  }
  for (const build of builds) {
    if (!build.choices.length) holds.push(`No explicit configuration properties recorded for ${build.productTitle}.`);
    for (const upgrade of build.upgrades) {
      if (new Set(upgrade.parts.map(p => p.requiresShipping)).size > 1) holds.push('Split option charge lines have different shipping flags; confirm fulfillment separately.');
    }
  }
  return {
    status: 'REVIEW_REQUIRED_NOT_FACTORY_APPROVAL' as const,
    orderName: order.name, createdAt: order.createdAt, capturedAt, currency,
    priceBasis: 'Customer-paid amounts, not supplier costs. Discounts are already reflected in line totals.',
    builds, unmatchedCharges, holds: [...new Set(holds)],
    totals: { subtotalCents: subtotal, discountCents: cents(order.totalDiscountsSet, currency), shippingCents: shipping, taxCents: tax, paidCents: total },
    scope: 'Recorded product titles and explicit order choices only. No delivery, compatibility, warranty or factory acceptance inferred.'
  };
}
