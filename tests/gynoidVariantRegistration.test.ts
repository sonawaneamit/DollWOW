import { describe, expect, it } from 'vitest';
import { gynoidBodyVersionMappings } from '@/lib/catalog/gynoid-body-versions';
import { prepareGynoidVariantRegistration, assertGynoidVersionPreservation, type GynoidVariantSnapshot } from '../scripts/lib/gynoid-variant-registration';

function fixture(): GynoidVariantSnapshot {
  const row = gynoidBodyVersionMappings[0];
  const connection = <T>(nodes: T[]) => ({ nodes, pageInfo: { hasNextPage: false } });
  return { id: row.productId, handle: row.handle, title: 'Lisa', status: 'DRAFT', tags: ['gynoid'], descriptionHtml: '<p>Retain</p>',
    options: [{ id: 'option', name: 'Title', optionValues: [{ id: 'value', name: 'Default Title' }] }],
    variants: connection([{ id: row.standardVariantId, title: 'Default Title', price: '5299.00', compareAtPrice: null,
      selectedOptions: [{ name: 'Title', value: 'Default Title' }], inventoryPolicy: 'CONTINUE', taxable: true,
      taxCode: null, inventoryItem: { id: 'item', tracked: false, requiresShipping: true, sku: 'original' } }]),
    media: connection([{ id: 'original-image' }]), metafields: connection([]), resourcePublications: connection([])
  };
}
function renamed(p: GynoidVariantSnapshot) {
  p.options[0].name = 'Body version'; p.options[0].optionValues[0].name = 'Standard';
  p.variants.nodes[0].title = 'Standard';
  p.variants.nodes[0].selectedOptions = [{ name: 'Body version', value: 'Standard' }];
  return p;
}
function complete(p: GynoidVariantSnapshot) {
  renamed(p); p.options[0].optionValues.push({ id: 'deluxe-value', name: 'Deluxe' });
  p.variants.nodes.push({ ...structuredClone(p.variants.nodes[0]), id: gynoidBodyVersionMappings[0].deluxeVariantId,
    title: 'Deluxe', price: '5799.00', selectedOptions: [{ name: 'Body version', value: 'Deluxe' }] });
  return p;
}
describe('resumable exact Gynoid draft variant registration', () => {
  it('prepares only a rename and one Deluxe variant, preserving the original Standard', () => {
    const p = fixture(), before = structuredClone(p);
    const plan = prepareGynoidVariantRegistration(p, 'USD');
    expect(plan.rename?.values).toEqual([{ id: 'value', name: 'Standard' }]);
    expect(plan.create?.variants).toEqual([{ price: '5799.00', optionValues: [{ optionId: 'option', name: 'Deluxe' }],
      inventoryPolicy: 'CONTINUE', taxable: true, taxCode: null, inventoryItem: { tracked: false, requiresShipping: true } }]);
    expect(p).toEqual(before);
  });
  it('resumes after rename without replaying it', () => {
    const plan = prepareGynoidVariantRegistration(renamed(fixture()), 'USD');
    expect(plan.rename).toBeNull(); expect(plan.create).not.toBeNull();
  });
  it('does no mutations when Deluxe is already present', () => {
    const plan = prepareGynoidVariantRegistration(complete(fixture()), 'USD');
    expect(plan.rename).toBeNull(); expect(plan.create).toBeNull();
    expect(plan.registeredDeluxeId).toBe(gynoidBodyVersionMappings[0].deluxeVariantId);
  });
  it.each(['active', 'published', 'truncated', 'other-parent', 'other-price', 'tracked', 'extra-option', 'unverified-deluxe'])('rejects %s', failure => {
    const p = fixture();
    if (failure === 'active') p.status = 'ACTIVE';
    if (failure === 'published') p.resourcePublications.nodes.push({ isPublished: true, publication: { id: 'pub', name: 'Store' } });
    if (failure === 'truncated') p.media.pageInfo.hasNextPage = true;
    if (failure === 'other-parent') p.id += '1';
    if (failure === 'other-price') p.variants.nodes[0].price = '1';
    if (failure === 'tracked') p.variants.nodes[0].inventoryItem.tracked = true;
    if (failure === 'extra-option') p.options.push(p.options[0]);
    if (failure === 'unverified-deluxe') { complete(p); p.variants.nodes[1].price = '1'; }
    expect(() => prepareGynoidVariantRegistration(p, 'USD')).toThrow();
  });
  it('allows only body-option changes and the additional variant', () => {
    expect(() => assertGynoidVersionPreservation(fixture(), complete(fixture()))).not.toThrow();
    for (const field of ['tags', 'media', 'standard-price', 'standard-sku']) {
      const after = complete(fixture());
      if (field === 'tags') after.tags.push('changed');
      if (field === 'media') after.media.nodes.pop();
      if (field === 'standard-price') after.variants.nodes[0].price = '1';
      if (field === 'standard-sku') after.variants.nodes[0].inventoryItem.sku = 'changed';
      expect(() => assertGynoidVersionPreservation(fixture(), after)).toThrow();
    }
  });
});
