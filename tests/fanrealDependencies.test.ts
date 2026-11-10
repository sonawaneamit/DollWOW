import {describe,it,expect} from 'vitest';
import {createFanrealDependencyPlanner,fanrealDependencyMenuHash} from '@/lib/cart/fanreal-dependencies';
import {getDefaultSelections,resolveCustomization} from '@/lib/customization/resolve';
import {exactUpgradeLines} from '@/lib/cart/exact-upgrade-lines';
import type {BrandCustomizationConfig} from '@/types/customization';
import type {Product} from '@/types/product';
const product={id:'gid://shopify/Product/123'} as Product;
const config:BrandCustomizationConfig={id:'imported',brandLabel:'Fanreal',leadTimeNote:'Factory order',rules:[],groups:[
 {id:'hair-options',label:'Hair Options',selectionMode:'single',required:true,display:'cards',options:[{id:'wig-cover',label:'Wig cover',priceDelta:0,priceVerified:true},{id:'hair-transplant-human',label:'Hair transplant (Human hair)',priceDelta:399,priceVerified:true}]},
 {id:'wig',label:'Wig Style',selectionMode:'single',required:true,display:'cards',visibleWhen:[[{groupId:'hair-options',optionId:'wig-cover'}]],options:[{id:'as-shown',label:'As shown',priceDelta:0,priceVerified:true}]},
 {id:'human-hair',label:'Human Hair Implant Style',selectionMode:'single',required:true,display:'cards',visibleWhen:[[{groupId:'hair-options',optionId:'hair-transplant-human'}]],options:[{id:'h02',label:'H02',priceDelta:0,priceVerified:true}]},
 {id:'skin',label:'Skin',selectionMode:'single',required:true,display:'cards',options:[{id:'tan',label:'Tan',priceDelta:0,priceVerified:true}]}
]};
const planner=createFanrealDependencyPlanner({[product.id]:fanrealDependencyMenuHash(config)});
describe('Fanreal paid hair dependency ownership',()=>{
 it('keeps skin on the doll and places the selected implanted style on the exact paid line',()=>{
  const resolved=resolveCustomization(config,{'hair-options':'hair-transplant-human','human-hair':'h02',skin:'tan'},2780);
  expect(resolved.issues).toEqual([]);const plan=planner(product,config,resolved.selectedOptions,2)!;
  expect(plan.included.map(o=>o.groupId)).toEqual(['skin']);expect(plan.items[0].amount).toBe(798);
  const [line]=exactUpgradeLines({parentVariantId:'gid://shopify/ProductVariant/1',parentLineId:'gid://shopify/CartLine/test',quantity:2,charge:{amount:798,currencyCode:'USD',items:plan.items},bindings:[{parentVariantId:'gid://shopify/ProductVariant/1',group:'Hair Options',label:'Hair transplant (Human hair)',unitAmount:399,currencyCode:'USD',merchandiseId:'gid://shopify/ProductVariant/2',productTitle:'Fanreal human hair'}],verifiedVariants:[{id:'gid://shopify/ProductVariant/2',productTitle:'Fanreal human hair',amount:399,currencyCode:'USD',availableForSale:true,requiresShipping:false}]});
  expect(line.attributes).toContainEqual({key:'Included: Human Hair Implant Style',value:'H02'});expect(line.attributes).not.toContainEqual({key:'Included: Skin',value:'Tan'});
 });
 it('does not charge included wig styling or claim that styling belongs to an absent upgrade',()=>{
  const resolved=resolveCustomization(config,getDefaultSelections(config),2780);const plan=planner(product,config,resolved.selectedOptions,1)!;
  expect(plan.items).toEqual([]);expect(plan.included.some(o=>o.groupId==='wig')).toBe(true);
 });
 it('rejects menu drift and leaves every unreviewed parent on its existing path',()=>{
  expect(planner({...product,id:'gid://shopify/Product/999'},config,[],1)).toBeUndefined();
  const changed=structuredClone(config);changed.groups[0].options[1].priceDelta=300;
  expect(()=>planner(product,changed,[],1)).toThrow('fresh checkout review');
 });
 it('does not accept an unexpected paid child under a reviewed hair choice',()=>{
  const resolved=resolveCustomization(config,{'hair-options':'hair-transplant-human','human-hair':'h02',skin:'tan'},2780);
  const poisoned=resolved.selectedOptions.map(o=>o.groupId==='human-hair'?{...o,priceDelta:50}:o);
  expect(()=>planner(product,config,poisoned,1)).toThrow('exact checkout mapping');
 });
});

import {templateConfigurationPresets} from '@/lib/customization/template-presets';
import {templateConfigSignature} from '@/lib/customization/template-config-signature';
it('renders all three hair tiers when each tier reveals a different style branch, preserving independent choices',()=>{
 const menu=structuredClone(config);menu.groups[0].options.splice(1,0,{id:'wig-transplant-ht-fiber',label:'Synthetic hair',priceDelta:249,priceVerified:true});
 menu.groups.push({id:'high-temperature-fiber',label:'Synthetic Hair Style',selectionMode:'single',required:true,display:'cards',visibleWhen:[[{groupId:'hair-options',optionId:'wig-transplant-ht-fiber'}]],options:[{id:'s01',label:'S01',priceDelta:0,priceVerified:true}]});
 menu.groups.push({id:'choose-head',label:'Head',selectionMode:'single',required:true,display:'cards',options:[{id:'a',label:'A',priceDelta:0,priceVerified:true},{id:'b',label:'B',priceDelta:0,priceVerified:true}]});
 const definition={tag:'options:fanreal-test',signature:templateConfigSignature(menu),tiers:[
  {id:'starter' as const,description:'Wig',add:[{groupId:'hair-options',optionId:'wig-cover'}],remove:[]},
  {id:'enthusiast' as const,description:'Synthetic',add:[{groupId:'hair-options',optionId:'wig-transplant-ht-fiber'}],remove:[]},
  {id:'collector' as const,description:'Human',add:[{groupId:'hair-options',optionId:'hair-transplant-human'}],remove:[]}
 ]};
 const presets=templateConfigurationPresets(definition,menu,menu,2780,{'choose-head':'b',skin:'tan','hair-options':'hair-transplant-human','human-hair':'h02'});
 expect(presets.map(p=>p.totalPrice)).toEqual([2780,3029,3179]);
 for(const preset of presets){expect(preset.selections['choose-head']).toBe('b');expect(preset.selections.skin).toBe('tan');}
 expect(presets[0].selections).not.toHaveProperty('human-hair');expect(presets[0].selections).not.toHaveProperty('high-temperature-fiber');
 expect(presets[1].selections['high-temperature-fiber']).toBe('s01');expect(presets[1].selections).not.toHaveProperty('human-hair');
 expect(presets[2].selections['human-hair']).toBe('h02');expect(presets[2].selections).not.toHaveProperty('high-temperature-fiber');
 expect(templateConfigurationPresets(definition,menu,menu,2780,{'choose-head':'b',skin:'tan','hair-options':'wig-cover','high-temperature-fiber':''})).toEqual([]);
});
