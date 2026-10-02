import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { exactUpgradeLines } from '@/lib/cart/exact-upgrade-lines';
import { getDefaultSelections, resolveCustomization } from '@/lib/customization/resolve';
import { templateConfigurationPresets } from '@/lib/customization/template-presets';
import { customizationVisibility } from '@/lib/customization/visibility';
import { getCustomizationConfig, getFactoryCustomizationConfig } from '@/lib/customization/configs';
import { buildSukiChargeSpecs } from '../scripts/prepare-suki-draft-charges.mjs';
import { prepareSukiConfig, prepareSukiChargeMappings, sukiDefaultSelections, sukiPresetDefinition, getSukiCustomizationConfig,
  SUKI_PRODUCT_ID, SUKI_VARIANT_ID, type SukiSourceGroup } from '@/lib/customization/irontech-suki';
import { sampleProducts } from '@/lib/data/sample-products';
import { importedProductionNoteSignals } from '@/lib/customization/production-notes';
import type { CustomizationGroup, CustomizationSelections } from '@/types/customization';
import fixture from './fixtures/sukiMenu.json';

const source = fixture.source;
const release = { payload: { groups: fixture.registryGroups } };
const raw: { groups: Record<number, { options: Array<{ label: string; rules: string }> }> } = { groups: fixture.extraHeadGroups };
const proof = fixture.selectedProof;
const config = prepareSukiConfig(source.sourceMenu as SukiSourceGroup[]);
const defaults = sukiDefaultSelections(config)!;
const definition = sukiPresetDefinition(config);
const presets = templateConfigurationPresets(definition, config, config, 2799, defaults);
const resolve = (selections: CustomizationSelections = {}) => resolveCustomization(config, { ...defaults, ...selections }, 2799);
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Prepared ownership graph, not an assertion of a free-head entitlement or verified branch availability.
const deferredSpecs: Array<[number, string, string]> = [
  [31, 'extra-head-type', 'Extra head type'], [37, 'extra-head-hair', 'Extra head implanted hair'],
  [39, 'extra-head-hair-color', 'Extra head implanted hair color'], [43, 'extra-head-premium', 'Extra head premium options']
];
const deferredGroups: CustomizationGroup[] = deferredSpecs.map(([index, id, label]) => ({
  id, label, required: id !== 'extra-head-premium', display: 'swatches',
  selectionMode: id === 'extra-head-premium' ? 'multiple' : 'single',
  visibleWhen: id === 'extra-head-hair' ? ['hard-silicone', 'soft-silicone'].map(optionId => [
    { groupId: 'buy-2nd-head', optionId: 'yes' }, { groupId: 'extra-head-type', optionId }
  ]) : id === 'extra-head-hair-color' ? [[
    { groupId: 'extra-head-hair', optionId: 'implanted-long-straight-synthetic-hair' }
  ]] : [[{ groupId: 'buy-2nd-head', optionId: 'yes' }]],
  options: raw.groups[index].options.map((o: { label: string; rules: string }) => ({
    id: slug(o.label), label: o.label, priceDelta: Number(JSON.parse(o.rules)[0] || 0),
    priceVerified: true, purchasable: false,
    description: 'Source-priced only; extra-head entitlement and branch compatibility are not verified.'
  }))
}));
const charges = prepareSukiChargeMappings({ ...config, groups: [...config.groups, ...deferredGroups] }, release.payload.groups);
const previousEntry = fixture.previousTemplate;
const previousRecipe = fixture.previousTemplate;
const unavailableRecipeChoices = previousRecipe.tiers.flatMap(t => [...t.add, ...t.remove]).filter(c =>
  !config.groups.some(g => g.id === c.groupId && g.options.some(o => o.id === c.optionId)));

describe('Suki exact 166cm 2.0 / S20 / ROS MAX preparation', () => {
  it('preserves the complete 23-group, 181-choice source universe and every price', () => {
    expect(config.groups).toHaveLength(23);
    expect(config.groups.flatMap(g => g.options)).toHaveLength(181);
    expect(new Set(config.groups.map(g => g.id)).size).toBe(23);
    for (const group of config.groups) {
      expect(new Set(group.options.map(o => o.id)).size).toBe(group.options.length);
      const original = source.sourceMenu.find(g => g.id === group.id)!;
      for (const option of group.options) expect(option.priceDelta).toBe(original.options.find(o => o.id === option.id)!.priceDelta);
    }
  });
  it('uses the existing draft, exact selected proof, and recorded price floor', () => {
    expect(source.productId).toBe(SUKI_PRODUCT_ID);
    expect(source.variantId).toBe(SUKI_VARIANT_ID);
    expect(proof.chosen.find(g => g.group === 'Silicone Head Type')!.selected[0].value).toBe('ROS Max_3');
    expect(proof.chosen.find(g => g.group === 'Skin Color')!.selected[0].value).toBe('Glow_2');
    expect(Math.round(2799 * 0.9 * 100)).toBe(251910);
    expect(251910 - 248600).toBe(3310);
  });
  it('keeps free selected defaults, singleton facts, and no paid accessories', () => {
    const r = resolve();
    expect(r.totalPrice).toBe(2799);
    expect(r.issues).toEqual([]);
    expect(r.requiresPriceConfirmation).toBe(false);
    expect(defaults['skin-color']).toBe('glow');
    expect(defaults['silicone-head-type']).toBe('ros-max');
    expect(defaults['premium-head-body-options']).toEqual(['s-makeup-upgrade', 's-body-painting']);
    expect(defaults.accessories).toEqual([]);
    expect(defaults['buy-2nd-head']).toBe('no');
    for (const id of ['breast-options', 'body-skeleton', 'hand-skeleton']) expect(r.selectedOptions.filter(o => o.groupId === id)).toHaveLength(1);
    expect(resolve({ 'premium-head-body-options': ['ironai'] }).optionPriceDelta).toBe(0);
    expect(sukiDefaultSelections({ ...config, id: 'unrelated' })).toBeUndefined();
  });
  it('survives imported default-signal normalization and scopes the integration hook to this product', () => {
    const imported = structuredClone(config.groups);
    imported.forEach(g => g.options.forEach(o => { o.sourceProductionNoteSignals = importedProductionNoteSignals(o.productionNote); }));
    const product = { ...sampleProducts[0], id: SUKI_PRODUCT_ID, extended: { ...sampleProducts[0].extended, customizationGroups: imported } };
    expect(getSukiCustomizationConfig(product)).toEqual(config);
    expect(getSukiCustomizationConfig({ ...product, id: 'other' })).toBeUndefined();
    expect(() => getSukiCustomizationConfig({ ...product, extended: {} })).toThrow('prepared Suki menu');
    expect(sukiDefaultSelections({ ...config, groups: imported })).toEqual(defaults);
    expect(prepareSukiConfig(config.groups as SukiSourceGroup[])).toEqual(config);
  });
  it('runs the parent-installed config and resolver hooks without losing either free default', () => {
    const product = { ...sampleProducts[0], id: SUKI_PRODUCT_ID, vendor: 'Irontech Dolls',
      tags: [definition.tag], extended: { ...sampleProducts[0].extended, customizationGroups: config.groups } };
    const integrated = getCustomizationConfig(product);
    expect(integrated).toEqual(config);
    expect(getFactoryCustomizationConfig(product)).toEqual(config);
    expect(getDefaultSelections(integrated)).toEqual(defaults);
    const resolved = resolveCustomization(integrated, {}, 2799);
    expect(resolved.selections['premium-head-body-options']).toEqual(['s-makeup-upgrade', 's-body-painting']);
    expect(resolved.totalPrice).toBe(2799);
    expect(resolved.issues).toEqual([]);
    expect(resolved.requiresPriceConfirmation).toBe(false);
    expect(templateConfigurationPresets(definition, integrated, integrated, 2799, {})).toHaveLength(3);
    expect(definition.tag).toBe('options:irontech-female-silicone-166v2-s20-ros-max');
  });
  it('rejects unverified alternate heads and does not silently substitute a paid/free second head', () => {
    const alternatives: CustomizationSelections[] = [{ 'choose-a-head': 'others' }, { 'silicone-head-type': 'hard-silicone' }, { 'buy-2nd-head': 'yes' }];
    for (const selection of alternatives) {
      expect(resolve(selection).requiresPriceConfirmation).toBe(true);
    }
    expect(resolve({ 'silicone-head-type': 'hard-silicone' }).selections['hemisphere-eyes']).toBeUndefined();
    expect(resolve({ 'accessories': ['unknown'] }).issues.length).toBeGreaterThan(0);
  });
  for (const group of config.groups) for (const option of group.options.filter(o => o.priceDelta! > 0 && o.purchasable !== false)) {
    it(`prices ${group.id}/${option.id} exactly`, () => {
      const r = resolve({ [group.id]: group.selectionMode === 'multiple' ? [option.id] : option.id });
      expect(r.optionPriceDelta).toBe(option.priceDelta);
      expect(r.issues).toEqual([]);
      expect(r.requiresPriceConfirmation).toBe(false);
    });
  }
  it('applies three practical retailer-supported tiers without appearance choices or performance promises', () => {
    expect(unavailableRecipeChoices.length).toBeGreaterThan(0);
    expect(presets).toHaveLength(3);
    expect(definition.tiers[1].add.map(c => c.optionId)).toEqual(['ultra-light-weight', 'soft-thigh']);
    expect(definition.tiers[2].add.map(c => c.optionId)).toEqual(['heating', 'soft-belly']);
    expect(presets.map(p => p.id)).toEqual(['starter', 'popular', 'premium']);
    expect(presets.map(p => p.totalPrice)).toEqual([2799, 3097, 3256]);
    expect(resolve({ 'premium-head-body-options': ['ultra-light-weight'] }).requiresPriceConfirmation).toBe(false);
    expect(fixture.combinations.status).toBe('PASS_RETAILER_SUPPORTED_COMBINATIONS');
    for (const state of fixture.combinations.states) {
      const selected = state.choices.filter(c => c.checked);
      expect(selected.every(c => !c.disabled && c.visible)).toBe(true);
      expect(selected.reduce((sum, c) => sum + Number(c.price), 0)).toBe(state.name === 'enthusiast' ? 298 : 457);
      expect(state.inspectedConditionalRuleCount).toBeGreaterThan(0);
      expect(state.tierConditionalReferences).toEqual([]);
    }
    expect(definition.tiers.every(t => !/proposed|held|confirm|kg|%/i.test(t.description))).toBe(true);
    for (const preset of presets) {
      const r = resolveCustomization(config, preset.selections, 2799);
      expect(r.issues).toEqual([]);
      expect(r.requiresPriceConfirmation).toBe(false);
      expect(preset.selections['choose-a-head']).toBe('default');
      expect(preset.selections['buy-2nd-head']).toBe('no');
      expect(preset.managedGroupIds).toEqual(['premium-head-body-options']);
    }
  });
  it('retains manual appearance and independent extras across tiers, including downgrades', () => {
    const current = { ...presets[2].selections, 'skin-color': 'natural', accessories: ['silicone-socks'],
      'premium-head-body-options': [...presets[2].selections['premium-head-body-options'] as string[], 'facial-freckles'] };
    const tiers = templateConfigurationPresets(definition, config, config, 2799, current);
    expect(tiers.map(p => p.totalPrice)).toEqual([2849, 3147, 3306]);
    for (const p of tiers) {
      expect(p.selections['skin-color']).toBe('natural');
      expect(p.selections.accessories).toEqual(['silicone-socks']);
      expect(p.selections['premium-head-body-options']).toContain('facial-freckles');
    }
    expect(resolve({ accessories: [] }).selections.accessories).toEqual([]);
  });
  it('owns deferred hair under the extra head and keeps primary ROS MAX free', () => {
    const graph = { ...config, groups: [...config.groups, ...deferredGroups] };
    const state = { ...defaults, 'buy-2nd-head': 'yes', 'extra-head-type': 'hard-silicone',
      'extra-head-hair': 'implanted-long-straight-synthetic-hair', 'extra-head-hair-color': '1-golden-brown' };
    expect(customizationVisibility(graph, state).issues).toEqual([]);
    expect(customizationVisibility(graph, state).activeGroupIds.has('extra-head-hair-color')).toBe(true);
    expect(customizationVisibility(graph, { ...state, 'extra-head-type': 'ros-max' }).activeGroupIds.has('extra-head-hair-color')).toBe(false);
    const off = resolveCustomization(graph, { ...state, 'buy-2nd-head': 'no' }, 2799);
    expect(off.optionPriceDelta).toBe(0);
    expect(off.selectedOptions.some(o => o.groupId.startsWith('extra-head-'))).toBe(false);
    const on = resolveCustomization(graph, { ...state, 'extra-head-type': 'ros-max' }, 2799);
    expect(on.optionPriceDelta).toBe(180);
    expect(on.requiresPriceConfirmation).toBe(true);
    expect(on.selectedOptions.find(o => o.groupId === 'silicone-head-type')?.priceDelta).toBe(0);
  });
  it('reuses named variants by semantic identity AND exact amount and itemizes them', () => {
    expect(charges.reused).toHaveLength(8);
    expect(charges.missing).toHaveLength(27);
    expect(charges.exclusions).toHaveLength(9);
    expect(charges.missing.some(m => m.groupId.startsWith('extra-head'))).toBe(false);
    for (const item of charges.reused) {
      const b = item.binding;
      expect(release.payload.groups[item.sourceRegistryGroup as keyof typeof release.payload.groups].some(v => v.merchandiseId === b.merchandiseId && v.unitAmount === b.unitAmount)).toBe(true);
      const lines = exactUpgradeLines({ parentVariantId: SUKI_VARIANT_ID, parentLineId: 'gid://shopify/CartLine/suki-test', quantity: 1,
        charge: { amount: b.unitAmount, currencyCode: 'USD', title: 'Suki', items: [{ group: b.group, label: b.label, amount: b.unitAmount }] },
        bindings: [b], verifiedVariants: [{ id: b.merchandiseId, productTitle: b.productTitle, amount: b.unitAmount,
          currencyCode: 'USD', availableForSale: true, requiresShipping: false }] });
      expect(lines[0].attributes).toContainEqual({ key: 'Customization', value: `${b.group}: ${b.label}` });
    }
    const changed = structuredClone(config.groups);
    changed.find(g => g.id === 'premium-head-body-options')!.options.find(o => o.id === 'heating')!.priceDelta = 101;
    const mismatch = prepareSukiChargeMappings({ ...config, groups: changed }, release.payload.groups).missing.find(m => m.optionId === 'heating');
    expect(mismatch?.existingSemanticAmounts).toEqual([100]);
    expect(mismatch?.reason).toContain('different amount');
  });
  it('excludes unreachable paid choices even when flagged purchasable', () => {
    const children = structuredClone(deferredGroups);
    children.forEach(g => g.options.forEach(o => { o.purchasable = true; }));
    const result = prepareSukiChargeMappings({ ...config, groups: [...config.groups, ...children] }, release.payload.groups);
    expect(result.missing).toEqual(charges.missing);
    expect(result.reused).toEqual(charges.reused);
    expect(result.exclusions.filter(o => o.reason.startsWith('Unreachable'))).toHaveLength(9);
  });
  it('does not map different features just because their amounts match', () => {
    const r = prepareSukiChargeMappings(config, { fake: [{ group: 'Accessories', label: 'Other accessory', unitAmount: 30,
      merchandiseId: 'gid://shopify/ProductVariant/123', productTitle: 'Irontech Dolls - Other accessory', currencyCode: 'USD' }] });
    expect(r.reused).toEqual([]);
    expect(r.missing).toHaveLength(35);
  });
  it('keeps unsupported identity branches out of customer-facing choices', () => {
    for (const id of ['choose-a-head', 'silicone-head-type', 'buy-2nd-head']) {
      const options = config.groups.find(g => g.id === id)!.options;
      expect(options.filter(o => o.displayable !== false)).toHaveLength(1);
      expect(options.some(o => /separately verified/.test(o.description ?? ''))).toBe(false);
    }
  });
  it('prepares 20 clearly described draft charge products with mandatory pilot tags', () => {
    const specs = buildSukiChargeSpecs({ productId: SUKI_PRODUCT_ID, variantId: SUKI_VARIANT_ID, config, chargeMappings: charges });
    expect(specs).toHaveLength(20);
    const hair = specs.find(s => s.group === 'Pubic Hair')!;
    expect(hair.choiceLabels).toEqual(['Original', 'Bikini Wax', 'Freestyle', 'Heart', 'Striping', 'Martini Glass', 'Natural', 'Wild']);
    expect(hair.unitAmount).toBe(30);
    expect(specs.filter(s => s !== hair).every(s => s.choiceLabels.length === 1)).toBe(true);
    expect(new Set(specs.map(s => s.descriptionHtml)).size).toBe(20);
    expect(specs.every(s => s.descriptionHtml.length > 180)).toBe(true);
    expect(specs.every(s => ['dollwow-system', 'custom-option-charge', 'exact-upgrade-pilot'].every(tag => s.tags.includes(tag)))).toBe(true);
    expect(specs.some(s => /extra head/i.test(s.productTitle))).toBe(false);
    expect(specs.find(s => /ultra light/i.test(s.productTitle))?.unitAmount).toBe(199);
  });
  it('covers all 35 active paid choices with eight semantic matches and 20 draft binding fixtures', () => {
    const named = fixture.namedCharges;
    expect(named.status).toBe('FIXTURE_ONLY_NOT_A_RELEASE_BINDING');
    expect(named.bindings.filter(b => b.origin === 'DRAFT_FIXTURE')).toHaveLength(20);
    expect(named.bindings.filter(b => b.origin === 'EXISTING_SEMANTIC_MATCH')).toHaveLength(8);
    expect(named.bindings).toHaveLength(28);
    for (const choice of [...charges.reused.map(c => ({ groupId: c.groupId, optionId: c.optionId })), ...charges.missing]) {
      const group = config.groups.find(g => g.id === choice.groupId)!;
      const option = group.options.find(o => o.id === choice.optionId)!;
      const bindings = named.bindings.filter((b: { group: string; unitAmount: number; choiceLabels: string[] }) =>
        b.group === group.label && b.unitAmount === option.priceDelta && b.choiceLabels.includes(option.label));
      expect(bindings).toHaveLength(1);
    }
    for (const b of named.bindings.filter(b => b.origin === 'DRAFT_FIXTURE')) {
      expect(b.status).toBe('DRAFT');
      expect(b.descriptionHtml!.length).toBeGreaterThan(180);
      expect(b.tags).toEqual(expect.arrayContaining(['dollwow-system', 'custom-option-charge', 'exact-upgrade-pilot']));
      const v = b.variant;
      expect(Number(v.price)).toBe(b.unitAmount);
      expect(v.taxable).toBe(true);
      expect(v.inventoryPolicy).toBe('CONTINUE');
      expect(v.inventoryItem).toMatchObject({ requiresShipping: false, tracked: false });
    }
  });
  it('exports a local, non-release artifact only when explicitly requested', () => {
    if (process.env.SUKI_WRITE_PREPARED !== '1') return;
    const evidence = process.env.SUKI_EVIDENCE_DIR;
    expect(evidence, 'Explicit evidence destination required for diagnostics').toBeTruthy();
    const read = (name: string) => JSON.parse(readFileSync(`${evidence}/${name}`, 'utf8'));
    const fullSource = read('suki-review-menu-candidate.json');
    const fullRaw = read('yourdoll-itd911-menu.json');
    const exportConfig = prepareSukiConfig(fullSource.sourceMenu);
    const exportDefinition = sukiPresetDefinition(exportConfig);
    const named = read('suki-named-charge-candidate.json');
    const packet = {
      schemaVersion: 2, status: 'PARENT_HOOKS_TESTED_CHARGE_DRAFT_PREPARATION_ONLY', productId: SUKI_PRODUCT_ID, variantId: SUKI_VARIANT_ID,
      identity: source.identity, sourceRevision: read('suki_glow-draft-input.json').revision, basePrice: source.basePrice,
      sourceRefs: ['suki-review-menu-candidate.json', 'yourdoll-itd911-selected-proof.json', 'suki-selected-config-menu-comparison.json', 'molly-peer-menu-for-suki-comparison.json'],
      recordedMinimum: 2486, priceAfterTenPercent: 2519.10, floorHeadroom: 33.10,
      config: exportConfig, defaults, templateDefinition: exportDefinition, resolvedPresets: presets,
      presetReview: { status: 'PASS_RETAILER_SUPPORTED_UNDER_AUTHORIZED_FALLBACK',
        tierTotals: presets.map(p => ({ id: p.id, amount: p.totalPrice })),
        note: 'Exact ITD911 source combinations tested live. Retailer-supported, not factory-certified. No appearance choices, finished-weight or combined-performance promises.',
        evidence: 'suki-retailer-tier-combinations.json' },
      customerAvailability: { sourceChoices: 181, hiddenUnsupportedIdentityChoices: 5,
        disabledULW: 0, purchasableChoices: 176, note: 'Five unsupported head-identity choices remain hidden and non-purchasable.' },
      reusableClusterTag: definition.tag,
      registryStatus: 'REGISTRATION_REQUIRED: tag alone grants no eligibility. Each new compatible doll needs exact-menu signature review and registration through the existing workflow.',
      templateReuse: { engine: 'templateConfigurationPresets', existingRecipeCompatible: false,
        previousProductId: previousEntry.productId, unavailableRecipeChoices },
      chargeMappings: charges,
      namedChargeDrafts: { status: named.status, artifact: 'suki-named-charge-candidate.json',
        readOnlyAuditArtifact: 'suki-charge-readback.json', createdDraftProducts: named.bindings.filter((b: { origin: string }) => b.origin !== 'EXISTING_SEMANTIC_MATCH').length,
        reusedExistingProducts: named.reused.length, activePaidChoicesCovered: named.bindings.reduce((n: number, b: { choiceLabels: string[] }) => n + b.choiceLabels.length, 0),
        remainingProductsToCreate: charges.missing.filter(c => !named.bindings.some((b: { group: string; choiceLabels: string[]; unitAmount: number }) => b.group === c.group && b.choiceLabels.includes(c.label) && b.unitAmount === c.unitAmount)).length,
        note: 'chargeMappings.missing is the 27-choice shared-registry gap. See candidate bindings for draft product coverage. Activation, parent mapping and registry registration are parent-owned.' },
      optionalExtraHead: { status: 'DISABLED_UNTIL_ENTITLEMENT_AND_FULL_GRAPH_VERIFIED',
        proposedOwnershipGroups: deferredGroups,
        sourceBranches: fullRaw.groups.slice(31, 44),
        note: 'Retain complete hidden source data. Proposed ownership guards are not a verified complete head-identity/eye/mouth graph. No optional groups are appended to the 23-group checkout menu.' },
      otherHiddenSourceBranches: fullRaw.groups.map((g: { visible: boolean }, index: number) => ({ index, group: g }))
        .filter((g: { index: number; group: { visible: boolean } }) => !g.group.visible && g.index < 31),
      integration: {
        configs: 'Parent-installed getSukiCustomizationConfig hook tested through getCustomizationConfig and getFactoryCustomizationConfig. Parent still owns installing the reviewed menu. No parent mutation performed here.',
        resolve: 'Parent-installed sukiDefaultSelections hook tested with empty selections; both selected zero-cost S+ defaults survive. Shared files not modified by this work.',
        presets: 'Three retailer-supported tiers validated. Register this exact product and templateConfigSignature through the existing workflow. Cluster tag alone does not register this or future dolls. Do not reuse Suki 167cm binding or bypass signature validation.',
        charges: 'Eight existing semantic matches plus 20 charge drafts cover all 35 active paid choices once candidate coverage is complete. Parent owns activation and registration. Keep dollwow-system and exact-upgrade-pilot on every charge and preserve choiceLabels. No parent mappings or shared registry writes performed here.',
        optionalBranches: 'Keep buy-2nd-head/yes and alternate primary heads non-purchasable. Do not transfer retailer free-head promotions. Extra-head hair must never depend on the primary head.'
      },
      validation: { groupCount: 23, choiceCount: 181, applicablePresets: 3, runtime: 'PASS_WITH_PARENT_INSTALLED_DEFAULT_HOOK',
        productionIntegration: 'PARENT_INSTALLED_HOOKS_PASS_LOCAL_INTEGRATION_TESTS; NOT_DEPLOYED_BY_THIS_WORK', namedCartUnitValidation: 'MOCKED_VARIANT_READBACK_ONLY',
        liveCheckout: 'NOT_RUN', browserQA: 'NOT_RUN', publication: 'NOT_PERFORMED' }
    };
    writeFileSync(`${evidence}/suki-prepared-menu.json`, JSON.stringify({ ...packet,
      payloadSha256: createHash('sha256').update(JSON.stringify(packet)).digest('hex') }, null, 2) + '\n');
  });
});
