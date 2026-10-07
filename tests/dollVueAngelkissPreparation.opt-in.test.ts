import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { expect, it, vi } from 'vitest';
import { env, hasShopifyStorefrontEnv } from '@/lib/utils/env';
import { storefrontAuthHeaders } from '@/lib/shopify/auth';
import { adminFetch } from '@/lib/shopify/admin';
import { mapShopifyProduct } from '@/lib/shopify/mappers';
import { isCustomerVisibleProduct } from '@/lib/shopify/storefront';
import { getCustomizationConfig } from '@/lib/customization/configs';
import { dollVueConfigForProduct } from '@/lib/dollvue/config';
import { isDollVueExcluded } from '@/lib/dollvue/eligibility';
import { classifyAppearance } from '@/lib/dollvue/appearance';
import { dollVueReadinessFingerprint, type DollVueReadinessRecord } from '@/lib/dollvue/readiness';
import { productImageSources } from '@/lib/catalog/productImage';
import { normalizeReviewedImage } from '@/lib/dollvue/reviewedImages';
import { isOwnedOptionAsset } from '@/lib/assets/option-assets.mjs';

const root = '/Volumes/Extreme Pro/Projects/DollWOW/data/exports/dollvue-readiness-2026-10-07';
const output = path.join(root,'angelkiss-hair-family-preparation');
const hash = (bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
type Node = Parameters<typeof mapShopifyProduct>[0];
type State = {id:string;handle:string;status:string;tags:string[];hold:{value:string}|null;publishedAt:string|null;
  resourcePublications:{nodes:Array<{isPublished:boolean}>;pageInfo:{hasNextPage:boolean}}};
type AdminNode = Omit<Node,'priceRange'|'variants'|'media'> & State & {
  variants:{edges:Array<{node:Omit<Node['variants']['edges'][number]['node'],'price'> & {price:string}}>};
};
type Choice = DollVueReadinessRecord['choices'][number];
const fields: Record<string,string> = {
  catalogIdentityKey:'catalog_identity_key',catalogBodyIdentityKey:'catalog_body_identity_key',headModel:'head_model',
  displayName:'display_name',bodyType:'body_type',lookTags:'look_tags',brand:'brand',sourceTitle:'source_title',
  sourceHandle:'source_handle',sourceReleaseRank:'source_release_rank',material:'material',heightCm:'height_cm',
  weightLb:'weight_lb',cupSize:'cup_size',measurements:'measurements',warehouseCountry:'warehouse_country',
  warehouseRegions:'warehouse_regions',stockStatus:'stock_status',deliveryEstimate:'delivery_estimate',
  stockLastCheckedAt:'stock_last_checked_at',customAvailable:'custom_available',penisAddOnAvailable:'has_insertable_penis_add_on',
  irontechUlwEligibility:'irontech_ulw_eligibility',qcNote:'qc_note',customizationGroups:'customization_groups',
};
const query = `query AngelkissSourcePreparation($ids:[ID!]!){nodes(ids:$ids){... on Product{
  id handle title description seo{title description} vendor productType tags
  featuredImage{url altText width height} images(first:50){edges{node{url altText width height}}}
  priceRange{minVariantPrice{amount currencyCode} maxVariantPrice{amount currencyCode}}
  variants(first:30){edges{node{id title availableForSale price{amount currencyCode} selectedOptions{name value}}}}
  media(first:50){edges{node{mediaContentType alt ... on MediaImage{image{url altText width height}}
    ... on Video{previewImage{url altText width height} sources{url mimeType}}}}}
  ${Object.entries(fields).map(([alias,key])=>`${alias}:metafield(namespace:"custom",key:"${key}"){value}`).join('\n')}
}}}`;

it.skipIf(process.env.DOLLVUE_ANGELKISS_PREPARATION !== '1')('prepares exact-byte Angelkiss hair candidates with no source or new family approval',async ()=>{
  const inventoryFile=path.join(root,'inventory.json');
  const inventoryBytes=await fs.readFile(inventoryFile);
  const inventory=JSON.parse(inventoryBytes.toString()) as {capturedAt:string;rows:Array<{
    id:string;handle:string;brand:string;status:string;reasons:string[];familyKey:string;photos:Array<{url:string}>;
  }>;families:Array<{key:string;groups:Array<{id:string;options:Array<{id:string;label:string;swatch?:{kind:string;value:string};decision:{status:string}}>}>}>};
  const auditFile=path.join(root,'reference-audit.json'),jevFile=path.join(root,'jev-review.json');
  const auditBytes=await fs.readFile(auditFile),jevBytes=await fs.readFile(jevFile);
  const audit=JSON.parse(auditBytes.toString()) as {rows:Array<{url:string;sha256:string;visualMeaningVerified:boolean}>};
  const jev=JSON.parse(jevBytes.toString()) as {results:Array<{occurrences:Array<{family:string;groupId:string;optionId:string}>}>};
  const registryBytes=await fs.readFile('lib/dollvue/readiness-registry.json');
  const registry=JSON.parse(registryBytes.toString()) as Record<string,DollVueReadinessRecord>;
  const seed=registry['gid://shopify/Product/10431698337976'];
  expect(seed.status).toBe('ready');
  const seedChoices=seed.choices.filter(c=>c.groupId==='hairstyle');
  expect(seedChoices.map(c=>c.optionId)).toEqual(Array.from({length:15},(_,i)=>'no-'+(i+1)));
  const choices=seedChoices.map(c=>({...c,optionId:'hairstyle-'+c.optionId.slice(3)}));
  const selected=inventory.rows.filter(row=>row.brand==='Angelkiss'&&['ACTIVE','DRAFT'].includes(row.status)&&!registry[row.id]&&!row.reasons.length)
    .filter(row=>JSON.stringify(inventory.families.find(f=>f.key===row.familyKey)!.groups.find(g=>g.id==='hairstyle')!
      .options.filter(o=>o.decision.status==='candidate').map(o=>({groupId:'hairstyle',optionId:o.id,reference:o.swatch?.value})))===JSON.stringify(choices))
    .map(row=>({...row,productId:row.id,firstOwnedSource:row.photos[0]}));
  expect(selected).toHaveLength(78);
  const cachedSeed=inventory.rows.find(row=>row.id===seed.productId)!;
  const cachedHair=inventory.families.find(f=>f.key===cachedSeed.familyKey)!.groups.find(g=>g.id==='hairstyle')!
    .options.filter(o=>o.decision.status==='candidate');
  expect(cachedHair).toHaveLength(15);
  for(const row of selected){
    const group=inventory.families.find(f=>f.key===row.familyKey)!.groups.find(g=>g.id==='hairstyle')!;
    expect(group.options.filter(o=>o.decision.status==='candidate').map(o=>({optionId:o.id,reference:o.swatch?.value})))
      .toEqual(cachedHair.map((o,i)=>({optionId:'hairstyle-'+(i+1),reference:o.swatch?.value})));
    expect(group.options.filter(o=>o.decision.status==='candidate').map(o=>o.label)).toEqual(Array.from({length:15},(_,i)=>'Hairstyle #'+(i+1)));
  }
  await fs.mkdir(output,{recursive:true,mode:0o700});
  expect(await fs.stat(path.join(output,'candidate-manifest.json')).then(()=>true,e=>{if(e.code==='ENOENT')return false;throw e;})).toBe(false);
  const readIds=[seed.productId,...selected.map(row=>row.productId)];
  expect(new Set(readIds).size).toBe(79);
  expect(hasShopifyStorefrontEnv()).toBe(true);
  const counts={storefrontBulkReads:0,adminBulkReads:0,imageReads:0,generationCalls:0,shopifyWrites:0};
  const nativeFetch=globalThis.fetch;
  vi.stubGlobal('fetch',async(input:Parameters<typeof fetch>[0],init?:RequestInit)=>{
    const url=new URL(input instanceof Request?input.url:String(input));
    const method=init?.method||(input instanceof Request?input.method:'GET');
    if(url.hostname===env.SHOPIFY_STORE_DOMAIN&&url.pathname.endsWith('/graphql.json')&&method==='POST'){
      const body=JSON.parse(String(init?.body));
      expect(body.query).toMatch(/^\s*query\b/);expect(body.query).not.toMatch(/\bmutation\b/);
      expect(body.variables.ids.length).toBeLessThanOrEqual(50);
      expect(body.variables.ids.every((id:string)=>readIds.includes(id))).toBe(true);
      if(url.pathname.includes('/admin/'))counts.adminBulkReads++;else counts.storefrontBulkReads++;
    }else if(url.hostname===env.SHOPIFY_STORE_DOMAIN&&url.pathname==='/admin/oauth/access_token'&&method==='POST'){
      // Token renewal is the only non-query POST allowed.
    }else{expect(method).toBe('GET');expect(isOwnedOptionAsset(url.href)).toBe(true);counts.imageReads++;}
    return nativeFetch(input,init);
  });
  const startedAt=new Date().toISOString();
  try{
    const nodes=new Map<string,Node|null>(),states=new Map<string,State|null>(),draftNodes=new Map<string,Node>();
    for(let offset=0;offset<readIds.length;offset+=50){
      const ids=readIds.slice(offset,offset+50);
      const response=await fetch('https://'+env.SHOPIFY_STORE_DOMAIN+'/api/2026-04/graphql.json',{
        method:'POST',cache:'no-store',signal:AbortSignal.timeout(60000),
        headers:{'Content-Type':'application/json',...storefrontAuthHeaders(env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!)},
        body:JSON.stringify({query,variables:{ids}}),
      });
      expect(response.ok).toBe(true);
      const body=await response.json() as {errors?:unknown[];data?:{nodes:Array<Node|null>}};
      expect(body.errors).toBeUndefined();expect(body.data?.nodes).toHaveLength(ids.length);
      body.data!.nodes.forEach((node,index)=>{if(node)expect(node.id).toBe(ids[index]);nodes.set(ids[index],node);});
      const state=await adminFetch<{nodes:Array<AdminNode|null>;shop:{currencyCode:string}}>(
        'query AngelkissPreparationState($ids:[ID!]!){nodes(ids:$ids){... on Product{'+
        'id handle title description seo{title description} vendor productType tags status publishedAt '+
        'hold:metafield(namespace:"custom",key:"catalog_image_review_hold"){value} '+
        'resourcePublications(first:50){nodes{isPublished} pageInfo{hasNextPage}} '+
        'featuredImage{url altText width height} images(first:50){edges{node{url altText width height}}} '+
        'variants(first:30){edges{node{id title availableForSale price selectedOptions{name value}}}} '+
        Object.entries(fields).map(([alias,key])=>alias+':metafield(namespace:"custom",key:"'+key+'"){value}').join(' ')+
        '}} shop{currencyCode}}',{ids});
      expect(state.nodes).toHaveLength(ids.length);
      state.nodes.forEach((node,index)=>{if(node){expect(node.id).toBe(ids[index]);
        const price={amount:node.variants.edges[0]?.node.price||'0',currencyCode:state.shop.currencyCode};
        draftNodes.set(node.id,{...node,priceRange:{minVariantPrice:price,maxVariantPrice:price},
          variants:{edges:node.variants.edges.map(({node:v})=>({node:{...v,price:{amount:v.price,currencyCode:state.shop.currencyCode}}}))}});
      }states.set(ids[index],node);});
    }
    const checkedAt=new Date().toISOString();
    function exactChoices(product:ReturnType<typeof mapShopifyProduct>):Choice[]{
      const config=dollVueConfigForProduct(product,getCustomizationConfig(product));
      const group=config.groups.find(g=>g.id==='hairstyle');
      if(!group||group.visibleWhen?.length)return [];
      return group.options.filter(o=>classifyAppearance(group,o).status==='candidate'&&o.swatch?.kind==='image')
        .map(o=>({groupId:group.id,optionId:o.id,reference:o.swatch!.value}));
    }
    const seedProduct=mapShopifyProduct(nodes.get(seed.productId)!);
    expect(exactChoices(seedProduct)).toEqual(seedChoices);
    expect(dollVueReadinessFingerprint(seedProduct,dollVueConfigForProduct(seedProduct,getCustomizationConfig(seedProduct)))).toBe(seed.fingerprint);
    expect(states.get(seed.productId)?.status).toBe('ACTIVE');expect(states.get(seed.productId)?.hold?.value?.trim()||'').toBe('');
    const sharedHairEvidence=[];
    for(const c of choices){
      const sha256=seed.imageDigests![c.reference];
      await normalizeReviewedImage({url:c.reference,sha256,origin:env.NEXT_PUBLIC_SITE_URL,optionReference:true});
      const cachedReference=cachedHair[choices.indexOf(c)].swatch!.value;
      const cachedAudit=audit.rows.find(row=>row.url===cachedReference);
      expect(cachedAudit?.sha256).toMatch(/^[a-f0-9]{64}$/);
      sharedHairEvidence.push({...c,sha256,seedOptionId:seedChoices.find(x=>x.reference===c.reference)!.optionId,
        cachedReference,cachedReferenceSha256:cachedAudit!.sha256,
        referenceBytesPreviouslyReviewed:true,targetBrandSemanticsApproval:false,reviewedForMatchingOnly:true});
    }
    async function sourceBytes(url:string){
      expect(isOwnedOptionAsset(url)).toBe(true);
      const response=await fetch(url,{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(20000)});
      expect(response.ok).toBe(true);expect(response.redirected).toBe(false);
      expect(response.url).toBe(new URL(url).href);expect(response.headers.get('content-type')).toMatch(/^image\//);
      const limit=20*1024*1024;
      expect(Number(response.headers.get('content-length'))).toBeLessThanOrEqual(limit);
      const reader=response.body!.getReader(),parts:Buffer[]=[];let size=0;
      try{while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;
        if(size>limit)throw Error('Source too large');parts.push(Buffer.from(part.value));}}
      finally{void reader.cancel().catch(()=>{});}
      const bytes=Buffer.concat(parts);
      const decoder=sharp(bytes,{limitInputPixels:25000000,failOn:'warning',animated:true}).timeout({seconds:5});
      const meta=await decoder.metadata();
      expect(meta.pages||1).toBe(1);expect(meta.width).toBeGreaterThan(0);expect(meta.height).toBeGreaterThan(0);
      expect(['jpeg','png','webp','gif']).toContain(meta.format);
      await decoder.clone().raw().toBuffer();
      return {bytes,sha256:hash(bytes),width:meta.width!,height:meta.height!,format:meta.format!};
    }
    const rows=[],excluded=[],tiles:Buffer[]=[];
    const escape=(s:string)=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
    for(const [index,old]of selected.entries()){
      const number=index+1,state=states.get(old.productId),storefrontNode=nodes.get(old.productId);
      const node=state?.status==='DRAFT'?draftNodes.get(old.productId):storefrontNode;
      try{
        if(!node||!state)throw Error('Current Storefront/Admin identity missing');
        expect(node.handle).toBe(old.handle);expect(state.handle).toBe(old.handle);
        expect(state.status).toBe(old.status);expect(state.hold?.value?.trim()||'').toBe('');
        if(state.status==='DRAFT'){expect(storefrontNode).toBeNull();expect(state.publishedAt).toBeNull();
          expect(state.resourcePublications.pageInfo.hasNextPage).toBe(false);
          expect(state.resourcePublications.nodes.some(x=>x.isPublished)).toBe(false);
        }else expect(state.status).toBe('ACTIVE');
        const product=mapShopifyProduct(node);
        expect(isCustomerVisibleProduct(product)).toBe(true);expect(isDollVueExcluded(product)).toBe(false);
        expect(product.extended.brand).toBe('Angelkiss');expect(product.extended.stockStatus).toBe('custom');
        expect(product.productType).toMatch(/^custom\b.*\bdoll\b/i);
        const scopeFlags=[product.productType,...product.tags,...state.tags].filter(value=>/head[ -]?only|torso|accessor|ready.to.ship|hold|not-for-launch|excluded/i.test(value));
        if(scopeFlags.length)throw Error('Current scope exclusion: '+[...new Set(scopeFlags)].join(', '));
        expect(exactChoices(product)).toEqual(choices);
        const hairGroup=dollVueConfigForProduct(product,getCustomizationConfig(product)).groups.find(g=>g.id==='hairstyle')!;
        expect(hairGroup.selectionMode).toBe('single');
        expect(hairGroup.options.filter(o=>classifyAppearance(hairGroup,o).status==='candidate').map(o=>o.label))
          .toEqual(Array.from({length:15},(_,i)=>'Hairstyle #'+(i+1)));
        const source=productImageSources(product)[0],image=await sourceBytes(source.url);
        expect([source.width,source.height]).toEqual([image.width,image.height]);
        const sourceFile=path.join(output,'source-'+node.id.split('/').at(-1)+'.'+(image.format==='jpeg'?'jpg':image.format));
        await fs.writeFile(sourceFile,image.bytes,{mode:0o600,flag:'wx'});
        const displayName=product.extended.displayName||product.title;
        const thumb=await sharp(image.bytes).autoOrient().resize(360,440,{fit:'contain',background:'#eeeeee'}).png().toBuffer();
        const footer=Buffer.from('<svg width="360" height="80"><rect width="360" height="80" fill="white"/><g font-family="Arial" font-size="14" fill="#111"><text x="8" y="19">'+number+'. '+escape(displayName.slice(0,38))+'</text><text x="8" y="39">'+node.id.split('/').at(-1)+' | photo 0</text><text x="8" y="59">Angelkiss / NOT VISUALLY APPROVED</text></g></svg>');
        tiles.push(await sharp({create:{width:360,height:520,channels:3,background:'#fff'}}).composite([
          {input:thumb,left:0,top:0},{input:footer,left:0,top:440}]).png().toBuffer());
        rows.push({contactSheetIndex:number,id:node.id,handle:node.handle,displayName,status:state.status,
          brand:product.extended.brand,productType:product.productType,stockStatus:product.extended.stockStatus,
          currentCheckedAt:checkedAt,currentHold:'clear',strictStorefrontIdentity:state.status==='ACTIVE',strictStorefrontNull:state.status==='DRAFT',
          publishedAt:state.publishedAt,publications:state.resourcePublications,
          sourcePosition:0,sourceUrl:source.url,sourceFile,sourceSha256:image.sha256,sourceBytes:image.bytes.length,
          decoded:{width:image.width,height:image.height,format:image.format},
          cachedLeadUrl:old.firstOwnedSource?.url,cachedLeadUnchanged:old.firstOwnedSource?.url===source.url,
          exactEyeChoices:[],exactHairChoices:choices,hairFamilyExact:true,hairApproval:false,
          cachedJevCases:jev.results.filter(x=>x.occurrences.some(o=>o.family===old.familyKey&&o.groupId==='hairstyle')).length,
          jevApproval:false,
          fingerprint:dollVueReadinessFingerprint(product,dollVueConfigForProduct(product,getCustomizationConfig(product))),
          sourceVisualReview:'NOT_REVIEWED',disposition:'AWAITING_SOURCE_PHOTO_INSPECTION',ready:false});
      }catch(error){excluded.push({contactSheetIndex:number,id:old.productId,handle:old.handle,reason:error instanceof Error?error.message:String(error)});}
      if((index+1)%10===0)console.info(JSON.stringify({processed:index+1,prepared:rows.length,excluded:excluded.length}));
    }
    const contactSheets=[];
    for(let offset=0;offset<tiles.length;offset+=10){
      const part=tiles.slice(offset,offset+10),file=path.join(output,'contact-sheet-'+String(rows[offset].contactSheetIndex).padStart(2,'0')+'-'+String(rows[offset+part.length-1].contactSheetIndex).padStart(2,'0')+'.png');
      const bytes=await sharp({create:{width:1800,height:Math.ceil(part.length/5)*520,channels:3,background:'#fff'}})
        .composite(part.map((input,i)=>({input,left:(i%5)*360,top:Math.floor(i/5)*520}))).png().toBuffer();
      await fs.writeFile(file,bytes,{mode:0o600,flag:'wx'});
      contactSheets.push({file,sha256:hash(bytes),indices:rows.slice(offset,offset+10).map(row=>row.contactSheetIndex)});
    }
    expect(await fs.readFile('lib/dollvue/readiness-registry.json')).toEqual(registryBytes);
    await fs.writeFile(path.join(output,'current-state-and-holds.json'),JSON.stringify({checkedAt,rows:[...states.values()],registryChanged:false},null,2),{mode:0o600,flag:'wx'});
    const summary={selected:selected.length,prepared:rows.length,active:rows.filter(r=>r.status==='ACTIVE').length,
      draft:rows.filter(r=>r.status==='DRAFT').length,excluded:excluded.length,exactEyeReferences:0,hairReferences:15,...counts};
    await fs.writeFile(path.join(output,'candidate-manifest.json'),JSON.stringify({startedAt,checkedAt,completedAt:new Date().toISOString(),
      family:'Angelkiss-hair15',seedProductId:seed.productId,summary,sharedEyeEvidence:[],sharedHairEvidence,rows,excluded,contactSheets,
      inputs:[{file:inventoryFile,sha256:hash(inventoryBytes)},{file:auditFile,sha256:hash(auditBytes)},{file:jevFile,sha256:hash(jevBytes)}],registryInputSha256:hash(registryBytes),
      snapshotCapturedAt:inventory.capturedAt,candidateOnly:true,registryChanged:false,publicationChanged:false,
      note:'Current source0 bytes prepared for assistant visual review only; same WM hair bytes with explicit numbered option mapping, not source approval or automatic target-brand activation. Eyes excluded; no Jev rerun.'},null,2),{mode:0o600,flag:'wx'});
    console.info(JSON.stringify({output,...summary}));
  }finally{vi.unstubAllGlobals();}
},30*60*1000);
