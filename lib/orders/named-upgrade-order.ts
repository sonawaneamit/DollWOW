import type { ExactUpgradeBinding } from '../cart/exact-upgrade-lines';
import { namedUpgradeBuilds } from '../cart/named-upgrade-builds';

export type NamedUpgradeOrderLine = {
  id: string; title: string; quantity: number; currentQuantity: number;
  customAttributes: Array<{ key: string; value: string }>;
  variant?: { id: string } | null;
  product?: { tags: string[] } | null;
};
export type NamedUpgradeOrder = {
  id: string; name: string; displayFinancialStatus: string;
  lineItems: { nodes: NamedUpgradeOrderLine[]; pageInfo: { hasNextPage: boolean } };
};

function attribute(line: NamedUpgradeOrderLine, key: string) {
  const values = line.customAttributes.filter(a => a.key === key);
  if (values.length > 1) throw new Error('Ambiguous build reference on an order line.');
  return values[0]?.value;
}

export function isNamedUpgradeOrderLine(line: Pick<NamedUpgradeOrderLine, 'customAttributes'>) {
  return line.customAttributes.some(a => a.key === '_DollWOW_checkout_model' && a.value === 'named-upgrades-v1');
}

/** Authenticated, complete Admin order data only; attributes associate lines but never prove a purchase. */
export function namedUpgradeOrderBuilds(order: NamedUpgradeOrder, bindings: ExactUpgradeBinding[]) {
  if (order.lineItems.pageInfo.hasNextPage) throw new Error('Load the complete order before preparing a factory build.');
  if (!['PAID', 'PARTIALLY_REFUNDED'].includes(order.displayFinancialStatus)) throw new Error('This order is not paid.');
  const all = order.lineItems.nodes;
  if (new Set(all.map(line => line.id)).size !== all.length || all.some(line =>
    !Number.isInteger(line.currentQuantity) || line.currentQuantity < 0 ||
    !Number.isInteger(line.quantity) || line.quantity < line.currentQuantity)) {
    throw new Error('Invalid or incomplete order quantities.');
  }
  const lines = all.filter(line => line.currentQuantity > 0);
  const parents = lines.filter(isNamedUpgradeOrderLine);
  const references = new Map<string, NamedUpgradeOrderLine>();
  for (const parent of parents) {
    const reference = attribute(parent, '_DollWOW_build_id');
    if (!reference || references.has(reference)) throw new Error('Missing or duplicate doll build reference.');
    references.set(reference, parent);
  }
  const normalized = parents.map(parent => ({ id: parent.id, quantity: parent.currentQuantity,
    attributes: parent.customAttributes, merchandise: { id: parent.variant?.id ?? '', product: { title: parent.title } },
    parentRelationship: null as { parent: { id: string } } | null }));
  for (const line of lines.filter(line => !isNamedUpgradeOrderLine(line))) {
    const reference = attribute(line, '_DollWOW_build_id');
    const isCharge = bindings.some(binding => binding.merchandiseId === line.variant?.id) ||
      line.product?.tags.some(tag => ['custom-option-charge', 'exact-upgrade-pilot'].includes(tag.toLowerCase()));
    if (!reference && !isCharge) continue;
    const parent = reference ? references.get(reference) : undefined;
    if (!parent || !isCharge) throw new Error('An order upgrade cannot be assigned to a verified doll.');
    normalized.push({ id: line.id, quantity: line.currentQuantity, attributes: line.customAttributes,
      merchandise: { id: line.variant?.id ?? '', product: { title: line.title } }, parentRelationship: { parent: { id: parent.id } } });
  }
  return namedUpgradeBuilds({ lines: { nodes: normalized, pageInfo: { hasNextPage: false } } }, bindings);
}

export function namedUpgradeFactoryPacket(order: NamedUpgradeOrder, bindings: ExactUpgradeBinding[]) {
  const builds = namedUpgradeOrderBuilds(order, bindings);
  if (!builds.length) throw new Error('No verified named-upgrade dolls in this order.');
  return {
    status: 'REVIEW_REQUIRED_NOT_FACTORY_APPROVAL' as const,
    scope: 'NAMED_UPGRADE_BUILDS_ONLY' as const,
    orderId: order.id, orderName: order.name,
    otherOrderLineIds: order.lineItems.nodes.filter(line => line.currentQuantity > 0 &&
      !builds.some(build => build.lineId === line.id || build.upgrades.some(upgrade => upgrade.lineId === line.id))).map(line => line.id),
    builds: builds.map(build => ({
      dollOrderLineId: build.lineId, dollVariantId: build.merchandiseId, quantity: build.quantity,
      dollTitle: order.lineItems.nodes.find(line => line.id === build.lineId)!.title,
      selectedConfiguration: order.lineItems.nodes.find(line => line.id === build.lineId)!.customAttributes.find(a => a.key === 'Selected configuration')?.value ?? 'Included choices and purchased upgrades below',
      includedChoices: build.includedChoices,
      purchasedUpgrades: build.upgrades
    }))
  };
}
