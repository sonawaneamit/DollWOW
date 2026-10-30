import {it,expect} from 'vitest';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import type {Product} from '@/types/product';
import {mapShopifyProduct} from '@/lib/shopify/mappers';
import {getCustomizationConfig} from '@/lib/customization/configs';
import {templateConfigSignature} from '@/lib/customization/template-config-signature';
import {templateConfigurationPresets} from '@/lib/customization/template-presets';
import {getDefaultSelections} from '@/lib/customization/resolve';
import {templateRuntimeHash,templateReleasePayloadHash,templateReleaseIssues,type TemplateReleaseRegistry} from '@/lib/customization/template-release-registry';

it.skipIf(process.env.DOL262_PREPARE!=='1')('prepares exact current four-parent release candidates without publishing',async()=>{
  const dir='data/exports/dol-262-2026-10-30';
  const read=async(path:string)=>JSON.parse(await fs.readFile(path,'utf8'));
  const raw=await read(`${dir}/corrected-readback-private.json`);
  const legacy=await read('/Volumes/Extreme Pro/Projects/DollWOW/data/exports/tdf-expansion-2026-10-03/firefly-local-preview-batch.json');
  const mapped=await read('/Volumes/Extreme Pro/Projects/DollWOW/data/exports/tdf-expansion-2026-10-03/firefly-brand-charge-bindings-candidate.json');
  const registry=await read('lib/customization/evidence/template-release.json') as TemplateReleaseRegistry;
  expect(templateReleaseIssues(registry)).toEqual([]);
  const named=await read('lib/cart/evidence/named-upgrades-release.json');
  const hash=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
  expect(named.approval.payloadHash).toBe(hash(named.payload));
  const products:Product[]=[];const results=[];
  for(const p of raw.parents){
    const fields=Object.fromEntries(p.metafields.nodes.filter((m:{namespace:string})=>m.namespace==='custom').map((m:{key:string,value:string})=>[m.key,{value:m.value}]));
    const aliases:Record<string,string>={catalogIdentityKey:'catalog_identity_key',catalogBodyIdentityKey:'catalog_body_identity_key',headModel:'head_model',displayName:'display_name',bodyType:'body_type',brand:'brand',material:'material',heightCm:'height_cm',weightLb:'weight_lb',cupSize:'cup_size',measurements:'measurements',stockStatus:'stock_status',customAvailable:'custom_available',customizationGroups:'customization_groups'};
    const price={amount:p.variants.nodes[0].price,currencyCode:'USD'};
    const product=mapShopifyProduct({...p,media:undefined,description:p.descriptionHtml,featuredImage:p.media.nodes[0].image,images:{edges:p.media.nodes.map((m:{image:unknown})=>({node:m.image}))},variants:{edges:p.variants.nodes.map((v:Record<string,unknown>)=>({node:{id:v.id,title:v.title,selectedOptions:v.selectedOptions,price,availableForSale:true}}))},priceRange:{minVariantPrice:price,maxVariantPrice:price},...Object.fromEntries(Object.entries(aliases).map(([key,field])=>[key,fields[field]]))});
    const config=getCustomizationConfig(product),recipe=structuredClone(legacy.drafts.find((d:{product:Product})=>d.product.handle===p.handle).templateRecipe);
    recipe.signature=templateConfigSignature(config);
    const presets=templateConfigurationPresets(recipe,config,config,Number(price.amount),getDefaultSelections(config));
    expect(presets).toHaveLength(3);
    const binding=mapped.rows.find((r:{productId:string})=>r.productId===p.id);expect(binding.missing).toEqual([]);
    for(const choice of binding.choices){const group=config.groups.find(g=>g.id===choice.groupId);const option=group?.options.find(o=>o.id===choice.optionId);if(!option)continue;expect(option.priceDelta).toBe(choice.amount);}
    const key=`firefly-mary-${p.id.split('/').pop()}-reviewed-2026-10-30`;
    registry.payload.bindings[key]=recipe;
    registry.payload.expectedProductIds.push(product.id);
    registry.payload.entries.push({productId:product.id,handle:product.handle,tag:recipe.tag,bindingKey:key,runtimeHash:templateRuntimeHash(product,config)});
    named.payload.parents[product.variants[0].id]=key;
    named.payload.groups[key]=binding.bindings.map(({parentVariantId,sourceStatus,...b}:{parentVariantId:string,sourceStatus:string})=>b);
    products.push(product);results.push({handle:p.handle,price:price.amount,weight:product.extended.weightLb,cup:product.extended.cupSize,groups:config.groups.length,presets:presets.map(t=>({label:t.label,total:t.totalPrice})),bindings:binding.bindings.length});
  }
  registry.payload.releaseId='dol262-firefly-approved-2026-10-30';
  registry.payload.sourceSnapshotHash=hash(products);
  // Candidates are deliberately unsigned until actual checkout evidence is available.
  registry.approvals=null;registry.releaseStatus='BLOCKED';
  named.releaseStatus='BLOCKED';named.approval=null;
  await fs.writeFile(`${dir}/products-runtime-private.json`,JSON.stringify(products,null,2));
  await fs.writeFile(`${dir}/template-candidate-private.json`,JSON.stringify(registry));
  await fs.writeFile(`${dir}/named-candidate-private.json`,JSON.stringify(named));
  await fs.writeFile(`${dir}/runtime-preflight.json`,JSON.stringify({at:new Date().toISOString(),results,payloadHash:templateReleasePayloadHash(registry.payload)},null,2));
  console.log(JSON.stringify(results));
});
