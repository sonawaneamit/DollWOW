import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import {sampleProducts} from '@/lib/data/sample-products';
import {getCustomizationConfig,getFactoryCustomizationConfig} from '@/lib/customization/configs';
import {getDefaultSelections,resolveCustomization,selectionIds} from '@/lib/customization/resolve';
import {templateConfigurationPresets} from '@/lib/customization/template-presets';
import {templateConfigSignature} from '@/lib/customization/template-config-signature';
import type {Product} from '@/types/product';
import type {CustomizationGroup} from '@/types/customization';

const included:CustomizationGroup={id:'included-construction',label:'Included construction',required:true,selectionMode:'multiple',display:'cards',options:['head','evo','gel','feet'].map(id=>({id,label:id,priceDelta:0,sourceProductionNoteSignals:{defaultSupplierSelection:true}}))};
const optional:CustomizationGroup={id:'body-functions',label:'Body functions',selectionMode:'multiple',display:'cards',options:[{id:'none',label:'No added functions',priceDelta:0},{id:'soft-thigh',label:'Soft thighs',priceDelta:35},{id:'body-heating',label:'Body heating',priceDelta:90}]};
const product=(groups:CustomizationGroup[]):Product=>({...sampleProducts[0],handle:'dolls-castle-regression',vendor:'Dolls Castle',tags:['dolls-castle'],extended:{...sampleProducts[0].extended,brand:'Dolls Castle',customizationGroups:groups}});
describe('Castle fixed included construction',()=>{
 for(const purpose of ['checkout','factory'] as const)it(`defaults and reset preserve every fixed choice: ${purpose}`,()=>{
  const cfg=(purpose==='checkout'?getCustomizationConfig:getFactoryCustomizationConfig)(product([included,optional])),defaults=getDefaultSelections(cfg);
  expect(cfg.id).toBe('dolls-castle-source-verified');
  for(const option of included.options){const id=`included-construction-${option.id}`;expect(defaults[id]).toBe(option.id);expect(cfg.groups.find(g=>g.id===id)?.required).toBe(true);}
  const empty=Object.fromEntries(Object.keys(defaults).map(id=>[id,[]]));
  const reset=resolveCustomization(cfg,empty,2099);
  expect(reset.issues).toEqual([]);expect(reset.totalPrice).toBe(2099);
  expect(reset.selectedOptions.filter(o=>o.groupId.startsWith('included-construction-')).map(o=>o.optionId)).toEqual(included.options.map(o=>o.id));
  expect(cfg.groups.find(g=>g.id==='body-functions')?.options.map(o=>[o.id,o.label,o.priceDelta])).toEqual(optional.options.map(o=>[o.id,o.label,o.priceDelta]));
 });
 it('does not lock paid choices, unmarked choices or optional groups',()=>{
  for(const changed of [{...included,required:false},{...included,options:included.options.map((o,i)=>i?o:{...o,priceDelta:1})},{...included,options:included.options.map((o,i)=>i?o:{...o,sourceProductionNoteSignals:undefined})}]){
   const cfg=getCustomizationConfig(product([changed,optional]));expect(cfg.groups.find(g=>g.id==='included-construction')?.selectionMode).toBe('multiple');
  }
 });
 it('does not affect another brand',()=>{
  const p=product([included,optional]);p.vendor='Climax Doll';p.extended.brand='Climax Doll';p.tags=['climax'];p.handle='climax-regression';
  expect(getCustomizationConfig(p).groups.some(g=>g.id==='included-construction')).toBe(true);
 });
});

// Parent can run the same production engine against the exact private intake packet.
const packet=process.env.CASTLE_DRAFT_PACKET;
describe.skipIf(!packet)('Castle exact intake packet',()=>{
 const drafts=packet?JSON.parse(readFileSync(packet,'utf8')).drafts:[];
 for(const draft of drafts)it(`${draft.product.handle}: fixed choices and exact alternative prices`,()=>{
  const p=draft.product as Product,cfg=getCustomizationConfig(p),defaults=getDefaultSelections(cfg);
  const fixed=p.extended.customizationGroups!.find(g=>g.id==='included-construction')!.options;
  const initial=resolveCustomization(cfg,defaults,Number(p.variants[0].price.amount));
  expect(initial.issues).toEqual([]);
  expect(initial.selectedOptions.filter(o=>o.groupId.startsWith('included-construction-')).map(o=>o.optionId)).toEqual(fixed.map(o=>o.id));
  for(const raw of p.extended.customizationGroups!.filter(g=>g.id!=='included-construction'))expect(cfg.groups.find(g=>g.id===raw.id)?.options.map(o=>[o.id,o.label,o.priceDelta])).toEqual(raw.options.map(o=>[o.id,o.label,o.priceDelta]));
  if(p.extended.heightCm===160){expect(draft.templateRecipe).toBeUndefined();return;}
  const current={...defaults,'skin-color':'tan','body-functions':cfg.groups.find(g=>g.id==='body-functions')!.options.filter(o=>o.id!=='none').map(o=>o.id)};
  const tiers=templateConfigurationPresets({...draft.templateRecipe,signature:templateConfigSignature(cfg)},cfg,cfg,2099,current);
  expect(tiers.map(t=>t.totalPrice)).toEqual([2099,2134,2189]);
  expect(tiers.map(t=>selectionIds(t.selections['body-functions']))).toEqual([['none'],['soft-thigh'],['body-heating']]);
  for(const t of tiers){expect(t.selections['skin-color']).toBe('tan');expect(resolveCustomization(cfg,t.selections,2099).issues).toEqual([]);expect(t.highlights.length).toBeGreaterThanOrEqual(fixed.length);}
 });
});
