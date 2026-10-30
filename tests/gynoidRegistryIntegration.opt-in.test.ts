import { test, expect, vi } from 'vitest';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import type { Product } from '@/types/product';
import reviewed from '@/data/catalog/gynoid-approved-configurations.json';
import { getCustomizationConfig } from '@/lib/customization/configs';
import { prepareGynoidTemplateCandidate } from '@/lib/customization/gynoid';
import { templateReleaseIssues, templateReleasePayloadHash, templateRuntimeHash, selectReleasedTemplateRecipe, type TemplateReleaseRegistry } from '@/lib/customization/template-release-registry';
import { namedUpgradePayloadHash, releasedNamedBindings, type NamedUpgradeRelease } from '@/lib/cart/named-upgrade-release';
vi.mock('server-only', () => ({}));

test.skipIf(process.env.GYNOID_REGISTRY_PREPARE !== '1')('integrates only verified Gynoid entries while preserving all existing release bindings', async () => {
  const root = 'data/exports/dol-273-approved-2026-10-30';
  const read = async (path: string) => JSON.parse(await fs.readFile(path, 'utf8'));
  const source = await read(`${root}/source-parity-normalized-1653/final.json`);
  const checkout = await read(`${root}/checkout-1626-two-channels/final.json`);
  const eligibility = await read(`${root}/category-eligibility-1641/final.json`);
  const shipping = await read(`${root}/shipping-1644/final.json`);
  for (const evidence of [source, checkout, eligibility, shipping]) {
    expect(evidence.preserved).toBe(true); expect(evidence.failure).toBeNull();
    expect(evidence.restoration.every((r: { restored: boolean }) => r.restored)).toBe(true);
  }
  expect(source.results).toHaveLength(11); expect(checkout.results).toHaveLength(49);
  expect(checkout.results.every((r: { discountExcluded: boolean }) => r.discountExcluded)).toBe(true);
  expect(eligibility.countries.every((c: { available: number; requested: number }) => c.available === 8 && c.requested === 8)).toBe(true);
  expect(shipping.results).toHaveLength(4);
  expect(shipping.results.every((r: { options: Array<{ estimatedCost: { amount: string } }> }) => r.options.some(o => Number(o.estimatedCost.amount) === 0))).toBe(true);
  const products = await read(`${root}/source-parity-normalized-1653/source-products.json`) as Product[];
  products.forEach(p => { p.tags = p.tags.filter(tag => tag !== 'catalog-review-hold'); });
  expect(products.map(p => p.id).sort()).toEqual(reviewed.products.map(p => p.productId).sort());
  expect(products.flatMap(p => p.variants)).toHaveLength(13);
  const template = await read('lib/customization/evidence/template-release.json') as TemplateReleaseRegistry;
  const named = await read('lib/cart/evidence/named-upgrades-release.json') as NamedUpgradeRelease;
  expect(templateReleaseIssues(template)).toEqual([]);
  expect(named.approval?.payloadHash).toBe(namedUpgradePayloadHash(named.payload));
  const priorTemplate = structuredClone(template), priorNamed = structuredClone(named);
  expect(template.payload.entries.some(e => products.some(p => p.id === e.productId))).toBe(false);
  const addition = await read(`${root}/named-upgrades-candidate-1552.json`) as NamedUpgradeRelease;
  expect(addition.releaseStatus).toBe('BLOCKED'); expect(addition.approval).toBeNull();
  for (const product of products) {
    expect(product.tags).not.toContain('dollwow-test'); expect(product.variants.every(v => v.availableForSale)).toBe(true);
    const config = getCustomizationConfig(product), recipe = prepareGynoidTemplateCandidate(product, config)!;
    const key = `gynoid-${product.id.split('/').at(-1)}-reviewed-2026-10-30`;
    expect(template.payload.bindings[key]).toBeUndefined();
    template.payload.bindings[key] = recipe;
    template.payload.expectedProductIds.push(product.id);
    template.payload.entries.push({ productId: product.id, handle: product.handle, tag: recipe.tag, bindingKey: key,
      runtimeHash: templateRuntimeHash(product, config) });
  }
  for (const [id, group] of Object.entries(addition.payload.parents)) {
    expect(named.payload.parents[id]).toBeUndefined(); named.payload.parents[id] = group;
  }
  for (const [key, group] of Object.entries(addition.payload.groups)) {
    expect(named.payload.groups[key]).toBeUndefined(); named.payload.groups[key] = group;
  }
  const at = new Date().toISOString();
  const evidenceRef = 'docs/catalog/dol-273-approved-release-2026-10-30.md#latest-eligibility-and-rate-checks; owner approval 7bc009b1; actual source/49US-carts/4postal-country carts/8charge-country checks';
  template.payload.releaseId = 'dol273-gynoid-approved-2026-10-30';
  template.payload.sourceSnapshotHash = createHash('sha256').update(JSON.stringify({ prior: priorTemplate.payload.sourceSnapshotHash, products })).digest('hex');
  const approval = { reviewedBy: 'Codex scoped verification under Martin release approval 7bc009b1', reviewedAt: at,
    evidenceRef, payloadHash: templateReleasePayloadHash(template.payload) };
  template.releaseStatus = 'APPROVED';
  template.approvals = { catalogCompatibility: approval, checkoutChargeLines: approval, coordinatedRelease: approval };
  named.payload.releaseId = 'dol273-gynoid-approved-2026-10-30'; named.releaseStatus = 'APPROVED';
  named.approval = { reviewedAt: at, evidenceRef, payloadHash: namedUpgradePayloadHash(named.payload) };
  expect(template.payload.entries.slice(0, priorTemplate.payload.entries.length)).toEqual(priorTemplate.payload.entries);
  for (const [key, value] of Object.entries(priorTemplate.payload.bindings)) expect(template.payload.bindings[key]).toEqual(value);
  for (const [key, value] of Object.entries(priorNamed.payload.parents)) expect(named.payload.parents[key]).toEqual(value);
  for (const [key, value] of Object.entries(priorNamed.payload.groups)) expect(named.payload.groups[key]).toEqual(value);
  expect(templateReleaseIssues(template)).toEqual([]);
  for (const product of products) expect(selectReleasedTemplateRecipe(template, product, getCustomizationConfig(product))).not.toBeNull();
  expect(releasedNamedBindings(named, products.flatMap(p => p.variants.map(v => v.id)))).toHaveLength(130);
  await fs.writeFile(`${root}/verified-registry-integration.json`, JSON.stringify({ at, evidenceRef,
    addedParents: 11, addedVariants: 13, bindings: 130, priorTemplateEntries: priorTemplate.payload.entries.length,
    priorNamedParents: Object.keys(priorNamed.payload.parents).length,
    templateHash: templateReleasePayloadHash(template.payload), namedHash: namedUpgradePayloadHash(named.payload),
    qualification: 'Scoped integration; retains prior bindings verbatim. Postal-rate QA is not full-address delivery/tax/payment proof. No merchant writes or deployment.' }, null, 2), { flag: 'wx', mode: 0o600 });
  await fs.writeFile('lib/customization/evidence/template-release.json', `${JSON.stringify(template, null, 2)}\n`);
  await fs.writeFile('lib/cart/evidence/named-upgrades-release.json', JSON.stringify(named));
}, 120000);

test.skipIf(process.env.GYNOID_REGISTRY_TAG_PROJECTION !== '1')('binds only the approved parent publication-hold removal to production recipe hashes', async () => {
  const root = 'data/exports/dol-273-approved-2026-10-30';
  const products = JSON.parse(await fs.readFile(`${root}/source-parity-normalized-1653/source-products.json`, 'utf8')) as Product[];
  const template = JSON.parse(await fs.readFile('lib/customization/evidence/template-release.json', 'utf8')) as TemplateReleaseRegistry;
  const original = JSON.parse(execFileSync('git', ['show', '9972efeb:lib/customization/evidence/template-release.json'], { maxBuffer: 8 * 1024 * 1024 }).toString()) as TemplateReleaseRegistry;
  expect(templateReleaseIssues(template)).toEqual([]);
  const before = structuredClone(template), previousHash = templateReleasePayloadHash(template.payload);
  for (const product of products) {
    const entry = template.payload.entries.find(e => e.productId === product.id)!;
    expect(entry.runtimeHash).toBe(templateRuntimeHash(product, getCustomizationConfig(product)));
    expect(product.tags).toContain('catalog-review-hold'); expect(product.tags).not.toContain('dollwow-test');
    product.tags = product.tags.filter(tag => tag !== 'catalog-review-hold');
    entry.runtimeHash = templateRuntimeHash(product, getCustomizationConfig(product));
  }
  expect(template.payload.entries.filter(e => !products.some(p => p.id === e.productId))).toEqual(original.payload.entries);
  expect(template.payload.bindings).toEqual(before.payload.bindings);
  template.payload.sourceSnapshotHash = createHash('sha256').update(JSON.stringify({ prior: original.payload.sourceSnapshotHash, products })).digest('hex');
  const at = new Date().toISOString(), payloadHash = templateReleasePayloadHash(template.payload);
  for (const approval of Object.values(template.approvals!)) {
    approval.payloadHash = payloadHash; approval.reviewedAt = at;
    approval.evidenceRef += '; exact approved parent publication-hold removal, all option/Laura holds retained';
  }
  expect(templateReleaseIssues(template)).toEqual([]);
  for (const product of products) expect(selectReleasedTemplateRecipe(template, product, getCustomizationConfig(product))).not.toBeNull();
  await fs.writeFile(`${root}/approved-publication-products.json`, JSON.stringify(products, null, 2), { flag: 'wx', mode: 0o600 });
  await fs.writeFile(`${root}/verified-publication-tag-projection.json`, JSON.stringify({ at, previousHash, payloadHash,
    parentIds: products.map(p => p.id), removedTag: 'catalog-review-hold', retainedSourceHolds: 'Unpriced alternate heads and unapproved Laura/additions remain held; no blanket brand/content clearance.' }, null, 2), { flag: 'wx', mode: 0o600 });
  await fs.writeFile('lib/customization/evidence/template-release.json', `${JSON.stringify(template, null, 2)}\n`);
});
