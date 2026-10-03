import {expect,it} from 'vitest';
import {sampleProducts} from '@/lib/data/sample-products';
import {withSeSiliconeHead} from '@/lib/customization/se-silicone-head';
import {getDefaultSelections,resolveCustomization} from '@/lib/customization/resolve';
import library from '@/data/promotions/se-silicone-head-library.json';
import type {BrandCustomizationConfig} from '@/types/customization';

const product={...sampleProducts[0],handle:'sedoll-akina-157cm-h-cup-tpe-companion-doll-z7mv2',title:'SE Doll Akina 157cm H-Cup TPE Companion Doll',vendor:'SE Doll',productType:'Custom TPE doll',tags:['sedoll'],extended:{brand:'SE Doll',material:'TPE',stockStatus:'custom' as const}};
const base:BrandCustomizationConfig={id:'se-source-verified',brandLabel:'SE Doll',leadTimeNote:'',rules:[],groups:[
  {id:'material',label:'Material',display:'cards',options:[{id:'regular-tpe-default',label:'Regular TPE (Default)',priceDelta:0},{id:'stpe-free',label:'STPE',priceDelta:100}]},
  {id:'skin-tone',label:'Skin Tone',display:'swatches',options:[{id:'natural',label:'Natural',priceDelta:0},{id:'light-tan',label:'Light Tan',priceDelta:0}]},
  {id:'choose-head',label:'Choose a Head',display:'swatches',options:[{id:'factory-default',label:'As shown',priceDelta:0},{id:'choose-10',label:'#10',priceDelta:0}]},
  {id:'enhanced-mouth-add-on',label:'Enhanced Mouth Add-On',display:'swatches',options:[{id:'textured',label:'Textured',priceDelta:0},{id:'with-tongue-free',label:'With Tongue',priceDelta:49}]}
]};
it('keeps the original head by default and offers each distinct supplier choice at 100',()=>{
 const c=withSeSiliconeHead(product,base);
 expect(getDefaultSelections(c)['silicone-head-upgrade']).toBe('keep-original-head');
 expect(resolveCustomization(c,getDefaultSelections(c),1000).optionPriceDelta).toBe(0);
 const options=c.groups.find(g=>g.id==='silicone-head-upgrade')!.options.slice(1);
 expect(options.length).toBe(library.heads.length);
 expect(new Set(options.map(o=>o.id)).size).toBe(options.length);
 expect(options.every(o=>o.priceDelta===100&&o.swatch?.kind==='image')).toBe(true);
});
it('requires STPE and Light Tan for every head and preserves its exact face in attributes',()=>{
 const c=withSeSiliconeHead(product,base);
 for(const head of library.heads){
  const s={...getDefaultSelections(c),material:'stpe-free','skin-tone':'light-tan','silicone-head-upgrade':`silicone-${head.id}`};
  const resolved=resolveCustomization(c,s,1000);
  expect(resolved.issues,head.id).toEqual([]);
  expect(resolved.optionPriceDelta).toBe(200);
  expect(resolved.cartAttributes.some(a=>a.value.includes(head.label))).toBe(true);
  expect(resolveCustomization(c,{...s,material:'regular-tpe-default'},1000).issues.length).toBeGreaterThan(0);
  expect(resolveCustomization(c,{...s,'skin-tone':'natural'},1000).issues.length).toBeGreaterThan(0);
 }
});
it('rejects simultaneous original-head switches and TPE mouth upgrades',()=>{
 const c=withSeSiliconeHead(product,base);
 const s={...getDefaultSelections(c),material:'stpe-free','skin-tone':'light-tan','silicone-head-upgrade':'silicone-144so'};
 expect(resolveCustomization(c,{...s,'choose-head':'choose-10'},1000).issues.length).toBeGreaterThan(0);
 expect(resolveCustomization(c,{...s,'enhanced-mouth-add-on':'with-tongue-free'},1000).issues.length).toBeGreaterThan(0);
});
it('does not add an upgrade to RTS, unrelated bodies, unknown parents or changed menus',()=>{
 for(const p of [{...product,handle:'unknown'},{...product,title:'SE Doll 165cm H-Cup TPE Doll'},{...product,extended:{...product.extended,stockStatus:'ready_to_ship' as const}}])expect(withSeSiliconeHead(p,base)).toBe(base);
 const withoutSkin={...base,groups:base.groups.filter(g=>g.id!=='skin-tone')};
 expect(withSeSiliconeHead(product,withoutSkin)).toBe(withoutSkin);
 const c=withSeSiliconeHead(product,base);expect(withSeSiliconeHead(product,c)).toBe(c);
});
