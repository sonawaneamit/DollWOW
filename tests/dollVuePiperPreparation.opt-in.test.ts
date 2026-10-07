import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { expect, it, vi } from 'vitest';
const pilotFixture=vi.hoisted(()=>({mailCalls:0,accountWrites:0}));
vi.mock('@/lib/dollvue/session',()=>({readDollVueSession:()=>({email:'private-piper-qa@example.invalid'})}));
vi.mock('@/lib/dollvue/accountUsage',()=>({dollVueUsageForEmail:async()=>({available:true,remaining:2}),recordDollVuePreview:async()=>{pilotFixture.accountWrites++;return true;}}));
vi.mock('@/lib/dollvue/email',()=>({sendDollVueLookEmail:async()=>{pilotFixture.mailCalls++;return {delivered:false,provider:'test-only-no-mail'};}}));
import { env, hasShopifyStorefrontEnv } from '@/lib/utils/env';
import { storefrontAuthHeaders } from '@/lib/shopify/auth';
import { adminFetch } from '@/lib/shopify/admin';
import { mapShopifyProduct } from '@/lib/shopify/mappers';
import { isCustomerVisibleProduct } from '@/lib/shopify/storefront';
import { getCustomizationConfig } from '@/lib/customization/configs';
import { getDefaultSelections, resolveCustomization, isOptionAvailableForCheckout } from '@/lib/customization/resolve';
import { dollVueConfigForProduct, areDollVueSelectionsValid, buildDollVuePrompt, resolveDollVueSelections } from '@/lib/dollvue/config';
import { isDollVueExcluded } from '@/lib/dollvue/eligibility';
import { classifyAppearance, DOLLVUE_APPEARANCE_POLICY } from '@/lib/dollvue/appearance';
import { dollVueReadinessFingerprint, evaluateDollVueReadiness, reviewedDollVueConfig, type DollVueReadinessRecord } from '@/lib/dollvue/readiness';
import { promotionPricingForSelections } from '@/lib/promotions/optionPricing';
import { productDisplayName, productPublicTitle } from '@/lib/catalog/naming';
import * as storefrontModule from '@/lib/shopify/storefront';
import * as eligibilityModule from '@/lib/dollvue/eligibility';
import { POST as cartPOST } from '@/app/dollvue/cart/route';
import { POST as generatePOST } from '@/app/dollvue/generate/route';
import { normalizeReviewedImage } from '@/lib/dollvue/reviewedImages';
import { productImageSources } from '@/lib/catalog/productImage';
import { isOwnedOptionAsset } from '@/lib/assets/option-assets.mjs';

const root='/Volumes/Extreme Pro/Projects/DollWOW/data/exports/dollvue-readiness-2026-10-07';
const output=path.join(root,'piper-family-preparation');
const hash=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
function assertRegistryAdditionOnly(beforeBytes:Buffer,afterBytes:Buffer,familyIds:string[]){
 const before=JSON.parse(beforeBytes.toString()),after=JSON.parse(afterBytes.toString());
 expect(Array.isArray(before)||Array.isArray(after)).toBe(false);expect(Object.keys(before).length).toBeGreaterThan(0);
 for(const [id,record]of Object.entries(before))expect(after[id],`Existing registry entry changed: ${id}`).toEqual(record);
 for(const id of familyIds)expect(after[id],`Assigned family entry changed: ${id}`).toEqual(before[id]);
 return {beforeCount:Object.keys(before).length,afterCount:Object.keys(after).length,beforeSha256:hash(beforeBytes),afterSha256:hash(afterBytes),unrelatedAdditions:Object.keys(after).filter(id=>!Object.hasOwn(before,id)),existingEntriesAndAssignedFamilyUnchanged:true};
}
it('allows unrelated registry additions but rejects existing or assigned-family changes',()=>{
 const bytes=(v:unknown)=>Buffer.from(JSON.stringify(v)),before=bytes({old:{status:'ready'}});
 expect(()=>assertRegistryAdditionOnly(before,bytes({old:{status:'ready'},parent:{status:'ready'}}),['own'])).not.toThrow();
 for(const next of [{},{old:{status:'excluded'}},{old:{status:'ready'},own:{status:'ready'}}])expect(()=>assertRegistryAdditionOnly(before,bytes(next),['own'])).toThrow();
});
const nextOutput=path.join(output,'next-il-erovenus');
it.skipIf(process.env.DOLLVUE_THREE_BRAND_FREEZE!=='1')('freezes native three-brand review and two iris inputs without provider access',async()=>{
 vi.stubGlobal('fetch',async()=>{throw Error('Offline review freeze forbids network and generation');});
 try{
  const relative='avant-rosretty-moonvale',dir=path.join(output,relative),prepFile=path.join(dir,'attempt-4/preparation.json');
  const prepBytes=await fs.readFile(prepFile),prep=JSON.parse(prepBytes.toString()),noteFile=path.join(dir,'native-review-decisions.json'),noteBytes=await fs.readFile(noteFile),notes=JSON.parse(noteBytes.toString());
  const registryBytes=await fs.readFile('lib/dollvue/readiness-registry.json'),registry=JSON.parse(registryBytes.toString());
  const categories=['pass','nudity','adultPresentationAmbiguous','sexualOrCoverageAmbiguous'];
  expect(categories.flatMap(k=>notes[k]).sort((a:number,b:number)=>a-b)).toEqual(Array.from({length:78},(_,i)=>i+1));
  expect(prep.rows).toHaveLength(78);expect(prep.freshBeforeAfterStateEqual).toBe(true);
  for(const r of [...prep.referenceEvidence,...prep.rows.map((r:any)=>r.sources[0])])expect(hash(await fs.readFile(r.file))).toBe(r.sha256);
  for(const s of [...prep.referenceSheets,...prep.sourceSheets])expect(hash(await fs.readFile(s.file))).toBe(s.sha256);
  const save=async(name:string,value:unknown)=>{const bytes=Buffer.from(JSON.stringify(value,null,2)+'\n'),file=path.join(dir,name);await fs.writeFile(file,bytes,{flag:'wx',mode:0o600});return {file,sha256:hash(bytes)};};
  const rows=prep.rows.map((r:any)=>{
   const category=categories.find(k=>notes[k].includes(r.index))!;
   const g=r.groups.find((g:any)=>g.attributes.includes('eye-color'));
   return {...r,sourceDecision:category==='pass'?'PASS_NATIVE_ADULT_NONEXPLICIT_IRIS':'EXCLUDED_SOURCE_ZERO',reasonCategory:category,reason:notes.reasonDefinitions[category],nativeDetail:notes.sourceDetails[r.index]||null,approvedSourcePositions:category==='pass'?[0]:[],reviewedSourcePositions:[0],unreviewedSourcePositions:r.sources.slice(1).map((s:any)=>s.sourcePosition),candidateGroups:category==='pass'?[{groupId:g.groupId,familyHash:g.familyHash,optionIds:g.options.filter((o:any)=>o.classification.status==='candidate'&&!(r.brand==='Avant Doll'&&o.id==='eye-20')).map((o:any)=>o.id)}]:[],ready:false,ownerReviewed:false,parentAllSourcesReviewed:false};
  });
  const passing=rows.filter((r:any)=>r.approvedSourcePositions.length);expect(passing).toHaveLength(16);
  const passOnlySheets=[];
  for(let n=0;n<passing.length;n+=8){const tiles=[];for(const r of passing.slice(n,n+8))tiles.push(await tile(await fs.readFile(r.sources[0].file),`${r.index} | ${r.id.split('/').at(-1)} | p0`,300,420));passOnlySheets.push(await sheet(tiles,4,`${relative}/pass-only-${n+1}-${Math.min(n+8,passing.length)}.png`,300,420));}
  const familyReuse=prep.families.map((f:any,i:number)=>{
   const expected=new Map(f.choices.map((c:any)=>[c.reference,c.sha256]));
   const exactExistingReadyIds=Object.entries(registry).filter(([,raw])=>{const rec=raw as any;return rec.status==='ready'&&(rec.groups||[]).some((g:any)=>{const refs=Object.values(g.references||{});return refs.length===expected.size&&refs.every((ref:any)=>expected.has(ref)&&rec.imageDigests?.[ref]===expected.get(ref));});}).map(([id])=>id);
   return {familyNumber:i+1,familyHash:f.referenceFamilyHash,exactExistingReadyIds,referenceSetAndDigestsExact:exactExistingReadyIds.length>0,reuseApplied:false,reason:exactExistingReadyIds.length?'No native-approved Moonvale source; reference identity alone cannot grant readiness.':'No exact complete reference-set and digest match in current ready registry. New-family pilot required for any proposed subset.'};
  });
  const pilots=[];
  for(const spec of notes.pilots){
   const row=passing.find((r:any)=>r.index===spec.index);expect(row).toBeTruthy();expect(registry[row.id]).toBeUndefined();
   const family=prep.families[spec.familyNumber-1],choice=family.choices.find((c:any)=>c.optionId===spec.optionId),reference=prep.referenceEvidence.find((r:any)=>r.reference===choice.reference),source=row.sources[0];
   const group=row.groups.find((g:any)=>g.familyHash===family.referenceFamilyHash);expect(group.exactCensusReferences).toBe(true);expect(group.options.some((o:any)=>o.id===spec.optionId&&o.reference===reference.reference&&o.classification.status==='candidate')).toBe(true);
   const inputSheet=await sheet([await tile(await fs.readFile(source.file),`${row.index} | ${row.id.split('/').at(-1)} | p0`,500,740),await tile(await fs.readFile(reference.file),`REF ${reference.index} | ${choice.label} | IRIS ONLY`,500,740)],2,`${relative}/pilot-input-${spec.name}.png`,500,740);
   const input={frozen:true,generationAuthorized:false,ready:false,ownerReviewed:false,parentAllSourcesReviewed:false,productId:row.id,handle:row.handle,index:row.index,sourcePosition:0,fingerprint:row.fingerprint,familyHash:family.referenceFamilyHash,source,references:[{url:reference.reference,file:reference.file,sha256:reference.sha256}],choices:[{groupId:group.groupId,optionId:choice.optionId,reference:reference.reference}],meaning:spec.meaning,constraints:'Iris hue/texture only. Retain original face, eye opening/gaze, makeup, hair, clothing, pose, background, accessories and branding. Use actual normal route prompt after parent authorization, not a custom replacement prompt.',inputSheet,preparation:{file:prepFile,sha256:hash(prepBytes),stateCheckedAt:prep.checkedAt},nativeReview:{file:noteFile,sha256:hash(noteBytes)},requiredBeforeAnyCall:'Parent inspection and explicit exact-input authorization; new reservation, fresh current access/holds/menu/fingerprint/source/reference checks before and after. One call only if authorized; no retry.'};
   pilots.push({...await save(`pilot-input-${spec.name}.json`,input),name:spec.name,inputSheet,sourceSha256:source.sha256,referenceSha256:reference.sha256});
  }
  const report={frozen:true,reviewedAt:new Date().toISOString(),reviewer:'assistant-native-image-review',ownerReviewed:false,parentAllSourcesReviewed:false,preparation:{file:prepFile,sha256:hash(prepBytes),stateCheckedAt:prep.checkedAt},nativeReview:{file:noteFile,sha256:hash(noteBytes)},rows,preservedProductScopeExclusions:prep.preservedExclusions,referenceEvidence:prep.referenceEvidence,referenceSheets:prep.referenceSheets,familyReview:notes.references,familyReuse,passOnlySheets,pilots,summary:{sourceZeroReviewed:78,uniqueReferenceBytesReviewed:prep.referenceEvidence.length,familySheetsReviewed:16,sourcePass:16,sourceExcluded:62,ready:0,brands:['Avant Doll','Rosretty','Moonvale'].map(brand=>({brand,reviewed:rows.filter((r:any)=>r.brand===brand).length,pass:passing.filter((r:any)=>r.brand===brand).length})),reasonCounts:Object.fromEntries(categories.map(k=>[k,notes[k].length])),preservedTorsoExclusions:prep.preservedExclusions.length},galleryReview:notes.galleryReview,currentRegistry:{count:Object.keys(registry).length,sha256:hash(registryBytes)},capturedLiveStateNotRecheckedOffline:true,registryWritten:false,newProductHolds:0,generationCalls:0,networkCalls:0,remoteMutations:0,remaining:'Two genuinely new iris-family input sheets await parent inspection/authorization. No ready proposal before pilot review and current-state runtime finalization. All later gallery sources remain unauthorized.'};
  const result=await save('native-review-and-candidate-proposal.json',report);
  expect(await fs.readFile('lib/dollvue/readiness-registry.json')).toEqual(registryBytes);console.info(JSON.stringify({result,summary:report.summary,pilots}));
 }finally{vi.unstubAllGlobals();}
},60000);
it.skipIf(process.env.DOLLVUE_AI_BIND_PARENT_APPROVAL!=='1')('binds parent pilot-only approval and normalizes two captured current states offline',async()=>{
 vi.stubGlobal('fetch',async()=>{throw Error('No network calls authorized for offline approval binding');});
 try{
  const dir=path.join(output,'next-ai-tech-tantaly'),proposalFile=path.join(dir,'ready-proposal-2-757-1791407792946.json'),proposalBytes=await fs.readFile(proposalFile);
  expect(hash(proposalBytes)).toBe('65fd25a2c8d856108bbdc515004989da9a527fa154baca7dba4812ef2e7ef36f');const proposal=JSON.parse(proposalBytes.toString());
  const approvalFile=path.join(dir,'parent-output-approval.json'),approvalBytes=await fs.readFile(approvalFile),approval=JSON.parse(approvalBytes.toString());
  expect(approval).toMatchObject({frozen:true,reviewer:'parent-assistant',ownerReviewed:false,verdict:'PASS_MINOR_VARIATION_ACCEPTED',parentAllSourcesReviewed:false,productId:'gid://shopify/Product/10518035431608',outputSha256:'1c1b2de790856505f0e7beec227b5a66e466b713d37c069f57f359d7cb551453'});
  expect(hash(await fs.readFile(path.join(dir,approval.outputFile)))).toBe(approval.outputSha256);expect(hash(await fs.readFile(path.join(dir,approval.comparisonFile)))).toBe(approval.comparisonSha256);
  expect(hash(await fs.readFile(path.join(dir,'pilot-input-ai-iris.json')))).toBe(approval.inputSha256);
  const verification=[];
  for(const report of proposal.verificationReports){const bytes=await fs.readFile(report.file);expect(hash(bytes)).toBe(report.sha256);const detail=JSON.parse(bytes.toString());expect(detail.beforeState).toEqual(detail.afterState);
   const state=detail.afterState;expect(state.status).toBe('ACTIVE');expect(state.publishedAt).toBeTruthy();expect(state.hold).toBeNull();expect(state.resourcePublications.pageInfo.hasNextPage).toBe(false);expect(state.resourcePublications.nodes.some((p:any)=>p.isPublished)).toBe(true);
   expect(detail.records[state.id]).toEqual(proposal.records[state.id]);expect(proposal.records[state.id].status).toBe('ready');expect(detail.counts).toMatchObject({cartPasses:3,rejectionChecks:5,generationCalls:0,remoteWrites:0});
   verification.push({id:state.id,handle:state.handle,draft:state.status==='DRAFT',status:state.status,publishedAt:state.publishedAt,privateHold:'clear',stateCheckedAt:detail.checkedAt,stateEvidence:{file:report.file,sha256:report.sha256},sourceReviewBy:'assistant-native-image-review'});
  }
  expect(verification).toHaveLength(2);
  const registryBytes=await fs.readFile('lib/dollvue/readiness-registry.json'),registry=JSON.parse(registryBytes.toString());for(const v of verification)if(registry[v.id])expect(registry[v.id]).toEqual(proposal.records[v.id]);
  const normalized={checkedAt:new Date().toISOString(),basis:'Previously captured before/after current Admin and strict Storefront state; not a new live read. Parent forbids new calls.',verification,networkCalls:0,generationCalls:0,ownerReviewed:false};
  const normalizedFile=path.join(dir,'normalized-verification-parent-approved.json');await fs.writeFile(normalizedFile,JSON.stringify(normalized,null,2)+'\n',{flag:'wx',mode:0o600});
  const file=path.join(dir,'ready-proposal-2-parent-approved.json');
  proposal.authority='User authorized private two-record finalization; parent subsequently accepted only the Danielle green-iris pilot comparison. Other source/reference review remains native assistant review. Historical native verdict is retained as earlier evidence. No registry writes.';
  await fs.writeFile(file,JSON.stringify({...proposal,parentOutputReviewed:true,parentOutputSpotcheck:approval.verdict,parentSourceReviewClaimed:false,parentAllSourcesReviewed:false,parentPilotApproval:{file:approvalFile,sha256:hash(approvalBytes),...approval},verification,normalizedVerification:{file:normalizedFile,sha256:hash(await fs.readFile(normalizedFile))},supersedes:{file:proposalFile,sha256:hash(proposalBytes)},approvalBoundAt:new Date().toISOString(),currentLocalRegistry:{count:Object.keys(registry).length,sha256:hash(registryBytes),candidateEntriesAbsentOrExact:true},newNetworkCalls:0,newGenerationCalls:0,registryWritten:false},null,2)+'\n',{flag:'wx',mode:0o600});
  expect(await fs.readFile('lib/dollvue/readiness-registry.json')).toEqual(registryBytes);console.info(JSON.stringify({file,sha256:hash(await fs.readFile(file)),verification}));
 }finally{vi.unstubAllGlobals();}
},60000);
it.skipIf(process.env.DOLLVUE_FINAL_TEXT_ELIGIBILITY!=='1')('reconciles Avant Rosretty Moonvale eligibility using text only',async()=>{
 const input=path.join(root,'inventory.json'),inputBytes=await fs.readFile(input),inventory=JSON.parse(inputBytes.toString());
 const coverageFile=path.join(root,'coverage-reconciliation-499.json'),coverageBytes=await fs.readFile(coverageFile),coverage=JSON.parse(coverageBytes.toString());
 const selected=inventory.rows.filter((r:any)=>['Avant Doll','Rosretty','Moonvale'].includes(r.brand)),ids=selected.map((r:any)=>r.id);
 expect(selected.filter((r:any)=>r.brand==='Avant Doll')).toHaveLength(14);expect(ids).toHaveLength(82);
 const registryBytes=await fs.readFile('lib/dollvue/readiness-registry.json'),registry=JSON.parse(registryBytes.toString()),nativeFetch=globalThis.fetch;
 const counts={adminReads:0,storefrontReads:0,imageReads:0,generationCalls:0,remoteWrites:0};
 vi.stubGlobal('fetch',async(input:Parameters<typeof fetch>[0],init?:RequestInit)=>{
  const u=new URL(input instanceof Request?input.url:String(input));expect(u.hostname).toBe(env.SHOPIFY_STORE_DOMAIN);expect(init?.method).toBe('POST');
  if(u.pathname.endsWith('/graphql.json')){const body=JSON.parse(String(init?.body));expect(body.query.trim()).toMatch(/^query\b/);expect(body.query).not.toMatch(/\bmutation\b/);expect(body.variables.ids.every((id:string)=>ids.includes(id))).toBe(true);expect(body.variables.ids.length).toBeLessThanOrEqual(50);if(u.pathname.includes('/admin/'))counts.adminReads++;else counts.storefrontReads++;}
  else expect(u.pathname).toBe('/admin/oauth/access_token');return nativeFetch(input,init);
 });
 const read=async()=>{const states:Array<AdminNode|null>=[],nodes:Array<Node|null>=[];for(let n=0;n<ids.length;n+=50){const chunk=ids.slice(n,n+50);
  const admin=await adminFetch<{nodes:Array<AdminNode|null>}>(adminQuery,{ids:chunk});expect(admin.nodes).toHaveLength(chunk.length);states.push(...admin.nodes);
  const response=await fetch(`https://${env.SHOPIFY_STORE_DOMAIN}/api/2026-04/graphql.json`,{method:'POST',cache:'no-store',signal:AbortSignal.timeout(60000),headers:{'Content-Type':'application/json',...storefrontAuthHeaders(env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!)},body:JSON.stringify({query:sfQuery,variables:{ids:chunk}})});
  expect(response.ok).toBe(true);const b=await response.json();expect(b.errors).toBeUndefined();expect(b.data.nodes).toHaveLength(chunk.length);nodes.push(...b.data.nodes);
 }return {states,nodes};};
 try{
  const before=await read(),rows=selected.map((old:any,i:number)=>{
   const state=before.states[i],node=before.nodes[i];if(state){expect(state.id).toBe(old.id);expect(state.handle).toBe(old.handle);}if(node)expect(node.id).toBe(old.id);
   const prior=coverage.rows.find((r:any)=>r.id===old.id),holdKnown=!!state&&Object.hasOwn(state,'hold')&&(state.hold===null||typeof state.hold?.value==='string'),holdClear=holdKnown&&!(state!.hold?.value.trim());
   const product=node?mapShopifyProduct(node):null,config=product?dollVueConfigForProduct(product,getCustomizationConfig(product)):null;
   const type=product?.productType||state?.productType||'',tags=state?.tags||[];
   const matchesHistoricalStrictTypeFilter=!!product&&product.extended.stockStatus==='custom'&&/^custom\b.*\bdoll\b/i.test(type)&&scopeFlags(type,tags).length===0;
   const groups=config?.groups.map(g=>({groupId:g.id,label:g.label,selectionMode:g.selectionMode,visibleWhen:g.visibleWhen,candidateChoices:g.options.filter(o=>classifyAppearance(g,o).status==='candidate').map(o=>({optionId:o.id,label:o.label,attribute:classifyAppearance(g,o),ownedReference:o.swatch?.kind==='image'&&isOwnedOptionAsset(o.swatch.value),reference:o.swatch?.kind==='image'?o.swatch.value:null}))})).filter(g=>g.candidateChoices.length)||[];
   const policyExcluded=product?isDollVueExcluded(product):null;
   const runtimeAvailable=product?eligibilityModule.resolveDollVueEligibility(product).available:false;
   return {id:old.id,handle:old.handle,brand:old.brand,cachedStatus:old.status,currentStatus:state?.status||null,publishedAt:state?.publishedAt||null,strictPublicLookupPresent:!!node,publicationState:state?.resourcePublications,holdKnown,holdClear,hold:state?.hold,currentProductType:type,currentStockStatus:product?.extended.stockStatus,currentCustomAvailable:product?.extended.customAvailable,currentTags:tags,matchesHistoricalStrictTypeFilter,policyExcluded,currentRuntimeAvailable:runtimeAvailable,customerVisible:product?isCustomerVisibleProduct(product):false,currentRegistryRecord:registry[old.id]||null,currentFingerprint:product&&config?dollVueReadinessFingerprint(product,config):null,groups,priorCoverage:prior||null,priorInventoryReasons:old.reasons,conclusion:!node?'not-publicly-available':!holdClear?'private-hold-not-clear':policyExcluded?'runtime-scope-excluded':product?.extended.stockStatus!=='custom'?'not-current-custom-stock':!groups.length?'no-current-appearance-candidates':'text-eligible-for-review-not-ready',sourceReviewPerformed:false,referenceByteReviewPerformed:false,newReadyApproval:false};
  });
  const after=await read();expect(after).toEqual(before);const registryVerification=assertRegistryAdditionOnly(registryBytes,await fs.readFile('lib/dollvue/readiness-registry.json'),ids);
  const byBrand=Object.fromEntries(['Avant Doll','Rosretty','Moonvale'].map(brand=>[brand,rows.filter((r:any)=>r.brand===brand).reduce((a:Record<string,number>,r:any)=>{a[r.conclusion]=(a[r.conclusion]||0)+1;return a;},{})]));
  const dir=path.join(output,'final-text-eligibility');await fs.mkdir(dir,{recursive:true,mode:0o700});const file=path.join(dir,`report-${registryVerification.beforeCount}-${Date.now()}.json`);
  await fs.writeFile(file,JSON.stringify({checkedAt:new Date().toISOString(),scope:'Text-only read-only reconciliation; no images, visual approvals, generations, new product sale holds or catalog mutations. Existing family review ownership is not reassigned.',classificationBasis:'Current runtime exclusion policy and custom stock, not the historical census Custom-prefix type filter. Missing reviewed records still block runtime availability. Text eligibility is not full-body visual approval or a claim of no prior review.',supersedesClassificationOnly:'report-757-1791407693724.json retains valid current observations but grouped strict type-filter failures as its conclusion. This report separates that census filter from runtime policy.',ownerReviewed:false,inputs:[{file:input,sha256:hash(inputBytes)},{file:coverageFile,sha256:hash(coverageBytes)}],rows,byBrand,counts,registryVerification,registryWritten:false},null,2)+'\n',{flag:'wx',mode:0o600});console.info(JSON.stringify({file,byBrand,counts}));
 }finally{vi.unstubAllGlobals();}
},5*60*1000);
it.skipIf(process.env.DOLLVUE_AI_TANTALY_FREEZE!=='1')('freezes queued Ai-Tech inputs and Tantaly scope exclusions without generation',async()=>{
 const dir=path.join(output,'next-ai-tech-tantaly'),bytes=await fs.readFile(path.join(dir,'preparation.json')),prep=JSON.parse(bytes.toString());
 const noteBytes=await fs.readFile(path.join(dir,'native-review-notes.json')),notes=JSON.parse(noteBytes.toString());expect(hash(bytes)).toBe(notes.preparationSha256);
 expect(Object.keys(notes.sourceZeroDecisions)).toHaveLength(17);expect(notes.generationAuthorized).toBe(false);expect(notes.ownerReviewed).toBe(false);
 for(const ref of prep.referenceEvidence)expect(hash(await fs.readFile(ref.file))).toBe(ref.sha256);
 for(const row of prep.rows)expect(hash(await fs.readFile(row.sources[0].file))).toBe(row.sources[0].sha256);
 const accepted=notes.acceptedForPrivateInputReview.map((decision:any)=>{const row=prep.rows.find((r:any)=>r.index===decision.index);expect(row.brand).toBe('Ai-Tech');expect(row.status).toBe('ACTIVE');expect(row.groups.every((g:any)=>g.exactCensusReferences)).toBe(true);return {row,decision};});
 const family=prep.families.find((f:any)=>f.referenceFamilyHash==='7b497c55d58bdba50ec6cf61f3457f564fe4a3ccc70e8c2f30d11f1308764848');expect(family.choices).toHaveLength(3);
 const tiles=[];for(const {row}of accepted)tiles.push(await tile(await fs.readFile(row.sources[0].file),`${row.index} | ${row.id.split('/').at(-1)} | p0`,450,650));
 const passSheet=await sheet(tiles,2,'next-ai-tech-tantaly/pass-only-sources-5-6.png',450,650);
 const pilotRow=accepted.find((r:any)=>r.row.index===6).row,selected=family.choices.find((r:Ref)=>r.optionId==='green');expect(selected).toBeDefined();
 const ref=prep.referenceEvidence.find((r:any)=>r.reference===selected.reference),source=pilotRow.sources[0];
 const inputSheet=await sheet([await tile(await fs.readFile(source.file),`6 | ${pilotRow.id.split('/').at(-1)} | p0`,450,650),await tile(await fs.readFile(ref.file),'REF 23 | Green | IRIS ONLY',450,650)],2,'next-ai-tech-tantaly/pilot-input-ai-iris.png',450,650);
 const inventory=JSON.parse(await fs.readFile(path.join(root,'inventory.json'),'utf8')),coverageBytes=await fs.readFile(path.join(root,'coverage-reconciliation-499.json'));
 const allBrandRows=inventory.rows.filter((r:any)=>['Ai-Tech','Tantaly'].includes(r.brand)),outside=allBrandRows.filter((r:any)=>!prep.rows.some((p:any)=>p.id===r.id));
 const save=(name:string,data:unknown)=>fs.writeFile(path.join(dir,name),JSON.stringify(data,null,2)+'\n',{flag:'wx',mode:0o600});
 await save('frozen-native-review.json',{reviewer:'assistant-native-image-review',ownerReviewed:false,preparationSha256:hash(bytes),nativeReviewNotesSha256:hash(noteBytes),referenceEvidence:prep.referenceEvidence,referenceDecisions:notes.referenceFamilies,rows:prep.rows.map((r:any)=>({index:r.index,id:r.id,brand:r.brand,status:r.status,source:r.sources[0],decision:notes.sourceZeroDecisions[String(r.index)]})),counts:notes.counts,passSheet,priorFamilyExclusions:prep.preservedExclusions,outsideCurrentCandidateScope:outside.map((r:any)=>({id:r.id,handle:r.handle,brand:r.brand,status:r.status,reasons:r.reasons,evidenceBasis:'cached inventory, not freshly queried'})),parentCoverageInput:{file:path.join(root,'coverage-reconciliation-499.json'),sha256:hash(coverageBytes),merged:false},registryWritten:false,sourceExclusionsAreSaleHolds:false});
 await save('candidate-proposal.json',{status:'PRIVATE_PREPARATION_NOT_READY',ownerReviewed:false,registryWritten:false,generationAuthorized:false,generationCalls:0,readyCount:0,proposed:accepted.map(({row,decision}:any)=>({index:row.index,id:row.id,handle:row.handle,shopifyStatus:row.status,source:row.sources[0],sourceReview:decision,fingerprint:row.fingerprint,choices:family.choices.map((r:Ref)=>({groupId:'eye-color',...r})),ready:false,sourcePositions:[0]})),passSheet,scope:'Ai-Tech iris-only input review. Tantaly torso and lower-body products remain excluded; source findings are not sale holds.'});
 await save('pilot-input-ai-iris.json',{frozen:true,generationAuthorized:false,ownerReviewed:false,ready:false,productId:pilotRow.id,handle:pilotRow.handle,index:6,sourcePosition:0,fingerprint:pilotRow.fingerprint,source,choices:[{groupId:'eye-color',optionId:selected.optionId,reference:selected.reference}],references:[{url:ref.reference,file:ref.file,sha256:ref.sha256}],familyHash:family.referenceFamilyHash,preparationSha256:hash(bytes),nativeReviewNotesSha256:hash(noteBytes),inputSheet,remaining:'Parent frozen input review and specific generation authorization; no generation has run.'});
},60000);
it.skipIf(process.env.DOLLVUE_IL_EROVENUS_FREEZE!=='1')('binds native review and one IL iris pilot without generation',async()=>{
 const prepBytes=await fs.readFile(path.join(nextOutput,'preparation.json')),prep=JSON.parse(prepBytes.toString());
 const noteBytes=await fs.readFile(path.join(nextOutput,'native-review-notes.json')),notes=JSON.parse(noteBytes.toString());
 expect(hash(prepBytes)).toBe(notes.preparationSha256);expect(Object.keys(notes.sourceZeroDecisions)).toHaveLength(prep.rows.length);expect(notes.ownerReviewed).toBe(false);
 const row=prep.rows.find((r:any)=>r.index===37),source=row.sources[0],family=prep.families.find((f:any)=>f.referenceFamilyHash==='56628f5ba8d97c8ad7d0d5714982405c29898732f7efc007727a797786c812e7');
 expect(row.brand).toBe('IL Doll');expect(row.status).toBe('ACTIVE');expect(row.groups.every((g:any)=>g.exactCensusReferences)).toBe(true);
 const references=family.choices.map((r:Ref)=>prep.referenceEvidence.find((p:any)=>p.reference===r.reference));
 for(const r of prep.referenceEvidence)expect(hash(await fs.readFile(r.file))).toBe(r.sha256);
 for(const r of prep.rows)expect(hash(await fs.readFile(r.sources[0].file))).toBe(r.sources[0].sha256);
 const alternatives=JSON.parse(await fs.readFile(path.join(nextOutput,'alternatives.json'),'utf8'));for(const r of alternatives.rows)for(const s of r.sources)expect(hash(await fs.readFile(s.file))).toBe(s.sha256);
 const selected=references.find((r:any)=>r.optionId==='no-2'),choices=[{groupId:'eye-color',optionId:'no-2',reference:selected.reference}];
 const passSheet=await sheet([await tile(await fs.readFile(source.file),`37 | ${row.id.split('/').at(-1)} | p0`,450,650)],1,'next-il-erovenus/pass-only-source-37.png',450,650);
 const inputSheet=await sheet([await tile(await fs.readFile(source.file),`37 | ${row.id.split('/').at(-1)} | p0`,450,650),await tile(await fs.readFile(selected.file),'REF 17 | No.2 bright blue | IRIS ONLY',450,650)],2,'next-il-erovenus/pilot-input-il-iris.png',450,650);
 const save=(name:string,data:unknown)=>fs.writeFile(path.join(nextOutput,name),JSON.stringify(data,null,2)+'\n',{flag:'wx',mode:0o600});
 const review={frozenAt:new Date().toISOString(),reviewer:'assistant-native-image-review',ownerReviewed:false,preparationSha256:hash(prepBytes),nativeReviewNotesSha256:hash(noteBytes),rows:prep.rows.map((r:any)=>({index:r.index,id:r.id,status:r.status,publicRuntime:r.publicRuntime,sourcePosition:0,file:r.sources[0].file,sha256:r.sources[0].sha256,decision:notes.sourceZeroDecisions[String(r.index)]})),alternatives:alternatives.rows,referenceEvidence:prep.referenceEvidence,referenceDecisions:notes.referenceFamilies,sourcePhotosReviewed:55,sourcePass:1,preservedPriorExclusions:prep.preservedExclusions.length,passSheet,sourceExclusionsAreSaleHolds:false,readyCount:0};
 await save('frozen-native-review.json',review);
 await save('pilot-input-il-iris.json',{frozen:true,ownerReviewed:false,ready:false,parentOutputSpotcheck:'pending',productId:row.id,handle:row.handle,index:37,sourcePosition:0,fingerprint:row.fingerprint,source,choices,references:[{url:selected.reference,file:selected.file,sha256:selected.sha256}],familyHash:family.referenceFamilyHash,sourceReview:notes.acceptedForPilot[0],authority:notes.pilotScope,preparationSha256:hash(prepBytes),nativeReviewNotesSha256:hash(noteBytes),inputSheet});
 await save('candidate-proposal.json',{status:'PRIVATE_PREPARATION_NOT_READY',ownerReviewed:false,registryWritten:false,readyCount:0,proposed:[{...row,choices:references.map((r:Ref)=>({groupId:'eye-color',...r})),sourcePositions:[0],ready:false}],excluded:review.rows.filter((r:any)=>r.index!==37),referenceExclusions:notes.referenceFamilies.filter((r:any)=>[2,3].includes(r.sheet)),notEnabled:['skin-tone','hairstyle','nail-color','toe-nail-color','Erovenus makeup'],generationCalls:0});
 console.info(JSON.stringify({inputSha256:hash(await fs.readFile(path.join(nextOutput,'pilot-input-il-iris.json'))),sourceSha256:source.sha256,referenceSha256:selected.sha256}));
},60000);
it.skipIf(process.env.DOLLVUE_IL_EROVENUS_ALTERNATIVES!=='1')('inspects galleries only for identified technical gaps',async()=>{
 const manifest=JSON.parse(await fs.readFile(path.join(nextOutput,'preparation.json'),'utf8')),rows=[];
 for(const index of [4,37]){
  const old=manifest.rows.find((r:any)=>r.index===index),product=await storefrontModule.getProductByHandle(old.handle,{strict:true,cache:'no-store'});
  expect(product?.id).toBe(old.id);expect(dollVueReadinessFingerprint(product!,dollVueConfigForProduct(product!,getCustomizationConfig(product!)))).toBe(old.fingerprint);
  const sources=productImageSources(product!).slice(0,8);expect(sources.map(s=>s.url)).toEqual(old.sources.map((s:any)=>s.url));
  const evidence=[],tiles=[];for(let p=1;p<sources.length;p++){const source=sources[p],image=await boundedOwnedImage(source.url),file=path.join(nextOutput,`source-${index}-${p}.${image.format==='jpeg'?'jpg':image.format}`);await fs.writeFile(file,image.bytes,{flag:'wx',mode:0o600});evidence.push({...source,sourcePosition:p,file,sha256:image.sha256});tiles.push(await tile(image.bytes,`${index} | ${old.id.split('/').at(-1)} | p${p}`,300,400));}
  rows.push({index,id:old.id,technicalGap:index===4?'Cropped source zero cannot establish full-body scope':'Check clearer iris detail and whether nails/feet visible for separate families',sources:evidence,sheet:await sheet(tiles,4,`next-il-erovenus/alternatives-${index}.png`,300,400)});
 }
 await fs.writeFile(path.join(nextOutput,'alternatives.json'),JSON.stringify({rows,generationCalls:0,ownerReviewed:false},null,2)+'\n',{flag:'wx',mode:0o600});
},10*60*1000);
it.skipIf(process.env.DOLLVUE_IL_EROVENUS_PREPARE!=='1'&&process.env.DOLLVUE_AI_TANTALY_PREPARE!=='1'&&process.env.DOLLVUE_AVANT_ROSRETTY_MOONVALE_PREPARE!=='1')('reserves assigned compact families privately without generation',async()=>{
 const expanded=process.env.DOLLVUE_AVANT_ROSRETTY_MOONVALE_PREPARE==='1',queued=process.env.DOLLVUE_AI_TANTALY_PREPARE==='1',brands=expanded?['Avant Doll','Rosretty','Moonvale']:queued?['Ai-Tech','Tantaly']:['IL Doll','Erovenus'];
 const subdir=expanded?'avant-rosretty-moonvale/attempt-4':queued?'next-ai-tech-tantaly':'next-il-erovenus',nextOutput=path.join(output,subdir);
 await fs.mkdir(nextOutput,{recursive:true,mode:0o700});
 const save=(name:string,data:unknown)=>fs.writeFile(path.join(nextOutput,name),JSON.stringify(data,null,2)+'\n',{flag:'wx',mode:0o600});
 await save('reservation.json',{brands,ownerReviewed:false,registryWrites:false,generationCalls:0,authority:expanded?'User assigned Avant14 Rosretty54 Moonvale10 source/reference review. Reuse only exact validated families; genuinely new family requires parent representative-input inspection before any provider call.':queued?'User queued Ai-Tech9 and Tantaly8 only for true custom appearance candidates. Reconcile fixed torso/out-of-scope accurately; no catalog publication.':'User assigned after Piper7 finalization; one representative per distinct family only after native source/reference review and fresh access/holds/bytes.',reservedAt:new Date().toISOString()});
 const input=path.join(root,'remaining-family-census/other-family-reference-inventory.json'),inputBytes=await fs.readFile(input);
 const families=JSON.parse(inputBytes.toString()).groups.filter((g:any)=>g.brands.some((b:string)=>brands.includes(b))).map((g:any)=>({...g,choices:g.choices.map((r:any)=>({...r,sha256:r.sha256||r.auditSha256}))}));
 const all=[...new Map<string,any>(families.flatMap((f:any)=>f.products).filter((p:any)=>brands.includes(p.brand)).map((p:any)=>[p.id,p] as [string,any])).values()];
 const reconciled=expanded?JSON.parse(await fs.readFile(path.join(output,'final-text-eligibility/report-757-1791407876216.json'),'utf8')).rows.filter((r:any)=>r.conclusion==='text-eligible-for-review-not-ready').map((r:any)=>r.id):[];
 const selected=all.filter(p=>expanded?reconciled.includes(p.id):p.inV2Unmatched&&!p.excludedReasons.length&&!p.inventoryReasons.length);if(expanded)expect(selected).toHaveLength(78);
 const ids=selected.map(p=>p.id),registryBytes=await fs.readFile('lib/dollvue/readiness-registry.json');
 const registry=JSON.parse(registryBytes.toString()),counts={adminReads:0,storefrontReads:0,imageReads:0,generationCalls:0,remoteMutations:0};
 const nativeFetch=globalThis.fetch;
 vi.stubGlobal('fetch',async(input:Parameters<typeof fetch>[0],init?:RequestInit)=>{
  const u=new URL(input instanceof Request?input.url:String(input)),method=init?.method||'GET';
  if(u.hostname===env.SHOPIFY_STORE_DOMAIN&&u.pathname.endsWith('/graphql.json')){expect(method).toBe('POST');const body=JSON.parse(String(init?.body));expect(body.query).toMatch(/^query\b/);expect(body.query).not.toMatch(/\bmutation\b/);expect(body.variables.ids.every((id:string)=>ids.includes(id))).toBe(true);if(u.pathname.includes('/admin/'))counts.adminReads++;else counts.storefrontReads++;}
  else if(u.hostname===env.SHOPIFY_STORE_DOMAIN&&u.pathname==='/admin/oauth/access_token')expect(method).toBe('POST');
  else {expect(method).toBe('GET');expect(isOwnedOptionAsset(u.href)).toBe(true);counts.imageReads++;}
  return nativeFetch(input,init);
 });
 try{
  const read=async()=>{const states:{nodes:Array<AdminNode|null>;shop:{currencyCode:string}}={nodes:[],shop:{currencyCode:''}},nodes:Array<Node|null>=[];
   for(let n=0;n<ids.length;n+=40){const chunk=ids.slice(n,n+40),part=await adminFetch<{nodes:Array<AdminNode|null>;shop:{currencyCode:string}}>(adminQuery,{ids:chunk});expect(part.nodes).toHaveLength(chunk.length);states.nodes.push(...part.nodes);states.shop=part.shop;
    const r=await fetch(`https://${env.SHOPIFY_STORE_DOMAIN}/api/2026-04/graphql.json`,{method:'POST',cache:'no-store',signal:AbortSignal.timeout(60000),headers:{'Content-Type':'application/json',...storefrontAuthHeaders(env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!)},body:JSON.stringify({query:sfQuery,variables:{ids:chunk}})});
    expect(r.ok).toBe(true);const b=await r.json();expect(b.errors).toBeUndefined();expect(b.data.nodes).toHaveLength(chunk.length);nodes.push(...b.data.nodes);
   }return {states,nodes};};
  const initial=await read(),refs=[...new Map<string,Ref>(families.flatMap((f:any)=>f.choices).map((r:Ref)=>[r.reference,r] as [string,Ref])).values()],referenceEvidence=[];
  for(const [i,ref]of refs.entries()){
   if(ref.reference.startsWith('/'))expect(hash(await fs.readFile(path.join(process.cwd(),'public',decodeURIComponent(new URL(ref.reference,'https://dollwow.com').pathname))))).toBe(ref.sha256);
   const image=await boundedOwnedImage(new URL(ref.reference,'https://dollwow.com').href);expect(image.sha256).toBe(ref.sha256);
   const file=path.join(nextOutput,`reference-${i+1}.webp`);await fs.writeFile(file,image.bytes,{flag:'wx',mode:0o600});referenceEvidence.push({index:i+1,...ref,file,ownerReviewed:false,visualDecision:'NOT_REVIEWED'});
  }
  const referenceSheets=[];
  for(const [i,family]of families.entries()){
   const tiles=[];for(const ref of family.choices){const r=referenceEvidence.find(r=>r.reference===ref.reference)!;tiles.push(await tile(await fs.readFile(r.file),`${r.index} | ${ref.label}`,300,320));}
   referenceSheets.push(await sheet(tiles,Math.min(4,tiles.length),`${subdir}/references-family-${i+1}.png`,300,320));
  }
  const rows=[];
  for(const [i,old]of selected.entries()){
   const state=initial.states.nodes[i],live=initial.nodes[i];expect(state?.id).toBe(old.id);expect(state?.handle).toBe(old.handle);expect(state?.status).toBe(old.status);expect(registry[old.id]).toBeUndefined();
   expect(Object.hasOwn(state!,'hold')).toBe(true);expect(state!.hold===null||typeof state!.hold?.value==='string').toBe(true);expect(state!.hold?.value.trim()||'').toBe('');
   if(old.status==='ACTIVE')assertActiveState(state,old,live);else{expect(live).toBeNull();expect(state!.publishedAt).toBeNull();expect(state!.resourcePublications.pageInfo.hasNextPage).toBe(false);expect(state!.resourcePublications.nodes.some(p=>p.isPublished)).toBe(false);}
   const price={amount:state!.variants.edges[0]?.node.price||'0',currencyCode:initial.states.shop.currencyCode};
   const node=live||{...state!,priceRange:{minVariantPrice:price,maxVariantPrice:price},variants:{edges:state!.variants.edges.map(({node:v})=>({node:{...v,price:{amount:v.price,currencyCode:price.currencyCode}}}))}} as Node;
   const product=mapShopifyProduct(node),config=dollVueConfigForProduct(product,getCustomizationConfig(product));
   const matching=families.filter((f:any)=>f.products.some((p:any)=>p.id===old.id));
   const groups=matching.map((f:any)=>{const original=f.products.find((p:any)=>p.id===old.id),group=config.groups.find(g=>g.id===original.groupId);return {familyHash:f.referenceFamilyHash,attributes:f.attributes,groupId:original.groupId,selectionMode:group?.selectionMode,visibleWhen:group?.visibleWhen,options:group?.options.map(o=>({id:o.id,label:o.label,reference:o.swatch?.kind==='image'?o.swatch.value:null,classification:classifyAppearance(group,o)})),exactCensusReferences:!!group&&f.choices.every((r:Ref)=>group.options.some(o=>o.id===r.optionId&&o.swatch?.kind==='image'&&o.swatch.value===r.reference))};});
   const sources=productImageSources(product).slice(0,8).map((s,sourcePosition)=>({...s,sourcePosition})) as any[];
   if(sources[0]){const image=await boundedOwnedImage(sources[0].url),file=path.join(nextOutput,`source-${i+1}-0.${image.format==='jpeg'?'jpg':image.format}`);await fs.writeFile(file,image.bytes,{flag:'wx',mode:0o600});Object.assign(sources[0],{file,sha256:image.sha256,width:image.width,height:image.height});}
   rows.push({index:i+1,id:old.id,handle:old.handle,brand:old.brand,status:old.status,publicRuntime:!!live,privateHold:'clear',productType:product.productType,tags:state!.tags,stockStatus:product.extended.stockStatus,scopeFlags:scopeFlags(product.productType,[...product.tags,...state!.tags]),policyExcluded:isDollVueExcluded(product),customerVisible:isCustomerVisibleProduct(product),fingerprint:dollVueReadinessFingerprint(product,config),groups,sources,sourceDecision:'NOT_REVIEWED',ready:false,ownerReviewed:false});
  }
  const sourceSheets=[];for(let n=0;n<rows.length;n+=8){const part=rows.slice(n,n+8),tiles=[];for(const r of part)if(r.sources[0]?.file)tiles.push(await tile(await fs.readFile(r.sources[0].file),`${r.index} | ${r.id.split('/').at(-1)} | p0`,260,340));sourceSheets.push(await sheet(tiles,4,`${subdir}/sources-${n+1}-${n+part.length}.png`,260,340));}
  const final=await read();expect(final).toEqual(initial);const after=await fs.readFile('lib/dollvue/readiness-registry.json');assertRegistryAdditionOnly(registryBytes,after,ids);
  await save('preparation.json',{checkedAt:new Date().toISOString(),input:{file:input,sha256:hash(inputBytes)},families,rows,preservedExclusions:all.filter(p=>!selected.some(s=>s.id===p.id)),referenceEvidence,referenceSheets,sourceSheets,initialStates:initial.states.nodes.map(({id,handle,status,publishedAt,tags,hold,resourcePublications}:any)=>({id,handle,status,publishedAt,tags,hold,resourcePublications})),freshBeforeAfterStateEqual:true,registryBefore:{count:Object.keys(registry).length,sha256:hash(registryBytes)},registryAfter:{count:Object.keys(JSON.parse(after.toString())).length,sha256:hash(after)},registryWritten:false,ownerReviewed:false,readyCount:0,counts});
  console.info(JSON.stringify({output:nextOutput,selected:rows.length,refs:referenceEvidence.length,counts}));
 }finally{vi.unstubAllGlobals();}
},30*60*1000);
const expectedFamilies=[
 ['8cb5ef2d8b99ed2a26bd6342f7f6e579832e6dbaaedb54da88bba257b7b9e9fc',5],
 ['f0665aac1adec8eae4fe3412972480bd9300e9533d35135e825738b0dd052684',5],
 ['eccbfd4b722300d58864872554581f77ea515bdaa22094b5793f027e0da36608',6],
];
type Node=Parameters<typeof mapShopifyProduct>[0];
type State={id:string;handle:string;status:string;publishedAt:string|null;tags:string[];hold:{value:string}|null;
 resourcePublications:{nodes:Array<{isPublished:boolean}>;pageInfo:{hasNextPage:boolean}}};
type AdminNode=Omit<Node,'variants'|'priceRange'> & State & {variants:{edges:Array<{node:Omit<Node['variants']['edges'][number]['node'],'price'> & {price:string}}>}};
type Candidate={id:string;handle:string;brand:string;status:string;inV2Unmatched:boolean;excludedReasons:string[];inventoryReasons:string[];priorReviews?:unknown[]};
type Ref={optionId:string;label:string;reference:string;sha256:string};
function scopeFlags(type:string,tags:string[]){return [type,...tags.filter(t=>t!=='catalog-review-hold')].filter(t=>/head[ -]?only|torso|accessor|ready.to.ship|hold|not-for-launch|excluded/i.test(t));}
function assertActiveState(state:State|null|undefined,identity:{id:string;handle:string},node:Node|null|undefined){
 expect(state).toBeTruthy();expect(state!.id).toBe(identity.id);expect(state!.handle).toBe(identity.handle);
 expect(state!.status).toBe('ACTIVE');expect(state!.publishedAt).toBeTruthy();expect(node?.id).toBe(identity.id);expect(node?.handle).toBe(identity.handle);
 expect(Object.hasOwn(state!,'hold')).toBe(true);expect(state!.hold===null||typeof state!.hold?.value==='string').toBe(true);
 expect(state!.hold?.value.trim()||'').toBe('');expect(state!.resourcePublications.pageInfo.hasNextPage).toBe(false);
 expect(state!.resourcePublications.nodes.some(p=>p.isPublished)).toBe(true);
}
function assertSourceDecision(row:{decision:string;sourcePosition:number|null;sourceSha256:string|null;visiblyAdult:boolean;nonExplicit:boolean;irisVisible:boolean}){
 expect(row.decision).toBe('pass');expect(row.visiblyAdult).toBe(true);expect(row.nonExplicit).toBe(true);expect(row.irisVisible).toBe(true);
 expect(Number.isInteger(row.sourcePosition)).toBe(true);expect(row.sourcePosition).toBeGreaterThanOrEqual(0);expect(row.sourcePosition).toBeLessThanOrEqual(7);
 expect(row.sourceSha256).toMatch(/^[a-f0-9]{64}$/);
}
it('rejects unknown holds, unavailable identities and incomplete publication',()=>{
 const identity={id:'id',handle:'handle'},node=identity as Node;
 const state={...identity,status:'ACTIVE',publishedAt:'2026-10-07',tags:[],hold:null,resourcePublications:{nodes:[{isPublished:true}],pageInfo:{hasNextPage:false}}};
 expect(()=>assertActiveState(state,identity,node)).not.toThrow();
 for(const changed of [{hold:undefined},{hold:{value:'review'}},{status:'DRAFT'},{publishedAt:null},{resourcePublications:{nodes:[],pageInfo:{hasNextPage:true}}}])
 expect(()=>assertActiveState({...state,...changed} as State,identity,node)).toThrow();
 expect(()=>assertActiveState(state,identity,null)).toThrow();
});
it('rejects source ambiguity, explicitness, missing iris detail and out-of-range positions',()=>{
 const row={decision:'pass',sourcePosition:0,sourceSha256:'a'.repeat(64),visiblyAdult:true,nonExplicit:true,irisVisible:true};
 expect(()=>assertSourceDecision(row)).not.toThrow();
 for(const changed of [{decision:'exclude'},{visiblyAdult:false},{nonExplicit:false},{irisVisible:false},{sourcePosition:8},{sourcePosition:-1},{sourcePosition:0.5},{sourcePosition:null},{sourceSha256:null}])
 expect(()=>assertSourceDecision({...row,...changed})).toThrow();
});
it('retains general catalog hold but rejects private scope holds',()=>{
 expect(scopeFlags('Custom Silicone doll',['catalog-review-hold'])).toEqual([]);
 expect(scopeFlags('Custom Silicone doll',['catalog-image-review-hold'])).toHaveLength(1);
});
const fields:Record<string,string>={catalogIdentityKey:'catalog_identity_key',catalogBodyIdentityKey:'catalog_body_identity_key',headModel:'head_model',displayName:'display_name',bodyType:'body_type',lookTags:'look_tags',brand:'brand',sourceTitle:'source_title',sourceHandle:'source_handle',sourceReleaseRank:'source_release_rank',material:'material',heightCm:'height_cm',weightLb:'weight_lb',cupSize:'cup_size',measurements:'measurements',warehouseCountry:'warehouse_country',warehouseRegions:'warehouse_regions',stockStatus:'stock_status',deliveryEstimate:'delivery_estimate',stockLastCheckedAt:'stock_last_checked_at',customAvailable:'custom_available',penisAddOnAvailable:'has_insertable_penis_add_on',irontechUlwEligibility:'irontech_ulw_eligibility',qcNote:'qc_note',customizationGroups:'customization_groups'};
const common=`id handle title description seo{title description} vendor productType tags featuredImage{url altText width height} images(first:50){edges{node{url altText width height}}} ${Object.entries(fields).map(([a,k])=>`${a}:metafield(namespace:"custom",key:"${k}"){value}`).join(' ')}`;
const stateFields='id handle status publishedAt tags hold:metafield(namespace:"custom",key:"catalog_image_review_hold"){value} resourcePublications(first:50){nodes{isPublished} pageInfo{hasNextPage}}';
const sfQuery=`query PiperPreparation($ids:[ID!]!){nodes(ids:$ids){... on Product{${common} priceRange{minVariantPrice{amount currencyCode} maxVariantPrice{amount currencyCode}} variants(first:30){edges{node{id title availableForSale price{amount currencyCode} selectedOptions{name value}}}} media(first:50){edges{node{mediaContentType alt ... on MediaImage{image{url altText width height}} ... on Video{previewImage{url altText width height} sources{url mimeType}}}}}}}}`;
const adminQuery=`query PiperDraftPreparation($ids:[ID!]!){nodes(ids:$ids){... on Product{${common} ${stateFields} variants(first:30){edges{node{id title availableForSale price selectedOptions{name value}}}} media(first:50){edges{node{mediaContentType alt ... on MediaImage{image{url altText width height}} ... on Video{preview{image{url altText width height}} sources{url mimeType}}}}}}} shop{currencyCode}}`;

it.skipIf(process.env.DOLLVUE_PIPER_PREPARATION!=='1')('prepares current Piper iris-family bytes without approval or generation',async()=>{
 const input=path.join(root,'remaining-family-census/other-family-reference-inventory.json'),inputBytes=await fs.readFile(input);
 const inventory=JSON.parse(inputBytes.toString()) as {groups:Array<{referenceFamilyHash:string;brands:string[];attributes:string[];choiceCount:number;choices:Ref[];products:Candidate[]}>};
 const families=inventory.groups.filter(g=>g.brands.includes('Piper Dolls')&&g.attributes.includes('eye-color'));
 expect(families.map(f=>f.choiceCount).sort()).toEqual([5,5,6]);
 expect(families.map(f=>[f.referenceFamilyHash,f.choiceCount])).toEqual(expectedFamilies);
 const registryBytes=await fs.readFile('lib/dollvue/readiness-registry.json'),registry=JSON.parse(registryBytes.toString());
 const selected=[...new Map(families.flatMap(f=>f.products).filter(r=>r.brand==='Piper Dolls'&&r.status==='ACTIVE'&&r.inV2Unmatched&&!r.excludedReasons.length&&!r.inventoryReasons.length).map(r=>[r.id,r])).values()];
 const ids=selected.map(r=>r.id);
 const refs=[...new Map(families.flatMap(f=>f.choices).map(r=>[r.reference,r])).values()];
 await fs.mkdir(output,{recursive:true});
 const save=(name:string,data:unknown)=>fs.writeFile(path.join(output,name),JSON.stringify(data,null,2)+'\n',{flag:'wx',mode:0o600});
 expect(await fs.stat(path.join(output,'candidate-manifest.json')).then(()=>true,()=>false)).toBe(false);
 expect(hasShopifyStorefrontEnv()).toBe(true);
 const counts={storefrontBulkReads:0,adminBulkReads:0,imageReads:0,generationCalls:0,shopifyWrites:0};
 const nativeFetch=globalThis.fetch;
 vi.stubGlobal('fetch',async(input:Parameters<typeof fetch>[0],init?:RequestInit)=>{
  const u=new URL(input instanceof Request?input.url:String(input)),method=init?.method||'GET';
  if(u.hostname===env.SHOPIFY_STORE_DOMAIN&&u.pathname.endsWith('/graphql.json')){
   expect(method).toBe('POST');const b=JSON.parse(String(init?.body));expect(b.query).toMatch(/^query\b/);expect(b.query).not.toMatch(/\bmutation\b/);
   expect(b.variables.ids.length).toBeLessThanOrEqual(50);expect(b.variables.ids.every((id:string)=>ids.includes(id))).toBe(true);
   if(u.pathname.includes('/admin/'))counts.adminBulkReads++;else counts.storefrontBulkReads++;
  }else if(u.hostname===env.SHOPIFY_STORE_DOMAIN&&u.pathname==='/admin/oauth/access_token'){expect(method).toBe('POST');}
  else{expect(method).toBe('GET');expect(isOwnedOptionAsset(u.href)).toBe(true);counts.imageReads++;}
  return nativeFetch(input,init);
 });
 try{
  const nodes=new Map<string,Node|null>(),states=new Map<string,State|null>();
  for(let n=0;n<ids.length;n+=50){const chunk=ids.slice(n,n+50);
   const r=await fetch(`https://${env.SHOPIFY_STORE_DOMAIN}/api/2026-04/graphql.json`,{method:'POST',cache:'no-store',signal:AbortSignal.timeout(60000),headers:{'Content-Type':'application/json',...storefrontAuthHeaders(env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!)},body:JSON.stringify({query:sfQuery,variables:{ids:chunk}})});
   expect(r.ok).toBe(true);const b=await r.json();expect(b.errors).toBeUndefined();expect(b.data.nodes).toHaveLength(chunk.length);
   b.data.nodes.forEach((p:Node|null,i:number)=>{if(p)expect(p.id).toBe(chunk[i]);nodes.set(chunk[i],p);});
   const s=await adminFetch<{nodes:Array<State|null>}>(`query PiperStates($ids:[ID!]!){nodes(ids:$ids){... on Product{${stateFields}}}}`,{ids:chunk});
   expect(s.nodes).toHaveLength(chunk.length);s.nodes.forEach((p,i)=>{if(p)expect(p.id).toBe(chunk[i]);states.set(chunk[i],p);});
  }
  const draftIds=selected.filter(p=>p.status==='DRAFT').map(p=>p.id),drafts=new Map<string,Node>();
  if(draftIds.length){const d=await adminFetch<{nodes:AdminNode[];shop:{currencyCode:string}}>(adminQuery,{ids:draftIds});
   for(const p of d.nodes){expect(p).toBeTruthy();expect(draftIds).toContain(p.id);const price={amount:p.variants.edges[0]?.node.price||'0',currencyCode:d.shop.currencyCode};
    drafts.set(p.id,{...p,priceRange:{minVariantPrice:price,maxVariantPrice:price},variants:{edges:p.variants.edges.map(({node:v})=>({node:{...v,price:{amount:v.price,currencyCode:d.shop.currencyCode}}}))}});
   }
  }
  const checkedAt=new Date().toISOString();await save('current-state-and-holds.json',{checkedAt,rows:[...states.values()],publicationChanged:false});
  async function imageBytes(url:string){
   expect(isOwnedOptionAsset(url)).toBe(true);const r=await fetch(url,{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(20000)});
   expect(r.ok).toBe(true);expect(r.headers.get('content-type')).toMatch(/^image\//);expect(Number(r.headers.get('content-length'))).toBeLessThanOrEqual(20*1024*1024);
   const reader=r.body!.getReader(),chunks:Buffer[]=[];let size=0;try{while(true){const p=await reader.read();if(p.done)break;size+=p.value.length;if(size>20*1024*1024)throw Error('image exceeds bound');chunks.push(Buffer.from(p.value));}}finally{void reader.cancel();}
   const bytes=Buffer.concat(chunks),decoder=sharp(bytes,{limitInputPixels:25000000,animated:true}).timeout({seconds:5}),meta=await decoder.metadata();expect(meta.pages||1).toBe(1);await decoder.clone().raw().toBuffer();
   return {bytes,sha256:hash(bytes),width:meta.width!,height:meta.height!,format:meta.format!};
  }
  const referenceEvidence=[],referenceTiles=[];
  for(const ref of refs.map(r=>({...r,groupId:'eye-color'}))){const local=await fs.readFile(path.join(process.cwd(),'public',ref.reference));expect(hash(local)).toBe(ref.sha256);
   const image=await imageBytes(new URL(ref.reference,'https://dollwow.com').href);expect(image.sha256).toBe(ref.sha256);
   const file=path.join(output,`reference-${ref.sha256}.webp`);await fs.writeFile(file,image.bytes,{flag:'wx',mode:0o600});
   referenceEvidence.push({...ref,file,productionBytesMatch:true,meaningReviewed:false,ownerReviewed:false});
   referenceTiles.push(await tile(image.bytes,'REF '+referenceEvidence.length+' | '+ref.label,260,250));
  }
  await sheet(referenceTiles,5,'all-iris-reference-contact-sheet.png',260,250);
  await save('reference-evidence.json',{checkedAt,references:referenceEvidence,meaningReviewed:false,ownerReviewed:false});
  const rows:any[]=[],excluded:any[]=[];
  for(const [i,old]of selected.entries()){
   try{
    if(registry[old.id])throw Error('already-current-registry');const state=states.get(old.id);expect(state).toBeTruthy();expect(state!.handle).toBe(old.handle);expect(state!.status).toBe(old.status);
    expect(Object.hasOwn(state!,'hold')).toBe(true);expect(state!.hold===null||typeof state!.hold?.value==='string').toBe(true);expect(state!.hold?.value.trim()||'').toBe('');
    if(old.status==='ACTIVE'){expect(state!.publishedAt).toBeTruthy();expect(nodes.get(old.id)).toBeTruthy();}
    else{expect(state!.publishedAt).toBeNull();expect(nodes.get(old.id)).toBeNull();expect(state!.resourcePublications.pageInfo.hasNextPage).toBe(false);expect(state!.resourcePublications.nodes.some(p=>p.isPublished)).toBe(false);}
    const node=nodes.get(old.id)||drafts.get(old.id);expect(node).toBeTruthy();expect(node!.handle).toBe(old.handle);
    const product=mapShopifyProduct(node!),config=dollVueConfigForProduct(product,getCustomizationConfig(product));
    expect(product.extended.brand).toBe('Piper Dolls');expect(isCustomerVisibleProduct(product)).toBe(true);expect(isDollVueExcluded(product)).toBe(false);
    expect(product.extended.stockStatus).toBe('custom');expect(product.productType).toMatch(/^custom\b.*\bdoll\b/i);expect(scopeFlags(product.productType,[...product.tags,...state!.tags])).toEqual([]);
    const family=families.find(f=>f.products.some(p=>p.id===old.id))!;const refs=family.choices;
    const group=config.groups.find(g=>g.id==='eye-color')!;expect(group).toBeDefined();expect(group.selectionMode).toBe('single');expect(group.visibleWhen?.length||0).toBe(0);
    const choices=group.options.filter(o=>classifyAppearance(group,o).status==='candidate').map(o=>({optionId:o.id,label:o.label,reference:o.swatch?.kind==='image'?o.swatch.value:null}));
    expect(choices).toEqual(refs.map(({optionId,label,reference})=>({optionId,label,reference})));
    rows.push({index:i+1,id:old.id,handle:old.handle,status:old.status,currentCheckedAt:checkedAt,displayName:product.extended.displayName||product.title,tags:state!.tags,privateHold:'clear',fingerprint:dollVueReadinessFingerprint(product,config),referenceFamilyHash:family.referenceFamilyHash,choices:refs.map(r=>({groupId:group.id,...r})),hairEnabled:false,sources:productImageSources(product).slice(0,8).map((s,sourcePosition)=>({...s,sourcePosition})),sourceVisualReview:'NOT_REVIEWED',ready:false});
   }catch(e){excluded.push({index:i+1,id:old.id,handle:old.handle,reason:e instanceof Error?e.message:String(e)});}
  }
  await save('current-family-candidates.json',{checkedAt,selected:ids.length,rows,excluded});
  console.info(JSON.stringify({phase:'current-identity-menu-holds',matching:rows.length,excluded:excluded.length,...counts}));
  let cursor=0;const mode=process.env.DOLLVUE_PIPER_IMAGES==='all'?'all':'lead';
  async function worker(){while(cursor<rows.length){const row=rows[cursor++];for(const source of row.sources.filter((s:any)=>mode==='all'||s.sourcePosition===0)){
   try{const image=await imageBytes(source.url),file=path.join(output,`source-${row.index}-${source.sourcePosition}.${image.format==='jpeg'?'jpg':image.format}`);await fs.writeFile(file,image.bytes,{flag:'wx',mode:0o600});Object.assign(source,{file,sha256:image.sha256,decodedWidth:image.width,decodedHeight:image.height,byteLength:image.bytes.length});}
   catch(e){source.error=e instanceof Error?e.message:String(e);}
  }console.info(JSON.stringify({phase:'photos',index:row.index,total:rows.length}));}}
  await Promise.all(Array.from({length:4},worker));
  const sheets=[];
  for(let start=0;start<rows.length;start+=8){const part=rows.slice(start,start+8),tiles=[];
   for(const row of part)for(const s of row.sources.filter((s:any)=>mode==='all'||s.sourcePosition===0))if(s.file)tiles.push(await tile(await fs.readFile(s.file),`${row.index} | ${row.id.split('/').at(-1)} | p${s.sourcePosition}`,220,290));
   const name=`source-candidates-${part[0].index}-${part.at(-1).index}.png`;sheets.push(await sheet(tiles,mode==='all'?8:4,name,220,290));
  }
  const finalStates=[];
  for(let n=0;n<ids.length;n+=50){
   const s=await adminFetch<{nodes:Array<State|null>}>(`query PiperStates($ids:[ID!]!){nodes(ids:$ids){... on Product{${stateFields}}}}`,{ids:ids.slice(n,n+50)});
   finalStates.push(...s.nodes);
  }
  expect(finalStates).toEqual([...states.values()]);
  await save('final-state-and-holds.json',{checkedAt:new Date().toISOString(),rows:finalStates});
  const latest=JSON.parse(await fs.readFile('lib/dollvue/readiness-registry.json','utf8'));
  const summary={selected:ids.length,currentMatching:rows.length,hairEnabled:0,excluded:excluded.length,sourceImagesPrepared:rows.reduce((n,r)=>n+r.sources.filter((s:any)=>s.file).length,0),sourceApproved:0,reviewReady:0,referenceMeaningReviewed:false,...counts};
  await save('candidate-manifest.json',{checkedAt,completedAt:new Date().toISOString(),summary,rows,excluded,contactSheets:sheets,referenceEvidence,families,inputs:[{file:input,sha256:hash(inputBytes)}],registryInputSha256:hash(registryBytes),concurrentRegistryAdditions:rows.filter(r=>latest[r.id]).map(r=>r.id),registryWritten:false,publicationChanged:false,ownerReviewed:false});
  console.info(JSON.stringify({output,...summary}));
 }finally{vi.unstubAllGlobals();}
},40*60*1000);

async function tile(bytes:Buffer,label:string,width:number,height:number){const image=await sharp(bytes).autoOrient().resize(width,height-35,{fit:'contain',background:'#eee'}).png().toBuffer();const text=label.replaceAll('&','&amp;').replaceAll('<','&lt;');return sharp({create:{width,height,channels:3,background:'#fff'}}).composite([{input:image,top:0,left:0},{input:Buffer.from(`<svg width="${width}" height="35"><text x="4" y="22" font-size="12" font-family="Arial">${text}</text></svg>`),top:height-35,left:0}]).png().toBuffer();}
async function sheet(tiles:Buffer[],columns:number,name:string,width:number,height:number){expect(tiles.length).toBeGreaterThan(0);const bytes=await sharp({create:{width:columns*width,height:Math.ceil(tiles.length/columns)*height,channels:3,background:'#fff'}}).composite(tiles.map((input,i)=>({input,left:(i%columns)*width,top:Math.floor(i/columns)*height}))).png().toBuffer();const file=path.join(output,name);await fs.writeFile(file,bytes,{flag:'wx',mode:0o600});return {file,sha256:hash(bytes)};}

async function parentApprovedInputs(){
 const bytes=await fs.readFile(path.join(output,'parent-input-approval.json'));
 expect(hash(bytes)).toBe('abbc5a30ee677bb55aca60a97dd4c70ccb3802db3eb1d1d03d0c33f78a94fda5');
 const approval=JSON.parse(bytes.toString());
 expect(approval).toMatchObject({frozen:true,reviewer:'parent-assistant',ownerReviewed:false,humanApproval:false,parentApproved:true,generationAuthorized:false,activationAuthorized:false});
 for(const input of approval.inputs)expect(hash(await fs.readFile(path.join(output,input.file)))).toBe(input.sha256);
 const proposal=JSON.parse(await fs.readFile(path.join(output,'candidate-proposal.json'),'utf8'));
 const review=JSON.parse(await fs.readFile(path.join(output,'frozen-assistant-review.json'),'utf8'));
 expect(proposal.proposed.map((r:any)=>r.index).sort((a:number,b:number)=>a-b)).toEqual(approval.acceptedSourceIndices);
 expect(review.references).toHaveLength(15);
 for(const p of proposal.proposed)expect(hash(await fs.readFile(p.sourceFile))).toBe(p.sourceSha256);
 for(const r of review.references)expect(hash(await fs.readFile(r.file))).toBe(r.sha256);
 return {approval,proposal,review,approvalSha256:hash(bytes)};
}

function unusedProviderCall(calls:number){if(calls!==0)throw Error('Pilot authorization consumed; retry and fallback forbidden');}
it.skipIf(process.env.DOLLVUE_IL_IRIS_RUNTIME!=='1'&&process.env.DOLLVUE_AI_IRIS_RUNTIME!=='1'&&process.env.DOLLVUE_IL_FINALIZE!=='1'&&process.env.DOLLVUE_AI_FINALIZE!=='1')('checks assigned iris choices with separately gated finalization',async()=>{
 const ai=process.env.DOLLVUE_AI_IRIS_RUNTIME==='1'||process.env.DOLLVUE_AI_FINALIZE==='1',directory=ai?path.join(output,'next-ai-tech-tantaly'):nextOutput;
 const finalize=process.env.DOLLVUE_IL_FINALIZE==='1'||process.env.DOLLVUE_AI_FINALIZE==='1';expect(ai&&process.env.DOLLVUE_IL_FINALIZE==='1').toBe(false);
 let parentVerdict:any=null,parentVerdictSha256:string|undefined;
 let nativeFidelityReview:any=null,nativeFidelitySha256:string|undefined;
 const batchRegistryBefore=await fs.readFile('lib/dollvue/readiness-registry.json'),finalizedReports:any[]=[];
 if(finalize&&ai){
  const bytes=await fs.readFile(path.join(directory,'pilot-ai-iris/native-output-review.json'));nativeFidelitySha256=hash(bytes);expect(nativeFidelitySha256).toBe('33ab2955e72d2d3bb2f97e515bc10247c368b7fe6d07916f71cb385d527c52c1');nativeFidelityReview=JSON.parse(bytes.toString());
  expect(nativeFidelityReview).toMatchObject({frozen:true,reviewer:'assistant-native-image-review',ownerReviewed:false,parentOutputReviewed:false,verdict:'PASS_WITH_MINOR_VARIATION',providerCalls:1,routeCalls:1,postflightPassed:true});
  expect(hash(await fs.readFile(path.join(directory,'parent-pilot-authorization.json')))).toBe(nativeFidelityReview.authorizationSha256);
  expect(hash(await fs.readFile(path.join(directory,'pilot-input-ai-iris.json')))).toBe(nativeFidelityReview.inputSha256);expect(hash(await fs.readFile(path.join(directory,'pilot-ai-iris/output.webp')))).toBe(nativeFidelityReview.outputSha256);
  const result=JSON.parse(await fs.readFile(path.join(directory,'pilot-ai-iris/result.json'),'utf8'));expect(result).toMatchObject({providerCalls:1,routeCalls:1,routeStatus:200,postflightPassed:true,inputSha256:nativeFidelityReview.inputSha256,outputSha256:nativeFidelityReview.outputSha256,providerRequestSha256:nativeFidelityReview.providerRequestSha256});
 }
 if(finalize&&!ai){
  const bytes=await fs.readFile(path.join(directory,'parent-pilot-verdict.json'));parentVerdictSha256=hash(bytes);expect(parentVerdictSha256).toBe('4198ac56aebbae91d536ac858d4dd89266d83ee8c77e49fc41d1bef3eee59751');parentVerdict=JSON.parse(bytes.toString());
  expect(parentVerdict).toMatchObject({frozen:true,reviewer:'parent-assistant',ownerReviewed:false,verdict:'PASS_MINOR_VARIATION_ACCEPTED',productId:'gid://shopify/Product/10518036086968',sourceIndex:37,sourcePosition:0,parentAllSourcesReviewed:false,finalizeSingleILSubsetAuthorized:true,registryMutationAuthorized:false});
  expect(hash(await fs.readFile(path.join(directory,parentVerdict.inputFile)))).toBe(parentVerdict.inputSha256);expect(hash(await fs.readFile(path.join(directory,parentVerdict.outputFile)))).toBe(parentVerdict.outputSha256);
  const result=JSON.parse(await fs.readFile(path.join(directory,'pilot-il-iris/result.json'),'utf8'));expect(result).toMatchObject({providerCalls:1,routeCalls:1,routeStatus:200,postflightPassed:true,inputSha256:parentVerdict.inputSha256,outputSha256:parentVerdict.outputSha256,providerRequestSha256:parentVerdict.providerRequestSha256});
 }
 const prepBytes=await fs.readFile(path.join(directory,'preparation.json')),prep=JSON.parse(prepBytes.toString());
 const pilotBytes=await fs.readFile(path.join(directory,ai?'pilot-input-ai-iris.json':'pilot-input-il-iris.json'));expect(hash(pilotBytes)).toBe(ai?'e5ca4437e0272ef138a45a92e38f5888cae3563266689f05b4f609619a604bc6':'0e86115158fcb64a945d2e40b753020ad369d6a229dcbb590b3d57946480610d');
 const pilot=JSON.parse(pilotBytes.toString()),reviewBytes=await fs.readFile(path.join(directory,'native-review-notes.json')),review=JSON.parse(reviewBytes.toString());
 expect(hash(prepBytes)).toBe(pilot.preparationSha256);expect(hash(reviewBytes)).toBe(pilot.nativeReviewNotesSha256);expect(review.ownerReviewed).toBe(false);
 const selected=prep.rows.filter((r:any)=>(ai?[5,6]:[37]).includes(r.index));expect(selected).toHaveLength(ai?2:1);
 for(const row of selected){
 const sourceReview=(ai?review.acceptedForPrivateInputReview:review.acceptedForPilot).find((r:any)=>r.index===row.index);expect(sourceReview).toMatchObject({sourcePosition:0,visiblyAdult:true,nonExplicit:true,irisVisible:true});
 const source=row.sources[0],family=prep.families.find((f:any)=>f.referenceFamilyHash===pilot.familyHash);
 const choices:DollVueReadinessRecord['choices']=family.choices.map((r:Ref)=>({groupId:'eye-color',optionId:r.optionId,reference:r.reference}));expect(choices).toHaveLength(ai?3:9);
 const pins:Record<string,string>={[source.url]:source.sha256,...Object.fromEntries(family.choices.map((r:Ref)=>[r.reference,r.sha256]))};
 const registryBefore=await fs.readFile('lib/dollvue/readiness-registry.json');expect(JSON.parse(registryBefore.toString())[row.id]).toBeUndefined();
 const nativeFetch=globalThis.fetch,counts={adminReads:0,storefrontReads:0,imageReads:0,cartPasses:0,rejectionChecks:0,generationCalls:0,remoteWrites:0};
 vi.stubGlobal('fetch',async(input:Parameters<typeof fetch>[0],init?:RequestInit)=>{
  const u=new URL(input instanceof Request?input.url:String(input)),method=init?.method||(input instanceof Request?input.method:'GET');
  if(u.hostname===env.SHOPIFY_STORE_DOMAIN&&u.pathname.endsWith('/graphql.json')){expect(method).toBe('POST');const b=JSON.parse(String(init?.body));expect(b.query.trim()).toMatch(/^query\b/);expect(b.query).not.toMatch(/\bmutation\b/);if(b.variables.ids)expect(b.variables.ids).toEqual([row.id]);if(b.variables.handle)expect(b.variables.handle).toBe(row.handle);if(u.pathname.includes('/admin/'))counts.adminReads++;else counts.storefrontReads++;}
  else if(u.hostname===env.SHOPIFY_STORE_DOMAIN&&u.pathname==='/admin/oauth/access_token')expect(method).toBe('POST');
  else{expect(method).toBe('GET');expect(Object.keys(pins).map(p=>new URL(p,'https://dollwow.com').href)).toContain(u.href);counts.imageReads++;}
  return nativeFetch(input,init);
 });
 const current=async()=>{
  const product=await storefrontModule.getProductByHandle(row.handle,{strict:true,cache:'no-store'}),state=await adminFetch<{nodes:Array<State|null>}>(`query ILRuntimeState($ids:[ID!]!){nodes(ids:$ids){... on Product{${stateFields}}}}`,{ids:[row.id]});
  assertActiveState(state.nodes[0],row,product as unknown as Node);expect(product?.extended.brand).toBe(ai?'Ai-Tech':'IL Doll');expect(product?.extended.stockStatus).toBe('custom');expect(isDollVueExcluded(product!)).toBe(false);expect(isCustomerVisibleProduct(product!)).toBe(true);expect(scopeFlags(product!.productType,[...product!.tags,...state.nodes[0]!.tags])).toEqual([]);
  const config=dollVueConfigForProduct(product!,getCustomizationConfig(product!));expect(dollVueReadinessFingerprint(product!,config)).toBe(row.fingerprint);expect(productImageSources(product!)[0].url).toBe(source.url);
  const group=config.groups.find(g=>g.id==='eye-color')!;expect(group.selectionMode).toBe('single');expect(group.visibleWhen?.length||0).toBe(0);expect(group.options.filter(o=>classifyAppearance(group,o).status==='candidate').map(o=>({groupId:group.id,optionId:o.id,reference:o.swatch?.value}))).toEqual(choices);
  for(const [url,sha256]of Object.entries(pins)){const file=url===source.url?source.file:prep.referenceEvidence.find((r:any)=>r.reference===url).file;expect(hash(await fs.readFile(file))).toBe(sha256);expect((await boundedOwnedImage(new URL(url,'https://dollwow.com').href)).sha256).toBe(sha256);}
  return {product:product!,config,state:state.nodes[0]};
 };
 try{
  const before=await current(),{product,config}=before;
  const prospective:DollVueReadinessRecord={productId:row.id,policy:DOLLVUE_APPEARANCE_POLICY,status:'ready',fingerprint:row.fingerprint,sourcePositions:[0],imageDigests:pins,choices};
  const evaluation=evaluateDollVueReadiness(product,config,prospective,{published:true,contentExcluded:false});expect(evaluation.ready).toBe(true);const menu=reviewedDollVueConfig(config,evaluation,'public');
  const record:DollVueReadinessRecord={...prospective,status:finalize?'ready':'needs-review'};expect(evaluateDollVueReadiness(product,config,record,{published:true,contentExcluded:false}).ready).toBe(finalize);
  const lookup=vi.spyOn(storefrontModule,'getProductByHandle').mockImplementation(async(handle,opts)=>{expect(handle).toBe(row.handle);expect(opts).toMatchObject({strict:true,cache:'no-store'});return product;});
  const eligible=vi.spyOn(eligibilityModule,'resolveCurrentDollVueEligibility').mockResolvedValue({available:true,config:menu,sourcePositions:[0],revision:row.fingerprint,imageDigests:pins});
  const origin=new URL(env.NEXT_PUBLIC_SITE_URL).origin,variant=product.variants.find(v=>v.availableForSale)!;expect(variant).toBeDefined();const checks=[];
  const request=(selections:Array<{groupId:string;optionId:string}>,o=origin)=>new Request(`${origin}/dollvue/cart`,{method:'POST',headers:{Origin:o,'Content-Type':'application/json'},body:JSON.stringify({productHandle:row.handle,selections})});
  try{
   for(const choice of choices){expect(areDollVueSelectionsValid(menu,[choice])).toBe(true);expect(isOptionAvailableForCheckout(menu,choice.groupId,choice.optionId)).toBe(true);
    const now=new Date(),initial=promotionPricingForSelections(product,menu,{},now).config,selections={...getDefaultSelections(initial),'eye-color':choice.optionId};
    const priced=promotionPricingForSelections(product,menu,selections,now).config,resolved=resolveCustomization(priced,selections,Number(variant.price.amount));expect(resolved.issues).toEqual([]);expect(resolved.requiresPriceConfirmation).toBe(false);
    const response=await cartPOST(request([choice]));expect(response.status).toBe(200);expect(response.headers.get('cache-control')).toBe('no-store');const payload=await response.json(),name=productDisplayName(product);
    expect(payload.item).toMatchObject({merchandiseId:variant.id,productHandle:row.handle,unitPrice:resolved.totalPrice,currencyCode:variant.price.currencyCode,readyToShip:false,selections:resolved.selections});expect(payload.item.attributes).toEqual([...(name?[{key:'DollWow Reference Name',value:name}]:[]),...resolved.cartAttributes]);
    expect(payload.item.customizationCharge).toEqual(resolved.optionPriceDelta>0?{amount:resolved.optionPriceDelta,currencyCode:variant.price.currencyCode,title:name||productPublicTitle(product),items:resolved.selectedOptions.filter(o=>o.priceDelta>0).map(o=>({group:o.groupLabel,label:o.optionLabel,amount:o.priceDelta}))}:undefined);
    checks.push({choice,resolved,payload,status:response.status});counts.cartPasses++;
   }
   for(const [selections,status,o]of [[choices.slice(0,1),403,'https://untrusted.invalid'],[choices.slice(0,2),409,origin],[[{groupId:'hairstyle',optionId:'no-1'}],409,origin],[[{groupId:'eye-color',optionId:'unknown'}],409,origin]] as const){expect((await cartPOST(request([...selections],o))).status).toBe(status);counts.rejectionChecks++;}
   eligible.mockResolvedValueOnce({available:false,config:menu,sourcePositions:[],revision:row.fingerprint,imageDigests:pins});expect((await cartPOST(request([choices[0]]))).status).toBe(404);counts.rejectionChecks++;
  }finally{lookup.mockRestore();eligible.mockRestore();}
  const after=await current();expect(after).toEqual(before);const registryVerification=assertRegistryAdditionOnly(registryBefore,await fs.readFile('lib/dollvue/readiness-registry.json'),[row.id]);
  if(finalize&&!ai){expect(hash(await fs.readFile(path.join(directory,'parent-pilot-verdict.json')))).toBe(parentVerdictSha256);expect(hash(await fs.readFile(path.join(directory,parentVerdict.outputFile)))).toBe(parentVerdict.outputSha256);}
  if(finalize&&ai){expect(hash(await fs.readFile(path.join(directory,'pilot-ai-iris/native-output-review.json')))).toBe(nativeFidelitySha256);expect(hash(await fs.readFile(path.join(directory,'pilot-ai-iris/output.webp')))).toBe(nativeFidelityReview.outputSha256);}
  expect(hash(await fs.readFile(path.join(directory,'native-review-notes.json')))).toBe(hash(reviewBytes));
  const reportFile=path.join(directory,`${finalize?'ready-proposal-1':'runtime-candidate-checks'}-${registryVerification.beforeCount}-${row.index}-${Date.now()}.json`);
  await fs.writeFile(reportFile,JSON.stringify({checkedAt:new Date().toISOString(),status:finalize?'EXACT_ONE_READY_PRIVATE_PROPOSAL_NOT_INTEGRATED':'PRIVATE_NEEDS_REVIEW_NOT_INTEGRATED',ownerReviewed:false,sourceReviewer:'assistant-native-image-review',sourceReview,nativeReviewNotesSha256:hash(reviewBytes),pilotInputSha256:hash(pilotBytes),parentSourceReviewClaimed:false,parentOutputSpotcheck:finalize&&!ai?'PASS_MINOR_VARIATION_ACCEPTED':ai&&finalize?'pending':'NO_NEW_PARENT_OUTPUT_VERDICT',parentPilotVerdict:parentVerdict,parentPilotVerdictSha256:parentVerdictSha256,nativeFidelityReview,nativeFidelitySha256,records:{[row.id]:record},beforeState:before.state,afterState:after.state,imageDigests:pins,counts,checks,registrySha256:hash(registryBefore),registryCount:registryVerification.beforeCount,registryVerification,registryWritten:false,actualGenerationCalls:0,remoteWrites:0,testScope:finalize?'Private ready proposal under the explicitly bound finalization authority and fidelity review. Source/reference review is native assistant review. Actual local cart checks with test-only eligibility; no hosted activation, cart creation or registry mutation.':'Actual local cart handler with test-only prospective eligibility and fresh strict Storefront lookup. No hosted readiness, cart creation or ready-record persistence.'},null,2)+'\n',{flag:'wx',mode:0o600});
  finalizedReports.push({file:reportFile,sha256:hash(await fs.readFile(reportFile)),records:{[row.id]:record},counts});
  console.info(JSON.stringify({reportFile,counts,registryVerification}));
 }finally{vi.restoreAllMocks();vi.unstubAllGlobals();}
 }
 if(ai&&finalize){
  const registryVerification=assertRegistryAdditionOnly(batchRegistryBefore,await fs.readFile('lib/dollvue/readiness-registry.json'),selected.map((r:any)=>r.id));
  const pilot=JSON.parse(pilotBytes.toString()),result=JSON.parse(await fs.readFile(path.join(directory,'pilot-ai-iris/result.json'),'utf8'));
  const comparison=await sheet([await tile(await fs.readFile(pilot.source.file),'6 | 10518035431608 | p0 SOURCE',450,650),await tile(await fs.readFile(pilot.references[0].file),'GREEN IRIS REFERENCE',450,650),await tile(await fs.readFile(result.output),'ONE-CALL OUTPUT | NATIVE PASS',450,650)],3,'next-ai-tech-tantaly/pilot-ai-iris/comparison.png',450,650);
  const records=Object.assign({},...finalizedReports.map(r=>r.records));expect(Object.keys(records)).toHaveLength(2);
  const file=path.join(directory,`ready-proposal-2-${registryVerification.beforeCount}-${Date.now()}.json`);
  await fs.writeFile(file,JSON.stringify({checkedAt:new Date().toISOString(),status:'EXACT_TWO_READY_PRIVATE_PROPOSAL_NOT_INTEGRATED',records,ownerReviewed:false,sourceReviewer:'assistant-native-image-review',parentSourceReviewClaimed:false,parentOutputReviewed:false,parentOutputSpotcheck:'pending',nativeFidelityReview,nativeFidelitySha256,pilotInputSha256:hash(pilotBytes),comparison,verificationReports:finalizedReports,registryVerification,registryWritten:false,generationCallsDuringFinalization:0,totalHistoricalPilotCalls:1,summary:{readyRecords:2,irisChoicesPerRecord:3,uniqueImageBindings:5,cartPasses:6,rejectionChecks:10},authority:'User authorized finishing two if native output passes. Parent reviewed representative input only; output comparison supplied for spotcheck. No registry writes.'},null,2)+'\n',{flag:'wx',mode:0o600});console.info(JSON.stringify({file,comparison}));
 }
},5*60*1000);
it.skipIf(process.env.DOLLVUE_IL_IRIS_PILOT!=='1'&&process.env.DOLLVUE_AI_IRIS_PILOT!=='1')('executes one authorized native-reviewed iris pilot with no retry',async()=>{
 const ai=process.env.DOLLVUE_AI_IRIS_PILOT==='1',directory=ai?path.join(output,'next-ai-tech-tantaly'):nextOutput;
 const inputFile=path.join(directory,ai?'pilot-input-ai-iris.json':'pilot-input-il-iris.json'),inputBytes=await fs.readFile(inputFile),inputSha256=hash(inputBytes);
 expect(inputSha256).toBe(ai?'e5ca4437e0272ef138a45a92e38f5888cae3563266689f05b4f609619a604bc6':'0e86115158fcb64a945d2e40b753020ad369d6a229dcbb590b3d57946480610d');
 const pilot=JSON.parse(inputBytes.toString()),notes=await fs.readFile(path.join(directory,'native-review-notes.json'));
 expect(hash(notes)).toBe(pilot.nativeReviewNotesSha256);
 let authorizationSha256:string|undefined;
 if(ai){const bytes=await fs.readFile(path.join(directory,'parent-pilot-authorization.json'));authorizationSha256=hash(bytes);expect(authorizationSha256).toBe('5a600a18c647db93ef3f7cfa65df2b771be7962b9fe866f347735659e0c5bada');
  const auth=JSON.parse(bytes.toString());expect(auth).toMatchObject({frozen:true,ownerReviewed:false,inputSha256,maxRouteCalls:1,maxProviderCalls:1,noRetries:true,noFallbacks:true,productId:pilot.productId,sourceIndex:6,sourcePosition:0});
  expect(hash(await fs.readFile(pilot.inputSheet.file))).toBe(auth.inputSheetSha256);expect(JSON.parse(notes.toString()).acceptedForPrivateInputReview.find((r:any)=>r.index===6)).toMatchObject({visiblyAdult:true,nonExplicit:true,irisVisible:true,sourcePosition:0});
  expect(pilot.choices).toEqual([{groupId:'eye-color',optionId:'green',reference:'/option-assets/cd59d8c43f47f6bd89505085b053b6319451ef0e1a440b2e8de2bc942a65e84e.webp'}]);
 }else{expect(pilot.sourceReview).toMatchObject({index:37,sourcePosition:0,visiblyAdult:true,nonExplicit:true,irisVisible:true});expect(pilot.authority).toMatchObject({maxRouteCalls:1,maxProviderCalls:1,noRetries:true,noFallbacks:true});expect(pilot.choices).toEqual([{groupId:'eye-color',optionId:'no-2',reference:'/option-assets/155844f00641124801002fc81b6d40380668f1fd9f34b837d61bafa3b8123ef9.webp'}]);}
 const registryBefore=await fs.readFile('lib/dollvue/readiness-registry.json');expect(JSON.parse(registryBefore.toString())[pilot.productId]).toBeUndefined();
 const dir=path.join(directory,ai?'pilot-ai-iris':'pilot-il-iris');await fs.mkdir(dir,{recursive:true,mode:0o700});
 const save=(name:string,data:unknown)=>fs.writeFile(path.join(dir,name),JSON.stringify(data,null,2)+'\n',{flag:'wx',mode:0o600});
 for(const name of ['route-reservation.json','provider-reservation.json'])expect(await fs.stat(path.join(dir,name)).then(()=>true,()=>false),'Existing reservation consumes authorization').toBe(false);
 const refs=pilot.references as Array<{url:string;file:string;sha256:string}>,origin=new URL(env.NEXT_PUBLIC_SITE_URL).origin;
 expect(origin).toMatch(/^https:\/\/(www\.)?dollwow\.com$/);
 const pins:Record<string,string>={[pilot.source.url]:pilot.source.sha256,...Object.fromEntries(refs.map(r=>[r.url,r.sha256]))};
 let calls=0,routeCalls=0,expectedImages:string[]=[],normalPrompt='',caught:unknown;
 let eligible:ReturnType<typeof vi.spyOn>|undefined;
 const beforeMail=pilotFixture.mailCalls,beforeAccount=pilotFixture.accountWrites,result:Record<string,unknown>={inputSha256,authorizationSha256,productId:pilot.productId,sourceFile:pilot.source.file,sourceSha256:pilot.source.sha256,referenceSha256:refs.map(r=>r.sha256),ownerReviewed:false,parentSpotcheck:'pending',ready:false,registryWritten:false,remoteCatalogWrites:0,customerMailSent:false};
 const nativeFetch=globalThis.fetch;
 vi.stubGlobal('fetch',async(input:Parameters<typeof fetch>[0],init?:RequestInit)=>{
  const u=new URL(input instanceof Request?input.url:String(input)),method=init?.method||(input instanceof Request?input.method:'GET');
  if(u.href==='https://api.venice.ai/api/v1/image/multi-edit'){
   unusedProviderCall(calls);expect(routeCalls).toBe(1);expect(method).toBe('POST');const bytes=Buffer.from(String(init?.body)),body=JSON.parse(bytes.toString());
   expect(body.modelId).toBe('seedream-v5-pro-edit');expect(body.images).toEqual(expectedImages);expect(body.images).toHaveLength(2);expect(body.prompt).toBe(normalPrompt);
   expect(body.prompt).toContain('Transfer only the visible iris color only');expect(body.prompt).toContain('Do not copy the reference image');expect(body.prompt).toContain('Keep every unselected attribute unchanged');
   const requestSha256=hash(bytes),imageSha256=body.images.map((s:string)=>hash(Buffer.from(s.split(',')[1],'base64')));
   expect(imageSha256[0]).toBe(pilot.source.sha256);
   await save('provider-reservation.json',{reservedAt:new Date().toISOString(),inputSha256,authorizationSha256,requestSha256,maxProviderCalls:1,noRetries:true,noFallbacks:true,imageSha256,originalImageDigests:pins});
   await fs.writeFile(path.join(dir,'provider-request.json'),bytes,{flag:'wx',mode:0o600});
   await save('provider-request-summary.json',{requestSha256,model:body.modelId,prompt:body.prompt,promptSha256:hash(Buffer.from(body.prompt)),imageSha256});
   calls++;result.providerRequestSha256=requestSha256;const response=await nativeFetch(input,init);result.providerStatus=response.status;await save('provider-response-status.json',{status:response.status});return response;
  }
  if(u.hostname===env.SHOPIFY_STORE_DOMAIN&&u.pathname.endsWith('/graphql.json')){expect(method).toBe('POST');const body=JSON.parse(String(init?.body));expect(body.query.trim()).toMatch(/^query\b/);expect(body.query).not.toMatch(/\bmutation\b/);if(body.variables.ids)expect(body.variables.ids).toEqual([pilot.productId]);if(body.variables.handle)expect(body.variables.handle).toBe(pilot.handle);}
  else if(u.hostname===env.SHOPIFY_STORE_DOMAIN&&u.pathname==='/admin/oauth/access_token')expect(method).toBe('POST');
  else{expect(method).toBe('GET');expect([pilot.source.url,...refs.map(r=>new URL(r.url,origin).href)]).toContain(u.href);expect(init?.cache).toBe('no-store');}
  return nativeFetch(input,init);
 });
 async function current(stage:string){
  const product=await storefrontModule.getProductByHandle(pilot.handle,{strict:true,cache:'no-store'});expect(product?.id).toBe(pilot.productId);
  const state=await adminFetch<{nodes:Array<State|null>}>(`query ILPilotState($ids:[ID!]!){nodes(ids:$ids){... on Product{${stateFields}}}}`,{ids:[pilot.productId]});
  assertActiveState(state.nodes[0],{id:pilot.productId,handle:pilot.handle},product as unknown as Node);expect(isCustomerVisibleProduct(product!)).toBe(true);expect(isDollVueExcluded(product!)).toBe(false);expect(product!.extended.brand).toBe(ai?'Ai-Tech':'IL Doll');expect(product!.extended.stockStatus).toBe('custom');expect(scopeFlags(product!.productType,[...product!.tags,...state.nodes[0]!.tags])).toEqual([]);
  const config=dollVueConfigForProduct(product!,getCustomizationConfig(product!));expect(dollVueReadinessFingerprint(product!,config)).toBe(pilot.fingerprint);expect(productImageSources(product!)[0].url).toBe(pilot.source.url);
  const record:DollVueReadinessRecord={productId:pilot.productId,policy:DOLLVUE_APPEARANCE_POLICY,status:'ready',fingerprint:pilot.fingerprint,sourcePositions:[0],imageDigests:pins,choices:pilot.choices};
  const readiness=evaluateDollVueReadiness(product!,config,record,{published:true,contentExcluded:false});expect(readiness.ready).toBe(true);const menu=reviewedDollVueConfig(config,readiness,'public');expect(areDollVueSelectionsValid(menu,pilot.choices)).toBe(true);
  expect(hash(await fs.readFile(pilot.source.file))).toBe(pilot.source.sha256);for(const ref of refs){expect(hash(await fs.readFile(ref.file))).toBe(ref.sha256);expect(hash(await fs.readFile(path.join(process.cwd(),'public',ref.url)))).toBe(ref.sha256);}
  const images=[await normalizeReviewedImage({url:pilot.source.url,sha256:pilot.source.sha256,origin})];for(const ref of refs)images.push(await normalizeReviewedImage({url:ref.url,sha256:ref.sha256,origin,optionReference:true}));
  const prompt=buildDollVuePrompt(product!,resolveDollVueSelections(menu,pilot.choices));
  if(stage==='after'){expect(images).toEqual(expectedImages);expect(prompt).toBe(normalPrompt);}
  await save(stage+'-current-verification.json',{checkedAt:new Date().toISOString(),state:state.nodes[0],fingerprint:pilot.fingerprint,sourcePosition:0,imageDigests:pins,normalizedImageSha256:images.map(s=>hash(Buffer.from(s.split(',')[1],'base64'))),normalRoutePromptSha256:hash(Buffer.from(prompt))});
  return {product:product!,menu,images,prompt};
 }
 try{
  const before=await current('before');expectedImages=before.images;normalPrompt=before.prompt;
  eligible=vi.spyOn(eligibilityModule,'resolveCurrentDollVueEligibility').mockImplementation(async product=>{expect(product.id).toBe(pilot.productId);expect(dollVueReadinessFingerprint(product,dollVueConfigForProduct(product,getCustomizationConfig(product)))).toBe(pilot.fingerprint);return {available:true,config:before.menu,sourcePositions:[0],revision:pilot.fingerprint,imageDigests:pins};});
  const body=JSON.stringify({productHandle:pilot.handle,sourcePosition:0,selections:pilot.choices.map(({groupId,optionId}:{groupId:string;optionId:string})=>({groupId,optionId}))});
  await save('route-reservation.json',{reservedAt:new Date().toISOString(),inputSha256,authorizationSha256,routeRequestSha256:hash(Buffer.from(body)),normalPromptSha256:hash(Buffer.from(normalPrompt)),maxRouteCalls:1});
  await fs.writeFile(path.join(dir,'route-request.json'),body,{flag:'wx',mode:0o600});routeCalls++;
  const response=await generatePOST(new Request(`${origin}/dollvue/generate`,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','x-vercel-ip-country':'US'},body}));
  const payload=await response.json();result.routeStatus=response.status;result.routeError=payload.error;
  if(payload.previewDataUrl){const bytes=Buffer.from(payload.previewDataUrl.split(',')[1],'base64'),file=path.join(dir,'output.webp');await fs.writeFile(file,bytes,{flag:'wx',mode:0o600});const meta=await sharp(bytes).metadata();result.output=file;result.outputSha256=hash(bytes);result.dimensions={width:meta.width,height:meta.height};}
  expect(response.status,String(payload.error)).toBe(200);expect(calls).toBe(1);expect(payload.emailDelivered).toBe(false);expect(pilotFixture.mailCalls-beforeMail).toBe(1);expect(pilotFixture.accountWrites-beforeAccount).toBe(1);
 }catch(error){caught=error;result.error=error instanceof Error?error.message:String(error);}
 finally{
  eligible?.mockRestore();try{await current('after');result.postflightPassed=true;}catch(error){result.postflightPassed=false;result.postflightError=error instanceof Error?error.message:String(error);caught ||= error;}
  const after=await fs.readFile('lib/dollvue/readiness-registry.json');result.registryBeforeSha256=hash(registryBefore);result.registryAfterSha256=hash(after);result.registryUnchanged=registryBefore.equals(after);
  try{result.registryVerification=assertRegistryAdditionOnly(registryBefore,after,[pilot.productId]);}catch(error){caught ||= error;result.registryVerificationError=error instanceof Error?error.message:String(error);}
  if(hash(await fs.readFile(inputFile))!==inputSha256)caught ||= Error('Frozen input changed');
  if(ai&&hash(await fs.readFile(path.join(directory,'parent-pilot-authorization.json')))!==authorizationSha256)caught ||= Error('Authorization changed');
  Object.assign(result,{providerCalls:calls,routeCalls,testOnlyMailInvocations:pilotFixture.mailCalls-beforeMail,testOnlyAccountWrites:pilotFixture.accountWrites-beforeAccount,completedAt:new Date().toISOString()});
  await save('result.json',result);vi.unstubAllGlobals();
 }
 if(caught)throw caught;
},5*60*1000);
it('forbids a second provider call including a route fallback',()=>{
 expect(()=>unusedProviderCall(0)).not.toThrow();for(const count of [1,2])expect(()=>unusedProviderCall(count)).toThrow();
});

it.skipIf(process.env.DOLLVUE_PIPER_EXECUTE_TWO_PILOTS!=='1')('executes exactly the two frozen authorized iris pilots, never retries or activates',async()=>{
 await parentApprovedInputs();
 const authFile=path.join(output,'two-pilot-generation-authorization.json'),authBytes=await fs.readFile(authFile);
 const authorizationSha256=hash(authBytes);expect(authorizationSha256).toBe('20b9b0910e2a5d15daade87451389a37fb37b1f6e75142a8a393561962408e72');
 const auth=JSON.parse(authBytes.toString());expect(auth.maxTotalProviderCalls).toBe(2);expect(auth.noRetries).toBe(true);expect(auth.noFallbacks).toBe(true);
 const registryBefore=await fs.readFile('lib/dollvue/readiness-registry.json');expect(Object.keys(JSON.parse(registryBefore.toString()))).toHaveLength(499);
 const runtimeFile='runtime-candidate-checks-7.json',runtimeBytes=await fs.readFile(path.join(output,runtimeFile)),runtime=JSON.parse(runtimeBytes.toString());
 expect(Object.values(runtime.records).every((r:any)=>r.status==='needs-review')).toBe(true);expect(runtime.summary.actualCartHandlerPasses).toBe(35);
 const summaries=[];let totalProviderCalls=0;const failures:unknown[]=[];
 for(const spec of auth.pilots){
  const inputFile=path.join(output,spec.inputFile),inputBytes=await fs.readFile(inputFile);expect(hash(inputBytes)).toBe(spec.inputSha256);
  const pilot=JSON.parse(inputBytes.toString()),dir=path.join(output,'pilot-'+spec.name);await fs.mkdir(dir,{recursive:true,mode:0o700});
  const save=(name:string,value:unknown)=>fs.writeFile(path.join(dir,name),JSON.stringify(value,null,2)+'\n',{flag:'wx',mode:0o600});
  for(const name of ['route-reservation.json','provider-reservation.json'])expect(await fs.stat(path.join(dir,name)).then(()=>true,()=>false),'Existing reservation consumes authorization').toBe(false);
  expect(pilot.choices).toHaveLength(1);expect(pilot.choices[0]).toMatchObject({groupId:'eye-color',optionId:spec.optionId});expect(pilot.index).toBe(spec.sourceIndex);expect(pilot.sourcePosition).toBe(0);
  const origin=new URL(env.NEXT_PUBLIC_SITE_URL).origin;expect(origin).toMatch(/^https:\/\/(www\.)?dollwow\.com$/);
  const refs=pilot.references as Array<{url:string;file:string;sha256:string}>;
  const pins:Record<string,string>={[pilot.source.url]:pilot.source.sha256,...Object.fromEntries(refs.map(r=>[r.url,r.sha256]))};
  let calls=0,expectedImages:string[]=[],normalPrompt='',caught:unknown;
  let eligibilitySpy:ReturnType<typeof vi.spyOn>|undefined;
  const beforeMail=pilotFixture.mailCalls,beforeAccount=pilotFixture.accountWrites;
  const result:Record<string,unknown>={name:spec.name,index:pilot.index,productId:pilot.productId,inputSha256:spec.inputSha256,authorizationSha256,ownerReviewed:false,parentOutputReview:'pending',fidelityPassed:false,generationSuccessful:false,ready:false,registryWritten:false,remoteCatalogWrites:0,customerMailSent:false};
  const nativeFetch=globalThis.fetch;
  vi.stubGlobal('fetch',async(input:Parameters<typeof fetch>[0],init?:RequestInit)=>{
   const url=new URL(input instanceof Request?input.url:String(input)),method=init?.method||(input instanceof Request?input.method:'GET');
   if(url.href==='https://api.venice.ai/api/v1/image/multi-edit'){
    unusedProviderCall(calls);expect(totalProviderCalls).toBeLessThan(2);expect(method).toBe('POST');
    const requestBytes=Buffer.from(String(init?.body)),body=JSON.parse(requestBytes.toString());
    expect(body.modelId).toBe('seedream-v5-pro-edit');expect(body.images).toEqual(expectedImages);expect(body.images).toHaveLength(2);expect(body.prompt).toBe(normalPrompt);
    expect(body.prompt).toContain('Transfer only the visible iris color only');expect(body.prompt).toContain('Do not copy the reference image');expect(body.prompt).toContain('Keep every unselected attribute unchanged');
    const requestSha256=hash(requestBytes),imageSha256=body.images.map((s:string)=>hash(Buffer.from(s.split(',')[1],'base64')));
    expect(imageSha256[0]).toBe(pilot.source.sha256);
    await save('provider-reservation.json',{reservedAt:new Date().toISOString(),authorizationSha256,inputSha256:spec.inputSha256,requestSha256,maxProviderCalls:1,noRetries:true,noFallbacks:true,imageSha256,sourceOriginalSha256:pilot.source.sha256,referenceOriginalSha256:refs.map(r=>r.sha256)});
    await fs.writeFile(path.join(dir,'provider-request.json'),requestBytes,{flag:'wx',mode:0o600});
    await save('provider-request-summary.json',{requestSha256,model:body.modelId,prompt:body.prompt,promptSha256:hash(Buffer.from(body.prompt)),imageSha256,aspectRatio:body.aspect_ratio,resolution:body.resolution});
    calls++;totalProviderCalls++;result.providerRequestSha256=requestSha256;
    const response=await nativeFetch(input,init);result.providerStatus=response.status;await save('provider-response-status.json',{status:response.status,receivedAt:new Date().toISOString()});return response;
   }
   if(url.hostname===env.SHOPIFY_STORE_DOMAIN&&url.pathname.endsWith('/graphql.json')){
    expect(method).toBe('POST');const body=JSON.parse(String(init?.body));expect(body.query.trim()).toMatch(/^query\b/);expect(body.query).not.toMatch(/\bmutation\b/);
    if(body.variables.ids)expect(body.variables.ids).toEqual([pilot.productId]);if(body.variables.handle)expect(body.variables.handle).toBe(pilot.handle);
   }else if(url.hostname===env.SHOPIFY_STORE_DOMAIN&&url.pathname==='/admin/oauth/access_token')expect(method).toBe('POST');
   else{expect(method).toBe('GET');expect([pilot.source.url,...refs.map(r=>new URL(r.url,origin).href)]).toContain(url.href);expect(init?.cache).toBe('no-store');}
   return nativeFetch(input,init);
  });
  async function current(stage:string){
   const product=await storefrontModule.getProductByHandle(pilot.handle,{strict:true,cache:'no-store'});expect(product?.id).toBe(pilot.productId);
   const state=await adminFetch<{nodes:Array<State|null>}>(`query PiperPilotState($ids:[ID!]!){nodes(ids:$ids){... on Product{${stateFields}}}}`,{ids:[pilot.productId]});
   assertActiveState(state.nodes[0],{id:pilot.productId,handle:pilot.handle},product as unknown as Node);
   expect(isCustomerVisibleProduct(product!)).toBe(true);expect(isDollVueExcluded(product!)).toBe(false);expect(product!.extended.brand).toBe('Piper Dolls');expect(product!.extended.stockStatus).toBe('custom');
   expect(scopeFlags(product!.productType,[...product!.tags,...state.nodes[0]!.tags])).toEqual([]);
   const config=dollVueConfigForProduct(product!,getCustomizationConfig(product!));expect(dollVueReadinessFingerprint(product!,config)).toBe(pilot.fingerprint);expect(productImageSources(product!)[0].url).toBe(pilot.source.url);
   const record:DollVueReadinessRecord={productId:pilot.productId,policy:DOLLVUE_APPEARANCE_POLICY,status:'ready',fingerprint:pilot.fingerprint,sourcePositions:[0],imageDigests:pins,choices:pilot.choices};
   const readiness=evaluateDollVueReadiness(product!,config,record,{published:true,contentExcluded:false});expect(readiness.ready).toBe(true);const menu=reviewedDollVueConfig(config,readiness,'public');
   expect(areDollVueSelectionsValid(menu,pilot.choices)).toBe(true);
   expect(hash(await fs.readFile(pilot.source.file))).toBe(pilot.source.sha256);for(const ref of refs)expect(hash(await fs.readFile(ref.file))).toBe(ref.sha256);
   const images=[await normalizeReviewedImage({url:pilot.source.url,sha256:pilot.source.sha256,origin})];
   for(const ref of refs)images.push(await normalizeReviewedImage({url:ref.url,sha256:ref.sha256,origin,optionReference:true}));
   const prompt=buildDollVuePrompt(product!,resolveDollVueSelections(menu,pilot.choices));
   if(stage==='after'){expect(images).toEqual(expectedImages);expect(prompt).toBe(normalPrompt);}
   await save(stage+'-current-verification.json',{checkedAt:new Date().toISOString(),productId:product!.id,handle:product!.handle,state:state.nodes[0],fingerprint:pilot.fingerprint,sourcePosition:0,imageDigests:pins,normalizedImageSha256:images.map(s=>hash(Buffer.from(s.split(',')[1],'base64'))),normalRoutePromptSha256:hash(Buffer.from(prompt))});
   return {product:product!,menu,images,prompt};
  }
  try{
   const before=await current('before');expectedImages=before.images;normalPrompt=before.prompt;
   eligibilitySpy=vi.spyOn(eligibilityModule,'resolveCurrentDollVueEligibility').mockImplementation(async product=>{
    expect(product.id).toBe(pilot.productId);expect(dollVueReadinessFingerprint(product,dollVueConfigForProduct(product,getCustomizationConfig(product)))).toBe(pilot.fingerprint);
    return {available:true,config:before.menu,sourcePositions:[0],revision:pilot.fingerprint,imageDigests:pins};
   });
   const routeBody=JSON.stringify({productHandle:pilot.handle,sourcePosition:0,selections:pilot.choices.map(({groupId,optionId}:{groupId:string;optionId:string})=>({groupId,optionId}))});
   await save('route-reservation.json',{reservedAt:new Date().toISOString(),authorizationSha256,inputSha256:spec.inputSha256,routeRequestSha256:hash(Buffer.from(routeBody)),maxRouteCalls:1,normalRoutePromptSha256:hash(Buffer.from(normalPrompt))});
   await fs.writeFile(path.join(dir,'route-request.json'),routeBody,{flag:'wx',mode:0o600});
   const response=await generatePOST(new Request(`${origin}/dollvue/generate`,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','x-vercel-ip-country':'US'},body:routeBody}));
   const payload=await response.json();result.routeStatus=response.status;result.routeError=payload.error;
   if(payload.previewDataUrl){const bytes=Buffer.from(payload.previewDataUrl.split(',')[1],'base64'),file=path.join(dir,'output.webp');await fs.writeFile(file,bytes,{flag:'wx',mode:0o600});const meta=await sharp(bytes).metadata();result.output=file;result.outputSha256=hash(bytes);result.dimensions={width:meta.width,height:meta.height};result.generationSuccessful=true;}
   expect(response.status,String(payload.error)).toBe(200);expect(calls).toBe(1);expect(payload.emailDelivered).toBe(false);expect(pilotFixture.mailCalls-beforeMail).toBe(1);expect(pilotFixture.accountWrites-beforeAccount).toBe(1);
  }catch(error){caught=error;result.error=error instanceof Error?error.message:String(error);}
  finally{
   eligibilitySpy?.mockRestore();
   try{await current('after');result.postflightPassed=true;}catch(error){result.postflightPassed=false;result.postflightError=error instanceof Error?error.message:String(error);caught ||= error;}
   result.providerCalls=calls;result.completedAt=new Date().toISOString();result.testOnlyMailInvocations=pilotFixture.mailCalls-beforeMail;result.testOnlyAccountWrites=pilotFixture.accountWrites-beforeAccount;
   const registryAfter=await fs.readFile('lib/dollvue/readiness-registry.json');result.registryBeforeSha256=hash(registryBefore);result.registryAfterSha256=hash(registryAfter);result.registryUnchanged=registryBefore.equals(registryAfter);
   if(!registryBefore.equals(registryAfter))caught ||= Error('External registry changed during authorized pilot');
   if(hash(await fs.readFile(inputFile))!==spec.inputSha256||hash(await fs.readFile(authFile))!==authorizationSha256) caught ||= Error('Frozen input changed');
   await save('result.json',result);vi.unstubAllGlobals();summaries.push(result);
  }
  if(caught)failures.push(caught);
 }
 expect(hash(await fs.readFile(path.join(output,runtimeFile)))).toBe(hash(runtimeBytes));
 await fs.writeFile(path.join(output,'two-pilot-results.json'),JSON.stringify({completedAt:new Date().toISOString(),authorizationSha256,totalProviderCalls,summaries,ownerReviewed:false,parentOutputReview:'pending',readyRecords:0,registryWritten:false,remoteCatalogWrites:0,customerMailSent:false},null,2)+'\n',{flag:'wx',mode:0o600});
 if(failures.length)throw failures[0];expect(totalProviderCalls).toBe(2);
},10*60*1000);

it.skipIf(process.env.DOLLVUE_PIPER_RUNTIME_CANDIDATES!=='1'&&process.env.DOLLVUE_PIPER_FINALIZE_READY!=='1')('checks exactly seven prospective runtime candidates without activation or generation',async()=>{
 const {proposal,review,approvalSha256}=await parentApprovedInputs();
 const readyMode=process.env.DOLLVUE_PIPER_FINALIZE_READY==='1';
 let fidelitySha256:string|undefined;
 if(readyMode){
  const bytes=await fs.readFile(path.join(output,'parent-fidelity-review.json'));fidelitySha256=hash(bytes);
  expect(fidelitySha256).toBe('1940deb93a855087e0e210d48330b0df1adfdf823de91efc313e234ddd7ea603');
  const fidelity=JSON.parse(bytes.toString());expect(fidelity).toMatchObject({frozen:true,reviewer:'parent-assistant',ownerReviewed:false,humanApproval:false,verdict:'PASS_MINOR_VARIATION_ACCEPTED',perfectMatch:false,finalizeExactSevenProposalAuthorized:true,registryWritesAuthorized:false});
  expect(fidelity.approvedSourceIndices).toEqual([29,30,36,48,49,51,52]);expect(fidelity.pilotReviews).toHaveLength(2);
  for(const input of fidelity.inputs)expect(hash(await fs.readFile(path.join(output,input.file)))).toBe(input.sha256);
 }
 const pilotIndexBytes=await fs.readFile(path.join(output,'pilot-input-hashes.json')),pilotIndex=JSON.parse(pilotIndexBytes.toString());
 expect(pilotIndex.pilots).toHaveLength(2);for(const pilot of pilotIndex.pilots)expect(hash(await fs.readFile(pilot.file))).toBe(pilot.sha256);
 const ids:string[]=proposal.proposed.map((r:any)=>r.id),registryBytes=await fs.readFile('lib/dollvue/readiness-registry.json');
 const registry=JSON.parse(registryBytes.toString());expect(Object.keys(registry).length).toBeGreaterThanOrEqual(499);
 if(readyMode)expect(Object.keys(registry)).toHaveLength(499);
 for(const id of ids)expect(registry[id]).toBeUndefined();
 const counts={adminReads:0,storefrontReads:0,imageReads:0,generationCalls:0,remoteWrites:0,defaults:0,singleChoiceChecks:0,actualCartHandlerPasses:0,rejectionChecks:0};
 const nativeFetch=globalThis.fetch;
 vi.stubGlobal('fetch',async(input:Parameters<typeof fetch>[0],init?:RequestInit)=>{
  const u=new URL(input instanceof Request?input.url:String(input)),method=init?.method||(input instanceof Request?input.method:'GET');
  if(u.hostname===env.SHOPIFY_STORE_DOMAIN&&u.pathname.endsWith('/graphql.json')){
   expect(method).toBe('POST');const body=JSON.parse(String(init?.body));expect(body.query).toMatch(/^query\b/);expect(body.query).not.toMatch(/\bmutation\b/);
   expect(body.variables.ids).toEqual(ids);if(u.pathname.includes('/admin/'))counts.adminReads++;else counts.storefrontReads++;
  }else if(u.hostname===env.SHOPIFY_STORE_DOMAIN&&u.pathname==='/admin/oauth/access_token'){expect(method).toBe('POST');}
  else{expect(method).toBe('GET');expect(isOwnedOptionAsset(u.href)).toBe(true);counts.imageReads++;}
  return nativeFetch(input,init);
 });
 const records:Record<string,DollVueReadinessRecord>={},verification=[];
 try{
  async function current(){
   const states=await adminFetch<{nodes:Array<State|null>}>(`query PiperRuntimeStates($ids:[ID!]!){nodes(ids:$ids){... on Product{${stateFields}}}}`,{ids});
   const response=await fetch(`https://${env.SHOPIFY_STORE_DOMAIN}/api/2026-04/graphql.json`,{method:'POST',cache:'no-store',signal:AbortSignal.timeout(60000),headers:{'Content-Type':'application/json',...storefrontAuthHeaders(env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!)},body:JSON.stringify({query:sfQuery,variables:{ids}})});
   expect(response.ok).toBe(true);const body=await response.json();expect(body.errors).toBeUndefined();expect(body.data.nodes).toHaveLength(7);expect(states.nodes).toHaveLength(7);
   return {checkedAt:new Date().toISOString(),states:states.nodes,nodes:body.data.nodes as Node[]};
  }
  const before=await current(),verified=new Map<string,string>();
  async function verify(url:string,sha256:string,file:string){
   expect(hash(await fs.readFile(file))).toBe(sha256);
   if(verified.has(url)){expect(verified.get(url)).toBe(sha256);return;}
   const image=await boundedOwnedImage(new URL(url,'https://dollwow.com').href);expect(image.sha256).toBe(sha256);verified.set(url,sha256);
  }
  for(const [i,row]of proposal.proposed.entries()){
   assertActiveState(before.states[i],row,before.nodes[i]);const product=mapShopifyProduct(before.nodes[i]);
   expect(isCustomerVisibleProduct(product)).toBe(true);expect(isDollVueExcluded(product)).toBe(false);expect(product.extended.brand).toBe('Piper Dolls');expect(product.extended.stockStatus).toBe('custom');
   expect(scopeFlags(product.productType,[...product.tags,...before.states[i]!.tags])).toEqual([]);
   const config=dollVueConfigForProduct(product,getCustomizationConfig(product));expect(dollVueReadinessFingerprint(product,config)).toBe(row.fingerprint);
   const source=productImageSources(product)[row.sourcePosition];expect(source.url).toBe(row.sourceUrl);await verify(row.sourceUrl,row.sourceSha256,row.sourceFile);
   const choices:DollVueReadinessRecord['choices']=row.choices.map((r:any)=>({groupId:r.groupId,optionId:r.optionId,reference:r.reference}));
   expect(choices).toHaveLength(5);expect(choices.every(c=>c.groupId==='eye-color')).toBe(true);expect(row.referenceFamilyHash).not.toBe(expectedFamilies[2][0]);
   const group=config.groups.find(g=>g.id==='eye-color')!;expect(group.selectionMode).toBe('single');expect(group.visibleWhen?.length||0).toBe(0);
   expect(group.options.filter(o=>classifyAppearance(group,o).status==='candidate').map(o=>({groupId:group.id,optionId:o.id,reference:o.swatch?.value}))).toEqual(choices);
   const pins:Record<string,string>={[row.sourceUrl]:row.sourceSha256};
   for(const choice of choices){const ref=review.references.find((r:any)=>r.reference===choice.reference)!;expect(ref).toBeDefined();await verify(ref.reference,ref.sha256,ref.file);pins[ref.reference]=ref.sha256;}
   const prospective:DollVueReadinessRecord={productId:row.id,policy:DOLLVUE_APPEARANCE_POLICY,fingerprint:row.fingerprint,status:'ready',sourcePositions:[row.sourcePosition],choices,imageDigests:pins};
   const ready=evaluateDollVueReadiness(product,config,prospective,{published:true,contentExcluded:false});expect(ready.ready).toBe(true);
   const menu=reviewedDollVueConfig(config,ready,'public');expect(menu.groups.flatMap(g=>g.options.filter(o=>o.dollVueEnabled).map(o=>[g.id,o.id]))).toEqual(choices.map(c=>[c.groupId,c.optionId]));
   records[row.id]={...prospective,status:readyMode?'ready':'needs-review'};
   expect(evaluateDollVueReadiness(product,config,records[row.id],{published:true,contentExcluded:false}).ready).toBe(readyMode);
   const now=new Date(),initial=promotionPricingForSelections(product,menu,{},now).config,variant=product.variants.find(v=>v.availableForSale)!;expect(variant).toBeDefined();
   function resolve(requested:DollVueReadinessRecord['choices']){
    const selections=getDefaultSelections(initial);
    if(requested.length)expect(areDollVueSelectionsValid(initial,requested)).toBe(true);
    for(const c of requested){expect(isOptionAvailableForCheckout(initial,c.groupId,c.optionId)).toBe(true);selections[c.groupId]=c.optionId;}
    const priced=promotionPricingForSelections(product,menu,selections,now).config,result=resolveCustomization(priced,selections,Number(variant.price.amount));
    expect(result.issues).toEqual([]);expect(result.requiresPriceConfirmation).toBe(false);expect(Number.isFinite(result.totalPrice)).toBe(true);
    for(const c of requested){expect(result.selections[c.groupId]).toBe(c.optionId);const chosen=result.selectedOptions.find(o=>o.groupId===c.groupId&&o.optionId===c.optionId)!;expect(chosen).toBeDefined();expect(result.cartAttributes.find(a=>a.key==='DollWow '+chosen.groupLabel)?.value.split(', ')).toContain(chosen.optionLabel+(chosen.priceDelta?` (+$${chosen.priceDelta})`:''));}
    return result;
   }
   const defaults=resolve([]);counts.defaults++;
   const lookup=vi.spyOn(storefrontModule,'getProductByHandle').mockImplementation(async(handle,options)=>{expect(handle).toBe(row.handle);expect(options).toMatchObject({strict:true,cache:'no-store'});return product;});
   const eligible=vi.spyOn(eligibilityModule,'resolveCurrentDollVueEligibility').mockResolvedValue({available:true,config:menu,sourcePositions:[row.sourcePosition],revision:row.fingerprint,imageDigests:pins});
   const origin=new URL(env.NEXT_PUBLIC_SITE_URL).origin;
   const request=(selections:Array<{groupId:string;optionId:string}>,requestOrigin=origin)=>new Request(`${origin}/dollvue/cart`,{method:'POST',headers:{Origin:requestOrigin,'Content-Type':'application/json'},body:JSON.stringify({productHandle:row.handle,selections})});
   const choiceChecks=[];
   try{
    for(const choice of choices){const resolved=resolve([choice]);counts.singleChoiceChecks++;
     const response=await cartPOST(request([choice]));expect(response.status).toBe(200);expect(response.headers.get('cache-control')).toBe('no-store');const payload=await response.json(),name=productDisplayName(product);
     expect(payload.item).toMatchObject({merchandiseId:variant.id,productHandle:row.handle,unitPrice:resolved.totalPrice,currencyCode:variant.price.currencyCode,readyToShip:false,selections:resolved.selections});
     expect(payload.item.attributes).toEqual([...(name?[{key:'DollWow Reference Name',value:name}]:[]),...resolved.cartAttributes]);
     expect(payload.item.customizationCharge).toEqual(resolved.optionPriceDelta>0?{amount:resolved.optionPriceDelta,currencyCode:variant.price.currencyCode,title:name||productPublicTitle(product),items:resolved.selectedOptions.filter(o=>o.priceDelta>0).map(o=>({group:o.groupLabel,label:o.optionLabel,amount:o.priceDelta}))}:undefined);
     choiceChecks.push({choice,resolved,cartPayload:payload,cartStatus:response.status});counts.actualCartHandlerPasses++;
    }
    for(const [selections,status,requestOrigin]of [[choices.slice(0,1),403,'https://untrusted.invalid'],[choices.slice(0,2),409,origin],[[{groupId:'hairstyle',optionId:'hairstyle-1'}],409,origin],[[{groupId:'eye-color',optionId:'not-a-choice'}],409,origin]] as const){expect((await cartPOST(request([...selections],requestOrigin))).status).toBe(status);counts.rejectionChecks++;}
    eligible.mockResolvedValueOnce({available:false,config:menu,sourcePositions:[],revision:row.fingerprint,imageDigests:pins});expect((await cartPOST(request([choices[0]]))).status).toBe(404);counts.rejectionChecks++;
   }finally{lookup.mockRestore();eligible.mockRestore();}
   verification.push({id:row.id,index:row.index,sourcePosition:row.sourcePosition,prospectiveReadyEvaluation:true,persistedCandidateReady:readyMode,privateHold:'clear',defaults,choiceChecks});
  }
  const after=await current();expect(after.states).toEqual(before.states);expect(after.nodes).toEqual(before.nodes);
  expect(counts).toMatchObject({defaults:7,singleChoiceChecks:35,actualCartHandlerPasses:35,rejectionChecks:35,generationCalls:0,remoteWrites:0});expect(verified.size).toBe(17);
  const registryAfter=await fs.readFile('lib/dollvue/readiness-registry.json'),latest=JSON.parse(registryAfter.toString());
  for(const [id,record]of Object.entries(registry))expect(latest[id]).toEqual(record);for(const id of ids)expect(latest[id]).toBeUndefined();
  if(readyMode){expect(registryAfter).toEqual(registryBytes);expect(hash(await fs.readFile(path.join(output,'parent-fidelity-review.json')))).toBe(fidelitySha256);}
  await parentApprovedInputs();expect(hash(await fs.readFile(path.join(output,'pilot-input-hashes.json')))).toBe(hash(pilotIndexBytes));
  await fs.writeFile(path.join(output,readyMode?'ready-proposal-7.json':'runtime-candidate-checks-7.json'),JSON.stringify({checkedAt:new Date().toISOString(),status:readyMode?'EXACT_SEVEN_READY_PRIVATE_PROPOSAL_NOT_INTEGRATED':'PILOT_OUTPUT_REVIEW_PENDING_NOT_ACTIVATABLE',ownerReviewed:false,parentInputsApproved:true,parentInputApprovalSha256:approvalSha256,parentFidelityReviewSha256:fidelitySha256,pilotInputsSha256:hash(pilotIndexBytes),records,verification,before,after,
   summary:{candidates:7,readyRecords:readyMode?7:0,uniqueVerifiedImages:verified.size,...counts},registryBeforeCount:Object.keys(registry).length,registryAfterCount:Object.keys(latest).length,registryBeforeSha256:hash(registryBytes),registryAfterSha256:hash(registryAfter),existingRecordsPreserved:true,registryWritten:false,activationAuthorized:false,generationAuthorized:false,
   sourceExclusions:review.rows.filter((r:any)=>r.decision!=='pass'),sourceExclusionsAreSaleHolds:false,
   testScope:readyMode?'Actual cart handler with test-only proposed eligibility and bulk-fresh strict product data. Exact seven ready records remain private proposal data only; no registry integration or live cart mutation. Parent accepted two representative pilots, not every eye combination.':'Actual cart handler with test-only prospective eligibility and bulk-fresh strict product data. Ready objects existed only in test memory; persisted records are needs-review and fail readiness. No live cart mutation, hosted readiness or generation fidelity is claimed.'},null,2)+'\n',{flag:'wx',mode:0o600});
 }finally{vi.restoreAllMocks();vi.unstubAllGlobals();}
},20*60*1000);

it.skipIf(process.env.DOLLVUE_PIPER_PILOT_INPUTS!=='1')('prepares exactly two parent-reviewed iris-only pilot inputs without generation',async()=>{
 const {approval,proposal,review,approvalSha256}=await parentApprovedInputs();
 const pilots=[];
 for(const spec of [{name:'numbered5',index:29,optionId:'no-5',colour:'purple',family:expectedFamilies[0][0]},
  {name:'named5',index:36,optionId:'blue',colour:'blue',family:expectedFamilies[1][0]}]){
  const p=proposal.proposed.find((r:any)=>r.index===spec.index);expect(p).toBeDefined();expect(p.referenceFamilyHash).toBe(spec.family);expect(p.sourcePosition).toBe(0);
  const choice=p.choices.find((c:any)=>c.optionId===spec.optionId);expect(choice).toBeDefined();expect(choice.groupId).toBe('eye-color');
  const ref=review.references.find((r:any)=>r.reference===choice.reference);expect(ref).toBeDefined();expect(ref.sha256).toBe(choice.sha256);
  const sourceBytes=await fs.readFile(p.sourceFile),refBytes=await fs.readFile(ref.file);
  const contactSheet=await sheet([await tile(sourceBytes,`${p.index} | ${p.id.split('/').at(-1)} | p0 SOURCE`,500,740),
   await tile(refBytes,`${spec.name} | ${choice.label} | ${spec.colour} IRIS ONLY`,500,740)],2,`pilot-input-${spec.name}.png`,500,740);
  const instruction=`Change only the visible iris colour to ${spec.colour}, matching the iris colour reference. Preserve the source's exact adult identity, facial shape, expression, eye geometry, eyelids, makeup, eyelashes, eyebrows, skin, hair, body proportions, opaque clothing, accessories, pose, lighting, framing and background. Do not transfer the reference face, surrounding skin, makeup, eyelids or eyeball geometry. Preserve all existing branding, hats and accessories. Do not invent hidden eye detail. No hair change, nudity, clothing removal or other appearance edit.`;
  const pilot={frozen:true,status:'INPUTS_ONLY_AWAITING_GENERATION_AUTHORIZATION',name:spec.name,productId:p.id,handle:p.handle,index:p.index,sourcePosition:0,
   fingerprint:p.fingerprint,referenceFamilyHash:p.referenceFamilyHash,choices:[{groupId:'eye-color',optionId:choice.optionId,reference:choice.reference}],
   source:{file:p.sourceFile,url:p.sourceUrl,sha256:p.sourceSha256,bytes:sourceBytes.length},references:[{file:ref.file,url:ref.reference,sha256:ref.sha256,bytes:refBytes.length,observedMeaning:ref.observedMeaning}],
   instruction,contactSheet,parentInputApprovalSha256:approvalSha256,ownerReviewed:false,humanApproval:false,parentInputApproved:true,parentPilotOutputReviewed:false,
   generationAuthorized:false,activationAuthorized:false,generationCalls:0,remoteWrites:0,freshIdentityHoldsAndBytesRequiredBeforeGeneration:true};
  const file=path.join(output,`pilot-input-${spec.name}.json`),bytes=Buffer.from(JSON.stringify(pilot,null,2)+'\n');await fs.writeFile(file,bytes,{flag:'wx',mode:0o600});
  pilots.push({file,sha256:hash(bytes),source:pilot.source,reference:pilot.references[0],sheet:contactSheet});
 }
 expect(pilots).toHaveLength(2);
 await fs.writeFile(path.join(output,'pilot-input-hashes.json'),JSON.stringify({frozen:true,parentInputApprovalSha256:approvalSha256,approvalConstraints:approval.constraints,pilots,generationCalls:0,remoteWrites:0},null,2)+'\n',{flag:'wx',mode:0o600});
});

async function boundedOwnedImage(url:string){
 expect(isOwnedOptionAsset(url)).toBe(true);
 const response=await fetch(url,{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(30000)});
 expect(response.ok).toBe(true);expect(response.headers.get('content-type')).toMatch(/^image\//);
 const limit=20*1024*1024;expect(Number(response.headers.get('content-length'))).toBeLessThanOrEqual(limit);
 const reader=response.body!.getReader(),chunks:Buffer[]=[];let size=0;
 try{while(true){const p=await reader.read();if(p.done)break;size+=p.value.length;expect(size).toBeLessThanOrEqual(limit);chunks.push(Buffer.from(p.value));}}
 finally{await reader.cancel();}
 const bytes=Buffer.concat(chunks),decoder=sharp(bytes,{limitInputPixels:25000000,failOn:'warning'}).timeout({seconds:5});
 const meta=await decoder.metadata();expect(meta.pages||1).toBe(1);await decoder.clone().raw().toBuffer();
 return {bytes,sha256:hash(bytes),width:meta.width!,height:meta.height!,format:meta.format!};
}

it.skipIf(process.env.DOLLVUE_PIPER_ALTERNATIVES!=='1')('downloads alternatives only for explicitly reviewed technical gaps',async()=>{
 const manifestBytes=await fs.readFile(path.join(output,'candidate-manifest.json'));
 const manifest=JSON.parse(manifestBytes.toString()),reviewBytes=await fs.readFile(path.join(output,'source-zero-review.json'));
 const review=JSON.parse(reviewBytes.toString());expect(review.manifestSha256).toBe(hash(manifestBytes));
 const rows=[],sheets=[];
 for(const decision of review.rows.filter((r:any)=>r.decision==='technical-gap')){
  const row=manifest.rows.find((r:any)=>r.id===decision.id);expect(row).toBeDefined();
  expect(decision.sourceSha256).toBe(row.sources[0].sha256);const sources=[];
  for(const source of row.sources.filter((s:any)=>s.sourcePosition>0&&s.sourcePosition<=7)){
   try{const image=await boundedOwnedImage(source.url);expect([image.width,image.height]).toEqual([source.width,source.height]);
    const file=path.join(output,`alternative-${row.index}-p${source.sourcePosition}.${image.format==='jpeg'?'jpg':image.format}`);
    await fs.writeFile(file,image.bytes,{flag:'wx',mode:0o600});
    sources.push({...source,file,sha256:image.sha256,byteLength:image.bytes.length,decodedWidth:image.width,decodedHeight:image.height,review:'NOT_REVIEWED'});
   }catch(e){sources.push({...source,error:e instanceof Error?e.message:String(e)});}
  }
  const tiles=[];for(const s of sources)if(s.file)tiles.push(await tile(await fs.readFile(s.file),`${row.index} | ${row.id.split('/').at(-1)} | p${s.sourcePosition}`,300,420));
  if(tiles.length)sheets.push(await sheet(tiles,4,`alternatives-${row.index}.png`,300,420));
  rows.push({index:row.index,id:row.id,handle:row.handle,sources});
 }
 await fs.writeFile(path.join(output,'alternative-manifest.json'),JSON.stringify({checkedAt:new Date().toISOString(),inputs:[{file:'candidate-manifest.json',sha256:hash(manifestBytes)},{file:'source-zero-review.json',sha256:hash(reviewBytes)}],rows,sheets,generationCalls:0,remoteWrites:0},null,2),{flag:'wx',mode:0o600});
},20*60*1000);

it.skipIf(process.env.DOLLVUE_PIPER_SHEETS!=='1')('renders exact iris-family sheets and audits private frozen artifacts offline',async()=>{
 const proposalBytes=await fs.readFile(path.join(output,'candidate-proposal.json')),proposal=JSON.parse(proposalBytes.toString());
 expect(proposal.registryCount).toBe(499);expect(proposal.ready).toBe(false);expect(proposal.generationAuthorized).toBe(false);
 const manifest=JSON.parse(await fs.readFile(path.join(output,'candidate-manifest.json'),'utf8'));
 const review=JSON.parse(await fs.readFile(path.join(output,'frozen-assistant-review.json'),'utf8'));
 expect(manifest.families.map((f:any)=>[f.referenceFamilyHash,f.choiceCount])).toEqual(expectedFamilies);
 const familySheets=[];let slots=0;
 for(const [i,family]of manifest.families.entries()){
  const tiles=[];
  for(const choice of family.choices){const ref=review.references.find((r:any)=>r.reference===choice.reference);expect(ref).toBeDefined();
   const bytes=await fs.readFile(ref.file);expect(hash(bytes)).toBe(choice.sha256);slots++;
   tiles.push(await tile(bytes,`Family ${i+1} | REF ${ref.index} | ${choice.label}`,300,290));
  }
  familySheets.push({referenceFamilyHash:family.referenceFamilyHash,choiceCount:family.choiceCount,...await sheet(tiles,family.choiceCount,`iris-family-${i+1}-${family.choiceCount}-references.png`,300,290)});
 }
 expect(slots).toBe(16);expect(review.references).toHaveLength(15);
 for(const input of proposal.inputs){const file=path.isAbsolute(input.file)?input.file:path.join(output,input.file);expect(hash(await fs.readFile(file))).toBe(input.sha256);}
 for(const s of proposal.passSheets)expect(hash(await fs.readFile(s.file))).toBe(s.sha256);
 for(const p of proposal.proposed){expect(p.ready).toBe(false);expect(p.generationAuthorized).toBe(false);expect(hash(await fs.readFile(p.sourceFile))).toBe(p.sourceSha256);}
 await fs.writeFile(path.join(output,'offline-artifact-audit.json'),JSON.stringify({checkedAt:new Date().toISOString(),proposalSha256:hash(proposalBytes),familySheets,referenceSlots:slots,uniqueReferences:15,sourcePass:proposal.proposed.length,allFrozenInputsMatch:true,passSheetHashesMatch:true,generationCalls:0,remoteWrites:0},null,2)+'\n',{flag:'wx',mode:0o600});
});

it.skipIf(process.env.DOLLVUE_PIPER_FREEZE!=='1')('freezes a source-reviewed candidate proposal, never runtime-ready records',async()=>{
 const reviewBytes=await fs.readFile(path.join(output,'frozen-assistant-review.json'));
 expect(hash(reviewBytes)).toBe('2ee5df2f69c239a18a79b861d023c339f9ac801deb62bd77846fe14d5667d7e9');
 const review=JSON.parse(reviewBytes.toString());
 expect(review).toMatchObject({frozen:true,reviewer:'assistant',ownerReviewed:false,parentApproved:false,generationAuthorized:false,ready:false});
 for(const input of review.inputs)expect(hash(await fs.readFile(path.join(output,input.file)))).toBe(input.sha256);
 const manifest=JSON.parse(await fs.readFile(path.join(output,'candidate-manifest.json'),'utf8'));
 const alternatives=JSON.parse(await fs.readFile(path.join(output,'alternative-manifest.json'),'utf8'));
 expect(review.rows).toHaveLength(manifest.rows.length);expect(new Set(review.rows.map((r:any)=>r.id)).size).toBe(review.rows.length);
 for(const row of manifest.rows)expect(review.rows.some((r:any)=>r.id===row.id&&r.index===row.index&&r.handle===row.handle)).toBe(true);
 const inventoryFile=path.join(root,'inventory.json'),inventoryBytes=await fs.readFile(inventoryFile);
 const inventory=JSON.parse(inventoryBytes.toString());const selected=inventory.rows.filter((r:any)=>r.brand==='Piper Dolls');
 const ids:string[]=selected.map((r:any)=>r.id);
 const counts={adminBulkReads:0,storefrontBulkReads:0,imageReads:0,generationCalls:0,remoteWrites:0,defaultChecks:0,irisChoiceChecks:0};
 const runtimeFiles=['lib/dollvue/config.ts','lib/dollvue/readiness.ts','lib/dollvue/readiness-registry.json'];
 const runtimeInputs=await Promise.all(runtimeFiles.map(async file=>({file,sha256:hash(await fs.readFile(file))})));
 const registry=JSON.parse(await fs.readFile(runtimeFiles[2],'utf8'));
 const nativeFetch=globalThis.fetch;
 vi.stubGlobal('fetch',async(input:Parameters<typeof fetch>[0],init?:RequestInit)=>{
  const u=new URL(input instanceof Request?input.url:String(input)),method=init?.method||(input instanceof Request?input.method:'GET');
  if(u.hostname===env.SHOPIFY_STORE_DOMAIN&&u.pathname.endsWith('/graphql.json')){
   expect(method).toBe('POST');const body=JSON.parse(String(init?.body));expect(body.query).toMatch(/^query\b/);expect(body.query).not.toMatch(/\bmutation\b/);
   expect(body.variables.ids.length).toBeGreaterThan(0);expect(body.variables.ids.length).toBeLessThanOrEqual(50);expect(body.variables.ids.every((id:string)=>ids.includes(id))).toBe(true);
   if(u.pathname.includes('/admin/'))counts.adminBulkReads++;else counts.storefrontBulkReads++;
  }else if(u.hostname===env.SHOPIFY_STORE_DOMAIN&&u.pathname==='/admin/oauth/access_token'){expect(method).toBe('POST');}
  else{expect(method).toBe('GET');expect(isOwnedOptionAsset(u.href)).toBe(true);counts.imageReads++;}
  return nativeFetch(input,init);
 });
 try{
  expect(hasShopifyStorefrontEnv()).toBe(true);
  async function current(){
   const states:Array<State|null>=[],nodes:Array<Node|null>=[];
   for(let start=0;start<ids.length;start+=50){const chunk=ids.slice(start,start+50);
    const s=await adminFetch<{nodes:Array<State|null>}>(`query PiperFreezeStates($ids:[ID!]!){nodes(ids:$ids){... on Product{${stateFields}}}}`,{ids:chunk});
    expect(s.nodes).toHaveLength(chunk.length);states.push(...s.nodes);
    const response=await fetch(`https://${env.SHOPIFY_STORE_DOMAIN}/api/2026-04/graphql.json`,{method:'POST',cache:'no-store',signal:AbortSignal.timeout(60000),headers:{'Content-Type':'application/json',...storefrontAuthHeaders(env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!)},body:JSON.stringify({query:sfQuery,variables:{ids:chunk}})});
    expect(response.ok).toBe(true);const body=await response.json();expect(body.errors).toBeUndefined();expect(body.data.nodes).toHaveLength(chunk.length);nodes.push(...body.data.nodes);
   }
   return {checkedAt:new Date().toISOString(),states,nodes};
  }
  const before=await current(),census=[],proposed=[],verified=new Map<string,string>();
  for(const ref of review.references){
   expect(ref.meaningReviewed).toBe(true);expect(ref.visualMeaningVerified).toBe(true);expect(ref.ownerReviewed).toBe(false);
   expect(hash(await fs.readFile(ref.file))).toBe(ref.sha256);expect(hash(await fs.readFile(path.join(process.cwd(),'public',ref.reference)))).toBe(ref.sha256);
   const image=await boundedOwnedImage(new URL(ref.reference,'https://dollwow.com').href);expect(image.sha256).toBe(ref.sha256);verified.set(ref.reference,ref.sha256);
  }
  for(const [i,old]of selected.entries()){
   const node=before.nodes[i],state=before.states[i];assertActiveState(state,old,node);
   const product=mapShopifyProduct(node!),rawConfig=getCustomizationConfig(product),config=dollVueConfigForProduct(product,rawConfig);
   expect(product.extended.brand).toBe('Piper Dolls');
   const row=manifest.rows.find((r:any)=>r.id===old.id),decision=review.rows.find((r:any)=>r.id===old.id);
   const group=config.groups.find(g=>g.id==='eye-color');
   const choices=group?.options.filter(o=>classifyAppearance(group,o).status==='candidate').map(o=>({optionId:o.id,label:o.label,reference:o.swatch?.kind==='image'?o.swatch.value:null}))||[];
   const fingerprint=dollVueReadinessFingerprint(product,config);
   const reasons=[...old.reasons];
   if(registry[old.id])reasons.push('Already present in current registry; never replace');
   if(!row)reasons.push('No exact mapping to requested census iris families; no source approval inferred');
   if(row){expect(fingerprint).toBe(row.fingerprint);expect(choices).toEqual(row.choices.map((r:any)=>({optionId:r.optionId,label:r.label,reference:r.reference})));}
   if(isDollVueExcluded(product)||product.extended.stockStatus!=='custom'||!/^custom\b.*\bdoll\b/i.test(product.productType)||scopeFlags(product.productType,[...product.tags,...state!.tags]).length)reasons.push('Current full-body custom scope gate failed');
   if(decision?.decision!=='pass')reasons.push(decision?.sourceZeroDecision||'Source not reviewed: no exact requested iris family');
   census.push({id:old.id,handle:old.handle,index:row?.index??null,status:state!.status,storefrontPresent:true,publishedAt:state!.publishedAt,privateHold:'clear',retainedTags:state!.tags,priorInventoryReasons:old.reasons,fingerprint,rawEyeGroup:rawConfig.groups.find(g=>g.id==='eye-color')||null,runtimeCandidateEyeGroup:group||null,referenceFamilyHash:row?.referenceFamilyHash??null,sourceDecision:decision?.decision||'not-reviewed',reasons,ready:false});
   if(reasons.length)continue;
   assertSourceDecision(decision);expect(group).toBeDefined();expect(group!.selectionMode).toBe('single');expect(group!.visibleWhen?.length||0).toBe(0);
   expect(isCustomerVisibleProduct(product)).toBe(true);
   const source=decision.sourcePosition===0?row.sources[0]:alternatives.rows.find((r:any)=>r.id===row.id)?.sources.find((s:any)=>s.sourcePosition===decision.sourcePosition);
   expect(source).toBeDefined();expect([source.url,source.sha256,source.file]).toEqual([decision.sourceUrl,decision.sourceSha256,decision.sourceFile]);
   const currentSource=productImageSources(product)[decision.sourcePosition];expect(currentSource).toBeDefined();expect(currentSource.url).toBe(source.url);
   expect(hash(await fs.readFile(source.file))).toBe(source.sha256);const image=await boundedOwnedImage(source.url);expect(image.sha256).toBe(source.sha256);expect([image.width,image.height]).toEqual([currentSource.width,currentSource.height]);verified.set(source.url,image.sha256);
   const defaults=getDefaultSelections(config),basePrice=Number(node!.priceRange.minVariantPrice.amount);
   const base=resolveCustomization(config,defaults,basePrice);expect(Number.isFinite(base.totalPrice)).toBe(true);counts.defaultChecks++;
   for(const choice of row.choices){
    expect(verified.get(choice.reference)).toBe(choice.sha256);expect(isOptionAvailableForCheckout(config,'eye-color',choice.optionId)).toBe(true);
    const result=resolveCustomization(config,{...defaults,'eye-color':choice.optionId},basePrice);
    expect(result.selections['eye-color']).toBe(choice.optionId);
    const chosen=result.selectedOptions.find(o=>o.groupId==='eye-color'&&o.optionId===choice.optionId);expect(chosen).toBeDefined();
    expect(result.cartAttributes.some(a=>a.key==='DollWow '+chosen!.groupLabel&&a.value.includes(chosen!.optionLabel))).toBe(true);counts.irisChoiceChecks++;
   }
   proposed.push({index:row.index,id:row.id,handle:row.handle,status:'candidate-awaiting-parent-approval',shopifyStatus:'ACTIVE',publiclyAvailable:true,fingerprint,sourcePosition:decision.sourcePosition,sourceUrl:source.url,sourceFile:source.file,sourceSha256:source.sha256,referenceFamilyHash:row.referenceFamilyHash,choices:row.choices,hairEnabled:false,ready:false,generationAuthorized:false});
  }
  expect(proposed).toHaveLength(7);expect(counts.defaultChecks).toBe(7);expect(counts.irisChoiceChecks).toBe(35);
  const after=await current();expect(after.states).toEqual(before.states);expect(after.nodes).toEqual(before.nodes);
  for(const input of runtimeInputs)expect(hash(await fs.readFile(input.file))).toBe(input.sha256);
  expect(hash(await fs.readFile(path.join(output,'frozen-assistant-review.json')))).toBe(hash(reviewBytes));
  const passSheets=[];
  for(let start=0;start<proposed.length;start+=4){const tiles=[];
   for(const p of proposed.slice(start,start+4))tiles.push(await tile(await fs.readFile(p.sourceFile),`${p.index} | ${p.id.split('/').at(-1)} | p${p.sourcePosition}`,360,500));
   passSheets.push(await sheet(tiles,4,`pass-only-sources-${start+1}-${Math.min(start+4,proposed.length)}.png`,360,500));
  }
  const save=(name:string,value:unknown)=>fs.writeFile(path.join(output,name),JSON.stringify(value,null,2)+'\n',{flag:'wx',mode:0o600});
  await save('freeze-current-state.json',{before,after,census,counts});
  await save('candidate-proposal.json',{preparedAt:new Date().toISOString(),status:'CANDIDATE_ONLY_AWAITING_PARENT_FROZEN_INPUT_APPROVAL',ready:false,registryWritten:false,generationAuthorized:false,ownerReviewed:false,parentApproved:false,runtimeDraftsCreated:0,
   scope:'Raw current source/menu and selection compatibility only. No injected ready registry, public cart-handler readiness, generation fidelity or release approval is claimed. ACTIVE Storefront records are not Shopify drafts; these are private proposal drafts only.',
   inputs:[...review.inputs,{file:'frozen-assistant-review.json',sha256:hash(reviewBytes)},{file:inventoryFile,sha256:hash(inventoryBytes)}],runtimeInputs,registryCount:Object.keys(registry).length,
   summary:{inventoryProducts:selected.length,inventoryWithoutPriorExclusions:selected.filter((r:any)=>!r.reasons.length).length,exactCensusFamilyMatches:manifest.rows.length,sourcePhotosReviewed:90,sourcePass:proposed.length,sourceExcluded:55,outsideExactIrisFamilies:3,uniqueImageBindings:verified.size,...counts},
   proposed,census,passSheets,sourceExclusionsAreSaleHolds:false,remaining:['Parent approval of exact frozen inputs','Parent-chosen actual generation and fidelity review','Runtime-ready validation and integration owned by parent','Remaining source exclusions and unmapped families are unfinished']});
 }finally{vi.unstubAllGlobals();}
},20*60*1000);
