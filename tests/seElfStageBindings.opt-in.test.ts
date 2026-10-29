import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { parseEnv } from 'node:util';
import { expect, it } from 'vitest';
import type { Product } from '@/types/product';
import type { TemplateReleaseRegistry } from '@/lib/customization/template-release-registry';
import type { NamedUpgradeRelease } from '@/lib/cart/named-upgrade-release';
import type { VerifiedUpgradeVariant } from '@/lib/cart/exact-upgrade-lines';

const directory = 'data/exports/dol-275-2026-10-29';
const templatePath = 'lib/customization/evidence/template-release.json';
const chargePath = 'lib/cart/evidence/named-upgrades-release.json';
const sha = (value: string) => createHash('sha256').update(value).digest('hex');

// Generates local release registries only after real draft/charge read checks; never publishes.
it.skipIf(process.env.DOL275_STAGE_BINDINGS !== '1')('stages exact Elf parent bindings without changing previous release entries', async () => {
  Object.assign(process.env, parseEnv(await readFile('/Volumes/Extreme Pro/Projects/DollWOW/.env.local', 'utf8')));
  const {readSeElfAdminSnapshot} = await import('@/scripts/lib/se-elf-admin-snapshot');
  const {getCustomizationConfig} = await import('@/lib/customization/configs');
  const {getDefaultSelections, isOptionAvailableForCheckout, resolveCustomization} = await import('@/lib/customization/resolve');
  const {templateRuntimeHash, templateReleaseIssues, templateReleasePayloadHash, selectReleasedTemplateRecipe} = await import('@/lib/customization/template-release-registry');
  const {templateConfigSignature} = await import('@/lib/customization/template-config-signature');
  const {templateConfigurationPresets} = await import('@/lib/customization/template-presets');
  const {promotionPricingForSelections} = await import('@/lib/promotions/optionPricing');
  const {namedUpgradePayloadHash, releasedNamedBindings} = await import('@/lib/cart/named-upgrade-release');
  const {exactUpgradeLines, upgradeBindingAcceptsChoice} = await import('@/lib/cart/exact-upgrade-lines');
  const {storefrontAuthHeaders} = await import('@/lib/shopify/auth');
  const {env} = await import('@/lib/utils/env');
  const source = JSON.parse(await readFile(`${directory}/live-preflight.json`, 'utf8')) as {
    results: Array<{sku: string; parent: Product}>};
  const projection = JSON.parse(await readFile(`${directory}/admin-projection.json`, 'utf8')) as {
    controls: Array<{handle: string; projectedHash: string; liveHash: string}>;
    drafts: Array<{sku: string; product: Product; runtimeHash: string}>};
  const metadata = JSON.parse(await readFile(`${directory}/metadata-journal.json`, 'utf8'));
  expect(metadata.state).toBe('COMPLETE_VERIFIED_UNPUBLISHED');
  expect(projection.drafts).toHaveLength(4);
  expect(projection.controls.every(control => control.projectedHash === control.liveHash)).toBe(true);
  const beforeTemplates = JSON.parse(await readFile(templatePath, 'utf8')) as TemplateReleaseRegistry;
  const beforeCharges = JSON.parse(await readFile(chargePath, 'utf8')) as NamedUpgradeRelease;
  expect(templateReleaseIssues(beforeTemplates)).toEqual([]);
  expect(beforeCharges.approval!.payloadHash).toBe(namedUpgradePayloadHash(beforeCharges.payload));
  const templates = structuredClone(beforeTemplates);
  const charges = structuredClone(beforeCharges);
  const reviewedAt = new Date().toISOString();
  const evidenceRef = 'docs/catalog/dol-275-release-2026-10-29.md';
  const rows: Array<{sku: string; product: Product; config: ReturnType<typeof getCustomizationConfig>;
    presets: ReturnType<typeof templateConfigurationPresets>; groupKey: string; runtimeHash: string}> = [];
  const catalogCharges = JSON.parse(await readFile(`${directory}/catalog-charge-journal.json`, 'utf8'));
  const activated = JSON.parse(await readFile(`${directory}/catalog-charge-activation.json`, 'utf8'));
  expect(catalogCharges.state).toBe('COMPLETE_VERIFIED_DRAFTS_UNPUBLISHED');
  expect(activated.state).toBe('COMPLETE_HEADLESS_ONLY_VERIFIED');
  const sourceBindings = [...source.results.flatMap(row => beforeCharges.payload.groups[beforeCharges.payload.parents[row.parent.variants[0].id]]),
    ...catalogCharges.bindings.map(({group, label, choiceLabels, unitAmount, currencyCode, merchandiseId, productTitle}: {
      group: string; label: string; choiceLabels: string[]; unitAmount: number; currencyCode: 'USD'; merchandiseId: string; productTitle: string
    }) => ({group, label, choiceLabels, unitAmount, currencyCode, merchandiseId, productTitle}))];
  for (const [index, row] of projection.drafts.entries()) {
    const fresh = await readSeElfAdminSnapshot(row.product.id);
    expect(fresh.raw.status).toBe('DRAFT');
    const product = fresh.product;
    const config = getCustomizationConfig(product);
    const runtimeHash = templateRuntimeHash(product, config);
    expect(runtimeHash).toBe(row.runtimeHash);
    expect(templates.payload.entries.some(entry => entry.productId === product.id)).toBe(false);
    const parent = source.results[index].parent;
    const parentEntry = beforeTemplates.payload.entries.find(entry => entry.productId === parent.id)!;
    expect(parentEntry).toBeDefined();
    expect(parentEntry.runtimeHash).toBe(projection.controls[index].liveHash);
    const definition = {...structuredClone(beforeTemplates.payload.bindings[parentEntry.bindingKey]), signature: templateConfigSignature(config)};
    expect(product.tags.filter(tag => tag.startsWith('options:'))).toEqual([definition.tag]);
    const bindingKey = sha(`dol275:${definition.signature}`);
    const binding = {...definition, signature: `sha256:${sha(definition.signature)}`};
    if (templates.payload.bindings[bindingKey]) expect(templates.payload.bindings[bindingKey]).toEqual(binding);
    templates.payload.bindings[bindingKey] = binding;
    templates.payload.entries.push({productId: product.id, handle: product.handle, tag: definition.tag, bindingKey, runtimeHash});
    templates.payload.expectedProductIds.push(product.id);
    const parentVariantId = product.variants[0].id;
    let groupKey = beforeCharges.payload.parents[parent.variants[0].id];
    expect(beforeCharges.payload.groups[groupKey]).toHaveLength(index === 0 ? 35 : 39);
    const group = structuredClone(beforeCharges.payload.groups[groupKey]);
    for (const menu of config.groups) for (const option of menu.options) {
      if ((option.priceDelta ?? 0) <= 0 || !isOptionAvailableForCheckout(config, menu.id, option.id)) continue;
      const matches = (binding: typeof group[number]) => binding.group === menu.label &&
        upgradeBindingAcceptsChoice({...binding, parentVariantId}, option.label) && binding.unitAmount === option.priceDelta && binding.currencyCode === 'USD' && !binding.readOnly;
      if (group.some(matches)) continue;
      const candidates = [...new Map(sourceBindings.filter(matches).map(binding => [binding.merchandiseId, binding])).values()];
      expect(candidates, `Existing SE charge for ${menu.label}/${option.label}`).toHaveLength(1);
      group.push(structuredClone(candidates[0]));
    }
    if (JSON.stringify(group) !== JSON.stringify(beforeCharges.payload.groups[groupKey])) {
      groupKey = `se-elf-${sha(JSON.stringify(group)).slice(0,16)}`;
      if (charges.payload.groups[groupKey]) expect(charges.payload.groups[groupKey]).toEqual(group);
      charges.payload.groups[groupKey] = group;
    }
    expect(charges.payload.parents[parentVariantId]).toBeUndefined();
    charges.payload.parents[parentVariantId] = groupKey;
    const defaults = getDefaultSelections(config);
    expect(defaults['skin-tone']).toBe('photographed-skin');
    const price = Number(product.priceRange.minVariantPrice.amount);
    const priced = promotionPricingForSelections(product, config, defaults, new Date(reviewedAt)).config;
    const presets = templateConfigurationPresets(definition, config, priced, price, defaults);
    expect(presets).toHaveLength(3);
    expect(presets.map(preset => preset.totalPrice)).toEqual(index < 2 ? [1705,1774,1934] : [1959,2028,2188]);
    rows.push({sku: row.sku, product, config, presets, groupKey, runtimeHash});
  }
  const bindings = Object.entries(charges.payload.parents).filter(([id]) => rows.some(row => row.product.variants[0].id === id))
    .flatMap(([parentVariantId, group]) => charges.payload.groups[group].map(binding => ({...binding, parentVariantId})));
  const ids = [...new Set(bindings.map(binding => binding.merchandiseId))];
  const query = `query($ids:[ID!]!){nodes(ids:$ids){... on ProductVariant{id price{amount currencyCode} availableForSale requiresShipping product{title tags}}}}`;
  const response = await fetch(`https://${env.SHOPIFY_STORE_DOMAIN}/api/2026-04/graphql.json`, {method: 'POST',
    headers: {'Content-Type': 'application/json', ...storefrontAuthHeaders(env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!)},
    body: JSON.stringify({query, variables: {ids}})});
  const payload = await response.json() as {errors?: unknown[]; data: {nodes: Array<{
    id: string; price: {amount: string; currencyCode: string}; availableForSale: boolean; requiresShipping: boolean;
    product: {title: string; tags: string[]}} | null>}};
  expect(response.ok).toBe(true);
  expect(payload.errors).toBeUndefined();
  expect(ids.filter((_, index) => !payload.data.nodes[index]), 'Unavailable named-charge variants in actual Storefront').toEqual([]);
  const verified: VerifiedUpgradeVariant[] = payload.data.nodes.map(node => {
    expect(node!.product.tags).toContain('dollwow-system');
    expect(node!.product.tags).toContain('exact-upgrade-pilot');
    return {id: node!.id, amount: Number(node!.price.amount), currencyCode: node!.price.currencyCode,
      availableForSale: node!.availableForSale, requiresShipping: node!.requiresShipping, productTitle: node!.product.title};
  });
  for (const row of rows) {
    const parentVariantId = row.product.variants[0].id;
    const check = (items: Array<{group: string; label: string; amount: number}>) => exactUpgradeLines({parentVariantId,
      parentLineId: 'gid://shopify/CartLine/dol275-read-only-preflight', quantity: 1,
      charge: {amount: items.reduce((sum, item) => sum + item.amount, 0), currencyCode: 'USD', items}, bindings, verifiedVariants: verified});
    for (const group of row.config.groups) for (const option of group.options) {
      if ((option.priceDelta ?? 0) <= 0 || !isOptionAvailableForCheckout(row.config, group.id, option.id)) continue;
      check([{group: group.label, label: option.label, amount: option.priceDelta!}]);
    }
    for (const preset of row.presets) {
      const priced = promotionPricingForSelections(row.product, row.config, preset.selections, new Date(reviewedAt)).config;
      const resolved = resolveCustomization(priced, preset.selections, Number(row.product.priceRange.minVariantPrice.amount));
      expect(resolved.issues).toEqual([]);
      check(resolved.selectedOptions.filter(option => option.priceDelta > 0).map(option => ({group: option.groupLabel, label: option.optionLabel, amount: option.priceDelta})));
    }
  }
  templates.payload.releaseId = 'presets-2026-10-29-se-elf';
  templates.payload.sourceSnapshotHash = sha(JSON.stringify({previous: beforeTemplates.payload.sourceSnapshotHash,
    products: rows.map(row => ({id: row.product.id, runtimeHash: row.runtimeHash}))}));
  const payloadHash = templateReleasePayloadHash(templates.payload);
  templates.approvals = Object.fromEntries(Object.keys(beforeTemplates.approvals!).map(gate => [gate,
    {reviewedBy: 'Codex incremental SE Elf checks; prior release entries preserved; Martin09:58 approval', reviewedAt, evidenceRef, payloadHash}])) as TemplateReleaseRegistry['approvals'];
  charges.payload.releaseId = 'named-upgrades-2026-10-29-se-elf';
  charges.approval = {payloadHash: namedUpgradePayloadHash(charges.payload), reviewedAt, evidenceRef};
  expect(templateReleaseIssues(templates)).toEqual([]);
  for (const entry of beforeTemplates.payload.entries) expect(templates.payload.entries.find(current => current.productId === entry.productId)).toEqual(entry);
  for (const [key, binding] of Object.entries(beforeTemplates.payload.bindings)) expect(templates.payload.bindings[key]).toEqual(binding);
  for (const [id, group] of Object.entries(beforeCharges.payload.parents)) expect(charges.payload.parents[id]).toBe(group);
  for (const [key, group] of Object.entries(beforeCharges.payload.groups)) expect(charges.payload.groups[key]).toEqual(group);
  for (const row of rows) {
    expect(selectReleasedTemplateRecipe(templates, row.product, row.config)).not.toBeNull();
    expect(releasedNamedBindings(charges, [row.product.variants[0].id])).toHaveLength(charges.payload.groups[row.groupKey].length);
  }
  await writeFile(`${directory}/binding-stage-proof.json`, JSON.stringify({reviewedAt, controls: projection.controls, rows, verified,
    priorTemplateEntriesPreserved: beforeTemplates.payload.entries.length, priorChargeParentsPreserved: Object.keys(beforeCharges.payload.parents).length,
    publicationAssumption: 'Must verify actual ACTIVE/published Storefront runtime hashes before acceptance; no cart or publication write in this preflight'}, null, 2));
  await writeFile(templatePath, `${JSON.stringify(templates, null, 2)}\n`);
  await writeFile(chargePath, `${JSON.stringify(charges)}\n`);
}, 120_000);
