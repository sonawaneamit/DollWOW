import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {expect,it,vi} from 'vitest';
const fixture=vi.hoisted(()=>({mail:0,account:0}));
vi.mock('@/lib/dollvue/session',()=>({readDollVueSession:()=>({email:'private-family-pilot@example.invalid'})}));
vi.mock('@/lib/dollvue/accountUsage',()=>({dollVueUsageForEmail:async()=>({available:true,remaining:2}),recordDollVuePreview:async()=>{fixture.account++;return true;}}));
vi.mock('@/lib/dollvue/email',()=>({sendDollVueLookEmail:async()=>{fixture.mail++;return {delivered:false,provider:'test-only-no-mail'};}}));
import {env} from '@/lib/utils/env';
import {adminFetch} from '@/lib/shopify/admin';
import * as storefront from '@/lib/shopify/storefront';
import * as eligibility from '@/lib/dollvue/eligibility';
import {getCustomizationConfig} from '@/lib/customization/configs';
import {dollVueConfigForProduct,areDollVueSelectionsValid,buildDollVuePrompt,resolveDollVueSelections} from '@/lib/dollvue/config';
import {DOLLVUE_APPEARANCE_POLICY} from '@/lib/dollvue/appearance';
import {dollVueReadinessFingerprint,evaluateDollVueReadiness,reviewedDollVueConfig,type DollVueReadinessRecord} from '@/lib/dollvue/readiness';
import {normalizeReviewedImage} from '@/lib/dollvue/reviewedImages';
import {productImageSources} from '@/lib/catalog/productImage';
import {POST as generatePOST} from '@/app/dollvue/generate/route';

const directory='/Volumes/Extreme Pro/Projects/DollWOW/data/exports/dollvue-readiness-2026-10-07/piper-family-preparation/avant-rosretty-moonvale';
const hash=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
const names=['avant-iris','rosretty-iris'];
const expectedInputs=['947e0c0b24b4c2e12f05d35fc876bbae0ae528f96d63c5a5bae4d0b8d83d5ed9','66eda9c104732805a3fc468674bcc8b3a7ec910a17bfc306f3e4831a39b2c4aa'];
const stateFields='id handle status publishedAt tags hold:metafield(namespace:"custom",key:"catalog_image_review_hold"){value} resourcePublications(first:50){nodes{isPublished} pageInfo{hasNextPage}}';
it.skipIf(process.env.DOLLVUE_THREE_BRAND_COMPARISONS!=='1')('binds native output review and builds parent comparisons offline',async()=>{
 vi.stubGlobal('fetch',async()=>{throw Error('Comparison preparation cannot call network');});
 try{
  const outputHashes=['a9c5fb151ca1c6384bb4729f1fe886f516c58b35676ada16495d26487e093229','a703bb210a8b6326ffa62a38af61d387acd474d6e2851ac39c91db7cbbfd4376'];
  const pilots=[];
  for(const [i,name] of names.entries()){
   const inputFile=path.join(directory,`pilot-input-${name}.json`),inputBytes=await fs.readFile(inputFile);expect(hash(inputBytes)).toBe(expectedInputs[i]);const input=JSON.parse(inputBytes.toString());
   const dir=path.join(directory,`pilot-${name}`),resultFile=path.join(dir,'result.json'),resultBytes=await fs.readFile(resultFile),result=JSON.parse(resultBytes.toString());
   expect(result).toMatchObject({routeStatus:200,providerStatus:200,providerCalls:1,routeCalls:1,postflightPassed:true,ready:false,ownerReviewed:false,outputSha256:outputHashes[i]});
   const sources=[input.source.file,input.references[0].file,result.output],digests=[input.source.sha256,input.references[0].sha256,outputHashes[i]],labels=[`${input.index} | ${input.productId.split('/').at(-1)} | p0 SOURCE`,'SELECTED BLUE IRIS REFERENCE','ONE-CALL OUTPUT | PARENT REVIEW PENDING'];
   const tiles=[];
   for(let n=0;n<3;n++){const bytes=await fs.readFile(sources[n]);expect(hash(bytes)).toBe(digests[n]);const image=await sharp(bytes).autoOrient().resize(450,650,{fit:'contain',background:'#eee'}).png().toBuffer();tiles.push(await sharp({create:{width:450,height:685,channels:3,background:'#fff'}}).composite([{input:image,left:0,top:0},{input:Buffer.from(`<svg width="450" height="35"><text x="5" y="22" font-size="11" font-family="Arial">${labels[n]}</text></svg>`),left:0,top:650}]).png().toBuffer());}
   const bytes=await sharp({create:{width:1350,height:685,channels:3,background:'#fff'}}).composite(tiles.map((input,n)=>({input,left:n*450,top:0}))).png().toBuffer(),file=path.join(dir,'comparison.png');await fs.writeFile(file,bytes,{flag:'wx',mode:0o600});
   pilots.push({name,productId:input.productId,inputFile,inputSha256:hash(inputBytes),sourceFile:input.source.file,sourceSha256:input.source.sha256,referenceFile:input.references[0].file,referenceSha256:input.references[0].sha256,outputFile:result.output,outputSha256:outputHashes[i],comparison:{file,sha256:hash(bytes)},resultEvidence:{file:resultFile,sha256:hash(resultBytes)},requestSha256:result.providerRequestSha256,nativeVerdict:'PASS_WITH_VARIATION_PARENT_DECISION_PENDING',nativeNotes:i===0?'Blue irises recognizable. Adult face identity, short wavy hair, opaque white underlayer/mesh shirt, red leggings, jewelry, pose and room retained. Eye opening/gaze, fine facial shading and textile rendering vary; no claim of perfect geometry/colorimetry. Normal-route DollVue watermark present.':'Blue irises recognizable. Adult identity, red hair, opaque white printed tank/brown skirt, pose and black background retained. Eye opening, lip/facial rendering and textile/text rendering vary; no claim of perfect geometry/colorimetry. Normal-route DollVue watermark present.',parentOutputReviewed:false,ownerReviewed:false,ready:false});
  }
  const file=path.join(directory,'two-pilot-output-review.json');await fs.writeFile(file,JSON.stringify({frozen:true,reviewedAt:new Date().toISOString(),reviewer:'assistant-native-image-review',ownerReviewed:false,parentAllSourcesReviewed:false,parentOutputReviewed:false,pilots,totalRouteCalls:2,totalProviderCalls:2,retries:0,fallbacks:0,customerMailSent:false,remoteMutations:0,registryWritten:false,readyCount:0,remaining:'Parent must review both exact outputs before any readiness finalization.'},null,2)+'\n',{flag:'wx',mode:0o600});
 }finally{vi.unstubAllGlobals();}
},60000);
function unused(calls:number){if(calls!==0)throw Error('Authorization consumed: retry/fallback forbidden');}
function additionsOnly(before:Buffer,after:Buffer,ids:string[]){const a=JSON.parse(before.toString()),b=JSON.parse(after.toString());for(const id of Object.keys(a))expect(b[id],id).toEqual(a[id]);for(const id of ids)expect(b[id],id).toEqual(a[id]);return {beforeCount:Object.keys(a).length,afterCount:Object.keys(b).length,beforeSha256:hash(before),afterSha256:hash(after),existingAndAssignedEntriesUnchanged:true};}
it('rejects second provider call and registry overwrites',()=>{
 expect(()=>unused(0)).not.toThrow();expect(()=>unused(1)).toThrow();
 expect(()=>additionsOnly(Buffer.from('{"old":1}'),Buffer.from('{"old":2}'),[])).toThrow();
});
it.skipIf(!names.includes(process.env.DOLLVUE_THREE_BRAND_PILOT||''))('runs one frozen authorized iris pilot through normal route with no retry',async()=>{
 const name=process.env.DOLLVUE_THREE_BRAND_PILOT!,index=names.indexOf(name);
 const inputFile=path.join(directory,`pilot-input-${name}.json`),inputBytes=await fs.readFile(inputFile),inputSha256=hash(inputBytes);expect(inputSha256).toBe(expectedInputs[index]);const pilot=JSON.parse(inputBytes.toString());
 const authorizationFile=path.join(directory,'parent-input-authorization.json'),authorizationBytes=await fs.readFile(authorizationFile),authorizationSha256=hash(authorizationBytes),authorization=JSON.parse(authorizationBytes.toString());
 expect(authorization).toMatchObject({frozen:true,ownerReviewed:false,parentAllSourcesReviewed:false,parentOutputReviewed:false,maxTotalRouteCalls:2,maxTotalProviderCalls:2,maxCallsPerFamily:1,noRetries:true,noFallbacks:true});
 const spec=authorization.pilots[index];expect(spec).toMatchObject({name,inputSha256,productId:pilot.productId,sourceSha256:pilot.source.sha256,referenceSha256:pilot.references[0].sha256,verdict:'PASS_INPUT_ONLY'});
 expect(hash(await fs.readFile(pilot.inputSheet.file))).toBe(spec.inputSheetSha256);expect(hash(await fs.readFile(pilot.nativeReview.file))).toBe(pilot.nativeReview.sha256);expect(pilot.sourcePosition).toBe(0);expect(pilot.choices).toHaveLength(1);expect(pilot.choices[0].groupId).toBe('eye-color');
 const registryBefore=await fs.readFile('lib/dollvue/readiness-registry.json');for(const p of authorization.pilots)expect(JSON.parse(registryBefore.toString())[p.productId]).toBeUndefined();
 const dir=path.join(directory,`pilot-${name}`);await fs.mkdir(dir,{recursive:true,mode:0o700});
 const save=(name:string,value:unknown)=>fs.writeFile(path.join(dir,name),JSON.stringify(value,null,2)+'\n',{flag:'wx',mode:0o600});
 // Exclusive creation makes a consumed authorization fail closed across process restarts.
 await save('authorization-reservation.json',{reservedAt:new Date().toISOString(),inputSha256,authorizationSha256,productId:pilot.productId,maxRouteCalls:1,maxProviderCalls:1,noRetries:true,noFallbacks:true});
 const origin=new URL(env.NEXT_PUBLIC_SITE_URL).origin;expect(origin).toMatch(/^https:\/\/(www\.)?dollwow\.com$/);
 const refs=pilot.references as Array<{url:string;file:string;sha256:string}>,pins:Record<string,string>={[pilot.source.url]:pilot.source.sha256,...Object.fromEntries(refs.map(r=>[r.url,r.sha256]))};
 let calls=0,routeCalls=0,expectedImages:string[]=[],normalPrompt='',beforeState:unknown,caught:unknown;
 let resolver:ReturnType<typeof vi.spyOn>|undefined;
 const mailBefore=fixture.mail,accountBefore=fixture.account,result:Record<string,unknown>={name,productId:pilot.productId,inputSha256,authorizationSha256,sourceFile:pilot.source.file,sourceSha256:pilot.source.sha256,referenceDigests:refs,ownerReviewed:false,parentOutputReview:'pending',ready:false,registryWritten:false,remoteMutations:0,customerMailSent:false};
 const nativeFetch=globalThis.fetch;
 vi.stubGlobal('fetch',async(input:Parameters<typeof fetch>[0],init?:RequestInit)=>{
  const u=new URL(input instanceof Request?input.url:String(input)),method=init?.method||(input instanceof Request?input.method:'GET');
  if(u.href==='https://api.venice.ai/api/v1/image/multi-edit'){
   unused(calls);expect(routeCalls).toBe(1);expect(method).toBe('POST');const bytes=Buffer.from(String(init?.body)),body=JSON.parse(bytes.toString());
   expect(body.modelId).toBe('seedream-v5-pro-edit');expect(body.images).toEqual(expectedImages);expect(body.images).toHaveLength(2);expect(body.prompt).toBe(normalPrompt);
   expect(body.prompt).toContain('Transfer only the visible iris color only');expect(body.prompt).toContain('Do not copy the reference image');expect(body.prompt).toContain('Keep every unselected attribute unchanged');
   const requestSha256=hash(bytes),imageSha256=body.images.map((s:string)=>hash(Buffer.from(s.split(',')[1],'base64')));expect(imageSha256[0]).toBe(pilot.source.sha256);
   await save('provider-reservation.json',{reservedAt:new Date().toISOString(),authorizationSha256,inputSha256,requestSha256,imageSha256,originalImageDigests:pins,maxProviderCalls:1,noRetries:true,noFallbacks:true});
   await fs.writeFile(path.join(dir,'provider-request.json'),bytes,{flag:'wx',mode:0o600});await save('provider-request-summary.json',{requestSha256,prompt:body.prompt,promptSha256:hash(Buffer.from(body.prompt)),model:body.modelId,imageSha256});
   calls++;result.providerRequestSha256=requestSha256;const response=await nativeFetch(input,init);result.providerStatus=response.status;await save('provider-response-status.json',{status:response.status,receivedAt:new Date().toISOString()});return response;
  }
  if(u.hostname===env.SHOPIFY_STORE_DOMAIN&&u.pathname.endsWith('/graphql.json')){expect(method).toBe('POST');const body=JSON.parse(String(init?.body));expect(body.query.trim()).toMatch(/^query\b/);expect(body.query).not.toMatch(/\bmutation\b/);if(body.variables?.ids)expect(body.variables.ids).toEqual([pilot.productId]);if(body.variables?.handle)expect(body.variables.handle).toBe(pilot.handle);}
  else if(u.hostname===env.SHOPIFY_STORE_DOMAIN&&u.pathname==='/admin/oauth/access_token')expect(method).toBe('POST');
  else{expect(method).toBe('GET');expect([pilot.source.url,...refs.map(r=>new URL(r.url,origin).href)]).toContain(u.href);expect(init?.cache).toBe('no-store');}
  return nativeFetch(input,init);
 });
 async function current(stage:string){
  const product=await storefront.getProductByHandle(pilot.handle,{strict:true,cache:'no-store'});expect(product?.id).toBe(pilot.productId);expect(product?.handle).toBe(pilot.handle);
  const data=await adminFetch<{nodes:Array<any>}>(`query ThreeBrandPilotState($ids:[ID!]!){nodes(ids:$ids){... on Product{${stateFields}}}}`,{ids:[pilot.productId]}),state=data.nodes[0];
  expect(state).toMatchObject({id:pilot.productId,handle:pilot.handle,status:'ACTIVE'});expect(state.publishedAt).toBeTruthy();expect(Object.hasOwn(state,'hold')).toBe(true);expect(state.hold===null||typeof state.hold?.value==='string').toBe(true);expect(state.hold?.value.trim()||'').toBe('');expect(state.resourcePublications.pageInfo.hasNextPage).toBe(false);expect(state.resourcePublications.nodes.some((r:any)=>r.isPublished)).toBe(true);
  expect(storefront.isCustomerVisibleProduct(product!)).toBe(true);expect(eligibility.isDollVueExcluded(product!)).toBe(false);expect(product!.extended.brand).toBe(spec.brand);expect(product!.extended.stockStatus).toBe('custom');
  expect([product!.productType,...product!.tags,...state.tags].filter(t=>t!=='catalog-review-hold').filter(t=>/head[ -]?only|torso|accessor|ready.to.ship|hold|not-for-launch|excluded/i.test(t))).toEqual([]);
  const config=dollVueConfigForProduct(product!,getCustomizationConfig(product!));expect(dollVueReadinessFingerprint(product!,config)).toBe(pilot.fingerprint);expect(productImageSources(product!)[0].url).toBe(pilot.source.url);
  // This record exists only inside the private resolver fixture; it is never persisted as ready.
  const record:DollVueReadinessRecord={productId:pilot.productId,policy:DOLLVUE_APPEARANCE_POLICY,status:'ready',fingerprint:pilot.fingerprint,sourcePositions:[0],imageDigests:pins,choices:pilot.choices};
  const readiness=evaluateDollVueReadiness(product!,config,record,{published:true,contentExcluded:false});expect(readiness.ready).toBe(true);const menu=reviewedDollVueConfig(config,readiness,'public');expect(areDollVueSelectionsValid(menu,pilot.choices)).toBe(true);
  expect(hash(await fs.readFile(pilot.source.file))).toBe(pilot.source.sha256);
  for(const ref of refs){expect(hash(await fs.readFile(ref.file))).toBe(ref.sha256);if(ref.url.startsWith('/'))expect(hash(await fs.readFile(path.join(process.cwd(),'public',decodeURIComponent(new URL(ref.url,origin).pathname))))).toBe(ref.sha256);}
  const images=[await normalizeReviewedImage({url:pilot.source.url,sha256:pilot.source.sha256,origin})];for(const ref of refs)images.push(await normalizeReviewedImage({url:ref.url,sha256:ref.sha256,origin,optionReference:true}));
  const prompt=buildDollVuePrompt(product!,resolveDollVueSelections(menu,pilot.choices));
  if(stage==='before')beforeState=state;else{expect(state).toEqual(beforeState);expect(images).toEqual(expectedImages);expect(prompt).toBe(normalPrompt);}
  await save(`${stage}-current-verification.json`,{checkedAt:new Date().toISOString(),state,fingerprint:pilot.fingerprint,sourcePosition:0,imageDigests:pins,normalizedImageSha256:images.map(s=>hash(Buffer.from(s.split(',')[1],'base64'))),promptSha256:hash(Buffer.from(prompt)),menu});
  return {product:product!,menu,images,prompt};
 }
 try{
  const before=await current('before');expectedImages=before.images;normalPrompt=before.prompt;
  resolver=vi.spyOn(eligibility,'resolveCurrentDollVueEligibility').mockImplementation(async product=>{expect(product.id).toBe(pilot.productId);expect(dollVueReadinessFingerprint(product,dollVueConfigForProduct(product,getCustomizationConfig(product)))).toBe(pilot.fingerprint);return {available:true,config:before.menu,sourcePositions:[0],revision:pilot.fingerprint,imageDigests:pins};});
  const body=JSON.stringify({productHandle:pilot.handle,sourcePosition:0,selections:pilot.choices.map(({groupId,optionId}:{groupId:string;optionId:string})=>({groupId,optionId}))});
  await save('route-reservation.json',{reservedAt:new Date().toISOString(),inputSha256,authorizationSha256,routeRequestSha256:hash(Buffer.from(body)),promptSha256:hash(Buffer.from(normalPrompt)),maxRouteCalls:1});await fs.writeFile(path.join(dir,'route-request.json'),body,{flag:'wx',mode:0o600});
  routeCalls++;const response=await generatePOST(new Request(`${origin}/dollvue/generate`,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','x-vercel-ip-country':'US'},body}));
  const payload=await response.json();result.routeStatus=response.status;result.routeError=payload.error;
  if(payload.previewDataUrl){const bytes=Buffer.from(payload.previewDataUrl.split(',')[1],'base64'),file=path.join(dir,'output.webp');await fs.writeFile(file,bytes,{flag:'wx',mode:0o600});const m=await sharp(bytes).metadata();Object.assign(result,{output:file,outputSha256:hash(bytes),dimensions:{width:m.width,height:m.height}});}
  expect(response.status,String(payload.error)).toBe(200);expect(calls).toBe(1);expect(payload.emailDelivered).toBe(false);expect(fixture.mail-mailBefore).toBe(1);expect(fixture.account-accountBefore).toBe(1);
 }catch(error){caught=error;result.error=error instanceof Error?error.message:String(error);}
 finally{
  resolver?.mockRestore();try{await current('after');result.postflightPassed=true;}catch(error){result.postflightPassed=false;result.postflightError=error instanceof Error?error.message:String(error);caught ||= error;}
  try{result.registryVerification=additionsOnly(registryBefore,await fs.readFile('lib/dollvue/readiness-registry.json'),authorization.pilots.map((p:any)=>p.productId));expect(hash(await fs.readFile(inputFile))).toBe(inputSha256);expect(hash(await fs.readFile(authorizationFile))).toBe(authorizationSha256);}catch(error){caught ||= error;result.finalVerificationError=error instanceof Error?error.message:String(error);}
  Object.assign(result,{providerCalls:calls,routeCalls,testOnlyMailInvocations:fixture.mail-mailBefore,testOnlyAccountWrites:fixture.account-accountBefore,completedAt:new Date().toISOString()});
  await save('result.json',result);vi.unstubAllGlobals();
 }
 if(caught)throw caught;
},5*60*1000);
