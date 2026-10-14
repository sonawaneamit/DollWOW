import {describe,it,expect} from 'vitest';
import {sampleProducts} from '@/lib/data/sample-products';
import {getCustomizationConfig} from '@/lib/customization/configs';
import {getDefaultSelections,resolveCustomization} from '@/lib/customization/resolve';
describe('reviewed Climax ULW885 fixed torso menu',()=>{
 for(const withHead of [false,true])it(`preserves included choices, head=${withHead}`,()=>{
  const groups=[{id:'skin-tone',label:'Skin tone',display:'compact' as const,selectionMode:'single' as const,required:true,options:[{id:'natural',label:'Natural',priceDelta:0,defaultSelected:true}]},
   ...(withHead?[{id:'included-head',label:'Included head',display:'compact' as const,selectionMode:'single' as const,required:true,options:[{id:'renata',label:'Renata head',priceDelta:0,defaultSelected:true}]}]:[])];
  const product={...sampleProducts[0],handle:`climax-renata-${withHead?'with-head':'headless'}`,vendor:'Climax Doll',tags:['climax','torso','options:climax-ulw885-torso-v1'],extended:{...sampleProducts[0].extended,brand:'Climax Doll',customizationGroups:groups}};
  const config=getCustomizationConfig(product);
  expect(config.id).toBe('climax-ulw885-torso-v1');
  expect(config.groups.map(g=>g.id)).toEqual(groups.map(g=>g.id));
  const resolved=resolveCustomization(config,getDefaultSelections(config),withHead?1175:1058);
  expect(resolved.issues).toEqual([]);
  expect(resolved.totalPrice).toBe(withHead?1175:1058);
 });
});
