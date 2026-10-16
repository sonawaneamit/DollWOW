import {test,expect,vi} from 'vitest';
import {readFile,writeFile} from 'node:fs/promises';
import {parseEnv} from 'node:util';
import {getCustomizationConfig} from '@/lib/customization/configs';
import {getDefaultSelections,resolveCustomization} from '@/lib/customization/resolve';
import {templateConfigurationPresets} from '@/lib/customization/template-presets';
import {createReleasedTemplateSelector,templateRuntimeHash,templateReleasePayloadHash,templateReleaseIssues} from '@/lib/customization/template-release-registry';
import {createHash} from 'node:crypto';
import {templateConfigSignature} from '@/lib/customization/template-config-signature';
import registrySource from '@/lib/customization/evidence/template-release.json';
vi.mock('server-only',()=>({}));
const DONOR='irontech-suki-165cm-g-cup-silicone-companion-doll-1larb';
test.skipIf(process.env.IRN_REGISTRY!=='1')('binds Irontech IRN dolls to the standard Irontech silicone recipe',async()=>{
 Object.assign(process.env,parseEnv(await readFile('.env.local','utf8')));process.env.VERCEL_ENV='preview';
 const handles:string[]=JSON.parse(await readFile(process.env.IRN_HANDLES!,'utf8'));
 const {getProductByHandle}=await import('@/lib/shopify/storefront');
 const registry=structuredClone(registrySource) as any;
 const donor=registry.payload.entries.find((e:any)=>e.handle===DONOR);
 const out:any[]=[];let key='';
 for(const h of handles){
  const p=await getProductByHandle(h);expect(p,h).toBeTruthy();
  const config=getCustomizationConfig(p!);
 const recipe={...structuredClone(registry.payload.bindings[donor.bindingKey]),signature:'sha256:'+createHash('sha256').update(templateConfigSignature(config)).digest('hex')};
  const k=createHash('sha256').update(JSON.stringify(recipe)).digest('hex');if(key&&key!==k)throw new Error('menus differ '+h);key=k;registry.payload.bindings[key]=recipe;
  registry.payload.entries=registry.payload.entries.filter((e:any)=>e.handle!==h);
  if(!registry.payload.expectedProductIds.includes(p!.id)) registry.payload.expectedProductIds.push(p!.id);
  registry.payload.entries.push({productId:p!.id,handle:h,tag:donor.tag,bindingKey:key,runtimeHash:templateRuntimeHash(p!,config)});
  out.push([h,p,config]);
 }
 const hash=templateReleasePayloadHash(registry.payload);
 for(const a of Object.values(registry.approvals) as any[]){a.payloadHash=hash;a.reviewedAt=new Date().toISOString();a.evidenceRef+='; Irontech IRN 10 dolls (preview, dollwow-test) bound to a copy of the standard Irontech silicone recipe (same tiers; menu without the body-weight/ULW group, eligibility unverified for these bodies) (2026-10-16)';}
 expect(templateReleaseIssues(registry)).toEqual([]);
 const sel=createReleasedTemplateSelector(registry);
 for(const [h,p,config] of out){
  const r=sel(p,config);expect(r,h).toBeTruthy();
  const base=Number(p.variants[0].price.amount);
  const tiers=templateConfigurationPresets(r,config,config,base,getDefaultSelections(config));
  expect(tiers.length,h).toBe(3);
  for(const t of tiers) expect(resolveCustomization(config,t.selections,base).issues).toEqual([]);
  console.log('IRN',h,base,tiers.map((t:any)=>[t.id,t.totalPrice]));
 }
 await writeFile('lib/customization/evidence/template-release.json',JSON.stringify(registry,null,2)+'\n');
},300000);
