import {test,expect,vi} from 'vitest';
import {readFile,writeFile} from 'node:fs/promises';
import {parseEnv} from 'node:util';
import {createHash} from 'node:crypto';
import {getCustomizationConfig} from '@/lib/customization/configs';
import {getDefaultSelections,resolveCustomization} from '@/lib/customization/resolve';
import {templateConfigurationPresets} from '@/lib/customization/template-presets';
import {createReleasedTemplateSelector,templateRuntimeHash,templateReleasePayloadHash,templateReleaseIssues} from '@/lib/customization/template-release-registry';
import {templateConfigSignature} from '@/lib/customization/template-config-signature';
import registrySource from '@/lib/customization/evidence/template-release.json';
import reviewed from '@/data/promotions/se-october-2026-reviewed.json';
vi.mock('server-only',()=>({}));

test.skipIf(process.env.SE_HEAD_PRESET_REFRESH!=='1')('preserves all three recipes on 115 reviewed bodies after adding the optional silicone head',async()=>{
 Object.assign(process.env,parseEnv(await readFile('.env.local','utf8')));
 const {getProductByHandle}=await import('@/lib/shopify/storefront');
 const registry=structuredClone(registrySource) as any;
 const selectOld=createReleasedTemplateSelector(registrySource);
 const evidence=[];
 for(const handle of Object.keys(reviewed.lightweight)){
  const p=await getProductByHandle(handle);expect(p,handle).toBeTruthy();
  const config=getCustomizationConfig(p!);
  expect(config.groups.find(g=>g.id==='silicone-head-upgrade')?.options.length,handle).toBe(60);
  const oldConfig={...config,groups:config.groups.filter(g=>g.id!=='silicone-head-upgrade'),rules:config.rules.filter(r=>!r.id.startsWith('se-silicone-'))};
  const old=selectOld(p!,oldConfig);expect(old,handle).toBeTruthy();
  const base=Number(p!.variants[0].price.amount);
  const before=templateConfigurationPresets(old,oldConfig,oldConfig,base,getDefaultSelections(oldConfig));
  const next={...old!,signature:templateConfigSignature(config)};
  const after=templateConfigurationPresets(next,config,config,base,getDefaultSelections(config));
  expect(before.length,handle).toBe(3);expect(after.length,handle).toBe(3);
  for(let i=0;i<3;i++){
   expect(after[i].totalPrice,handle).toBe(before[i].totalPrice);
   expect(after[i].selections['silicone-head-upgrade']).toBe('keep-original-head');
   expect(resolveCustomization(config,after[i].selections,base).issues,handle).toEqual([]);
  }
  const entry=registry.payload.entries.find((e:any)=>e.handle===handle);expect(entry).toBeTruthy();
  const key=createHash('sha256').update(JSON.stringify(next)).digest('hex');
  registry.payload.bindings[key]=next;entry.bindingKey=key;entry.runtimeHash=templateRuntimeHash(p!,config);
  evidence.push({handle,prices:after.map(x=>x.totalPrice),threePresetsPreserved:true});
 }
 const used=new Set(registry.payload.entries.map((e:any)=>e.bindingKey));
 registry.payload.bindings=Object.fromEntries(Object.entries(registry.payload.bindings).filter(([key])=>used.has(key)));
 registry.payload.releaseId='template-release-2026-10-03-se-silicone-head';
 const hash=templateReleasePayloadHash(registry.payload);
 for(const approval of Object.values(registry.approvals) as any[]){approval.payloadHash=hash;approval.reviewedAt=new Date().toISOString();approval.evidenceRef='docs/catalog/se-silicone-head-release-2026-10-03.md';}
 expect(templateReleaseIssues(registry)).toEqual([]);
 await writeFile('/Volumes/Extreme Pro/Projects/DollWOW/data/exports/se-head-preset-refresh.json',JSON.stringify({at:new Date().toISOString(),evidence},null,2));
 await writeFile('lib/customization/evidence/template-release.json',JSON.stringify(registry)+'\n');
},240000);
