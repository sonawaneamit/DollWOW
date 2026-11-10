import { describe, expect, it } from 'vitest';
import type { BrandCustomizationConfig } from '../types/customization';
import { templateConfigSignature } from '../lib/customization/template-config-signature';
import { templateConfigurationPresets, type TemplatePresetDefinition } from '../lib/customization/template-presets';

function fixture() {
  const config: BrandCustomizationConfig = {
    id:'conditional-preset-regression',brandLabel:'Reviewed brand',leadTimeNote:'',rules:[],
    groups:[
      {id:'head',label:'Head',required:true,display:'cards',options:[{id:'a',label:'A',priceDelta:0,priceVerified:true},{id:'b',label:'B',priceDelta:0,priceVerified:true}]},
      {id:'head-type',label:'Head type',required:true,display:'cards',visibleWhen:[[{groupId:'head',optionId:'b'}]],options:[{id:'hard',label:'Hard',priceDelta:0,priceVerified:true},{id:'ros',label:'ROS',priceDelta:100,priceVerified:true}]},
      {id:'hairstyle',label:'Hairstyle',display:'cards',options:[{id:'shown',label:'As shown',priceDelta:0,priceVerified:true},{id:'chosen',label:'Chosen look',priceDelta:0,priceVerified:true}]},
      {id:'features',label:'Features',display:'cards',selectionMode:'multiple',options:[{id:'included',label:'Included hands',priceDelta:0,priceVerified:true},{id:'soft',label:'Softer construction',priceDelta:100,priceVerified:true}]},
      {id:'hair-finish',label:'Hair finish',display:'cards',options:[{id:'wig',label:'Wig',priceDelta:0,priceVerified:true},{id:'implanted',label:'Implanted hair',priceDelta:95,priceVerified:true}]}
    ]
  };
  const definition: TemplatePresetDefinition = {tag:'options:reviewed-standard-v1',signature:templateConfigSignature(config),tiers:[
    {id:'starter',description:'Included',add:[{groupId:'features',optionId:'included'}],remove:[]},
    {id:'enthusiast',description:'Softer',add:[{groupId:'features',optionId:'soft'}],remove:[]},
    {id:'collector',description:'Implanted',add:[{groupId:'hair-finish',optionId:'implanted'}],remove:[]}
  ]};
  return {config,definition};
}

describe('preset defaults when a parent reveals a conditional branch',()=>{
  it('keeps all tiers and the chosen look when the newly visible default was absent',()=>{
    const {config,definition}=fixture();
    const presets=templateConfigurationPresets(definition,config,config,1000,{head:'b',hairstyle:'chosen'});
    expect(presets.map(p=>p.totalPrice)).toEqual([1000,1100,1195]);
    for(const p of presets){expect(p.selections.head).toBe('b');expect(p.selections.hairstyle).toBe('chosen');expect(p.selections['head-type']).toBe('hard');}
  });
  it('preserves a separately selected paid branch choice',()=>{
    const {config,definition}=fixture();
    expect(templateConfigurationPresets(definition,config,config,1000,{head:'b','head-type':'ros'}).map(p=>p.totalPrice)).toEqual([1100,1200,1295]);
  });
  it('does not replace an explicit empty required choice',()=>{
    const {config,definition}=fixture();
    expect(templateConfigurationPresets(definition,config,config,1000,{head:'b','head-type':''})).toEqual([]);
  });
  it('drops a hidden stale upgrade and its price after changing the parent',()=>{
    const {config,definition}=fixture();
    const presets=templateConfigurationPresets(definition,config,config,1000,{head:'a','head-type':'ros'});
    expect(presets.map(p=>p.totalPrice)).toEqual([1000,1100,1195]);
    expect(presets.every(p=>!Object.hasOwn(p.selections,'head-type'))).toBe(true);
  });
  it('still rejects an unverified choice in a visible branch',()=>{
    const {config,definition}=fixture();config.groups[1].options[1].priceVerified=false;
    definition.signature=templateConfigSignature(config);
    expect(templateConfigurationPresets(definition,config,config,1000,{head:'b','head-type':'ros'})).toEqual([]);
  });
});
