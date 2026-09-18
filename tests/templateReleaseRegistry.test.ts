import { describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';
import type { Product } from '@/types/product';
import type { BrandCustomizationConfig } from '@/types/customization';
vi.mock('server-only', () => ({}));
import { createReleasedTemplateSelector, selectReleasedTemplateRecipe, templateReleaseIssues,
  templateReleasePayloadHash, templateRuntimeHash, type TemplateReleaseRegistry } from '@/lib/customization/template-release-registry';
import { templateConfigSignature } from '@/lib/customization/template-config-signature';
import blockedRegistry from '@/lib/customization/evidence/template-release.json';

const config: BrandCustomizationConfig = { id: 'se-fixture', brandLabel: 'SE', leadTimeNote: '', rules: [], groups: [
  { id: 'finish', label: 'Finish', display: 'compact', required: true, options: [
    { id: 'included', label: 'Included', priceDelta: 0, priceVerified: true },
    { id: 'detail', label: 'Detail', priceDelta: 60, priceVerified: true }
  ] }
] };
const product: Product = { id: 'gid://shopify/Product/1', handle: 'test-doll', title: 'Test Doll', vendor: 'SE', productType: 'Doll',
  description: '', tags: ['options:se-fixture', 'custom'], featuredImage: null, images: [],
  variants: [{ id: 'gid://shopify/ProductVariant/1', title: 'Default', availableForSale: true,
    selectedOptions: [], price: { amount: '2000.00', currencyCode: 'USD' } }],
  priceRange: { minVariantPrice: { amount: '2000.00', currencyCode: 'USD' }, maxVariantPrice: { amount: '2000.00', currencyCode: 'USD' } },
  extended: { brand: 'SE', stockStatus: 'custom', bodyType: 'female', material: 'silicone', headModel: 'A' }
};

function sign(registry: TemplateReleaseRegistry) {
  const approval = { reviewedBy: 'Test reviewer', reviewedAt: '2026-09-13T12:00:00Z', evidenceRef: 'fixture-only-not-real-approval',
    payloadHash: templateReleasePayloadHash(registry.payload) };
  registry.approvals = { catalogCompatibility: { ...approval }, checkoutChargeLines: { ...approval }, coordinatedRelease: { ...approval } };
  return registry;
}
function fixture() {
  return sign({ schemaVersion: 2, releaseStatus: 'APPROVED', payload: { releaseId: 'fixture-only', sourceSnapshotHash: 'a'.repeat(64),
    expectedProductIds: [product.id], entries: [{ productId: product.id, handle: product.handle, tag: product.tags[0], bindingKey: 'se',
      runtimeHash: templateRuntimeHash(product, config) }], bindings: { se: { tag: product.tags[0], signature: templateConfigSignature(config),
      tiers: ['starter', 'enthusiast', 'collector'].map(id => ({ id, description: 'Fixture only', add: [], remove: [] })) } }
  }, approvals: null } as TemplateReleaseRegistry);
}

describe('coordinated template release boundary', () => {
  it('packages the entire reviewed cohort with evidence-bound approvals', () => {
    expect(templateReleaseIssues(blockedRegistry)).toEqual([]);
    expect(blockedRegistry.payload.entries).toHaveLength(2580);
    expect(blockedRegistry.payload.expectedProductIds).toHaveLength(2580);
  });
  it('still rejects a blocked registry', () => {
    expect(templateReleaseIssues({ ...fixture(), releaseStatus: 'BLOCKED' })).toEqual(['release_not_approved']);
  });
  it('expands compact signatures only after matching the current menu', () => {
    const registry = fixture();
    const original = registry.payload.bindings.se.signature;
    registry.payload.bindings.se.signature = `sha256:${createHash('sha256').update(original).digest('hex')}`;
    sign(registry);
    expect(selectReleasedTemplateRecipe(registry, product, config)?.signature).toBe(original);
    registry.payload.bindings.se.signature = `sha256:${'0'.repeat(64)}`;
    sign(registry);
    expect(selectReleasedTemplateRecipe(registry, product, config)).toBeNull();
  });
  it('selects only an exact product binding after all three evidence-bound reviews', () => {
    const registry = fixture();
    expect(templateReleaseIssues(registry)).toEqual([]);
    expect(selectReleasedTemplateRecipe(registry, product, config)).toEqual(registry.payload.bindings.se);
  });
  it.each(['catalogCompatibility', 'checkoutChargeLines', 'coordinatedRelease'] as const)('refuses a missing %s gate', gate => {
    const registry = fixture(); delete (registry.approvals as Partial<NonNullable<TemplateReleaseRegistry['approvals']>>)[gate];
    expect(templateReleaseIssues(registry)).toEqual([`missing_or_stale_${gate}`]);
  });
  it('invalidates old approvals when recipes change', () => {
    const registry = fixture(); registry.payload.bindings.se.tiers[2].add.push({ groupId: 'finish', optionId: 'detail' });
    expect(templateReleaseIssues(registry)).toEqual(['missing_or_stale_catalogCompatibility']);
  });
  it('does not accept placeholders as approvals', () => {
    const registry = fixture(); registry.approvals!.checkoutChargeLines.evidenceRef = 'pending';
    expect(templateReleaseIssues(registry)).toEqual(['missing_or_stale_checkoutChargeLines']);
  });
  it('rejects omitted, additional and duplicate product assignments', () => {
    const registry = fixture(); registry.payload.expectedProductIds.push('gid://shopify/Product/2');
    expect(templateReleaseIssues(sign(registry))).toContain('incomplete_or_duplicate_scope');
    registry.payload.expectedProductIds.pop(); registry.payload.entries.push({ ...registry.payload.entries[0] });
    expect(templateReleaseIssues(sign(registry))).toContain('incomplete_or_duplicate_scope');
    registry.payload.entries.pop(); registry.payload.entries[0].productId = 'gid://shopify/Product/2';
    expect(templateReleaseIssues(sign(registry))).toContain('incomplete_or_duplicate_scope');
  });
  it('rejects empty scope and duplicate expected IDs', () => {
    const registry = fixture(); registry.payload.expectedProductIds = [];
    expect(templateReleaseIssues(sign(registry))).toContain('invalid_payload');
    registry.payload.expectedProductIds = [product.id, product.id];
    expect(templateReleaseIssues(sign(registry))).toContain('invalid_scope');
  });
  it('rejects malformed and dangling bindings', () => {
    const registry = fixture(); registry.payload.bindings.se.tiers.pop();
    expect(templateReleaseIssues(sign(registry))).toContain('invalid_bindings');
    expect(templateReleaseIssues({ ...fixture(), payload: null })).toContain('invalid_payload');
    const missing = fixture(); missing.payload.entries[0].bindingKey = 'not-found';
    expect(templateReleaseIssues(sign(missing))).toContain('invalid_bindings');
  });
  it('keeps deferred Fanreal out, including alternate brand metadata', () => {
    const registry = fixture(); registry.payload.entries[0].handle = 'fanreal-test';
    expect(templateReleaseIssues(sign(registry))).toContain('invalid_entry');
    expect(selectReleasedTemplateRecipe(fixture(), { ...product, extended: { ...product.extended, brand: 'Fanreal' } }, config)).toBeNull();
  });
  it.each(['variant', 'price', 'currency', 'availability', 'head', 'tag', 'duplicateTag', 'handle', 'productId', 'stock'])(
    'rejects %s drift instead of borrowing the brand recipe', field => {
      const changed = structuredClone(product);
      if (field === 'variant') changed.variants[0].id += '2';
      if (field === 'price') changed.variants[0].price.amount = '2100';
      if (field === 'currency') changed.variants[0].price.currencyCode = 'EUR';
      if (field === 'availability') changed.variants[0].availableForSale = false;
      if (field === 'head') changed.extended.headModel = 'B';
      if (field === 'tag') changed.tags[0] = 'options:se-other';
      if (field === 'duplicateTag') changed.tags.push('OPTIONS:se-fixture');
      if (field === 'handle') changed.handle = 'new-doll';
      if (field === 'productId') changed.id += '2';
      if (field === 'stock') changed.extended.stockStatus = 'ready_to_ship';
      expect(selectReleasedTemplateRecipe(fixture(), changed, config)).toBeNull();
    });
  it.each(['price', 'label', 'note', 'condition', 'rule', 'defaultOrder'])(
    'rejects menu %s drift', field => {
      const changed = structuredClone(config);
      if (field === 'price') changed.groups[0].options[1].priceDelta = 100;
      if (field === 'label') changed.groups[0].options[1].label = 'Detail (FREE)';
      if (field === 'note') changed.groups[0].options[1].productionNote = 'Factory confirmation required';
      if (field === 'condition') changed.groups[0].visibleWhen = [[{ groupId: 'gate', optionId: 'yes' }]];
      if (field === 'rule') changed.rules.push({ id: 'conflict', type: 'incompatible', when: { groupId: 'finish', optionId: 'detail' },
        conflictsWith: { groupId: 'finish', optionId: 'included' }, message: 'Incompatible' });
      if (field === 'defaultOrder') changed.groups[0].options.reverse();
      expect(selectReleasedTemplateRecipe(fixture(), product, changed)).toBeNull();
    });
  it('does not invalidate recipes for unrelated editorial or image changes', () => {
    const changed = { ...product, description: 'New editorial', images: [{ url: '/new.jpg', altText: 'New image' }] };
    expect(templateRuntimeHash(changed, config)).toBe(templateRuntimeHash(product, config));
  });
  it('snapshots approval and protects the recipe from caller mutations', () => {
    const registry = fixture(); const select = createReleasedTemplateSelector(registry);
    registry.payload.bindings.se.tiers[0].description = 'Changed after validation';
    const recipe = select(product, config)!; recipe.tiers[0].description = 'Mutated returned recipe';
    expect(select(product, config)!.tiers[0].description).toBe('Fixture only');
  });
});
