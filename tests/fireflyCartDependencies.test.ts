import {describe,it,expect} from 'vitest';
import {fireflyDependencyPlan} from '@/lib/cart/firefly-dependencies';
import {exactUpgradeLines} from '@/lib/cart/exact-upgrade-lines';
import {namedUpgradeBuilds} from '@/lib/cart/named-upgrade-builds';
import type {Product} from '@/types/product';
import type {BrandCustomizationConfig,SelectedCustomizationOption} from '@/types/customization';

const product={id:'gid://shopify/Product/10639456305336',handle:'firefly-mary-160cm-max-silicone-companion-doll'} as Product;
const option=(groupId:string,optionId:string,priceDelta=0):SelectedCustomizationOption=>({groupId,optionId,priceDelta,groupLabel:groupId,optionLabel:optionId,priceConfirmed:true});
function fixture(root='hairstyle-hard',choice='implanted-synthetic-hair'){
  const paid=option(root,choice,150),color=option('hair-color','black'),style=option('skin-tone','tan');
  const config:BrandCustomizationConfig={id:'test',brandLabel:'Firefly',leadTimeNote:'',rules:[],groups:[
    {id:root,label:root,display:'compact',options:[]},
    {id:'hair-color',label:'Hair colour',display:'compact',options:[],visibleWhen:[[{groupId:root,optionId:choice}]]}
  ]};
  return {paid,color,style,config,selected:[paid,color,style]};
}

describe('exact Firefly free-detail ownership',()=>{
  it.each([
    ['hairstyle-hard','implanted-synthetic-hair'],
    ['head-type-for-extra-head','hard-silicone-with-movable-jaw-ros'],
    ['head-type-for-extra-head','soft-silicone-with-movable-jaw-ros'],
    ['hairstyle-for-extra-head-hard','implanted-hair']
  ])('attaches free dependent detail to %s/%s', (root,choice)=>{
    const f=fixture(root,choice),plan=fireflyDependencyPlan(product,f.config,f.selected,2)!;
    expect(plan.included).toEqual([f.style]);
    expect(plan.items).toEqual([{group:root,label:choice,amount:300,dependencyDetails:{scope:'firefly-free-details-v1',included:[{key:'Included: hair-color',value:'black'}],configured:[]}}]);
  });
  it('traverses free intermediate groups and ignores inactive OR branches',()=>{
    const f=fixture();const middle=option('middle','selected');
    f.config.groups.push({id:'middle',label:'Middle',display:'compact',options:[],visibleWhen:[[{groupId:f.paid.groupId,optionId:f.paid.optionId}]]});
    f.config.groups[1].visibleWhen=[[{groupId:'middle',optionId:'selected'}],[{groupId:'absent',optionId:'absent'}]];
    const plan=fireflyDependencyPlan(product,f.config,[...f.selected,middle],1)!;
    expect(plan.included).toEqual([f.style]);expect(plan.items[0].dependencyDetails?.included).toHaveLength(2);
  });
  it('removes dependent detail with the actual child line while retaining independent inclusions',()=>{
    const f=fixture(),plan=fireflyDependencyPlan(product,f.config,f.selected,1)!;
    const binding={parentVariantId:'gid://shopify/ProductVariant/1',merchandiseId:'gid://shopify/ProductVariant/2',group:f.paid.groupLabel,label:f.paid.optionLabel,unitAmount:150,currencyCode:'USD',productTitle:'Firefly - Implanted hair'};
    const input={parentVariantId:binding.parentVariantId,parentLineId:'gid://shopify/CartLine/parent',quantity:1,charge:{amount:150,currencyCode:'USD',items:plan.items},bindings:[binding],verifiedVariants:[{id:binding.merchandiseId,amount:150,currencyCode:'USD',productTitle:binding.productTitle,availableForSale:true,requiresShipping:false}]};
    const lines=exactUpgradeLines(input);
    const parent={id:input.parentLineId,quantity:1,parentRelationship:null,attributes:[{key:'_DollWOW_checkout_model',value:'named-upgrades-v1'},{key:'Included: skin-tone',value:'tan'}],merchandise:{id:binding.parentVariantId,product:{title:'Firefly'}}};
    const child={id:'child',quantity:1,parentRelationship:{parent:{id:parent.id}},attributes:lines[0].attributes,merchandise:{id:binding.merchandiseId,product:{title:binding.productTitle}}};
    const before=namedUpgradeBuilds({lines:{nodes:[parent,child],pageInfo:{hasNextPage:false}}},[binding]);
    expect(before[0].upgrades[0].includedChoices).toEqual([{key:'Included: hair-color',value:'black'}]);
    const after=namedUpgradeBuilds({lines:{nodes:[parent],pageInfo:{hasNextPage:false}}},[binding]);
    expect(after[0].upgrades).toEqual([]);expect(after[0].includedChoices).toEqual([{key:'Included: skin-tone',value:'tan'}]);
    const forged=structuredClone(input);forged.charge.items[0].dependencyDetails!.configured.push({key:'Configured: forged',value:'paid'});
    expect(()=>exactUpgradeLines(forged)).toThrow('Invalid dependent');
  });
  it('keeps paid dependent options and unknown roots blocked',()=>{
    const f=fixture();f.color.priceDelta=50;
    expect(()=>fireflyDependencyPlan(product,f.config,f.selected,1)).toThrow('verified exact-price');
    const unknown=fixture('unknown','paid');
    expect(()=>fireflyDependencyPlan(product,unknown.config,unknown.selected,1)).toThrow('verified exact-price');
  });
  it('rejects cyclic conditions and multiple paid owners',()=>{
    const f=fixture();f.config.groups[0].visibleWhen=[[{groupId:'hair-color',optionId:'black'}]];
    expect(()=>fireflyDependencyPlan(product,f.config,f.selected,1)).toThrow('Cyclic');
    const other=fixture();const second=option('hairstyle-for-extra-head-hard','implanted-hair',150);
    other.config.groups.push({id:second.groupId,label:'Extra',display:'compact',options:[]});
    other.config.groups[1].visibleWhen![0].push({groupId:second.groupId,optionId:second.optionId});
    expect(()=>fireflyDependencyPlan(product,other.config,[...other.selected,second],1)).toThrow('verified exact-price');
  });
  it('does not opt in another product ID or handle',()=>{
    const f=fixture();
    expect(fireflyDependencyPlan({...product,id:'gid://shopify/Product/1'},f.config,f.selected,1)).toBeUndefined();
    expect(fireflyDependencyPlan({...product,handle:'other'},f.config,f.selected,1)).toBeUndefined();
  });
});
