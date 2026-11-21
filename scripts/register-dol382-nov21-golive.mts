#!/usr/bin/env node
// DOL-382 (21 Nov 2026): register the Nov 19 Climax SiP157 + FU Doll previews Martin approved for go-live.
// Reads the drafts from the production Shopify Admin (drafts are invisible to the Storefront API), maps them with
// the app's own mapShopifyProduct and mirrors the PDP's Admin body_code/head_model merge, exactly like
// scripts/relink-dol381-382-from-admin.mts. Writes template-release entries (tiers), named checkout parents
// and the FU Doll named charge family. Re-run after any Shopify edit, and recheck against the real Storefront
// product right after publication.
// Run: SHOPIFY_STORE_DOMAIN=... SHOPIFY_ADMIN_ACCESS_TOKEN=... NODE_OPTIONS=--conditions=react-server \
//      npx tsx scripts/register-dol382-nov21-golive.mts [--write]
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { mapShopifyProduct } from '../lib/shopify/mappers';
import { getCustomizationConfig } from '../lib/customization/configs';
import { getDefaultSelections } from '../lib/customization/resolve';
import { templateRuntimeHash, templateReleasePayloadHash, templateReleaseIssues } from '../lib/customization/template-release-registry';
import { templateConfigSignature } from '../lib/customization/template-config-signature';
import { templateConfigurationPresets } from '../lib/customization/template-presets';
import { namedUpgradePayloadHash } from '../lib/cart/named-upgrade-release';

const CLIMAX_BINDING = '8586064917530b4599bbb3c6026a0013ce64e2dff8aea26f579fea957b6b719d';
const CLIMAX_CHARGE_FAMILY = '2b7031e6681b6b2db4c0e2117b3abe49b18b1ba1319d1380a1301df00cfcc8e4'; // live Mayu SiY158 / Rhea SiU156
const FU_FAMILY = 'fudoll-silicone-nov21';
const PRODUCTS: Array<{ id: string; kind: 'climax' | 'fu-female' | 'fu-male' }> = [
  { id: 'gid://shopify/Product/10745002033336', kind: 'climax' },   // Lexi SiP157
  { id: 'gid://shopify/Product/10745002688696', kind: 'climax' },   // Frida SiP157
  { id: 'gid://shopify/Product/10745005473976', kind: 'fu-female' }, // White Peach 163 I
  { id: 'gid://shopify/Product/10745005637816', kind: 'fu-female' }, // Qin Xingyue 163 I
  { id: 'gid://shopify/Product/10745005801656', kind: 'fu-male' },   // Luo Chengchuan 176
  // DOL-382 held go-live (21 Nov, second release): October FU drafts brought up to the White Peach standard.
  { id: 'gid://shopify/Product/10638363754680', kind: 'fu-female' }, // Anna 162 F
  { id: 'gid://shopify/Product/10638363852984', kind: 'fu-female' }, // Tifa 162 F
  { id: 'gid://shopify/Product/10638363951288', kind: 'fu-female' }, // Lisa 157 G RST
  { id: 'gid://shopify/Product/10638364049592', kind: 'fu-female' }  // Ziqing 165 F
];
const REG = 'lib/customization/evidence/template-release.json';
const NAMED = 'lib/cart/evidence/named-upgrades-release.json';
const RECIPES = 'data/draft-previews/dol382-new-dolls-recipes-nov19.json';
const FIXTURE = 'tests/fixtures/dol382-nov21-admin-readback.json';
const EVIDENCE = 'docs/catalog/dol382-nov21-held-golive.md';
const sha = (s: string) => createHash('sha256').update(s).digest('hex');
const money = (a: string) => { const n = Number(a); return Number.isInteger(n) ? n.toFixed(1) : String(n); };
const META: Record<string, string> = { catalogIdentityKey: 'catalog_identity_key', catalogBodyIdentityKey: 'catalog_body_identity_key', headModel: 'head_model', bodyCode: 'body_code', displayName: 'display_name', lookTags: 'look_tags', brand: 'brand', sourceReleaseRank: 'source_release_rank', material: 'material', heightCm: 'height_cm', weightLb: 'weight_lb', cupSize: 'cup_size', measurements: 'measurements', warehouseCountry: 'warehouse_country', warehouseRegions: 'warehouse_regions', stockStatus: 'stock_status', deliveryEstimate: 'delivery_estimate', stockLastCheckedAt: 'stock_last_checked_at', customAvailable: 'custom_available', penisAddOnAvailable: 'has_insertable_penis_add_on', irontechUlwEligibility: 'irontech_ulw_eligibility', qcNote: 'qc_note', customizationGroups: 'customization_groups' };
async function admin(query: string, variables: Record<string, unknown>) {
  const res = await fetch(`https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2026-04/graphql.json`, { method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_ACCESS_TOKEN ?? '' },
    body: JSON.stringify({ query, variables }) });
  const json: any = await res.json();
  if (json.errors || !json.data) throw new Error(`Admin read failed: ${JSON.stringify(json.errors ?? res.status)}`);
  return json.data;
}
const productQuery = `query($ids:[ID!]!){ nodes(ids:$ids){ ... on Product { id handle title description status seo{title description} vendor productType tags
  priceRangeV2{ minVariantPrice{amount currencyCode} maxVariantPrice{amount currencyCode} }
  variants(first:30){ edges{ node{ id title availableForSale price selectedOptions{name value} } } }
  ${Object.entries(META).map(([alias, key]) => `${alias}: metafield(namespace:"custom", key:"${key}"){ value }`).join('\n')} } } }`;
const data = await admin(productQuery, { ids: PRODUCTS.map(p => p.id) });

// FU Doll charge products (tag fu-intake-2026-10-03) plus the shared Climax irrigator / drying rod products
// (generic DollWOW accessory charges already live in the Climax family).
const charges: any[] = [];
let cursor: string | null = null;
do {
  const page: any = await admin(`query($c:String){products(first:100,after:$c,query:"handle:dollwow-fu-upgrade-*"){pageInfo{hasNextPage endCursor} nodes{id handle title tags variants(first:2){nodes{id price}}}}}`, { c: cursor });
  charges.push(...page.products.nodes); cursor = page.products.pageInfo.hasNextPage ? page.products.pageInfo.endCursor : null;
} while (cursor);

const registry = JSON.parse(fs.readFileSync(REG, 'utf8'));
const named = JSON.parse(fs.readFileSync(NAMED, 'utf8'));
const recipes = JSON.parse(fs.readFileSync(RECIPES, 'utf8'));
const climaxFamily: any[] = named.payload.groups[CLIMAX_CHARGE_FAMILY];
const shared = (label: string) => { const b = climaxFamily.find(x => x.group === 'Accessories' && x.label === label); if (!b) throw new Error(`missing shared ${label}`); return { ...b, choiceLabels: [label] }; };
const fuCharge = (title: string, amount: number) => {
  const hit = charges.filter(c => c.title === title && Number(c.variants.nodes[0].price) === amount);
  if (hit.length !== 1) throw new Error(`FU charge ${title} $${amount}: ${hit.length} matches`);
  if (!hit[0].tags.includes('dollwow-system') || !hit[0].tags.includes('exact-upgrade-pilot')) throw new Error(`FU charge ${title} missing system tags`);
  return hit[0];
};
// Config group label -> FU charge product title prefix (the products were created before the menu gained "(Multiple)").
const productGroup: Record<string, string> = {
  'Premium Head & Body Options (Multiple) (Silicone Body)': 'Premium Head & Body Options (Silicone Body)',
  'Premium Head Options For Extra Head (Multiple)': 'Premium Head Options For Extra Head'
};
const productLabel: Record<string, string> = { 'Vagina Hair Type|Pubic Hair': 'Pubic hair style' };
const fuBindings = new Map<string, any>();
function fuBindingFor(group: string, label: string, amount: number) {
  if (group === 'Accessories' && (label === 'Vaginal Irrigator' || label === 'Reusable Drying Rod')) {
    const b = shared(label); if (b.unitAmount !== amount) throw new Error(`shared ${label} price`); return b;
  }
  const pg = productGroup[group] ?? group;
  if (group === 'Sexy Lingerie Add-On') {
    const c = fuCharge(`FUDOLL - ${pg}: Lingerie style`, amount);
    const key = `lingerie|${amount}`;
    const existing = fuBindings.get(key);
    if (existing) { if (!existing.choiceLabels.includes(label)) existing.choiceLabels.push(label); return existing; }
    const b = { group, label: `Lingerie style ($${amount})`, unitAmount: amount, currencyCode: 'USD', merchandiseId: c.variants.nodes[0].id, productTitle: c.title, productId: c.id, handle: c.handle, choiceLabels: [label] };
    fuBindings.set(key, b); return b;
  }
  const c = fuCharge(`FUDOLL - ${pg}: ${productLabel[`${group}|${label}`] ?? label}`, amount);
  return { group, label, unitAmount: amount, currencyCode: 'USD', merchandiseId: c.variants.nodes[0].id, productTitle: c.title, productId: c.id, handle: c.handle, choiceLabels: [label] };
}
const fuFamily: any[] = [];
const recipeChanges: string[] = [];
const famKey = (b: any) => JSON.stringify([b.group, b.merchandiseId]);

const report: any[] = []; const readback: any[] = [];
for (const node of data.nodes) {
  const spec = PRODUCTS.find(p => p.id === node.id)!;
  const { status, priceRangeV2, ...rest } = node; const currencyCode = priceRangeV2.minVariantPrice.currencyCode;
  const product = mapShopifyProduct({ ...rest, featuredImage: null, images: { edges: [] },
    priceRange: { minVariantPrice: { amount: money(priceRangeV2.minVariantPrice.amount), currencyCode }, maxVariantPrice: { amount: money(priceRangeV2.maxVariantPrice.amount), currencyCode } },
    variants: { edges: node.variants.edges.map((e: any) => ({ node: { ...e.node, price: { amount: money(e.node.price), currencyCode } } })) } });
  product.extended = { ...product.extended, bodyCode: node.bodyCode?.value || product.extended.bodyCode, headModel: node.headModel?.value || product.extended.headModel };
  if (product.tags.some(t => /^(dollwow-test|dol382-nov19)$/.test(t))) throw new Error(`${product.handle}: internal tags still present`);
  const config = getCustomizationConfig(product);
  const signature = templateConfigSignature(config);
  const sig = `sha256:${sha(signature)}`;
  const optionTag = product.tags.filter(t => /^options:/.test(t));
  if (optionTag.length !== 1) throw new Error(`${product.handle}: options tag`);
  let bindingKey: string;
  if (spec.kind === 'climax') {
    bindingKey = CLIMAX_BINDING;
    if (registry.payload.bindings[bindingKey].signature !== sig) throw new Error(`${product.handle}: Climax menu differs from live Mayu/Rhea`);
  } else {
    const recipeEntry = recipes.find((r: any) => r.productIds.includes(product.id));
    bindingKey = `fudoll-${spec.kind === 'fu-male' ? 'male' : 'female'}-silicone-${sig.slice(7, 19)}`;
    const recipe = { ...structuredClone(recipeEntry.recipe), signature: sig };
    const existing = registry.payload.bindings[bindingKey];
    // Recipes may change only through the recipes file (Luo's Starter moved to 9-ending tiers on 21 Nov); log it.
    if (existing && JSON.stringify(existing) !== JSON.stringify(recipe)) recipeChanges.push(bindingKey);
    registry.payload.bindings[bindingKey] = recipe;
  }
  const runtimeHash = templateRuntimeHash(product, config);
  const entry = { productId: product.id, handle: product.handle, tag: optionTag[0], bindingKey, runtimeHash };
  const idx = registry.payload.entries.findIndex((e: any) => e.productId === product.id);
  if (idx >= 0) registry.payload.entries[idx] = entry; else registry.payload.entries.push(entry);
  if (!registry.payload.expectedProductIds.includes(product.id)) registry.payload.expectedProductIds.push(product.id);
  const binding = registry.payload.bindings[bindingKey];
  const tiers = templateConfigurationPresets({ ...binding, signature }, config, config, Number(product.variants[0].price.amount), getDefaultSelections(config));
  // Checkout charges.
  const parent = product.variants[0].id;
  const paid = config.groups.flatMap(g => g.options.filter(o => (o.priceDelta ?? 0) > 0).map(o => ({ group: g.label, label: o.label, amount: o.priceDelta! })));
  if (spec.kind === 'climax') {
    named.payload.parents[parent] = CLIMAX_CHARGE_FAMILY;
  } else {
    for (const item of paid) {
      const b = fuBindingFor(item.group, item.label, item.amount);
      if (!fuFamily.some(x => famKey(x) === famKey(b))) fuFamily.push(b);
    }
    named.payload.parents[parent] = FU_FAMILY;
  }
  report.push({ handle: product.handle, status, base: product.variants[0].price.amount, variant: parent, bindingKey, runtimeHash, tiers: tiers.map(t => t.totalPrice), paidOptions: paid.length });
  readback.push({ readAt: new Date().toISOString().slice(0, 10), source: 'Shopify Admin GraphQL 2026-04 readback, mapped with mapShopifyProduct; bodyType/sourceTitle/sourceHandle omitted to mirror Storefront field access; bodyCode/headModel kept because the PDP merges them from Admin', status, product });
}
named.payload.groups[FU_FAMILY] = fuFamily.sort((a, b) => `${a.group}|${a.label}`.localeCompare(`${b.group}|${b.label}`));
// Every paid option of every FU product must bind to exactly one charge at the same price.
for (const row of readback) {
  const parent = row.product.variants[0].id; const config = getCustomizationConfig(row.product);
  const fam = named.payload.groups[named.payload.parents[parent]];
  for (const g of config.groups) for (const o of g.options) if ((o.priceDelta ?? 0) > 0) {
    const m = fam.filter((b: any) => b.group === g.label && (b.choiceLabels ? b.choiceLabels.includes(o.label) : b.label === o.label) && b.unitAmount === o.priceDelta);
    if (m.length !== 1) throw new Error(`${row.product.handle}: ${g.label} / ${o.label} has ${m.length} charges`);
  }
}
const now = new Date().toISOString();
registry.payload.releaseId = 'template-release-2026-11-21b-dol382-held-golive';
const payloadHash = templateReleasePayloadHash(registry.payload);
for (const gate of ['catalogCompatibility', 'checkoutChargeLines', 'coordinatedRelease'])
  registry.approvals[gate] = { reviewedBy: 'Dolly (Grok Bot) for Martin, DOL-382 held go-live 21 Nov (Martin approved all previews and all FU dolls)', reviewedAt: now, payloadHash, evidenceRef: EVIDENCE };
named.payload.releaseId = 'named-upgrades-2026-11-21b-dol382-held-golive';
named.approval = { payloadHash: namedUpgradePayloadHash(named.payload), evidenceRef: EVIDENCE, reviewedAt: now };
const issues = templateReleaseIssues(registry);
console.log(JSON.stringify({ issues, recipeChanges, report, fuFamilySize: fuFamily.length }, null, 1));
if (issues.length) process.exit(1);
if (process.argv.includes('--write')) {
  fs.writeFileSync(REG, JSON.stringify(registry, null, 2) + '\n');
  fs.writeFileSync(NAMED, JSON.stringify(named) + '\n');
  fs.writeFileSync(FIXTURE, JSON.stringify(readback, null, 1));
  fs.writeFileSync('tests/fixtures/dol382-nov21-report.json', JSON.stringify(report, null, 1));
}
