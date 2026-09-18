export type ExactUpgradeBinding = {
  parentVariantId: string;
  group: string;
  label: string;
  unitAmount: number;
  currencyCode: string;
  merchandiseId: string;
  productTitle: string;
  /** Same-price styles in one reviewed upgrade family; never an arbitrary label. */
  choiceLabels?: string[];
  tattooPositions?: string[];
  /** Retain an old item's order interpretation without selecting it for new carts. */
  readOnly?: boolean;
};

export function upgradeBindingAcceptsChoice(binding: ExactUpgradeBinding, label: string) {
  return binding.choiceLabels ? binding.choiceLabels.includes(label) : binding.label === label;
}

export type VerifiedUpgradeVariant = {
  id: string;
  productTitle: string;
  amount: number;
  currencyCode: string;
  availableForSale: boolean;
  requiresShipping: boolean;
};

type Charge = {
  amount: number;
  currencyCode: string;
  title?: string;
  items?: Array<{ group?: string; label: string; amount: number; tattooPosition?: string }>;
};

function cents(amount: number) {
  const rounded = Math.round(amount * 100);
  if (!Number.isFinite(amount) || amount < 0 || !Number.isSafeInteger(rounded) || Math.abs(amount * 100 - rounded) > 0.00001) {
    throw new Error('Upgrade amount must be a non-negative, exact currency amount.');
  }
  return rounded;
}

/**
 * Local pilot only, not called by the production cart builder yet. Inputs must
 * come from server repricing and a fresh Storefront variant read, never a client.
 * Use actual parent line IDs so two builds of the same doll cannot cross-attach.
 */
export function exactUpgradeLines(input: {
  parentVariantId: string;
  parentLineId: string;
  quantity: number;
  charge?: Charge;
  bindings: ExactUpgradeBinding[];
  verifiedVariants: VerifiedUpgradeVariant[];
}) {
  const { charge, quantity, parentVariantId, parentLineId } = input;
  if (!/^gid:\/\/shopify\/ProductVariant\/\d+$/.test(parentVariantId) ||
      !/^gid:\/\/shopify\/CartLine\/.+/.test(parentLineId)) {
    throw new Error('An exact parent variant and cart line are required.');
  }
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) throw new Error('Invalid doll quantity.');
  if (!charge) return [];
  const total = cents(charge.amount);
  if (!/^[A-Z]{3}$/.test(charge.currencyCode)) throw new Error('Invalid upgrade currency.');
  const items = charge.items ?? [];
  if (items.reduce((sum, item) => sum + cents(item.amount), 0) !== total || (total > 0 && !items.length)) {
    throw new Error('Itemized upgrades do not match the configured total.');
  }
  if (!total && !items.length) return [];
  const seen = new Set<string>();
  return items.map(item => {
    const amount = cents(item.amount);
    if (!amount || amount % quantity !== 0 || !item.group || !item.label.trim()) {
      throw new Error('Each paid upgrade needs an exact unit price and identity.');
    }
    const identity = JSON.stringify([item.group, item.label]);
    if (seen.has(identity)) throw new Error('Duplicate paid upgrade.');
    seen.add(identity);
    const matches = input.bindings.filter(binding => !binding.readOnly && binding.parentVariantId === parentVariantId &&
      binding.group === item.group && upgradeBindingAcceptsChoice(binding, item.label) &&
      binding.currencyCode === charge.currencyCode && cents(binding.unitAmount) === amount / quantity);
    if (matches.length !== 1) throw new Error(`An exact checkout item is not verified for ${item.label}.`);
    const binding = matches[0];
    if (binding.tattooPositions ? !item.tattooPosition || !binding.tattooPositions.includes(item.tattooPosition) : item.tattooPosition !== undefined) {
      throw new Error('Tattoo placement needs a verified choice.');
    }
    if (!/^gid:\/\/shopify\/ProductVariant\/\d+$/.test(binding.merchandiseId) || binding.merchandiseId === parentVariantId) {
      throw new Error('Invalid upgrade merchandise.');
    }
    if (!binding.productTitle.trim() || binding.productTitle === 'Selected customization') {
      throw new Error('A customer-readable upgrade title is required.');
    }
    const live = input.verifiedVariants.filter(variant => variant.id === binding.merchandiseId);
    if (live.length !== 1 || !live[0].availableForSale || live[0].requiresShipping ||
        live[0].productTitle !== binding.productTitle || live[0].currencyCode !== charge.currencyCode ||
        cents(live[0].amount) !== amount / quantity) {
      throw new Error(`Checkout availability, title or price changed for ${item.label}.`);
    }
    return {
      merchandiseId: binding.merchandiseId,
      quantity,
      parent: { lineId: parentLineId },
      attributes: [
        { key: 'Applies to', value: charge.title || 'Configured doll' },
        { key: 'Customization', value: `${item.group}: ${item.label}` },
        ...(item.tattooPosition ? [{ key: 'Tattoo position', value: item.tattooPosition }] : [])
      ]
    };
  });
}
