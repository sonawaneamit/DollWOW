import { expect, test } from 'vitest';
import { normalizeImportedCaseIdentities, normalizeImportedBrandColorIdentities } from '@/lib/customization/imported-option-identities';
import { groupedCartAttributes } from '@/lib/customization/resolve';
import type { CustomizationGroup } from '@/types/customization';

function colors(): CustomizationGroup[] {
  return [{id:'vagina-color',label:'Vagina Color',display:'swatches',options:
    ['no-change','pink','light-brown','pink','dark-brown'].map((id,index)=>({id,label:id==='pink'?'Pink':id,priceDelta:0,
      swatch:{kind:'image' as const,value:`https://www.rosemarydoll.com/wp-content/uploads/2020/08/${index===1?'Pink-1-2.jpg':'Dark-Brown-1-1.jpg'}`}}))}];
}

test.each(['6ye','hr'])('repairs only known %s swatches without changing their presentation or price', brand => {
  const source=colors(); const original=structuredClone(source);
  const fixed=normalizeImportedBrandColorIdentities(source,brand);
  expect(new Set(fixed[0].options.map(o=>o.id)).size).toBe(5);
  expect(fixed[0].options.map(({id,...rest})=>rest)).toEqual(source[0].options.map(({id,...rest})=>rest));
  expect(source).toEqual(original);
  expect(normalizeImportedBrandColorIdentities(fixed,brand)).toEqual(fixed);
  for (const index of [1,3]) {
    const option=fixed[0].options[index];
    expect(groupedCartAttributes([{groupId:'vagina-color',groupLabel:'Vagina Color',optionId:option.id,optionLabel:option.label,priceDelta:0,priceConfirmed:true}],'Included: ')[0].value)
      .toBe(`Pink (supplier swatch Pink_${index})`);
  }
});

test('leaves other brands and unrecognized or conditional swatches untouched',()=>{
  const source=colors();
  for(const brand of ['fanreal','wm','']) expect(normalizeImportedBrandColorIdentities(source,brand)).toBe(source);
  source[0].options[3].swatch!.value='https://example.com/different.jpg';
  expect(normalizeImportedBrandColorIdentities(source,'hr')).toEqual(source);
  const conditional=colors(); conditional[0].visibleWhen=[[{groupId:'other',optionId:'yes'}]];
  expect(normalizeImportedBrandColorIdentities(conditional,'6ye')).toEqual(conditional);
});

function fixture(): CustomizationGroup[] {
  return [{id:'upgraded-flight-case-add-on',label:'Upgraded Flight Case Add On',display:'cards',options:[
    {id:'none',label:'No add-on',priceDelta:0},
    {id:'flight-case-doll-weight-40kg',label:'Flight Case (Doll Weight &lt; 40kg)',priceDelta:699},
    {id:'flight-case-doll-weight-40kg',label:'Flight Case (Doll Weight ≥ 40kg)',priceDelta:899}
  ]}];
}

test('case sizes receive distinct stable IDs without changing commerce data', () => {
  const source=fixture(); const before=structuredClone(source);
  const fixed=normalizeImportedCaseIdentities(source);
  expect(fixed[0].options.map(x=>x.id)).toEqual(['none','flight-case-under-40kg','flight-case-40kg-and-over']);
  expect(fixed[0].options.map(({id,...rest})=>rest)).toEqual(source[0].options.map(({id,...rest})=>rest));
  expect(source).toEqual(before);
  expect(normalizeImportedCaseIdentities(fixed)).toEqual(fixed);
});

test('conditional references and unknown collisions stay untouched for review', () => {
  const source=fixture();
  source.push({id:'dependent',label:'Dependent',display:'cards',options:[],visibleWhen:[[{groupId:source[0].id,optionId:source[0].options[1].id}]]});
  expect(normalizeImportedCaseIdentities(source)).toEqual(source);
  const unknown=fixture(); unknown[0].options[2].label='Unknown case';
  unknown[0].options[1].label='Another unknown case';
  expect(normalizeImportedCaseIdentities(unknown)).toEqual(unknown);
});
