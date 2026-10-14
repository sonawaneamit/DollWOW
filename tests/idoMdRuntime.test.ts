import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { mapShopifyProduct } from '@/lib/shopify/mappers';
import { getCustomizationConfig, getFactoryCustomizationConfig } from '@/lib/customization/configs';
import { getDefaultSelections, resolveCustomization } from '@/lib/customization/resolve';
import { IDO_MENU_TAG, MD_MENU_TAG, isIdoMdFixedInclusion } from '@/lib/customization/ido-md';
import { configurationPresets } from '@/lib/customization/presets';
import { prepareMdFactoryMenu } from '@/lib/customization/ido-md-preparation';
import { templateConfigSignature } from '@/lib/customization/template-config-signature';
import { promotionPricingForSelections, promotionOptionPrice } from '@/lib/promotions/optionPricing';
import { getOptionConflict } from '@/lib/customization/resolve';
import { optionAssetViolations } from '@/lib/assets/option-assets.mjs';
import type { CustomizationGroup } from '@/types/customization';

function product(brand: string, tags: string[], groups: CustomizationGroup[], headModel?: string) {
  return mapShopifyProduct({
    id: 'gid://shopify/Product/1', handle: `${brand.toLowerCase()}-runtime`, title: brand,
    description: '', vendor: brand, productType: 'Custom Silicone Doll', tags,
    featuredImage: null, images: { edges: [] }, variants: { edges: [] },
    priceRange: { minVariantPrice: { amount: '2899', currencyCode: 'USD' }, maxVariantPrice: { amount: '2899', currencyCode: 'USD' } },
    customizationGroups: { value: JSON.stringify(groups) },
    headModel: { value: headModel }, stockStatus: { value: 'custom' }, material: { value: 'silicone' }
  });
}
const option = (id: string, priceDelta = 0) => ({ id, label: id, priceDelta, priceVerified: true });
const menu = (): CustomizationGroup[] => [
  { id: 'standing-add-on', label: 'Standing', display: 'compact', options: [option('standing')] },
  { id: 'makeup-options', label: 'Makeup', display: 'compact', selectionMode: 'multiple', options: [
    option('realistic-body-painting-free'), option('real-skin-texture'), option('paid', 50)
  ] },
  { id: 'extra', label: 'Extra', display: 'compact', options: [option('none'), option('yes', 599)] },
  { id: 'detail', label: 'Detail', display: 'compact', visibleWhen: [[{ groupId: 'extra', optionId: 'yes' }]], options: [option('standard'), option('upgrade', 25)] }
];

describe('exact IDO/MD mapped runtime', () => {
  it('restores exact factory defaults after mapping, retains singleton groups and prevents removal', () => {
    const p = product('IDO', [IDO_MENU_TAG], menu()), before = JSON.stringify(p);
    expect(p.extended.customizationGroups?.[1].options[0].sourceProductionNoteSignals).toBeUndefined();
    const config = getCustomizationConfig(p);
    expect(config.id).toBe(IDO_MENU_TAG.slice(8));
    expect(config.groups.map(g => g.id)).toEqual(menu().map(g => g.id));
    expect(getFactoryCustomizationConfig(p)).toEqual(config);
    expect(getDefaultSelections(config)['makeup-options']).toEqual(['realistic-body-painting-free', 'real-skin-texture']);
    expect(resolveCustomization(config, { 'makeup-options': [] }, 2899).selections['makeup-options']).toEqual(['realistic-body-painting-free', 'real-skin-texture']);
    expect(resolveCustomization(config, { 'makeup-options': ['paid'] }, 2899).optionPriceDelta).toBe(50);
    expect(isIdoMdFixedInclusion(config, 'makeup-options', 'paid')).toBe(false);
    expect(JSON.stringify(p)).toBe(before);
    expect(configurationPresets(p.handle, config, 2899, getDefaultSelections(config))).toEqual([]);
  });
  it('clears hidden extra details and charges exactly once', () => {
    const c = getCustomizationConfig(product('IDO', [IDO_MENU_TAG], menu()));
    expect(resolveCustomization(c, { extra: 'yes', detail: 'upgrade' }, 2899)).toMatchObject({ totalPrice: 3523, issues: [], requiresPriceConfirmation: false });
    const removed = resolveCustomization(c, { extra: 'none', detail: 'upgrade' }, 2899);
    expect(removed.totalPrice).toBe(2899);
    expect(removed.selections).not.toHaveProperty('detail');
  });
  it('does not activate by brand alone or wrong brand/tag, nor alter other defaults', () => {
    for (const [brand, tags] of [['IDO', []], ['Other', [IDO_MENU_TAG]], ['IDO', [MD_MENU_TAG]]] as Array<[string, string[]]>) {
      const c = getCustomizationConfig(product(brand, tags, menu()));
      expect(c.id).not.toBe(IDO_MENU_TAG.slice(8));
      expect(c.id).not.toBe(MD_MENU_TAG.slice(8));
    }
  });
  it('never invents verified prices or charges for fixed features', () => {
    const groups = menu();
    groups[1].options[0].priceVerified = false;
    const c = getCustomizationConfig(product('IDO', [IDO_MENU_TAG], groups));
    expect(resolveCustomization(c, {}, 2899).requiresPriceConfirmation).toBe(true);
  });
});

const root = process.env.IDO_MD_SNAPSHOT_ROOT;
describe.skipIf(!root)('authoritative Shopify snapshots through real mapper', () => {
  for (const [brand, tag, count] of [['ido', IDO_MENU_TAG, 11], ['md', MD_MENU_TAG, 26]] as const) {
    it(`${brand}: all current drafts retain every group, price and dependency`, () => {
      const snapshot = JSON.parse(readFileSync(`${root}/${brand}-before.json`, 'utf8'));
      expect(snapshot.products).toHaveLength(count);
      for (const row of snapshot.products) {
        expect(row.status).toBe('DRAFT');
        const groups = JSON.parse(row.metafields.nodes.find((m: { key: string }) => m.key === 'customization_groups').value);
        const p = product(row.metafields.nodes.find((m: { key: string }) => m.key === 'brand').value, row.tags, groups);
        const c = getCustomizationConfig(p);
        expect(c.id).toBe(tag.slice(8));
        expect(c.groups.map(g => [g.id, g.visibleWhen, g.options.map(o => [o.id, o.priceDelta])])).toEqual(groups.map((g: CustomizationGroup) => [g.id, g.visibleWhen, g.options.map(o => [o.id, o.priceDelta])]));
        expect(optionAssetViolations(c.groups)).toEqual([]);
        const resolved = resolveCustomization(c, {}, 2899);
        expect(resolved).toMatchObject({ optionPriceDelta: 0, issues: [], requiresPriceConfirmation: false });
        if (brand === 'ido') {
          expect(resolved.selections['makeup-options']).toHaveLength(2);
          expect(resolved.selections['premium-head-body-options-multiple']).toHaveLength(6);
          expect(configurationPresets(row.handle, c, 2899, resolved.selections)).toEqual([]);
        }
      }
    });
  }
  it('prepares exact signatures and proposed metafields without live writes', () => {
    const hash = (text: string) => `sha256:${createHash('sha256').update(text).digest('hex')}`;
    const rows = [];
    const staged: Record<string, unknown[]> = { ido: [], md: [] };
    for (const brand of ['ido', 'md']) {
      const snapshot = JSON.parse(readFileSync(`${root}/${brand}-before.json`, 'utf8'));
      for (const row of snapshot.products) {
        const fields = row.metafields.nodes;
        const saved = fields.find((m: { key: string }) => m.key === 'customization_groups');
        const brandLabel = fields.find((m: { key: string }) => m.key === 'brand').value;
        const headModel = fields.find((m: { key: string }) => m.key === 'head_model').value;
        const supplied = JSON.parse(saved.value);
        const before = JSON.stringify(supplied);
        const current = getCustomizationConfig(product(brandLabel, row.tags, supplied, headModel));
        const proposal = brand === 'md' ? prepareMdFactoryMenu(supplied, {
          extraHeadRetailPrice: 599,
          includesSkinTexture: row.handle === 'md-leona-161cm-silicone-companion-doll', listingHeadCode: headModel
        }) : { groups: supplied, priceChanges: [], holds: [] };
        expect(JSON.stringify(supplied)).toBe(before);
        const mapped = product(brandLabel, row.tags, proposal.groups, headModel);
        const proposed = getCustomizationConfig(mapped);
        expect(optionAssetViolations(proposed.groups)).toEqual([]);
        expect(resolveCustomization(proposed, {}, 2899)).toMatchObject({ optionPriceDelta: 0, requiresPriceConfirmation: false, issues: [] });
        if (brand === 'md') {
          const body = 'premium-head-body-options-multiple';
          expect(resolveCustomization(proposed, { [body]: ['soft-butt'] }, 2899).optionPriceDelta).toBe(100);
          expect(resolveCustomization(proposed, { [body]: ['soft-butt', 'bionic-skin-softer-skin'] }, 2899).optionPriceDelta).toBe(299);
          expect(resolveCustomization(proposed, { [body]: ['bionic-skin-softer-skin'] }, 2899).optionPriceDelta).toBe(299);
          expect(resolveCustomization(proposed, { 'an-extra-free-head': 'yes-i-need-free' }, 2899).optionPriceDelta).toBe(599);
          expect(resolveCustomization(proposed, { [body]: [] }, 2899).selections[body]).toContain('hard-hand');
          expect(getOptionConflict(proposed, { head: 'other-heads', 'other-heads': 'm22' }, 'head-type', 'ros-head-movable-jaw')).toBeNull();
          const originalRos = getOptionConflict(proposed, { head: 'no-change' }, 'head-type', 'ros-head-movable-jaw');
          expect(originalRos).toBeNull();
          expect(getOptionConflict(proposed, { 'an-extra-free-head': 'yes-i-need-free', 'extra-head-choice': 'm38' }, 'extra-head-type', 'ros-head-movable-jaw')).toBeNull();
          for (const [timestamp, active] of [['2026-10-01T06:59:59Z', false], ['2026-10-01T07:00:00Z', true], ['2026-11-01T06:59:59Z', true], ['2026-11-01T07:00:00Z', false]] as const) {
            const now = new Date(timestamp);
            const selected = { [body]: ['soft-butt', 'bionic-skin-softer-skin'] };
            const priced = promotionPricingForSelections(mapped, proposed, selected, now);
            const result = resolveCustomization(priced.config, selected, 2899);
            expect(result.optionPriceDelta).toBe(active ? 0 : 299);
            expect(result.issues).toEqual([]);
            expect(result.requiresPriceConfirmation).toBe(false);
            expect(priced.config.groups.some(g => g.id === 'md-october-gifts')).toBe(active);
            if (active) {
              expect(result.selections['md-october-gifts']).toEqual(['three-in-one-head-stand']);
              expect(result.selections.accessories).toContain('vine-talk-ai-box-free');
            }
            const group = proposed.groups.find(g => g.id === body)!;
            expect(promotionOptionPrice(mapped, group, group.options.find(o => o.id === 'bionic-skin-softer-skin')!, now, false).displayDelta).toBe(active ? 0 : 299);
          }
        }
        rows.push({ productId: row.id, handle: row.handle, status: row.status,
          savedMetafieldSha256: hash(saved.value), currentRuntimeSignature: hash(templateConfigSignature(current)),
          proposedRuntimeSignature: hash(templateConfigSignature(proposed)),
          priceChanges: proposal.priceChanges, holds: proposal.holds,
          proposedMetafield: { ownerId: row.id, namespace: 'custom', key: 'customization_groups', type: 'json', value: JSON.stringify(proposed.groups) },
          fixedDefaults: getDefaultSelections(proposed),
          conditionalPricing: brand === 'md' ? 'soft-butt is zero only while bionic-skin-softer-skin is selected' : null
        });
        // Same approved retail decisions feed both parent handoff formats.
        const factoryGroups = structuredClone(proposal.groups);
        const holds = [...proposal.holds];
        const stagedConfig = getCustomizationConfig(product(brandLabel, row.tags, factoryGroups, headModel));
        expect(resolveCustomization(stagedConfig, {}, 2899)).toMatchObject({ issues: [], requiresPriceConfirmation: false, optionPriceDelta: 0 });
        const changes = stagedConfig.groups.flatMap(g => g.options.flatMap(o => {
          const old = supplied.find((source: CustomizationGroup) => source.id === g.id)?.options.find((source: { id: string }) => source.id === o.id);
          return old && (old.priceDelta !== o.priceDelta || old.purchasable !== o.purchasable || old.label !== o.label)
            ? [{ groupId: g.id, optionId: o.id, before: { priceDelta: old.priceDelta, label: old.label, purchasable: old.purchasable }, after: { priceDelta: o.priceDelta, label: o.label, purchasable: o.purchasable } }] : [];
        }));
        staged[brand].push({ productId: row.id, handle: row.handle, status: 'DRAFT',
          originalMetafieldSha256: hash(saved.value), runtimeSignature: hash(templateConfigSignature(stagedConfig)),
          groups: stagedConfig.groups, rules: stagedConfig.rules, changes, holds,
          campaign: brand === 'md' ? { startsOn: '2026-10-01', endsOn: '2026-10-31', timeZone: 'America/Los_Angeles', bionicCatalogPrice: 299, bionicCampaignPrice: 0, gifts: ['3-in-1 Head Stand', 'AI Box'], runtimeSignature: hash(templateConfigSignature(promotionPricingForSelections(mapped, stagedConfig, {}, new Date('2026-10-14T12:00:00Z')).config)) } : null,
          presetDecision: brand === 'ido' ? 'MANUAL_ONLY_ALL_INCLUDED' : 'Preserve existing articulated-fingers / soft-butt / heating recipe; regenerate signature.',
          metafield: { ownerId: row.id, namespace: 'custom', key: 'customization_groups', type: 'json', value: JSON.stringify(stagedConfig.groups) }
        });
      }
    }
    expect(rows).toHaveLength(37);
    if (process.env.IDO_MD_PROPOSAL_OUTPUT) {
      for (const brand of ['ido', 'md']) writeFileSync(`${root}/${brand}-staged-menus.json`, JSON.stringify(staged[brand], null, 2));
      writeFileSync(process.env.IDO_MD_PROPOSAL_OUTPUT, JSON.stringify({
      status: 'STAGED_OWNER_DECISIONS_APPLIED', mutations: 0,
      decisions: { mdExtraHeadRetailPrice: '599 release retail decision under general publication/pricing authorization; not an explicit user-selected price; factory agency cost 360', mdOctoberBionicPromotion: 'Custom-doll October poster verified: scheduled Oct 1-31 2026; catalog price remains 299', rosCapability: 'Exact PDF p38 head-code compatibility rules; ROS included at zero for supported heads', idoPresets: 'approved manual-only; factory inclusions fixed', dealerExtras: 'owner-authorized fallback prices retained' },
      integrations: { fixedInclusionUI: 'implemented', conditionalSoftButtUI: 'implemented', campaignPricing: 'shared PDP/cart scheduler', signatures: 'regenerated with staged catalog and October runtime signatures' }, rows
      }, null, 2));
    }
  });
});
