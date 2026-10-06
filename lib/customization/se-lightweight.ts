import reviewed from '@/data/promotions/se-october-2026-public.json';
import type {Product} from '@/types/product';
import type {BrandCustomizationConfig} from '@/types/customization';

export function withSeLightweight(product: Product, config: BrandCustomizationConfig): BrandCustomizationConfig {
  const body = (reviewed.lightweight as Record<string,string>)[product.handle];
  const material = config.groups.find(g => g.id === 'material');
  const currentBody = product.title.match(/\b(157|161|163)\s*cm\s*([HFE])-Cup\b/i);
  if (!body || product.extended.stockStatus !== 'custom' || !/^(?:s?tpe)$/i.test(product.extended.material ?? '')
    || !currentBody || `${currentBody[1]}${currentBody[2].toUpperCase()}` !== body
    || !material?.options.some(o => o.id === 'stpe-free') || config.groups.some(g => g.id === 'body-weight')) return config;
  return {...config, groups:[...config.groups, {
    id:'body-weight',label:'Body Weight',selectionMode:'single',display:'cards',required:true,
    description:'LSTPE reduces the weight of the STPE body. Select STPE under Material to use this upgrade. The head supplied with your doll is unchanged.',
    options:[
      {id:'standard-body-weight',label:'Standard body weight',priceDelta:0,priceVerified:true,purchasable:true},
      {id:'lstpe-lightweight',label:'LSTPE Lightweight Upgrade',priceDelta:100,priceVerified:true,purchasable:true,factoryExists:true}
    ]
  }],rules:[...config.rules,...material.options.filter(o=>o.id!=='stpe-free').map(o=>({
    id:`lstpe-requires-stpe-${o.id}`,type:'incompatible' as const,
    when:{groupId:'body-weight',optionId:'lstpe-lightweight'},conflictsWith:{groupId:'material',optionId:o.id},
    message:'Select STPE under Material to use the LSTPE lightweight upgrade.'
  }))]};
}
