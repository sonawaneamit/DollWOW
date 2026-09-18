import { expect, test } from 'vitest';
import { getSeCustomizationGroups } from '@/lib/customization/dealer-brands';
import type { Product } from '@/types/product';
import type { CustomizationGroup } from '@/types/customization';

test('SE shared identity corrections preserve option order, prices and supplier imagery', () => {
  const groups: CustomizationGroup[] = [{ id: 'standing-add-on', label: 'Standing', required: false, selectionMode: 'single', display: 'swatches', options: [
    { id: 'free', label: 'FREE', priceDelta: 0, swatch: {kind:'image', value:'https://supplier.test/Standing.jpg'} },
    { id: 'free', label: 'FREE', priceDelta: 0, swatch: {kind:'image', value:'https://supplier.test/Hard-Feet.jpg'} }
  ] }, { id: 'upgraded-flight-case-add-on', label: 'Case', required: false, selectionMode: 'single', display: 'swatches', options: [
    {id:'flight-case-doll-weight-40kg', label:'Flight Case (Doll Weight &lt; 40kg)', priceDelta:699},
    {id:'flight-case-doll-weight-40kg', label:'Flight Case (Doll Weight ≥ 40kg)', priceDelta:899}
  ] }];
  const product = {handle:'se-another-doll',title:'SE Doll',vendor:'SE Doll',tags:[],extended:{}} as unknown as Product;
  const before = structuredClone(groups);
  const fixed = getSeCustomizationGroups(product, groups);
  expect(fixed.map(group => group.options.map(option => option.id))).toEqual([['standing-feet','hard-feet'],['flight-case-under-40kg','flight-case-40kg-and-over']]);
  expect(fixed.map(group => group.options.map(option => option.priceDelta))).toEqual([[0,0],[699,899]]);
  expect(fixed[0].options.map(option => option.swatch)).toEqual(before[0].options.map(option => option.swatch));
  expect(groups).toEqual(before);
  expect(getSeCustomizationGroups(product, fixed)).toEqual(fixed);
});
