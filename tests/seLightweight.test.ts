import {expect,it} from 'vitest';
import {sampleProducts} from '@/lib/data/sample-products';
import {withSeLightweight} from '@/lib/customization/se-lightweight';
import {getDefaultSelections,resolveCustomization} from '@/lib/customization/resolve';
import {promotionPricingForSelections} from '@/lib/promotions/optionPricing';
import type {BrandCustomizationConfig} from '@/types/customization';
const product={...sampleProducts[0],handle:'sedoll-akina-157cm-h-cup-tpe-companion-doll-z7mv2',title:'SE Doll Akina 157cm H-Cup TPE Companion Doll',vendor:'SE Doll',productType:'Custom TPE doll',tags:['sedoll'],extended:{brand:'SE Doll',material:'TPE',stockStatus:'custom' as const}};
const base:BrandCustomizationConfig={id:'se-source-verified',brandLabel:'SE Doll',leadTimeNote:'',rules:[],groups:[{id:'material',label:'Material',display:'cards',selectionMode:'single',options:[{id:'regular-tpe-default',label:'Regular TPE (Default)',priceDelta:0},{id:'stpe-free',label:'STPE',priceDelta:100}]}]};
it('preserves defaults and requires STPE when lightweight is chosen',()=>{
 const config=withSeLightweight(product,base);
 expect(getDefaultSelections(config)['body-weight']).toBe('standard-body-weight');
 expect(resolveCustomization(config,{'body-weight':'lstpe-lightweight',material:'regular-tpe-default'},1000).issues.length).toBeGreaterThan(0);
 expect(resolveCustomization(config,{'body-weight':'lstpe-lightweight',material:'stpe-free'},1000).issues).toEqual([]);
});
it('charges 90 during October and restores separate STPE 100 plus lightweight 100 afterward',()=>{
 const config=withSeLightweight(product,base);
 const selections={material:'stpe-free','body-weight':'lstpe-lightweight'};
 for(const [date,amount]of [['2026-10-15T12:00:00Z',90],['2026-11-01T08:00:00Z',200]] as const){
  const priced=promotionPricingForSelections(product,config,selections,new Date(date)).config;
  expect(resolveCustomization(priced,selections,1000).optionPriceDelta).toBe(amount);
 }
});
it('does not add lightweight to RTS, different bodies, hybrids or unreviewed handles',()=>{
 for(const p of [{...product,handle:'unreviewed'}, {...product,title:'SE Doll 165cm H-Cup TPE Doll'}, {...product,extended:{...product.extended,material:'Hybrid'}}, {...product,extended:{...product.extended,stockStatus:'ready_to_ship' as const}}])expect(withSeLightweight(p,base)).toBe(base);
});
it('does not duplicate the group when configuration is applied again',()=>{
 const once=withSeLightweight(product,base);expect(withSeLightweight(product,once)).toBe(once);
});
