import fs from 'node:fs/promises';import {parseEnv} from 'node:util';import {createHash} from 'node:crypto';import assert from 'node:assert/strict';import sharp from 'sharp';import {createServer} from 'vite';
const env=parseEnv(await fs.readFile(process.argv[2],'utf8'));assert(env.VENICE_API_KEY);Object.assign(process.env,env);
const root='data/exports/dol312-both-brands-nov10',data=JSON.parse(await fs.readFile(root+'/fresh-candidates.json')),assets=JSON.parse(await fs.readFile(root+'/asset-byte-review.json'));
const server=await createServer({configFile:false,server:{middlewareMode:true},resolve:{alias:{'@':process.cwd()}},plugins:[{name:'offline-marker',resolveId(id){if(id==='server-only')return '\0offline-marker';},load(id){if(id==='\0offline-marker')return 'export {};';}}]});
const {buildDollVuePrompt}=await server.ssrLoadModule('/lib/dollvue/config.ts');const {brandDollVuePreview}=await server.ssrLoadModule('/lib/dollvue/branding.ts');
const {getCurrentDollVueHold}=await server.ssrLoadModule('/lib/dollvue/currentHold.ts');
const sha=b=>createHash('sha256').update(b).digest('hex');
try {for(const [handle,groupId,optionId] of [['mmx-monica-163a-silicone-companion-doll','eye-color','regular-1'],['fanreal-kelly-155cm-f-cup-silicone-companion-doll','eyes','e07']]) {
 const r=data.products.find(r=>r.product.handle===handle);assert(r&&!r.excluded&&r.hold==='clear');
 const folder=root+'/pilot-'+r.brand.toLowerCase();await fs.mkdir(folder,{recursive:true});const journal=folder+'/generation-journal.json';
 const previous=await fs.readFile(journal,'utf8').then(JSON.parse).catch(()=>null);if(previous){console.log(JSON.stringify({handle,state:previous.state,reused:true}));continue;}
 const source=assets.sources.find(s=>s.id===r.product.id);assert(source);const sourceBytes=await fs.readFile(source.file);assert.equal(sha(sourceBytes),source.sha256);
 // Both exact originals independently reviewed: adult-proportioned dolls in
 // opaque black clothing, no nudity, sexual act or sexualized request.
 const fresh=await fetch(source.url,{redirect:'error',signal:AbortSignal.timeout(20000)});assert(fresh.ok);assert.equal(sha(Buffer.from(await fresh.arrayBuffer())),source.sha256);
 assert.equal(await getCurrentDollVueHold(r.product.id,8000),'clear');
 const group=r.config.groups.find(g=>g.id===groupId),option=group.options.find(o=>o.id===optionId);assert(option?.swatch?.kind==='image');
 const ref=await fs.readFile('public'+option.swatch.value),meta=await sharp(ref).metadata();const normalized=meta.width<256||meta.height<256?await sharp(ref).resize(512,512,{fit:'contain',background:'#fff'}).webp().toBuffer():ref;
 const prompt=buildDollVuePrompt(r.product,[{group,option}]);const payload={modelId:'seedream-v5-pro-edit',images:[`data:image/jpeg;base64,${sourceBytes.toString('base64')}`,`data:image/webp;base64,${normalized.toString('base64')}`],prompt,aspect_ratio:'2:3',resolution:'2K',output_format:'webp',safe_mode:true,enhance_prompt:false,disable_prompt_optimization_thinking:true};
 const record={state:'SUBMITTED',at:new Date().toISOString(),handle,productId:r.product.id,groupId,optionId,modelId:payload.modelId,sourceSHA256:source.sha256,reference:option.swatch.value,referenceSHA256:sha(ref),prompt,requestSHA256:sha(Buffer.from(JSON.stringify(payload))),nonExplicitSourceReviewed:true,productionWrites:0,emails:0,customerUsageWrites:0,cartWrites:0};
 await fs.writeFile(journal,JSON.stringify(record,null,2));await fs.writeFile(folder+'/source-original.jpg',sourceBytes);console.log(JSON.stringify({handle,state:'SUBMITTED'}));
 const response=await fetch('https://api.venice.ai/api/v1/image/multi-edit',{method:'POST',headers:{Authorization:`Bearer ${env.VENICE_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(105000)});
 record.status=response.status;
 if(!response.ok){record.state='FAILED_AFTER_SUBMISSION';await fs.writeFile(journal,JSON.stringify(record,null,2));throw Error('Provider HTTP '+response.status+'; no fallback or retry');}
 const bytes=Buffer.from(await response.arrayBuffer());const m=await sharp(bytes).metadata();assert(m.width&&m.height);
 await fs.writeFile(folder+'/output-raw.webp',bytes);await fs.writeFile(folder+'/output-branded.webp',await brandDollVuePreview(bytes,handle,[{group:group.label,option:option.label}]));
 record.state='COMPLETE_REQUIRES_VISUAL_REVIEW';record.outputSHA256=sha(bytes);record.width=m.width;record.height=m.height;record.completedAt=new Date().toISOString();await fs.writeFile(journal,JSON.stringify(record,null,2));console.log(JSON.stringify({handle,state:record.state}));
}}finally {await server.close();}
