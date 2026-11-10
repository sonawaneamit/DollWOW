import {describe,it,expect} from 'vitest';
import fixture from './fixtures/fanreal-mirella-release-nov10.json';
import release from '@/lib/customization/evidence/fanreal-release-nov10.json';
import {selectFanrealTemplateRecipe} from '@/lib/customization/fanreal-template';
import {getCustomizationConfig} from '@/lib/customization/configs';
import {templateConfigurationPresets} from '@/lib/customization/template-presets';
import {getDefaultSelections} from '@/lib/customization/resolve';
import type {Product} from '@/types/product';
const product=fixture as unknown as Product;
describe('exact Fanreal release identities',()=>{
 it('loads the actual Storefront plus Admin-enriched reviewed product representation',()=>{
  const config=getCustomizationConfig(product);const recipe=selectFanrealTemplateRecipe(release,product,config);expect(recipe).toBeTruthy();
  expect(templateConfigurationPresets(recipe!,config,config,2980,getDefaultSelections(config)).map(p=>p.totalPrice)).toEqual([2980,3229,3379]);
 });
 it.each(['price','variant','currency','availability','head','bodyCode','tag','handle','displayName'])('rejects %s drift instead of borrowing a recipe',field=>{
  const changed=structuredClone(product);
  if(field==='price')changed.variants[0].price.amount='1000';
  if(field==='variant')changed.variants[0].id+='1';
  if(field==='currency')changed.variants[0].price.currencyCode='EUR';
  if(field==='availability')changed.variants[0].availableForSale=false;
  if(field==='head')changed.extended.headModel='Other';
  if(field==='bodyCode')changed.extended.bodyCode='Unknown';
  if(field==='tag')changed.tags.push('options:unreviewed-other');
  if(field==='handle')changed.handle+='-other';
  if(field==='displayName')changed.extended.displayName='Other Real Skin';
  expect(selectFanrealTemplateRecipe(release,changed,getCustomizationConfig(changed))).toBeNull();
 });
 it('leaves unknown Fanreal parents deferred and rejects a changed release payload',()=>{
  expect(selectFanrealTemplateRecipe(release,{...product,id:'gid://shopify/Product/999'},getCustomizationConfig(product))).toBeUndefined();
  expect(selectFanrealTemplateRecipe({...release,payload:null},product,getCustomizationConfig(product))).toBeNull();
  const changed=structuredClone(release);changed.payload.entries[0].recipe.tiers[0].description='Changed';
  expect(selectFanrealTemplateRecipe(changed,product,getCustomizationConfig(product))).toBeNull();
 });
});
