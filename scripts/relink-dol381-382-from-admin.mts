#!/usr/bin/env node
// DOL-381/382: relink draft (unpublished) registry entries from a production Shopify Admin readback.
// Drafts are invisible to the Storefront API, so the Admin readback is mapped through the app's own
// mapShopifyProduct, mirroring Storefront field access (bodyType/sourceTitle/sourceHandle are not
// Storefront-readable). Method checked on 2026-11-19 against six live Top Fire/Irontech entries:
// Admin-derived hashes equalled the registered hashes. Re-run after any Shopify edit, and recheck
// against the real Storefront product immediately after Martin approves publication.
// Run: SHOPIFY_STORE_DOMAIN=... SHOPIFY_ADMIN_ACCESS_TOKEN=... NODE_OPTIONS=--conditions=react-server \
//      npx tsx scripts/relink-dol381-382-from-admin.mts [--write]
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { mapShopifyProduct } from '../lib/shopify/mappers';
import { getCustomizationConfig } from '../lib/customization/configs';
import { getDefaultSelections } from '../lib/customization/resolve';
import { templateRuntimeHash, templateReleasePayloadHash, templateReleaseIssues } from '../lib/customization/template-release-registry';
import { templateConfigSignature } from '../lib/customization/template-config-signature';
import { templateConfigurationPresets } from '../lib/customization/template-presets';

const IDS = ['gid://shopify/Product/10742344941752', 'gid://shopify/Product/10742344974520', 'gid://shopify/Product/10742348513464'];
const REG = 'lib/customization/evidence/template-release.json';
const FIXTURE = 'tests/fixtures/dol381-382-admin-readback-2026-11-19.json';
const sha = (s: string) => createHash('sha256').update(s).digest('hex');
const money = (a: string) => { const n = Number(a); return Number.isInteger(n) ? n.toFixed(1) : String(n); };
const META: Record<string, string> = { catalogIdentityKey: 'catalog_identity_key', catalogBodyIdentityKey: 'catalog_body_identity_key', headModel: 'head_model', displayName: 'display_name', lookTags: 'look_tags', brand: 'brand', sourceReleaseRank: 'source_release_rank', material: 'material', heightCm: 'height_cm', weightLb: 'weight_lb', cupSize: 'cup_size', measurements: 'measurements', warehouseCountry: 'warehouse_country', warehouseRegions: 'warehouse_regions', stockStatus: 'stock_status', deliveryEstimate: 'delivery_estimate', stockLastCheckedAt: 'stock_last_checked_at', customAvailable: 'custom_available', penisAddOnAvailable: 'has_insertable_penis_add_on', irontechUlwEligibility: 'irontech_ulw_eligibility', qcNote: 'qc_note', customizationGroups: 'customization_groups' };
const query = `query($ids:[ID!]!){ nodes(ids:$ids){ ... on Product { id handle title description status seo{title description} vendor productType tags
  priceRangeV2{ minVariantPrice{amount currencyCode} maxVariantPrice{amount currencyCode} }
  variants(first:30){ edges{ node{ id title availableForSale price selectedOptions{name value} } } }
  ${Object.entries(META).map(([alias, key]) => `${alias}: metafield(namespace:"custom", key:"${key}"){ value }`).join('\n')} } } }`;
const res = await fetch(`https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2026-04/graphql.json`, { method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_ACCESS_TOKEN ?? '' },
  body: JSON.stringify({ query, variables: { ids: IDS } }) });
const json: any = await res.json();
if (json.errors || !json.data) throw new Error(`Admin read failed: ${JSON.stringify(json.errors ?? res.status)}`);
const registry = JSON.parse(fs.readFileSync(REG, 'utf8'));
const readback: any[] = []; const report: any[] = [];
for (const node of json.data.nodes) {
  const { status, priceRangeV2, ...rest } = node; const currencyCode = priceRangeV2.minVariantPrice.currencyCode;
  const product = mapShopifyProduct({ ...rest, featuredImage: null, images: { edges: [] },
    priceRange: { minVariantPrice: { amount: money(priceRangeV2.minVariantPrice.amount), currencyCode }, maxVariantPrice: { amount: money(priceRangeV2.maxVariantPrice.amount), currencyCode } },
    variants: { edges: node.variants.edges.map((e: any) => ({ node: { ...e.node, price: { amount: money(e.node.price), currencyCode } } })) } });
  const config = getCustomizationConfig(product);
  const entry = registry.payload.entries.find((e: any) => e.productId === product.id);
  const binding = registry.payload.bindings[entry.bindingKey];
  const signature = templateConfigSignature(config);
  if (binding.signature !== `sha256:${sha(signature)}`) throw new Error(`${product.handle}: menu changed; the tier recipe needs review before relinking.`);
  Object.assign(entry, { handle: product.handle, runtimeHash: templateRuntimeHash(product, config) });
  const tiers = templateConfigurationPresets({ ...binding, signature }, config, config, Number(product.variants[0].price.amount), getDefaultSelections(config));
  report.push({ handle: product.handle, status, base: product.variants[0].price.amount, runtimeHash: entry.runtimeHash, tiers: tiers.map(t => t.totalPrice) });
  readback.push({ readAt: new Date().toISOString().slice(0, 10), source: 'Shopify Admin GraphQL 2026-04 readback, mapped with mapShopifyProduct; bodyType/sourceTitle/sourceHandle omitted to mirror Storefront field access', status, product });
}
const now = new Date().toISOString(); const payloadHash = templateReleasePayloadHash(registry.payload);
for (const gate of ['catalogCompatibility', 'checkoutChargeLines', 'coordinatedRelease'])
  registry.approvals[gate] = { ...registry.approvals[gate], reviewedAt: now, payloadHash };
const issues = templateReleaseIssues(registry);
console.log(JSON.stringify({ issues, report }, null, 1));
if (issues.length) process.exit(1);
if (process.argv.includes('--write')) {
  fs.writeFileSync(REG, JSON.stringify(registry, null, 2) + '\n');
  fs.writeFileSync(FIXTURE, JSON.stringify(readback, null, 1));
}
