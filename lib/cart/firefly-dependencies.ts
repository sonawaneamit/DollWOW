import {isReviewedFireflyProduct} from '@/lib/customization/firefly-release';
import {groupedCartAttributes} from '@/lib/customization/resolve';
import type {Product} from '@/types/product';
import type {BrandCustomizationConfig,SelectedCustomizationOption} from '@/types/customization';
import type {DependencyChargeItem} from './ido-md-dependencies';

const reviewedRoots=new Set([
  'hairstyle-hard/implanted-synthetic-hair',
  'head-type-for-extra-head/hard-silicone-with-movable-jaw-ros',
  'head-type-for-extra-head/soft-silicone-with-movable-jaw-ros',
  'hairstyle-for-extra-head-hard/implanted-hair'
]);
const key=(option:SelectedCustomizationOption)=>`${option.groupId}/${option.optionId}`;

/** Free dependent details belong to their paid line, never the persistent doll line. */
export function fireflyDependencyPlan(product:Product,config:BrandCustomizationConfig,selected:SelectedCustomizationOption[],quantity:number){
  if(!isReviewedFireflyProduct(product))return undefined;
  const selectedByKey=new Map(selected.map(option=>[key(option),option]));
  function ancestors(option:SelectedCustomizationOption,visiting=new Set<string>()):Set<string>{
    const id=key(option);
    if(visiting.has(id))throw new Error('Cyclic customization dependency.');
    const next=new Set(visiting).add(id),roots=new Set<string>();
    for(const branch of config.groups.find(group=>group.id===option.groupId)?.visibleWhen??[]){
      const conditions=branch.map(condition=>selectedByKey.get(`${condition.groupId}/${condition.optionId}`));
      if(conditions.some(condition=>!condition))continue;
      for(const condition of conditions){
        if(condition!.priceDelta>0)roots.add(key(condition!));
        for(const root of ancestors(condition!,next))roots.add(root);
      }
    }
    return roots;
  }
  const owners=new Map<string,string>();
  for(const option of selected){
    const roots=ancestors(option);
    if(!roots.size)continue;
    if(option.priceDelta!==0||roots.size!==1||![...roots].every(root=>reviewedRoots.has(root))){
      throw new Error('This dependent paid option needs a verified exact-price checkout mapping.');
    }
    owners.set(key(option),[...roots][0]);
  }
  const items:DependencyChargeItem[]=selected.filter(option=>option.priceDelta>0).map(owner=>{
    const dependents=selected.filter(option=>owners.get(key(option))===key(owner));
    return {group:owner.groupLabel,label:owner.optionLabel,amount:Math.round(owner.priceDelta*quantity*100)/100,
      ...(dependents.length?{dependencyDetails:{scope:'firefly-free-details-v1' as const,
        included:groupedCartAttributes(dependents,'Included: '),configured:[]}}:{})};
  });
  return {items,included:selected.filter(option=>option.priceDelta===0&&!owners.has(key(option)))};
}
