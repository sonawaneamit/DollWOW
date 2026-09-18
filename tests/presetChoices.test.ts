import fs from 'node:fs';
import React, { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { parse } from 'node-html-parser';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { litaHeadChoice, presetChoiceOptions, replacePresetChoice, withPresetChoices } from '@/lib/customization/preset-choices';
import { getDefaultSelections, resolveCustomization } from '@/lib/customization/resolve';
import { templateConfigurationPresets } from '@/lib/customization/template-presets';
import { getCustomizationConfig } from '@/lib/customization/configs';
import { mapShopifyProduct } from '@/lib/shopify/mappers';
import { withPromotionOptionPricing } from '@/lib/promotions/optionPricing';
import { PresetChoiceDialog } from '@/components/PresetChoiceDialog';
import type { BrandCustomizationConfig } from '@/types/customization';
import type { ConfigurationPreset } from '@/lib/customization/presets';

vi.stubGlobal('React', React);
afterAll(() => vi.unstubAllGlobals());

function fixture(multiple = true) {
  const config: BrandCustomizationConfig = { id: 'fixture', brandLabel: 'SE Doll', leadTimeNote: '', rules: [], groups: [
    { id: 'skin', label: 'Skin tone', display: 'swatches', options: [{ id: 'shown', label: 'As shown', priceDelta: 0 }, { id: 'tan', label: 'Tan', priceDelta: 0 }] },
    { id: 'add-extra-head', label: 'Extra head', display: 'swatches', selectionMode: multiple ? 'multiple' : 'single', options: [
      { id: 'none', label: 'No extra head', priceDelta: 0 },
      { id: 'extra-134sc', label: '#134SC', priceDelta: 225 },
      { id: 'extra-b', label: '#B', priceDelta: 225 },
      { id: 'extra-c', label: '#C', priceDelta: 300 },
      { id: 'unverified', label: 'Unverified', priceDelta: 0, priceVerified: false },
      { id: 'unavailable', label: 'Unavailable', priceDelta: 0, purchasable: false }
    ] }
  ] };
  const preset: ConfigurationPreset = { id: 'popular', label: 'Enthusiast', description: 'Extra SE head #134SC with articulated fingers.', totalPrice: 2618,
    selections: { skin: 'tan', 'add-extra-head': multiple ? ['extra-134sc'] : 'extra-134sc' }, highlights: ['#134SC', 'Articulated fingers'], managedGroupIds: ['add-extra-head'] };
  return { config, preset };
}

describe('personal choices in presets', () => {
  it.each([true, false])('reserves the actual upgrade price but does not pick a face (multiple=%s)', multiple => {
    const { config, preset } = fixture(multiple);
    const [result] = withPresetChoices([preset], config, 2393, getDefaultSelections(config), [litaHeadChoice]);
    expect(result.totalPrice).toBe(2618);
    expect(result.selections['add-extra-head']).toEqual(multiple ? ['none'] : 'none');
    expect(result.pendingChoices).toEqual([litaHeadChoice]);
    expect(result.highlights).toEqual(['Articulated fingers', 'Extra head: your choice']);
    expect(result.description).not.toContain('#134SC');
  });
  it('preserves the customer face and appearance choices, with its exact price', () => {
    const { config, preset } = fixture();
    const current = { skin: 'tan', 'add-extra-head': ['extra-c'] };
    const [result] = withPresetChoices([preset], config, 2393, current, [litaHeadChoice]);
    expect(result.selections).toEqual(current);
    expect(result.pendingChoices).toEqual([]);
    expect(result.totalPrice).toBe(2693);
  });
  it('retains additional manually chosen heads when changing the first one', () => {
    const { config, preset } = fixture();
    const current = { skin: 'tan', 'add-extra-head': ['extra-b', 'extra-c'] };
    const [result] = withPresetChoices([preset], config, 2393, current, [litaHeadChoice]);
    expect(result.selections).toEqual(current);
    expect(result.totalPrice).toBe(2918);
    expect(replacePresetChoice(config, current, litaHeadChoice, 'extra-134sc')['add-extra-head']).toEqual(['extra-134sc', 'extra-c']);
  });
  it('does not call a paid head free; verified zero-priced promotions reserve zero', () => {
    const { config, preset } = fixture();
    config.groups[1].options[1].priceDelta = 0;
    const [result] = withPresetChoices([preset], config, 2393, getDefaultSelections(config), [litaHeadChoice]);
    expect(result.totalPrice).toBe(2393);
    expect(result.pendingChoices).toHaveLength(1);
  });
  it('excludes unknown prices, unavailable options, and incompatible choices', () => {
    const { config, preset } = fixture();
    config.rules.push({ id: 'conflict', type: 'incompatible', when: { groupId: 'skin', optionId: 'tan' }, conflictsWith: { groupId: 'add-extra-head', optionId: 'extra-c' }, message: 'Not compatible' });
    config.groups[1].options.push({ id: 'unknown', label: 'Unknown' });
    expect(presetChoiceOptions(config, { ...preset.selections, 'add-extra-head': ['none'] }, litaHeadChoice).map(o => o.id)).toEqual(['extra-134sc', 'extra-b']);
  });
  it('does not add a head requirement to Starter and preserves an independently selected head', () => {
    const { config, preset } = fixture();
    preset.id = 'starter'; preset.selections['add-extra-head'] = ['none'];
    const [result] = withPresetChoices([preset], config, 2393, { 'add-extra-head': ['extra-b'] }, [litaHeadChoice]);
    expect(result.choiceSlots).toEqual([]);
    expect(result.selections['add-extra-head']).toEqual(['extra-b']);
    expect(result.totalPrice).toBe(2618);
  });
  it('holds a preset when no eligible choice remains', () => {
    const { config, preset } = fixture();
    config.groups[1].options.slice(1).forEach(option => { option.purchasable = false; });
    expect(withPresetChoices([preset], config, 2393, {}, [litaHeadChoice])).toEqual([]);
  });
  it('removes the preset-owned head cost when switching back to Starter', () => {
    const { config, preset } = fixture();
    preset.id = 'starter'; preset.selections['add-extra-head'] = ['none'];
    const [result] = withPresetChoices([preset], config, 2393, { 'add-extra-head': ['extra-b'] }, [litaHeadChoice], ['add-extra-head']);
    expect(result.totalPrice).toBe(2393);
    expect(result.selections['add-extra-head']).toEqual(['none']);
    expect(result.pendingChoices).toEqual([]);
  });
});

describe('choice dialog markup', () => {
  const props = { open: true, title: 'Choose your extra head', presetLabel: 'Enthusiast', dollName: 'Lita B',
    options: fixture().config.groups[1].options.slice(1, 3), totalWithoutChoice: 2393, currencyCode: 'USD', step: 1, steps: 1,
    onDraft: vi.fn(), onConfirm: vi.fn(), onClose: vi.fn() };
  it('starts with no checked face and disabled confirmation, with a labelled native dialog', () => {
    const html = parse(renderToStaticMarkup(createElement(PresetChoiceDialog, props)));
    expect(html.querySelector('dialog[aria-labelledby][aria-describedby]')).not.toBeNull();
    expect(html.querySelector('input[checked]')).toBeNull();
    expect(html.querySelectorAll('button').find(button => button.text.includes('Confirm head'))!.hasAttribute('disabled')).toBe(true);
    expect(html.text).toContain('$2,618');
    expect(html.text).not.toContain('FREE');
  });
  it('shows the chosen face and enables confirmation only after a valid choice', () => {
    const html = parse(renderToStaticMarkup(createElement(PresetChoiceDialog, { ...props, draftId: 'extra-b' })));
    expect(html.querySelector('input[checked]')?.getAttribute('value')).toBe('extra-b');
    expect(html.querySelectorAll('button').find(button => button.text.includes('Confirm head'))!.hasAttribute('disabled')).toBe(false);
  });
});

const directory = 'data/exports/option-template-review/2026-09-13/buyer-led-recipes';
it.skipIf(!fs.existsSync(`${directory}/live-runtime-source.ndjson`))('local Lita evidence keeps all three tiers, real head swatches, and exact reserved totals', () => {
  const raw = fs.readFileSync(`${directory}/live-runtime-source.ndjson`, 'utf8').split('\n').filter(Boolean).map(line => JSON.parse(line))
    .find(product => product.handle === 'sedoll-lita-b-163cm-c-cup-silicone-companion-doll-1fl7h');
  const product = mapShopifyProduct({ ...raw, variants: { edges: raw.variants.nodes.map((node: unknown) => ({ node })) } });
  const config = getCustomizationConfig(product);
  const priced = withPromotionOptionPricing(product, config, new Date('2026-09-14T12:00:00Z'));
  const review = JSON.parse(fs.readFileSync(`${directory}/runtime-review-package.json`, 'utf8'));
  const binding = review.bindings[review.products[product.handle]];
  const definition = binding.definition ?? binding;
  const current = getDefaultSelections(priced);
  const original = templateConfigurationPresets(definition, config, priced, 2333, current);
  expect(original).toHaveLength(3);
  const presets = withPresetChoices(original, priced, 2333, current, [litaHeadChoice]);
  expect(presets).toHaveLength(3);
  expect(presets.map(p => p.totalPrice)).toEqual(original.map(p => p.totalPrice));
  expect(presets[1].pendingChoices).toHaveLength(1);
  const options = presetChoiceOptions(priced, presets[1].selections, litaHeadChoice);
  expect(options.length).toBeGreaterThan(10);
  expect(options.every(option => option.swatch?.kind === 'image')).toBe(true);
  expect(options.some(option => /other heads?/i.test(option.label))).toBe(false);
  const selected = replacePresetChoice(priced, presets[1].selections, litaHeadChoice, 'extra-134sc');
  expect(resolveCustomization(priced, selected, 2333).totalPrice).toBe(2618);
});
