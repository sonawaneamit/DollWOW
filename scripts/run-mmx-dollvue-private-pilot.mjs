import fs from 'node:fs/promises';
import {parseEnv} from 'node:util';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {createServer} from 'vite';

const root='data/exports/dol312-mmx-nov10/pilot-monica';
const credentials=process.argv[2];
assert(credentials,'Supply the existing configured DollVue credentials file');
const env=parseEnv(await fs.readFile(credentials,'utf8'));
assert(env.VENICE_API_KEY&&env.SHOPIFY_STORE_DOMAIN,'Configured provider and catalog credentials required');
await fs.mkdir(root,{recursive:true});
const journalFile=`${root}/generation-journal.json`;
const previous=await fs.readFile(journalFile,'utf8').then(JSON.parse).catch(e=>{if(e.code==='ENOENT')return null;throw e;});
if(previous){
 if(previous.state==='COMPLETE'){console.log(JSON.stringify({status:'reused-completed-pilot',output:previous.output}));process.exit(0);}
 if(previous.state==='SUBMITTED'||previous.state==='FAILED_AFTER_SUBMISSION')throw Error('Prior submission exists. Do not replay a potentially billed generation.');
}
const sha=b=>createHash('sha256').update(b).digest('hex');
const modelId='seedream-v5-pro-edit';
const productId='gid://shopify/Product/10640123723960';
const handle='mmx-monica-163a-silicone-companion-doll';
const snapshots=JSON.parse(await fs.readFile('/Volumes/Extreme Pro/Projects/DollWOW-dol261-mmx/data/exports/dol261-nov10/final63-storefront-readback-private.json'));
const product=snapshots.find(p=>p.id===productId&&p.handle===handle);assert(product);
const sourceURL=product.images[0].url;
const localSource='/Volumes/Extreme Pro/Projects/DollWOW-dol261-mmx/data/exports/dol261-nov10/photo-audit/monica163-draft.jpg';
const source=await fs.readFile(localSource);
// This exact original was visually reviewed: an adult-proportioned catalog doll
// in black turtleneck, shorts and boots, with no nudity or sexual act.
const modelResponse=await fetch('https://api.venice.ai/api/v1/models?type=inpaint',{headers:{Authorization:`Bearer ${env.VENICE_API_KEY}`},signal:AbortSignal.timeout(20000)});
assert(modelResponse.ok,`Provider model listing HTTP ${modelResponse.status}`);
const models=await modelResponse.json();const actualModel=models.data?.find(m=>m.id===modelId);
assert(actualModel,'Configured primary DollVue model is unavailable; no generation attempted');
const domain=env.SHOPIFY_STORE_DOMAIN.replace(/^https?:\/\//,'').replace(/\/$/,'');
let adminToken=env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const query=`query PrivateDollVuePilot($id:ID!){ product(id:$id){id handle status tags hold:metafield(namespace:"custom",key:"catalog_image_review_hold"){value} menu:metafield(namespace:"custom",key:"customization_groups"){value} images(first:8){nodes{url}}}}`;
async function queryAdmin(){return fetch(`https://${domain}/admin/api/2026-04/graphql.json`,{method:'POST',headers:{'Content-Type':'application/json','X-Shopify-Access-Token':adminToken},body:JSON.stringify({query,variables:{id:productId}}),signal:AbortSignal.timeout(20000)});}
let current=await queryAdmin();
if(current.status===401&&env.SHOPIFY_CLIENT_ID&&env.SHOPIFY_CLIENT_SECRET){
 const tokenResponse=await fetch(`https://${domain}/admin/oauth/access_token`,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'client_credentials',client_id:env.SHOPIFY_CLIENT_ID,client_secret:env.SHOPIFY_CLIENT_SECRET}),signal:AbortSignal.timeout(20000)});
 const t=await tokenResponse.json();assert(tokenResponse.ok&&t.access_token,'Catalog authorization unavailable');adminToken=t.access_token;current=await queryAdmin();
}
assert(current.ok,`Catalog read HTTP ${current.status}`);
const currentBody=await current.json();assert(!currentBody.errors?.length,'Catalog read failed');const live=currentBody.data?.product;
assert(live?.id===productId&&live.handle===handle&&live.status==='ACTIVE','Product identity/publication changed');
assert(!live.hold?.value?.trim(),'Current product image hold applies');
assert(!live.tags.some(t=>/age.*hold|safety.*hold|content.*hold|dollwow-test|dollwow-system/i.test(t)),'Current exclusion tag applies');
assert(live.images.nodes.some(i=>i.url===sourceURL),'Source image no longer belongs to current product');
const rawGroups=JSON.parse(live.menu.value);product.extended.customizationGroups=rawGroups;
// The framework marker is replaced only inside this offline Node runner, just as
// in tests/server-only.setup.ts. No production module or eligibility gate changes.
const server=await createServer({configFile:false,server:{middlewareMode:true},resolve:{alias:{'@':process.cwd()}},plugins:[{
 name:'private-node-server-marker',resolveId(id){if(id==='server-only')return '\0private-server-only';},
 load(id){if(id==='\0private-server-only')return 'export {};';}
}]});
const {getCustomizationConfig}=await server.ssrLoadModule('/lib/customization/configs.ts');
const {buildDollVuePrompt}=await server.ssrLoadModule('/lib/dollvue/config.ts');
const {brandDollVuePreview}=await server.ssrLoadModule('/lib/dollvue/branding.ts');
const config=getCustomizationConfig(product);
const choices=[['hairstyle','hairstyle-12'],['eye-color','regular-1']].map(([groupId,optionId])=>{
 const group=config.groups.find(g=>g.id===groupId),option=group?.options.find(o=>o.id===optionId);
 assert(group&&option?.swatch?.kind==='image'&&option.displayable!==false&&option.factoryExists!==false,'Current exact appearance choice is unavailable');
 return {group,option};
});
const freshSource=await fetch(sourceURL,{redirect:'error',signal:AbortSignal.timeout(20000)});assert(freshSource.ok,'Current source unavailable');
const freshBytes=Buffer.from(await freshSource.arrayBuffer());assert.equal(sha(freshBytes),sha(source),'Source original changed; require fresh visual review');
const referenceRecords=[],images=[`data:image/jpeg;base64,${source.toString('base64')}`];
for(const {group,option} of choices){
 assert(/^\/option-assets\/[a-f0-9]{64}\.webp$/.test(option.swatch.value),'Non-local or unexpected reference');
 const bytes=await fs.readFile(`public${option.swatch.value}`);const m=await sharp(bytes).metadata();assert(m.width&&m.height);
 const normalized=(m.width<256||m.height<256)?await sharp(bytes).resize(512,512,{fit:'contain',background:'#fff'}).webp({quality:92}).toBuffer():bytes;
 images.push(`data:image/webp;base64,${normalized.toString('base64')}`);
 referenceRecords.push({groupId:group.id,optionId:option.id,label:option.label,url:option.swatch.value,sha256:sha(bytes),providerInputSHA256:sha(normalized)});
 await fs.writeFile(`${root}/${group.id}-reference.webp`,bytes);
}
const prompt=buildDollVuePrompt(product,choices);
const payload={modelId,images,prompt,aspect_ratio:'2:3',resolution:'2K',output_format:'webp',safe_mode:true,enhance_prompt:false,disable_prompt_optimization_thinking:true};
const record={state:'PREFLIGHT_COMPLETE',at:new Date().toISOString(),productId,handle,modelId,
 modelAvailable:true,providerConstraints:actualModel.model_spec?.constraints??null,sourceURL,sourceSHA256:sha(source),
 references:referenceRecords,prompt,requestSHA256:sha(Buffer.from(JSON.stringify(payload))),
 scope:'Private non-sexual hair/iris fidelity probe only; not a readiness record or sales/publication approval.',
 generationParameters:{aspect_ratio:'2:3',resolution:'2K',safe_mode:true},
 sourceVisualReview:{reviewer:'Codex assistant',nonExplicit:true,clothed:true},
 catalogHoldClear:true,productionMutations:0,emails:0,customerUsageWrites:0,cartWrites:0};
await fs.writeFile(`${root}/source-original.jpg`,source);
await fs.writeFile(`${root}/preflight.json`,JSON.stringify(record,null,2));
record.state='SUBMITTED';record.submittedAt=new Date().toISOString();await fs.writeFile(journalFile,JSON.stringify(record,null,2));
console.log(JSON.stringify({state:record.state,modelId,handle,selections:referenceRecords.map(r=>r.label)}));
try{
 const response=await fetch('https://api.venice.ai/api/v1/image/multi-edit',{method:'POST',headers:{Authorization:`Bearer ${env.VENICE_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(105000)});
 record.httpStatus=response.status;record.responseType=response.headers.get('content-type');
 if(!response.ok){
  const detail=(await response.text()).replaceAll(env.VENICE_API_KEY,'[REDACTED]').slice(0,2000);
  record.state='FAILED_AFTER_SUBMISSION';record.detail=detail;await fs.writeFile(journalFile,JSON.stringify(record,null,2));
  throw Error(`Provider HTTP ${response.status}; saved response. No automatic retry/fallback.`);
 }
 const result=Buffer.from(await response.arrayBuffer());const m=await sharp(result).metadata();assert(m.width&&m.height,'Undecodable provider response');
 await fs.writeFile(`${root}/output-raw.webp`,result);
 const branded=await brandDollVuePreview(result,handle,choices.map(({group,option})=>({group:group.label,option:option.label})));
 await fs.writeFile(`${root}/output-branded.webp`,branded);
 record.state='COMPLETE';record.completedAt=new Date().toISOString();record.output=`${root}/output-branded.webp`;
 record.outputSHA256=sha(result);record.brandedSHA256=sha(branded);record.dimensions={width:m.width,height:m.height};
 record.visualFidelityReviewed=false;await fs.writeFile(journalFile,JSON.stringify(record,null,2));
 console.log(JSON.stringify({state:record.state,modelId,dimensions:record.dimensions,output:record.output}));
}catch(e){
 if(record.state!=='FAILED_AFTER_SUBMISSION'){record.state='FAILED_AFTER_SUBMISSION';record.error=String(e?.message??e);await fs.writeFile(journalFile,JSON.stringify(record,null,2));}
 throw e;
}finally{await server.close();}
