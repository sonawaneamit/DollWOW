import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {describe,it,expect} from 'vitest';
import {mapShopifyProduct} from '@/lib/shopify/mappers';
import {getCustomizationConfig} from '@/lib/customization/configs';
import {getDefaultSelections,selectionIds} from '@/lib/customization/resolve';
import {templateRuntimeHash,templateReleasePayloadHash} from '@/lib/customization/template-release-registry';
import {templateConfigSignature} from '@/lib/customization/template-config-signature';
import {templateConfigurationPresets} from '@/lib/customization/template-presets';

const out=process.env.CASTLE_REGISTRATION_EVIDENCE;
describe.skipIf(!out)('final Castle registry hash freeze',()=>{
 it('matches both staged entries to final source and actual Shopify representation',()=>{
  const sha=(s:string)=>createHash('sha256').update(s).digest('hex');
  const files=['lib/customization/configs.ts','lib/shopify/mappers.ts','lib/customization/resolve.ts','lib/customization/template-config-signature.ts','lib/customization/template-release-registry.ts','data/exports/oct14-release/storefront-readback.json','data/exports/oct14-release/admin-readback.json','lib/customization/evidence/template-release.json'];
  const bytes=Object.fromEntries(files.map(p=>[p,fs.readFileSync(p,'utf8')]));
  const registry=JSON.parse(bytes['lib/customization/evidence/template-release.json']);
  const source=JSON.parse(bytes['data/exports/oct14-release/storefront-readback.json']);
  const admin=JSON.parse(bytes['data/exports/oct14-release/admin-readback.json']);
  const records=[];
  for(const id of ['gid://shopify/Product/10659380363448','gid://shopify/Product/10659380428984']){
   const node=source.nodes.find((n:any)=>n.id===id);expect(node).toBeTruthy();
   const p=mapShopifyProduct(node);p.tags=p.tags.filter(t=>t!=='dollwow-test');
   const bodyCode=admin.nodes.find((n:any)=>n.id===id)?.metafields.nodes.find((m:any)=>m.namespace==='custom'&&m.key==='body_code')?.value;
   if(bodyCode)p.extended.bodyCode=bodyCode;
   expect(p.variants).toEqual(node.variants.edges.map((e:any)=>e.node));expect(p.priceRange).toEqual(node.priceRange);
   expect(p.variants[0].price.amount).toBe('2099.0');
   const cfg=getCustomizationConfig(p),actual=templateRuntimeHash(p,cfg);
   const matches=registry.payload.entries.filter((e:any)=>e.productId===id);expect(matches).toHaveLength(1);
   const entry=matches[0];expect(entry.runtimeHash).toBe(actual);expect(entry.handle).toBe(p.handle);expect(p.tags).toContain(entry.tag);
   const definition=registry.payload.bindings[entry.bindingKey];
   const signature=templateConfigSignature(cfg);expect(definition.signature).toBe(`sha256:${sha(signature)}`);
   const tiers=templateConfigurationPresets({...definition,signature},cfg,cfg,Number(p.variants[0].price.amount),getDefaultSelections(cfg));
   expect(tiers.map(t=>t.totalPrice)).toEqual([2099,2134,2189]);
   expect(tiers.map(t=>selectionIds(t.selections['body-functions']))).toEqual([['none'],['soft-thigh'],['body-heating']]);
   const expected=p.extended.customizationGroups!.find(g=>g.id==='included-construction')!.options.map(o=>o.id);
   for(const tier of tiers)expect(cfg.groups.filter(g=>g.id.startsWith('included-construction-')).flatMap(g=>selectionIds(tier.selections[g.id]))).toEqual(expected);
   records.push({entry,recomputedRuntimeHash:actual,signatureHash:sha(signature),variant:p.variants[0],priceRange:p.priceRange,finalTags:p.tags,bodyCodeSupplement:bodyCode||null,totals:tiers.map(t=>t.totalPrice),fixedChoices:expected});
  }
  for(const p of files)expect(fs.readFileSync(p,'utf8')).toBe(bytes[p]);
  fs.writeFileSync(path.join(out!,'final-registry-hash-pass.json'),JSON.stringify({status:'PASS_FINAL_CONFIG_ACTUAL_STOREFRONT_HASHES',at:new Date().toISOString(),sourceReadAt:source.at,files:Object.fromEntries(files.map(p=>[p,sha(bytes[p])])),payloadHash:templateReleasePayloadHash(registry.payload),registryStatus:registry.releaseStatus,records,configFrozenByWorker:true,shopifyWrites:0,approvalsChanged:false,approvalOwner:'Parent after actual cart checks'},null,2));
 });
});
