import { afterEach, describe, expect, it, vi } from 'vitest';
import { createExactUpgradePilotCart, createVerifiedNamedUpgradeCart } from '@/lib/cart/exact-upgrade-pilot';
import type { ExactUpgradeBinding } from '@/lib/cart/exact-upgrade-lines';

const parent = 'gid://shopify/ProductVariant/53553717379256';
const binding: ExactUpgradeBinding = { parentVariantId: parent, group: 'Body', label: 'Heating', unitAmount: 150,
  currencyCode: 'USD', merchandiseId: 'gid://shopify/ProductVariant/2', productTitle: 'Body heating' };
const input = { merchandiseId: parent, quantity: 1, attributes: [{ key: 'DollWow Body', value: 'Heating (+$150)' }],
  namedUpgradeAttributes: [{ key: 'Included: Skin tone', value: 'Tan' }],
  customizationCharge: { amount: 150, currencyCode: 'USD', items: [{ group: 'Body', label: 'Heating', amount: 150 }] } };
function fixture(mode = '') {
  vi.stubEnv('NODE_ENV', 'development'); vi.stubEnv('DOLLWOW_EXACT_UPGRADE_PILOT', '1');
  const variants = [
    { id: parent, price: { amount: '2333', currencyCode: 'USD' }, availableForSale: true, requiresShipping: true, product: { title: 'Lita', tags: [] } },
    { id: binding.merchandiseId, price: { amount: mode === 'price-drift' ? '151' : '150', currencyCode: 'USD' }, availableForSale: true, requiresShipping: false,
      product: { title: binding.productTitle, tags: ['dollwow-system', 'exact-upgrade-pilot'] } }
  ];
  if(mode==='two-products') variants.push({...variants[0],id:'gid://shopify/ProductVariant/3',price:{amount:'1500',currencyCode:'USD'}});
  type Line = { id: string; quantity: number; attributes: { key: string; value: string }[]; merchandise: typeof variants[number]; parentRelationship: { parent: { id: string } } | null };
  let rows: Line[] = [];
  const cart = () => ({ id: 'cart-test', checkoutUrl: 'https://checkout.example.test', totalQuantity: rows.reduce((n, r) => n + r.quantity, 0),
    lines: { nodes: rows, pageInfo: { hasNextPage: false } } });
  const calls: string[] = [];
  const request = async <T>(query: string, variables: Record<string, unknown>): Promise<T> => {
    calls.push(query);
    if (query.startsWith('query')) return { nodes: variants } as T;
    if (query.includes('cartCreate')) {
      const data = variables.input as { lines: { merchandiseId: string; quantity: number; attributes: Line['attributes'] }[] };
      rows = data.lines.map((line, i) => ({ ...line, id: `gid://shopify/CartLine/${i}`, merchandise: variants.find(v=>v.id===line.merchandiseId)!, parentRelationship: null }));
      return { cartCreate: { cart: cart(), userErrors: [] } } as T;
    }
    if (mode === 'add-error') return { cartLinesAdd: { cart: null, userErrors: [{ message: 'Unavailable' }] } } as T;
    const children = variables.lines as { quantity: number; attributes: Line['attributes']; parent: { lineId: string } }[];
    rows = [...rows, ...children.map((line, i) => ({ ...line, id: `gid://shopify/CartLine/child-${i}`, merchandise: variants[1],
      parentRelationship: { parent: { id: mode === 'wrong-parent' ? 'bad' : line.parent.lineId } } }))];
    if (mode === 'missing-child') rows.pop();
    if (mode === 'lost-included-choice') rows[0].attributes = rows[0].attributes.filter(a => !a.key.startsWith('Included: '));
    return { cartLinesAdd: { cart: cart(), userErrors: [] } } as T;
  };
  return { request, calls, bindings: async () => mode==='two-products'?[binding,{...binding,parentVariantId:'gid://shopify/ProductVariant/3'}]:[binding], rows: () => rows };
}
afterEach(() => vi.unstubAllEnvs());
describe('development-only exact-price pilot integration', () => {
  it('does not run in production even if flagged', async () => {
    const f = fixture(); vi.stubEnv('NODE_ENV', 'production');
    expect(await createExactUpgradePilotCart([input], [], f.request, f.bindings)).toBeUndefined(); expect(f.calls).toHaveLength(0);
  });
  it('does not run without its explicit flag', async () => {
    const f = fixture(); vi.stubEnv('DOLLWOW_EXACT_UPGRADE_PILOT', '0');
    expect(await createExactUpgradePilotCart([input], [], f.request, f.bindings)).toBeUndefined(); expect(f.calls).toHaveLength(0);
  });
  it('rejects non-pilot dolls', async () => {
    const f = fixture(); await expect(createExactUpgradePilotCart([{ ...input, merchandiseId: binding.merchandiseId }], [], f.request, f.bindings)).rejects.toThrow('Lita B only');
    expect(f.calls).toHaveLength(0);
  });
  it('preflights prices before creating a cart', async () => {
    const f = fixture('price-drift'); await expect(createExactUpgradePilotCart([input], [], f.request, f.bindings)).rejects.toThrow('changed');
    expect(f.calls).toHaveLength(1);
  });
  it('returns a checkout only after the actual child relationship is verified', async () => {
    const f = fixture(); expect(await createExactUpgradePilotCart([input], ['TEST'], f.request, f.bindings)).toMatchObject({ id: 'cart-test', totalQuantity: 2 });
    expect(f.calls).toHaveLength(3);
    expect(f.rows()[0].attributes).toContainEqual({ key: 'Included: Skin tone', value: 'Tan' });
    expect(JSON.stringify(f.rows()[0].attributes)).not.toContain('Heating');
    const reference = f.rows()[0].attributes.find(a => a.key === '_DollWOW_build_id');
    expect(reference?.value).toBeTruthy();
    expect(f.rows()[1].attributes).toContainEqual(reference);
  });
  it('rejects missing server-generated included choices before creating a cart', async () => {
    const f = fixture();
    await expect(createExactUpgradePilotCart([{ ...input, namedUpgradeAttributes: undefined }], [], f.request, f.bindings)).rejects.toThrow('included-choice');
    expect(f.calls).toHaveLength(0);
  });
  it('keeps two builds of the same variant attached to separate parent line IDs', async () => {
    const f = fixture(); expect(await createExactUpgradePilotCart([input, input], [], f.request, f.bindings)).toMatchObject({ totalQuantity: 4 });
    const refs = f.rows().filter(row => !row.parentRelationship).map(row => row.attributes.find(a => a.key === '_DollWOW_build_id')!.value);
    expect(new Set(refs).size).toBe(2);
  });
  it('keeps different SE dolls and their distinct base prices attached correctly', async () => {
    const f=fixture('two-products');
    expect(await createExactUpgradePilotCart([input,{...input,merchandiseId:'gid://shopify/ProductVariant/3'}],[],f.request,f.bindings)).toMatchObject({totalQuantity:4});
    expect(f.rows().filter(row=>!row.parentRelationship).map(row=>row.merchandise.price.amount)).toEqual(['2333','1500']);
    expect(new Set(f.rows().filter(row=>row.parentRelationship).map(row=>row.parentRelationship!.parent.id)).size).toBe(2);
  });
  it('supports an ordinary base-only item beside a reviewed configured doll', async () => {
    const f = fixture('two-products');
    vi.stubEnv('NODE_ENV', 'production');
    const base = { merchandiseId: 'gid://shopify/ProductVariant/3', quantity: 1, namedUpgradeAttributes: [] };
    expect(await createVerifiedNamedUpgradeCart([input, base], [], f.request, [binding], true)).toMatchObject({ totalQuantity: 3 });
    expect(f.rows().filter(row => row.parentRelationship)).toHaveLength(1);
    expect(f.rows()[1].attributes).toContainEqual({ key: '_DollWOW_checkout_model', value: 'standard-v1' });
  });
  it.each(['add-error', 'missing-child', 'wrong-parent', 'lost-included-choice'])('never redirects a partial or misattached %s cart', async mode => {
    const f = fixture(mode); await expect(createExactUpgradePilotCart([input], [], f.request, f.bindings)).rejects.toThrow();
  });
});
