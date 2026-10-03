import {expect, it} from 'vitest';
import {octoberOptionAdjustment, type OctoberProduct} from '@/lib/promotions/october2026';
import type {BrandCustomizationConfig, CustomizationSelections} from '@/types/customization';

const product: OctoberProduct = {handle:'sedoll-lita-b-163cm-c-cup-silicone-companion-doll-1fl7h', title:'SE Doll Lita B 163cm C-Cup Silicone Companion Doll',vendor:'SE Doll',productType:'Custom Silicone doll',tags:['sedoll'],extended:{brand:'SE Doll',material:'Silicone',stockStatus:'custom'}};
const option = {id:'movable-eyelids',label:'Movable Eyelids',priceDelta:89};
const group = {id:'premium-head-body-options-multiple',label:'Premium Head & Body Options (Multiple)',display:'swatches' as const,options:[option]};
const config: BrandCustomizationConfig = {id:'se-source-verified',brandLabel:'SE Doll',leadTimeNote:'',rules:[],groups:[
  {id:'choose-head',label:'Choose a Head',display:'swatches',options:[{id:'factory-default',label:'As shown',priceDelta:0},{id:'choose-014so',label:'#014SO',priceDelta:0},{id:'choose-134sc',label:'#134SC',priceDelta:0},{id:'unknown',label:'#999SO',priceDelta:0}]},
  {id:'head-silicone-type',label:'Head Silicone Type',display:'swatches',options:[{id:'ros-free',label:'ROS (FREE)',priceDelta:0},{id:'hard-silicone',label:'Hard Silicone',priceDelta:0}]},
  {id:'head-silicone-type-2',label:'Head Silicone Type',display:'swatches',options:[{id:'ros-free',label:'ROS (FREE)',priceDelta:0}]},group
]};
const selections = {'head-silicone-type':'ros-free'};
const during = new Date('2026-10-15T12:00:00Z');
function price(s:CustomizationSelections, p=product, c=config, date=during) {return octoberOptionAdjustment(p,group,option,date,{config:c,selections:s});}
it('releases only the exact reviewed primary ROS head eyelid price',()=>{
  expect(price(selections)?.displayDelta).toBe(62.3);
  expect(option.priceDelta).toBe(89);
});
it.each(['no-change','hard-silicone','unknown'])('does not infer ROS from function %s', selected=>{
  expect(price({...selections,'head-silicone-type':selected})).toBeNull();
});
it('does not use the extra head function to qualify the primary eyelids',()=>{
  expect(price({...selections,'head-silicone-type':'hard-silicone','head-silicone-type-2':'ros-free'})).toBeNull();
});
it('does not discount another parent, unavailable option, conditional menu or expired promotion',()=>{
  expect(price(selections,{...product,handle:'unreviewed'})).toBeNull();
  expect(price(selections,product,{...config,groups:config.groups.map(g=>g.id==='head-silicone-type'?{...g,options:g.options.map(o=>({...o,purchasable:false}))}:g)})).toBeNull();
  expect(price(selections,product,{...config,groups:[...config.groups,{...group,id:'conditional',visibleWhen:[[{groupId:'choose-head',optionId:'choose-014so'}]]}]})).toBeNull();
  expect(price(selections,product,config,new Date('2026-11-01T08:00:00Z'))).toBeNull();
});
