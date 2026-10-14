import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {describe,it,expect} from 'vitest';
import {mapShopifyProduct} from '@/lib/shopify/mappers';
import {getCustomizationConfig} from '@/lib/customization/configs';
import {getDefaultSelections,resolveCustomization,selectionIds} from '@/lib/customization/resolve';
import {templateConfigSignature} from '@/lib/customization/template-config-signature';
import {templateConfigurationPresets} from '@/lib/customization/template-presets';
import {templateRuntimeHash,templateReleasePayloadHash,templateReleaseIssues,selectReleasedTemplateRecipe} from '@/lib/customization/template-release-registry';

const out=process.env.CASTLE_REGISTRATION_EVIDENCE;
describe.skipIf(!out)('Castle actual Storefront registration evidence',()=>{
 it('maps exact imported nodes, preserves prices and prepares only two entries',()=>{
  const dir=out!;
  const load=(p:string)=>JSON.parse(fs.readFileSync(p,'utf8'));
  const source=load('data/exports/oct14-release/storefront-readback.json');
  const admin=load('data/exports/oct14-release/admin-readback.json');
  const imported=load('data/exports/oct14-release/import-results.json').results;
  const drafts=load(path.join(dir,'drafts.json')).drafts;
  const registryPath='lib/customization/evidence/template-release.json';
  const original=load(registryPath);
  expect(templateReleaseIssues(original)).toEqual([]);
  const sha=(s:string)=>createHash('sha256').update(s).digest('hex');
  const records=[];
  for(const head of ['S21','S12']){
   const draft=drafts.find((d:any)=>d.product.extended.headModel===head);
   const node=source.nodes.find((n:any)=>n.handle===draft.product.handle);
   expect(node).toBeTruthy();const imp=imported.find((p:any)=>p.handle===node.handle);expect(node.id).toBe(imp.productId);
   const mapped=mapShopifyProduct(node);
   expect(mapped.variants[0].id).toBe(imp.variantId);expect(mapped.variants[0].price.amount).toBe('2099.0');
   expect(mapped.priceRange).toEqual(node.priceRange);expect(mapped.variants).toEqual(node.variants.edges.map((e:any)=>e.node));
   expect(mapped.tags).toContain('dollwow-test');
   const product=structuredClone(mapped);product.tags=product.tags.filter(t=>t!=='dollwow-test');
   expect(product.tags).toEqual(node.tags.filter((t:string)=>t!=='dollwow-test'));
   const bodyCode=admin.nodes.find((p:any)=>p.id===product.id)?.metafields.nodes.find((m:any)=>m.namespace==='custom'&&m.key==='body_code')?.value;
   if(bodyCode)product.extended.bodyCode=bodyCode;
   const cfg=getCustomizationConfig(product),defaults=getDefaultSelections(cfg);
   const definition={...draft.templateRecipe,signature:templateConfigSignature(cfg)};
   const tiers=templateConfigurationPresets(definition,cfg,cfg,Number(product.variants[0].price.amount),defaults);
   expect(tiers.map(t=>t.totalPrice)).toEqual([2099,2134,2189]);
   expect(tiers.map(t=>selectionIds(t.selections['body-functions']))).toEqual([['none'],['soft-thigh'],['body-heating']]);
   for(const tier of tiers){const resolved=resolveCustomization(cfg,tier.selections,2099);expect(resolved.issues).toEqual([]);expect(resolved.requiresPriceConfirmation).toBe(false);expect(resolved.selectedOptions.filter(o=>o.priceDelta>0).length).toBe(tier.id==='starter'?0:1);}
   const runtimeHash=templateRuntimeHash(product,cfg);
   expect(runtimeHash).not.toBe(templateRuntimeHash(mapped,getCustomizationConfig(mapped)));
   const reformatted=structuredClone(product);reformatted.variants[0].price.amount='2099.00';
   expect(templateRuntimeHash(reformatted,cfg)).not.toBe(runtimeHash);
   const bindingKey=sha(definition.tag);
   records.push({entry:{productId:product.id,handle:product.handle,tag:definition.tag,bindingKey,runtimeHash},definition:{...definition,signature:`sha256:${sha(definition.signature)}`},mappedProduct:product,bodyCodeSupplement:bodyCode||null,totals:tiers.map(t=>t.totalPrice),paidSelections:tiers.map(t=>resolveCustomization(cfg,t.selections,2099).selectedOptions.filter(o=>o.priceDelta>0)),sourceReadAt:source.at});
  }
  expect(records).toHaveLength(2);
  const next=structuredClone(original);
  for(const r of records){
   expect(next.payload.entries.some((e:any)=>e.productId===r.entry.productId||e.handle===r.entry.handle)).toBe(false);
   expect(next.payload.bindings[r.entry.bindingKey]).toBeUndefined();
   next.payload.entries.push(r.entry);next.payload.expectedProductIds.push(r.entry.productId);next.payload.bindings[r.entry.bindingKey]=r.definition;
  }
  expect(next.payload.entries.slice(0,original.payload.entries.length)).toEqual(original.payload.entries);
  for(const [key,value]of Object.entries(original.payload.bindings))expect(next.payload.bindings[key]).toEqual(value);
  const chargeReport=load('data/exports/oct14-release/charge-release-results.json');
  const relevant=chargeReport.checks.filter((c:any)=>/Dolls Castle - Body functions: (Soft thighs|Body heating)$/.test(c.title));
  const countries=['US','PT','GB','DE'];
  const chargesPass=countries.every(country=>['Soft thighs','Body heating'].every(label=>relevant.some((c:any)=>c.country===country&&c.title.endsWith(`: ${label}`)&&c.passed)));
  const evidence={at:new Date().toISOString(),status:'PASS_CATALOG_RUNTIME_TWO_ACTUAL_PRODUCTS',baselinePayloadHash:templateReleasePayloadHash(original.payload),sourceFileSha256:sha(fs.readFileSync('data/exports/oct14-release/storefront-readback.json','utf8')),records,existingEntriesPreserved:original.payload.entries.length,existingBindingsPreserved:Object.keys(original.payload.bindings).length,chargeMarkets:{passed:chargesPass,checks:relevant},coordinatedApproval:'NOT_GRANTED_BY_THIS_TEST',finalTagChange:'Remove dollwow-test only after deployment; any further tag/price/menu/availability change invalidates hash'};
  fs.writeFileSync(path.join(dir,'storefront-registration-evidence.json'),JSON.stringify(evidence,null,2));
  next.payload.releaseId='template-release-2026-10-14-castle';
  next.payload.sourceSnapshotHash=sha(JSON.stringify({previous:original.payload.sourceSnapshotHash,records:records.map(r=>({entry:r.entry,product:r.mappedProduct}))}));
  next.releaseStatus='BLOCKED';next.approvals=null;
  // In-memory approval fixture exercises selector structure only. It is never
  // saved as an approval or used as evidence of a live checkout test.
  const structural=structuredClone(next);structural.releaseStatus='APPROVED';
  structural.approvals=Object.fromEntries(['catalogCompatibility','checkoutChargeLines','coordinatedRelease'].map(gate=>[gate,{reviewedBy:'Structure-only test fixture',reviewedAt:new Date().toISOString(),evidenceRef:'tests/castleStorefrontRegistration.test.ts',payloadHash:templateReleasePayloadHash(structural.payload)}]));
  expect(templateReleaseIssues(structural)).toEqual([]);
  for(const r of records){const cfg=getCustomizationConfig(r.mappedProduct);const selected=selectReleasedTemplateRecipe(structural,r.mappedProduct,cfg);expect(selected).not.toBeNull();expect(templateConfigurationPresets(selected,cfg,cfg,2099,getDefaultSelections(cfg)).map(t=>t.totalPrice)).toEqual([2099,2134,2189]);}
  fs.writeFileSync(path.join(dir,'template-registration-candidate.json'),JSON.stringify(next));
  if(process.env.CASTLE_STAGE_TEMPLATE==='1'){
   // Parent explicitly requested staging for its coordinated approval step.
   // Compare again to avoid overwriting concurrent registry work.
   expect(load(registryPath)).toEqual(original);
   fs.writeFileSync(path.join(dir,'template-registration-baseline.json'),JSON.stringify(original));
   fs.writeFileSync(registryPath,JSON.stringify(next)+'\n');
   fs.writeFileSync(path.join(dir,'template-registration-staged.json'),JSON.stringify({at:new Date().toISOString(),status:'STAGED_BLOCKED_AWAITING_PARENT_APPROVAL',newProducts:records.map(r=>r.entry),payloadHash:templateReleasePayloadHash(next.payload),priorEntries:original.payload.entries.length,priorBindings:Object.keys(original.payload.bindings).length,finalEntries:next.payload.entries.length,finalBindings:Object.keys(next.payload.bindings).length},null,2));
  }
 });
});
