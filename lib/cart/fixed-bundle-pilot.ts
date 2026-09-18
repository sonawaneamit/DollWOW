import { exactUpgradeLines, type ExactUpgradeBinding } from './exact-upgrade-lines';
import type { InputLine, Request } from './exact-upgrade-pilot';

const DOLL = 'gid://shopify/ProductVariant/53553717379256';
const BUNDLE = 'gid://shopify/ProductVariant/54096397172920';
const TITLE = 'SE Doll Lita B - Enthusiast build';
const MARKER = '_DollWOW_bundle_build';
const bindings: ExactUpgradeBinding[] = [
  { parentVariantId: DOLL, group: 'Add Extra Head', label: '#134SC', unitAmount: 225, currencyCode: 'USD', merchandiseId: 'gid://shopify/ProductVariant/54093933740216', productTitle: 'SE Doll extra head #134SC' },
  { parentVariantId: DOLL, group: 'Accessories', label: 'Vaginal Irrigator', unitAmount: 35, currencyCode: 'USD', merchandiseId: 'gid://shopify/ProductVariant/54093933805752', productTitle: 'Vaginal irrigator' },
  { parentVariantId: DOLL, group: 'Accessories', label: 'Reusable Drying Rod', unitAmount: 25, currencyCode: 'USD', merchandiseId: 'gid://shopify/ProductVariant/54093933838520', productTitle: 'Reusable drying rod' }
];
type Attribute = { key: string; value: string };
type Money = { amount: string; currencyCode: string };
type Variant = { id: string; price: Money; availableForSale: boolean; requiresShipping: boolean; product: { title: string; tags: string[] } };
type Row = { id: string; quantity: number; attributes: Attribute[]; merchandise: Variant; cost: { subtotalAmount: Money } };
type Group = Row & { __typename: string; lineComponents: Row[] };
type Cart = { id: string; checkoutUrl: string; totalQuantity: number; lines: { nodes: Group[]; pageInfo: { hasNextPage: boolean } } };
const variantFields = 'id price{amount currencyCode} availableForSale requiresShipping product{title tags}';
const rowFields = `id quantity attributes{key value} merchandise{...on ProductVariant{${variantFields}}} cost{subtotalAmount{amount currencyCode}}`;

function usd(money: Money, expected: number) {
  return money.currencyCode === 'USD' && Number(money.amount) === expected;
}

// The approved fixed build is a development-only pilot. Server validation must
// resolve selections and reprice them before calling this bridge.
export async function createFixedBundlePilotCart(lines: InputLine[], discountCodes: string[], request: Request) {
  if (process.env.NODE_ENV === 'production' || process.env.DOLLWOW_FIXED_BUNDLE_PILOT !== '1') return undefined;
  if (!lines.length || lines.length > 20 || lines.some(line => line.merchandiseId !== DOLL)) {
    throw new Error('This local bundle preview supports Lita B only.');
  }
  const ids = [DOLL, BUNDLE, ...bindings.map(binding => binding.merchandiseId)];
  const live = await request<{ nodes: Array<Variant | null> }>(
    `query($ids:[ID!]!){nodes(ids:$ids){...on ProductVariant{${variantFields}}}}`, { ids }, { cache: 'no-store' }
  );
  const variants = ids.map(id => {
    const matches = live.nodes.filter((variant): variant is Variant => variant?.id === id);
    if (matches.length !== 1 || !matches[0].availableForSale) throw new Error('A bundle item is unavailable. Please contact us before checkout.');
    return matches[0];
  });
  const [doll, bundle, ...upgrades] = variants;
  if (!doll.requiresShipping || !usd(doll.price, 2333) || !usd(bundle.price, 2618) || bundle.product.title !== TITLE ||
      !bundle.product.tags.includes('dollwow-system') || !bundle.product.tags.includes('fixed-bundle-pilot')) {
    throw new Error('The approved bundle price or identity has changed.');
  }
  const verifiedVariants = upgrades.map(variant => ({ id: variant.id, productTitle: variant.product.title,
    amount: Number(variant.price.amount), currencyCode: variant.price.currencyCode,
    availableForSale: variant.availableForSale, requiresShipping: variant.requiresShipping }));
  for (const line of lines) {
    const additions = exactUpgradeLines({ parentVariantId: DOLL, parentLineId: 'gid://shopify/CartLine/preflight',
      quantity: line.quantity, charge: line.customizationCharge, bindings, verifiedVariants });
    if (additions.length !== 3) throw new Error('This local preview supports the Lita Enthusiast setup only. Other setups are not released.');
  }
  const inputs = lines.map((line, index) => ({ merchandiseId: BUNDLE, quantity: line.quantity,
    attributes: [...(line.attributes ?? []).filter(attribute => attribute.key !== MARKER), { key: MARKER, value: String(index) }] }));
  const result = await request<{ cartCreate: { cart: Cart | null; userErrors: { message: string }[] } }>(
    `mutation($input:CartInput!){cartCreate(input:$input){cart{id checkoutUrl totalQuantity lines(first:250){pageInfo{hasNextPage} nodes{
      __typename ${rowFields} ...on ComponentizableCartLine{lineComponents{${rowFields}}}
    }}} userErrors{message}}}`, { input: { lines: inputs, discountCodes } }, { cache: 'no-store' }
  );
  const { cart, userErrors } = result.cartCreate;
  if (userErrors.length || !cart || cart.lines.pageInfo.hasNextPage || cart.lines.nodes.length !== inputs.length) {
    throw new Error('Could not verify the complete bundle. Please return to your build.');
  }
  for (const [index, input] of inputs.entries()) {
    const matches = cart.lines.nodes.filter(row => row.attributes.some(a => a.key === MARKER && a.value === String(index)));
    const row = matches[0];
    if (matches.length !== 1 || row.__typename !== 'ComponentizableCartLine' || row.merchandise.id !== BUNDLE ||
        row.quantity !== input.quantity || !usd(row.cost.subtotalAmount, 2618 * input.quantity) ||
        !input.attributes.every(attribute => row.attributes.some(a => a.key === attribute.key && a.value === attribute.value)) || row.lineComponents.length !== 4) {
      throw new Error('The checkout build or its selections changed.');
    }
    for (const component of [doll, ...upgrades]) {
      const rows = row.lineComponents.filter(child => child.merchandise.id === component.id);
      if (rows.length !== 1 || rows[0].quantity !== input.quantity || !usd(rows[0].merchandise.price, Number(component.price.amount)) ||
          rows[0].merchandise.requiresShipping !== component.requiresShipping ||
          rows[0].merchandise.product.title !== component.product.title ||
          !usd(rows[0].cost.subtotalAmount, Number(component.price.amount) * input.quantity)) {
        throw new Error('A paid bundle component changed. Checkout was stopped.');
      }
    }
  }
  return { id: cart.id, checkoutUrl: cart.checkoutUrl, totalQuantity: cart.totalQuantity };
}
