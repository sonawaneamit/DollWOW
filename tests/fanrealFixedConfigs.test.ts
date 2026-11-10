import {describe,it,expect} from 'vitest';
import {getCustomizationConfig} from '@/lib/customization/configs';
import {getDefaultSelections,resolveCustomization} from '@/lib/customization/resolve';
import {sampleProducts} from '@/lib/data/sample-products';
const diana={...sampleProducts[0],id:'gid://shopify/Product/10705045455032',handle:'fanreal-diana-t110j-j-cup-real-skin-silicone-torso-companion-doll',title:'Fanreal Diana Real Skin torso',vendor:'Fanreal',tags:['fanreal','torso'],extended:{...sampleProducts[0].extended,brand:'Fanreal',bodyType:'female' as const,customAvailable:true,customizationGroups:[{id:'head-type',label:'Head',display:'cards' as const,required:true,options:[{id:'as-shown',label:'Diana ROS (as shown)',priceDelta:0}]},{id:'skin-tone',label:'Skin tone',display:'cards' as const,required:true,options:[{id:'as-shown',label:'Tan (as shown)',priceDelta:0}]}]}};
describe('exact Fanreal fixed torso configurations',()=>{
 it('preserves included tan finish without generic paid skin or care upsells',()=>{
  const config=getCustomizationConfig(diana);expect(config.id).toBe('fanreal-fixed-torso-v1');expect(config.groups.flatMap(g=>g.options).every(o=>o.priceDelta===0)).toBe(true);
  const result=resolveCustomization(config,getDefaultSelections(config),2358);expect(result.issues).toEqual([]);expect(result.totalPrice).toBe(2358);expect(JSON.stringify(config)).not.toMatch(/Deep|45|65|care-kit/);
 });
 it('keeps the exact warehouse torso fixed instead of borrowing a generic customizer',()=>{
  const product={...diana,id:'gid://shopify/Product/10564112318648',handle:'fanreal-maria-t109f-f-cup-silicone-ready-to-ship-companion-doll',extended:{...diana.extended,customAvailable:false,stockStatus:'ready_to_ship' as const,customizationGroups:[]}};
  expect(getCustomizationConfig(product).groups).toEqual([]);
 });
 it('rejects changed paid options on the fixed source instead of silently enabling them',()=>{
  const changed=structuredClone(diana);changed.extended.customizationGroups[1].options[0].priceDelta=45;expect(()=>getCustomizationConfig(changed)).toThrow('needs review');
 });
});
