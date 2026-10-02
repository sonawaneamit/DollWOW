import {describe,expect,it} from 'vitest';
import release from '@/lib/cart/evidence/named-upgrades-release.json';
import fixture from './fixtures/ivyTorsoMenu.json';
import charges from './fixtures/ivyNamedCharges.json';
import {exactUpgradeLines} from '@/lib/cart/exact-upgrade-lines';
import {formatHeightDual} from '@/lib/catalog/productSpecs';
import {sampleProducts} from '@/lib/data/sample-products';
import {getCustomizationConfig} from '@/lib/customization/configs';
import {getDefaultSelections,resolveCustomization} from '@/lib/customization/resolve';
import type {CustomizationGroup} from '@/types/customization';
import type {Product} from '@/types/product';

const ivy:Product={...sampleProducts[0],id:fixture.productId,
 handle:'erovenus-ivy-112-5cm-d-cup-max-series-silicone-torso',
 title:'Erovenus Ivy 112.5cm D-Cup Max Series Silicone Torso',vendor:'Erovenus',productType:'Adult torso',tags:[fixture.templateTag,'torso','erovenus'],
 extended:{brand:'Erovenus',displayName:'Ivy',material:'Silicone',headModel:'H6B',customizationGroups:fixture.groups as CustomizationGroup[]}};
const config=getCustomizationConfig(ivy);
describe('Ivy reuses source-confirmed Erovenus torso choices',()=>{
 it('has all reviewed charges connected to the release registry',()=>{
  const registry=release as {payload:{parents:Record<string,string>;groups:Record<string,unknown[]>}};
  const key=registry.payload.parents[charges.parentVariantId];
  expect(registry.payload.groups[key]).toEqual(charges.bindings.map(({status,...binding})=>binding));
 });
 it('does not round the factory measurement to 113cm',()=>expect(formatHeightDual(112.5)).toBe('3 ft 8 in / 112.5 cm'));
 it('keeps the photographed primary head and five meaningful groups',()=>{
  expect(config.groups).toHaveLength(5);
  expect(config.groups.some(g=>g.id==='choose-head')).toBe(false);
  expect(config.groups.find(g=>g.id==='add-extra-head')?.selectionMode).toBe('single');
 });
 it('has unique IDs and no invented unknown price',()=>{
  for(const g of config.groups){expect(new Set(g.options.map(o=>o.id)).size).toBe(g.options.length);for(const o of g.options){expect(o.priceDelta).toBeGreaterThanOrEqual(0);expect(o.priceVerified).toBe(true);}}
 });
 it('defaults to zero paid extras',()=>{
  const r=resolveCustomization(config,getDefaultSelections(config),1659);
  expect(r.totalPrice).toBe(1659);expect(r.issues).toEqual([]);expect(r.requiresPriceConfirmation).toBe(false);
  expect(r.selections['premium-head-body-options-multiple']).toHaveLength(3);
  expect(r.selections.accessories).toHaveLength(2);
 });
 for(const group of config.groups){for(const option of group.options.filter(o=>(o.priceDelta??0)>0)){
  it(`prices ${group.id}/${option.id} exactly`,()=>{
   const r=resolveCustomization(config,{...getDefaultSelections(config),[group.id]:group.selectionMode==='multiple'?[option.id]:option.id},1659);
   expect(r.optionPriceDelta).toBe(option.priceDelta);expect(r.issues).toEqual([]);expect(r.requiresPriceConfirmation).toBe(false);
   expect(r.selectedOptions.some(o=>o.optionLabel===option.label)).toBe(true);
   // Unit verification of the prepared mapping; unpublished charges are not
   // represented as available in a real Shopify checkout.
   const lines=exactUpgradeLines({parentVariantId:charges.parentVariantId,parentLineId:'gid://shopify/CartLine/test',quantity:1,
    charge:{amount:option.priceDelta!,currencyCode:'USD',title:'Ivy',items:[{group:group.label,label:option.label,amount:option.priceDelta!}]},
    bindings:charges.bindings.map(b=>({...b,parentVariantId:charges.parentVariantId})),
    verifiedVariants:charges.bindings.map(b=>({id:b.merchandiseId,productTitle:b.productTitle,amount:b.unitAmount,currencyCode:'USD',availableForSale:true,requiresShipping:false}))});
   expect(lines).toHaveLength(1);
   expect(lines[0].attributes).toContainEqual({key:'Customization',value:`${group.label}: ${option.label}`});
  });
 }}
 it('removing the head also removes its implanted-hair charge',()=>{
  const r=resolveCustomization(config,{'add-extra-head':'none'},1659);
  expect(r.optionPriceDelta).toBe(0);expect(r.selectedOptions.some(o=>o.groupId==='hairstyle')).toBe(false);
 });
 it('keeps 23 named head identities at both source prices',()=>{
  const heads=config.groups.find(g=>g.id==='add-extra-head')!.options;
  expect(heads.filter(o=>o.priceDelta===275)).toHaveLength(23);
  expect(heads.filter(o=>o.priceDelta===425)).toHaveLength(23);
 });
 it('does not alter unrelated Erovenus menus',()=>{
  const other=getCustomizationConfig({...ivy,tags:['erovenus']});
  expect(other.groups.find(g=>g.id==='add-extra-head')?.selectionMode).toBe('multiple');
 });
});
