import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { exactUpgradeLines, upgradeBindingAcceptsChoice, type ExactUpgradeBinding, type VerifiedUpgradeVariant } from './exact-upgrade-lines';
import { namedUpgradeBuilds } from './named-upgrade-builds';

const PILOT_VARIANT = 'gid://shopify/ProductVariant/53553717379256';
type Attribute = { key: string; value: string };
export type InputLine = {
  merchandiseId: string; quantity: number; attributes?: Attribute[];
  namedUpgradeAttributes?: Attribute[];
  customizationCharge?: Parameters<typeof exactUpgradeLines>[0]['charge'];
};
export type Request = <T>(query: string, variables: Record<string, unknown>, options: { cache: 'no-store' }) => Promise<T>;
export type PreservedLegacyBuild = { parent: InputLine; charges: Array<{
  merchandiseId: string; quantity: number; attributes?: Attribute[];
}> };
type Variant = { id: string; price: { amount: string; currencyCode: string }; availableForSale: boolean;
  requiresShipping: boolean; product: { title: string; tags: string[] } };
type CartLine = { id: string; quantity: number; attributes: Attribute[]; merchandise: Variant;
  parentRelationship: { parent: { id: string } } | null };
type Cart = { id: string; checkoutUrl: string; totalQuantity: number;
  lines: { nodes: CartLine[]; pageInfo: { hasNextPage: boolean } } };
type Mutation = { cart: Cart | null; userErrors: { message: string }[] };
const CART_FIELDS = `id checkoutUrl totalQuantity lines(first:250){pageInfo{hasNextPage} nodes{
  id quantity attributes{key value} ... on CartLine{parentRelationship{parent{id}} instructions{canRemove canUpdateQuantity}}
  merchandise{... on ProductVariant{id price{amount currencyCode} availableForSale requiresShipping product{title tags}}}
}}`;

function money(value: number) { return Math.round(value * 100); }
function checked(result: Mutation): Cart {
  if (result.userErrors.length || !result.cart || result.cart.lines.pageInfo.hasNextPage) {
    throw new Error('Could not verify this configured checkout. Please return to your build and try again.');
  }
  return result.cart;
}

export async function loadExactUpgradePilotBindings(): Promise<ExactUpgradeBinding[]> {
  const directory = path.join(process.cwd(), 'data/exports/option-template-review/2026-09-13/buyer-led-recipes');
  try {
    const se = JSON.parse(await fs.readFile(path.join(directory, 'se-shared-upgrade-bindings.json'), 'utf8'));
    if (se.status !== 'PILOT_ONLY_NOT_RELEASED' || se.scope !== 'SE_SHARED_UPGRADES' || !Array.isArray(se.products) ||
        !Array.isArray(se.bindings) || !se.bindings.length || se.bindings.length > 50000 ||
        se.products.some((product: {tag:string;handle:string}) => !/^options:se-/.test(product.tag) || /fanreal/i.test(product.handle)) ||
        se.bindings.some((binding: ExactUpgradeBinding) => !se.products.some((product: {parentVariantId:string}) => product.parentVariantId === binding.parentVariantId) ||
          !binding.productTitle || !Number.isFinite(binding.unitAmount) || binding.unitAmount <= 0)) throw new Error('SE checkout bindings need review.');
    const combined: ExactUpgradeBinding[] = [...se.bindings];
    for (const spec of [
      {brand:'avant',scope:'AVANT_SHARED_UPGRADES',products:14,bindings:280,title:'Avant Doll - ',tags:['options:avant-female-silicone-standard']},
      {brand:'ai-tech',scope:'AI_TECH_SHARED_UPGRADES',products:8,bindings:224,title:'Ai-Tech - ',tags:['options:ai-tech-female-tpe-standard','options:ai-tech-female-silicone-standard']},
      {brand:'dolls-castle',scope:'DOLLS_CASTLE_SHARED_UPGRADES',products:152,bindings:5575,title:'Dolls Castle - ',tags:['options:dolls-castle-female-tpe-standard','options:dolls-castle-female-silicone-standard','options:dolls-castle-female-silicone-head-standard','options:dolls-castle-female-silicone-limited-body']},
      {brand:'jarliet',scope:'JARLIET_SHARED_UPGRADES',products:95,bindings:3485,title:'Jarliet Dolls - ',tags:['options:jarliet-female-silicone-head-standard','options:jarliet-female-tpe-standard','options:jarliet-female-silicone-standard']},
      {brand:'angelkiss',scope:'ANGELKISS_SHARED_UPGRADES',products:78,bindings:3042,title:'Angelkiss - ',tags:['options:angelkiss-female-silicone-standard','options:angelkiss-female-silicone-head-standard']},
      {brand:'real-lady',scope:'REAL_LADY_SHARED_UPGRADES',products:55,bindings:3018,title:'Real Lady - ',tags:['options:real-lady-female-silicone-selectable-head','options:real-lady-female-silicone-fixed-head']},
      {brand:'lusandy',scope:'LUSANDY_SHARED_UPGRADES',products:33,bindings:1452,title:'Lusandy - ',tags:['options:lusandy-female-silicone-standard']},
      {brand:'il',scope:'IL_SHARED_UPGRADES',products:19,bindings:1064,title:'IL Doll - ',tags:['options:il-female-silicone-standard']},
      {brand:'moonvale',scope:'MOONVALE_SHARED_UPGRADES',products:10,bindings:904,title:'Moonvale - ',tags:['options:moonvale-female-silicone-standard']},
      {brand:'6ye',scope:'SIX_YE_SHARED_UPGRADES',products:121,bindings:10043,title:'6YE Dolls - ',tags:['options:6ye-female-tpe-standard','options:6ye-female-silicone-head-standard','options:6ye-male-silicone-head-standard','options:6ye-female-silicone-standard']},
      {brand:'hr',scope:'HR_SHARED_UPGRADES',products:106,bindings:3674,title:'HR Dolls - ',tags:['options:hr-male-silicone-head-standard','options:hr-male-tpe-standard','options:hr-female-tpe-standard','options:hr-female-silicone-head-standard','options:hr-female-silicone-standard']},
      {brand:'yl',scope:'YL_SHARED_UPGRADES',products:161,bindings:7847,title:'YL Dolls - ',tags:['options:yl-female-tpe-standard','options:yl-female-silicone-standard']},
      {brand:'piper',scope:'PIPER_SHARED_UPGRADES',products:61,bindings:1985,title:'Piper Dolls - ',tags:['options:piper-female-tpe-skeleton-options','options:piper-female-silicone-standard','options:piper-female-tpe-enhanced-mouth','options:piper-female-tpe-limited-body']},
      {brand:'irontech',scope:'IRONTECH_SHARED_UPGRADES',products:393,bindings:20176,title:'Irontech Dolls - ',tags:['options:irontech-male-silicone-standard','options:irontech-female-silicone-standard','options:irontech-female-hybrid-standard','options:irontech-male-tpe-standard','options:irontech-female-silicone-head-cloudtouch','options:irontech-female-tpe-standard','options:irontech-female-silicone-head-standard','options:irontech-female-silicone-cloudtouch']},
      {brand:'climax',scope:'CLIMAX_SHARED_UPGRADES',products:59,bindings:2107,title:'Climax Doll - ',tags:['options:climax-female-hybrid-extra-head','options:climax-female-silicone-standard','options:climax-female-tpe-standard','options:climax-female-hybrid-standard','options:climax-female-silicone-restricted-head','options:climax-female-hybrid-restricted-head','options:climax-female-silicone-appearance']},
      {brand:'wm',scope:'WM_SHARED_UPGRADES',products:469,bindings:89407,title:'WM Dolls - ',tags:['options:wm-male-tpe-standard','options:wm-female-tpe-enhanced-head','options:wm-female-tpe-standard','options:wm-female-silicone-softness','options:wm-female-silicone-standard','options:wm-male-silicone-standard']},
      {brand:'starpery',scope:'STARPERY_SHARED_UPGRADES',products:208,bindings:46559,title:'Starpery - ',tags:['options:starpery-female-silicone-head-standard','options:starpery-female-silicone-standard','options:starpery-male-silicone-head-standard']},
      {brand:'sy',scope:'SY_SHARED_UPGRADES',products:180,bindings:15698,title:'SY Dolls - ',tags:[
        'options:sy-female-tpe-standard-smart','options:sy-female-tpe-standard',
        'options:sy-female-silicone-head-standard-smart','options:sy-male-silicone-standard',
        'options:sy-female-silicone-head-articulated-head','options:sy-female-silicone-articulated-head',
        'options:sy-female-silicone-head-standard','options:sy-female-silicone-head-articulated-head-smart',
        'options:sy-female-silicone-articulated-head-smart','options:sy-female-silicone-head-expressive-head-smart',
        'options:sy-female-silicone-head-expressive-head','options:sy-female-silicone-expressive-head-smart',
        'options:sy-female-silicone-standard','options:sy-female-silicone-expressive-head','options:sy-male-silicone-head-standard'
      ]}
    ]) {
      let batch;
      try { batch = JSON.parse(await fs.readFile(path.join(directory, `${spec.brand}-shared-upgrade-bindings.json`), 'utf8')); }
      catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
      if (!batch) continue;
      if (batch.status !== 'PILOT_ONLY_NOT_RELEASED' || batch.scope !== spec.scope ||
          !Array.isArray(batch.products) || batch.products.length !== spec.products || !Array.isArray(batch.bindings) || batch.bindings.length !== spec.bindings ||
          new Set(batch.products.map((p: {parentVariantId:string}) => p.parentVariantId)).size !== spec.products ||
          batch.products.some((p: {tag:string;handle:string;parentVariantId:string}) => !spec.tags.includes(p.tag) || /fanreal/i.test(p.handle) || combined.some(b=>b.parentVariantId===p.parentVariantId)) ||
          batch.bindings.some((b:ExactUpgradeBinding) => !batch.products.some((p:{parentVariantId:string})=>p.parentVariantId===b.parentVariantId) || !b.productTitle?.startsWith(spec.title) || b.currencyCode !== 'USD' || !Number.isFinite(b.unitAmount) || b.unitAmount <= 0)) {
        throw new Error(`${spec.brand} checkout bindings need review.`);
      }
      combined.push(...batch.bindings);
    }
    return combined;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  try {
    const shared = JSON.parse(await fs.readFile(path.join(directory, 'lita-shared-upgrade-bindings.json'), 'utf8'));
    if (shared.status !== 'PILOT_ONLY_NOT_RELEASED' || shared.scope !== 'LITA_SHARED_UPGRADES' ||
        !Array.isArray(shared.bindings) || !shared.bindings.length || shared.bindings.length > 100 ||
        shared.bindings.some((binding: ExactUpgradeBinding) => binding.parentVariantId !== PILOT_VARIANT ||
          !binding.productTitle || !Number.isFinite(binding.unitAmount) || binding.unitAmount <= 0 ||
          (binding.choiceLabels && (!Array.isArray(binding.choiceLabels) || !binding.choiceLabels.length ||
            binding.choiceLabels.some(label => typeof label !== 'string' || !label.trim()) || new Set(binding.choiceLabels).size !== binding.choiceLabels.length)))) {
      throw new Error('Shared Lita upgrade bindings need review.');
    }
    return shared.bindings;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  const file = path.join(directory, 'exact-upgrade-pilot-bindings.json');
  const data = JSON.parse(await fs.readFile(file, 'utf8'));
  if (data.status !== 'PILOT_ONLY_NOT_RELEASED' || !Array.isArray(data.bindings) || data.bindings.length !== 3) throw new Error('Pilot bindings unavailable.');
  return data.bindings;
}

// This limited bridge cannot be enabled in production. It exercises actual
// Shopify merchandise and nesting before designing a catalog-wide migration.
export async function createExactUpgradePilotCart(
  lines: InputLine[], discountCodes: string[], request: Request,
  loadBindings = loadExactUpgradePilotBindings
): Promise<{ id: string; checkoutUrl: string; totalQuantity: number } | undefined> {
  if (process.env.NODE_ENV === 'production' || process.env.DOLLWOW_EXACT_UPGRADE_PILOT !== '1') return undefined;
  const allBindings = await loadBindings();
  return createVerifiedNamedUpgradeCart(lines, discountCodes, request, allBindings);
}

/** Shared executor. Bindings must come from the reviewed pilot or approved release loader. */
export async function createVerifiedNamedUpgradeCart(
  lines: InputLine[], discountCodes: string[], request: Request, allBindings: ExactUpgradeBinding[], allowUnmappedBaseLines = false,
  preserved: PreservedLegacyBuild[] = []
): Promise<{ id: string; checkoutUrl: string; totalQuantity: number }> {
  const isMapped = (id: string) => allBindings.some(binding => binding.parentVariantId === id);
  if (!lines.length || lines.length > 20 || lines.some(line => !isMapped(line.merchandiseId) &&
      !(allowUnmappedBaseLines && !line.customizationCharge))) {
    throw new Error('This local checkout pilot supports reviewed brand batches (Lita B only without the SE registry).');
  }
  if (lines.some(line => !line.namedUpgradeAttributes)) {
    throw new Error('This configuration needs a verified included-choice summary before named-upgrade checkout.');
  }
  const parentIds = [...new Set(lines.map(line => line.merchandiseId))];
  if (preserved.some(build => isMapped(build.parent.merchandiseId))) throw new Error('Reviewed dolls cannot use legacy charges.');
  const legacyInputs = preserved.flatMap((build, index) => [...build.charges, build.parent].map((row, item) => ({
    merchandiseId: row.merchandiseId, quantity: row.quantity,
    attributes: [...(row.attributes ?? []), { key: '_DollWOW_checkout_model', value: 'legacy-v1' },
      { key: '_DollWOW_legacy_line', value: `${index}:${item}` }]
  })));
  const bindings = allBindings.filter(binding => parentIds.includes(binding.parentVariantId));
  // Read the chosen charges, not every possible upgrade for every doll in the cart.
  const selectedBindings = bindings.filter(binding => !binding.readOnly && lines.some(line =>
    line.merchandiseId === binding.parentVariantId && line.customizationCharge?.items?.some(item =>
      item.group === binding.group && upgradeBindingAcceptsChoice(binding, item.label))));
  const ids = [...new Set([...parentIds, ...selectedBindings.map(b => b.merchandiseId), ...legacyInputs.map(row => row.merchandiseId)])];
  if (ids.length > 250) throw new Error('Too many distinct configured items for one verified checkout.');
  const live = await request<{ nodes: Array<Variant | null> }>(
    `query($ids:[ID!]!){nodes(ids:$ids){... on ProductVariant{id price{amount currencyCode} availableForSale requiresShipping product{title tags}}}}`,
    { ids }, { cache: 'no-store' }
  );
  const parentVariants = new Map(parentIds.map(id => [id, live.nodes.find(v => v?.id === id)]));
  let legacyTotal = 0;
  for (const build of preserved) {
    const parent = live.nodes.find(v => v?.id === build.parent.merchandiseId);
    if (!parent?.availableForSale || !parent.requiresShipping || parent.price.currencyCode !== 'USD' ||
        !Number.isFinite(Number(parent.price.amount)) || build.parent.customizationCharge?.currencyCode !== 'USD') {
      throw new Error('A deferred doll is unavailable for checkout.');
    }
    let charges = 0;
    for (const row of build.charges) {
      const variant = live.nodes.find(v => v?.id === row.merchandiseId);
      if (!variant?.availableForSale || variant.requiresShipping || variant.price.currencyCode !== 'USD' ||
          !Number.isInteger(row.quantity) || row.quantity <= 0 || !Number.isFinite(Number(variant.price.amount))) {
        throw new Error('A deferred customization charge is unavailable.');
      }
      charges += money(Number(variant.price.amount)) * row.quantity;
    }
    if (charges !== money(build.parent.customizationCharge!.amount)) throw new Error('Deferred customization prices changed.');
    legacyTotal += money(Number(parent.price.amount)) * build.parent.quantity + charges;
  }
  if ([...parentVariants.values()].some(parent => !parent?.availableForSale || !parent.requiresShipping || parent.price.currencyCode !== 'USD' || !Number.isFinite(Number(parent.price.amount)))) {
    throw new Error('The pilot doll is not available with verified USD pricing.');
  }
  const verifiedVariants: VerifiedUpgradeVariant[] = live.nodes.flatMap(variant => {
    if (!variant || !selectedBindings.some(binding => binding.merchandiseId === variant.id)) return [];
    if (!variant.product.tags.includes('dollwow-system') || !variant.product.tags.includes('exact-upgrade-pilot')) throw new Error('Unexpected pilot merchandise.');
    return [{ id: variant.id, productTitle: variant.product.title, amount: Number(variant.price.amount),
      currencyCode: variant.price.currencyCode, availableForSale: variant.availableForSale, requiresShipping: variant.requiresShipping }];
  });
  const plan = (line: InputLine, parentLineId: string) => exactUpgradeLines({
    parentVariantId: line.merchandiseId, parentLineId, quantity: line.quantity,
    charge: line.customizationCharge, bindings, verifiedVariants
  });
  // Preflight every upgrade before any cart is created; Collector stays blocked
  // until its additional prices are mapped, never falling back to denominations.
  for (const line of lines) plan(line, 'gid://shopify/CartLine/preflight');
  const parentInputs = lines.map((line, index) => ({ merchandiseId: line.merchandiseId, quantity: line.quantity,
    attributes: [...line.namedUpgradeAttributes!, { key: '_DollWOW_pilot_build', value: String(index) },
      ...(isMapped(line.merchandiseId) ? [{ key: '_DollWOW_build_id', value: randomUUID() }] : []),
      { key: '_DollWOW_checkout_model', value: isMapped(line.merchandiseId) ? 'named-upgrades-v1' : 'standard-v1' }] }));
  const created = checked((await request<{ cartCreate: Mutation }>(
    `mutation($input:CartInput!){cartCreate(input:$input){cart{${CART_FIELDS}} userErrors{message}}}`,
    { input: { lines: [...parentInputs, ...legacyInputs], discountCodes } }, { cache: 'no-store' }
  )).cartCreate);
  const parents = parentInputs.map((input, index) => {
    const matches = created.lines.nodes.filter(node => node.merchandise.id === input.merchandiseId &&
      node.attributes.some(a => a.key === '_DollWOW_pilot_build' && a.value === String(index)) && !node.parentRelationship);
    if (matches.length !== 1 || matches[0].quantity !== input.quantity ||
        money(Number(matches[0].merchandise.price.amount)) !== money(Number(parentVariants.get(input.merchandiseId)!.price.amount))) throw new Error('Pilot parent changed during checkout.');
    return matches[0];
  });
  const additions = lines.flatMap((line, index) => plan(line, parents[index].id).map(upgrade => ({
    ...upgrade, attributes: [...upgrade.attributes,
      { key: '_DollWOW_build_id', value: parentInputs[index].attributes.find(a => a.key === '_DollWOW_build_id')!.value }]
  })));
  const completed = additions.length ? checked((await request<{ cartLinesAdd: Mutation }>(
    `mutation($cartId:ID!,$lines:[CartLineInput!]!){cartLinesAdd(cartId:$cartId,lines:$lines){cart{${CART_FIELDS}} userErrors{message}}}`,
    { cartId: created.id, lines: additions }, { cache: 'no-store' }
  )).cartLinesAdd) : created;
  if (completed.lines.nodes.length !== parents.length + additions.length + legacyInputs.length) throw new Error('Checkout is missing a configured item.');
  let actual = 0;
  for (const input of legacyInputs) {
    const rows = completed.lines.nodes.filter(row => row.merchandise.id === input.merchandiseId &&
      input.attributes.every(a => row.attributes.some(b => a.key === b.key && a.value === b.value)));
    const variant = live.nodes.find(v => v?.id === input.merchandiseId)!;
    if (rows.length !== 1 || rows[0].quantity !== input.quantity || rows[0].parentRelationship ||
        rows[0].attributes.length !== input.attributes.length || rows[0].merchandise.price.currencyCode !== 'USD' ||
        money(Number(rows[0].merchandise.price.amount)) !== money(Number(variant.price.amount))) {
      throw new Error('A deferred checkout item changed.');
    }
    actual += money(Number(variant.price.amount)) * input.quantity;
  }
  for (const [index, original] of parents.entries()) {
    const row = completed.lines.nodes.find(n => n.id === original.id);
    if (!row || row.quantity !== lines[index].quantity || row.merchandise.id !== lines[index].merchandiseId || row.parentRelationship ||
        row.attributes.length !== parentInputs[index].attributes.length ||
        !parentInputs[index].attributes.every(a => row.attributes.some(b => a.key === b.key && a.value === b.value))) {
      throw new Error('Configured doll or included choices changed.');
    }
    actual += money(Number(row.merchandise.price.amount)) * row.quantity;
  }
  for (const expected of additions) {
    const rows = completed.lines.nodes.filter(row => row.parentRelationship?.parent.id === expected.parent.lineId &&
      row.merchandise.id === expected.merchandiseId && expected.attributes.every(a => row.attributes.some(b => a.key === b.key && a.value === b.value)));
    const verified = verifiedVariants.find(v => v.id === expected.merchandiseId)!;
    if (rows.length !== 1 || rows[0].quantity !== expected.quantity || rows[0].merchandise.requiresShipping ||
        rows[0].merchandise.product.title !== verified.productTitle || rows[0].merchandise.price.currencyCode !== verified.currencyCode ||
        money(Number(rows[0].merchandise.price.amount)) !== money(verified.amount)) throw new Error('A checkout upgrade changed.');
    actual += money(verified.amount) * rows[0].quantity;
  }
  const expected = lines.reduce((sum, line) => sum + money(Number(parentVariants.get(line.merchandiseId)!.price.amount)) * line.quantity + money(line.customizationCharge?.amount ?? 0), 0);
  if (actual !== expected + legacyTotal) throw new Error('Configured checkout prices do not match.');
  namedUpgradeBuilds({ ...completed, lines: { ...completed.lines, nodes: completed.lines.nodes.filter(node =>
    node.parentRelationship || isMapped(node.merchandise.id)) } }, bindings);
  if (process.env.NODE_ENV !== 'production' && process.env.DOLLWOW_EXACT_UPGRADE_PILOT_JOURNAL === '1') {
    await fs.writeFile(path.join(process.cwd(), 'data/exports/option-template-review/2026-09-13/buyer-led-recipes', `exact-upgrade-cart-${Date.now()}.json`),
      JSON.stringify({ status: 'PILOT_CART_NOT_ORDER', createdAt: new Date().toISOString(), preDiscountCents: actual, cart: completed }, null, 2) + '\n', { flag: 'wx' });
  }
  return { id: completed.id, checkoutUrl: completed.checkoutUrl, totalQuantity: completed.totalQuantity };
}
