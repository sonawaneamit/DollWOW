import reviewed from '@/data/promotions/se-october-2026-public.json';
import library from '@/data/promotions/se-silicone-head-public.json';
import { catalogOptionAsset } from '@/lib/assets/option-assets.mjs';
import type {Product} from '@/types/product';
import type {BrandCustomizationConfig, CustomizationRule} from '@/types/customization';

export function withSeSiliconeHead(product:Product, config:BrandCustomizationConfig):BrandCustomizationConfig {
  const body = (reviewed.lightweight as Record<string,string>)[product.handle];
  const currentBody = product.title.match(/\b(157|161|163)\s*cm\s*([HFE])-Cup\b/i);
  const material = config.groups.find(g=>g.id==='material');
  const skin = config.groups.find(g=>g.id==='skin-tone');
  if (!body || product.extended.stockStatus!=='custom' || !/^(?:s?tpe)$/i.test(product.extended.material??'')
    || !currentBody || `${currentBody[1]}${currentBody[2].toUpperCase()}`!==body
    || !material?.options.some(o=>o.id==='stpe-free') || !skin?.options.some(o=>o.id==='light-tan'&&o.priceDelta===0)
    || config.groups.some(g=>g.id==='silicone-head-upgrade')) return config;
  const group = {
    id:'silicone-head-upgrade', label:'Silicone Head Upgrade', required:true,
    selectionMode:'single' as const, display:'swatches' as const,
    description:'Replace the original head with your choice of silicone head. Available with an STPE body in Light Tan only. Select STPE under Material and Light Tan under Skin Tone.',
    options:[
      {id:'keep-original-head',label:'Keep the original head',priceDelta:0,priceVerified:true,purchasable:true},
      ...library.heads.map(head=>({id:`silicone-${head.id}`,label:`${head.label} (${head.ros?'ROS':'Non-ROS'})`,
        priceDelta:100,priceVerified:true,purchasable:true,factoryExists:true,dollVueEnabled:false,
        swatch:{kind:'image' as const,value:catalogOptionAsset('s',head.imagePath),label:head.label}}))
    ]
  };
  const restrictions = [
    ...material.options.filter(o=>o.id!=='stpe-free').map(o=>({groupId:material.id,optionId:o.id,message:'Select STPE under Material for a silicone head upgrade.'})),
    ...skin.options.filter(o=>o.id!=='light-tan').map(o=>({groupId:skin.id,optionId:o.id,message:'Silicone head upgrades are currently available in Light Tan only.'})),
    ...config.groups.filter(g=>g.id==='choose-head').flatMap(g=>g.options.filter(o=>o.id!=='factory-default').map(o=>({groupId:g.id,optionId:o.id,message:'Keep the original head selection when choosing a replacement silicone head below.'}))),
    ...config.groups.filter(g=>g.id==='enhanced-mouth-add-on').flatMap(g=>g.options.filter(o=>(o.priceDelta??0)>0).map(o=>({groupId:g.id,optionId:o.id,message:'The TPE mouth upgrade cannot be combined with a replacement silicone head.'})))
  ];
  const rules:CustomizationRule[] = group.options.slice(1).flatMap(head=>restrictions.map(choice=>({
    id:`se-silicone-${head.id}-${choice.groupId}-${choice.optionId}`, type:'incompatible' as const,
    when:{groupId:group.id,optionId:head.id}, conflictsWith:{groupId:choice.groupId,optionId:choice.optionId},message:choice.message
  })));
  const groups = [...config.groups];
  groups.splice(groups.findIndex(g=>g.id===skin.id)+1,0,group);
  return {...config,groups,rules:[...config.rules,...rules]};
}
