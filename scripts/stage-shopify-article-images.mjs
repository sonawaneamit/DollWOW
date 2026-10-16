#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';

export function assertImageDraft(article, receipt) {
  if (!article || article.id!==receipt.articleId || article.handle!==receipt.slug || article.isPublished!==false || article.publishedAt!==null) throw new Error('Image target is not the recorded unscheduled draft');
}

export function stableArticleHash(article) {
  return createHash('sha256').update(JSON.stringify({title:article.title,handle:article.handle,body:article.body,summary:article.summary,tags:article.tags,author:article.author})).digest('hex');
}

export function assertImageReview(record) {
  if (!/^NEW-\d{2}$/.test(record.id)||!record.slug||!record.outputPath||!record.altText||record.altText.length>300||record.parentApproved!==true) throw new Error('Missing reviewed image metadata');
  if (!record.prompt || (!record.sourceReferencePaths?.length && record.originalConcept!==true)) throw new Error('Image provenance missing');
}

async function main() {
  const args=process.argv.slice(2),get=k=>args[args.indexOf(k)+1];
  for(const flag of ['--manifest','--receipts','--output'])if(!args.includes(flag))throw new Error(`${flag} required`);
  const manifest=JSON.parse(await fs.readFile(get('--manifest'),'utf8'));
  const receipts=JSON.parse(await fs.readFile(get('--receipts'),'utf8')).records;
  const records=manifest.records||manifest;
  if(!Array.isArray(records)||!records.length)throw new Error('No image records');
  records.forEach(assertImageReview);
  if(new Set(records.map(r=>r.id)).size!==records.length)throw new Error('Duplicate image IDs');
  const output=path.resolve(get('--output'));
  let report={startedAt:new Date().toISOString(),execute:args.includes('--execute'),records:[]};
  try{const prior=JSON.parse(await fs.readFile(output,'utf8'));if(prior.execute)report=prior;}catch(e){if(e.code!=='ENOENT')throw e;}
  const save=async()=>{report.checkedAt=new Date().toISOString();await fs.mkdir(path.dirname(output),{recursive:true});await fs.writeFile(output,JSON.stringify(report,null,2));};
  const domain=process.env.SHOPIFY_STORE_DOMAIN?.replace(/^https?:\/\//,'').replace(/\/$/,'');
  let token=process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
  async function api(query,variables={}){
    if(!token){
      if(!domain||!process.env.SHOPIFY_CLIENT_ID||!process.env.SHOPIFY_CLIENT_SECRET)throw new Error('Shopify credentials missing');
      const r=await fetch(`https://${domain}/admin/oauth/access_token`,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'client_credentials',client_id:process.env.SHOPIFY_CLIENT_ID,client_secret:process.env.SHOPIFY_CLIENT_SECRET}),signal:AbortSignal.timeout(30000)});
      const j=await r.json();if(!r.ok||!j.access_token)throw new Error('Shopify authentication failed');token=j.access_token;
    }
    const r=await fetch(`https://${domain}/admin/api/2026-04/graphql.json`,{method:'POST',headers:{'Content-Type':'application/json','X-Shopify-Access-Token':token},body:JSON.stringify({query,variables}),signal:AbortSignal.timeout(45000)});
    const j=await r.json();if(!r.ok||j.errors?.length)throw new Error(JSON.stringify(j.errors||r.status));
    for(const value of Object.values(j.data||{}))if(value?.userErrors?.length)throw new Error(JSON.stringify(value.userErrors));
    return j.data;
  }
  const fields='id title handle body summary tags author{name} isPublished publishedAt image{url altText width height}';
  const read=async id=>(await api(`query($id:ID!){article(id:$id){${fields}}}`,{id})).article;
  for(const record of records){
    const receipt=receipts.find(r=>r.calendarId===record.id&&r.slug===record.slug&&!r.error);
    if(!receipt)throw new Error(`No authorized article receipt ${record.id}`);
    const bytes=await fs.readFile(record.outputPath),metadata=await sharp(bytes).metadata();
    if(metadata.width<1200||metadata.height<600)throw new Error(`Image too small: ${record.id}`);
    if(!args.includes('--execute'))continue;
    const before=await read(receipt.articleId);assertImageDraft(before,receipt);
    const hash=createHash('sha256').update(bytes).digest('hex');
    let row=report.records.find(r=>r.id===record.id);
    if(row&&row.sha256!==hash)throw new Error(`Local image changed since upload: ${record.id}`);
    if(before.image){
      if(row?.articleImageUrl===before.image.url&&row?.altText===before.image.altText){row.verifiedAt=new Date().toISOString();await save();continue;}
      if(!row?.cdnUrl||before.image.altText!==record.altText||!before.image.url.includes(hash.slice(0,10)))throw new Error(`Existing unrecorded image; review before replacing: ${record.id}`);
    }
    if(!row){row={id:record.id,slug:record.slug,articleId:receipt.articleId,sha256:hash,altText:record.altText,originalArticleHash:stableArticleHash(before),localWidth:metadata.width,localHeight:metadata.height};report.records.push(row);await save();}
    if(stableArticleHash(before)!==row.originalArticleHash)throw new Error(`Article edited during image work: ${record.id}`);
    if(!row.fileId){
      const filename=`dollwow-${record.slug}-featured-${hash.slice(0,10)}.webp`;
      const staged=await api('mutation($input:[StagedUploadInput!]!){stagedUploadsCreate(input:$input){stagedTargets{url resourceUrl parameters{name value}} userErrors{field message}}}',{input:[{resource:'IMAGE',filename,mimeType:'image/webp',httpMethod:'POST',fileSize:String(bytes.length)}]});
      const target=staged.stagedUploadsCreate.stagedTargets[0];if(!target)throw new Error('No upload target');
      const form=new FormData();for(const p of target.parameters)form.append(p.name,p.value);form.append('file',new Blob([bytes],{type:'image/webp'}),filename);
      const uploaded=await fetch(target.url,{method:'POST',body:form,signal:AbortSignal.timeout(90000)});if(!uploaded.ok)throw new Error(`Upload HTTP ${uploaded.status}`);
      const created=await api('mutation($files:[FileCreateInput!]!){fileCreate(files:$files){files{...on MediaImage{id fileStatus image{url}}} userErrors{field message}}}',{files:[{originalSource:target.resourceUrl,filename,contentType:'IMAGE',alt:record.altText}]});
      row.fileId=created.fileCreate.files[0]?.id;if(!row.fileId)throw new Error('No file ID');await save();
    }
    if(!row.cdnUrl){
      for(let attempt=0;attempt<35;attempt++){
        const media=(await api('query($id:ID!){node(id:$id){...on MediaImage{fileStatus image{url}}}}',{id:row.fileId})).node;
        if(media.fileStatus==='FAILED')throw new Error(`Shopify image processing failed: ${record.id}`);
        if(media.fileStatus==='READY'&&media.image?.url){row.cdnUrl=media.image.url;await save();break;}
        await new Promise(r=>setTimeout(r,1200));
      }
      if(!row.cdnUrl)throw new Error(`Shopify image processing timed out: ${record.id}`);
    }
    if(new URL(row.cdnUrl).hostname!=='cdn.shopify.com')throw new Error('Unowned CDN target');
    const fresh=await read(receipt.articleId);assertImageDraft(fresh,receipt);
    if(stableArticleHash(fresh)!==row.originalArticleHash)throw new Error(`Article changed before image attachment: ${record.id}`);
    if(JSON.stringify(fresh.image)!==JSON.stringify(before.image))throw new Error(`Featured image changed during upload: ${record.id}`);
    await api('mutation($id:ID!,$article:ArticleUpdateInput!){articleUpdate(id:$id,article:$article){article{id} userErrors{field message}}}',{id:receipt.articleId,article:{image:{url:row.cdnUrl,altText:record.altText},isPublished:false}});
    const after=await read(receipt.articleId);assertImageDraft(after,receipt);
    if(stableArticleHash(after)!==row.originalArticleHash)throw new Error(`Article copy changed unexpectedly: ${record.id}`);
    if(!after.image||after.image.altText!==record.altText||after.image.width<1200)throw new Error(`Image readback mismatch: ${record.id}`);
    const test=await fetch(after.image.url,{signal:AbortSignal.timeout(30000)});if(!test.ok||!test.headers.get('content-type')?.startsWith('image/'))throw new Error(`Image URL failed: ${record.id}`);await test.body?.cancel();
    Object.assign(row,{articleImageUrl:after.image.url,width:after.image.width,height:after.image.height,isPublished:false,publishedAt:null,verifiedAt:new Date().toISOString()});
    await save();console.log(`${record.id}: image attached; draft verified`);
  }
  if(!args.includes('--execute')){report={execute:false,validated:records.length,publicationActions:0};await save();}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await main();
