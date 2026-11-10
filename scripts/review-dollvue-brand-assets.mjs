import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {createServer} from 'vite';
const root='data/exports/dol312-both-brands-nov10';
const data=JSON.parse(await fs.readFile(root+'/fresh-candidates.json'));
const server=await createServer({configFile:false,server:{middlewareMode:true},resolve:{alias:{'@':process.cwd()}}});
const {classifyAppearance}=await server.ssrLoadModule('/lib/dollvue/appearance.ts');
const {assessExteriorOption}=await server.ssrLoadModule('/lib/dollvue/exteriorScope.ts');
const {isDollVueGroupVisible}=await server.ssrLoadModule('/lib/dollvue/conditionalVisibility.ts');
const refs=new Map();
for(const row of data.products) {
 for(const choice of row.choices) {const group=row.config.groups.find(g=>g.id===choice.groupId),option=group.options.find(o=>o.id===choice.optionId);
  choice.decision=classifyAppearance(group,option);choice.exterior=assessExteriorOption(group,option);}
 const groups=new Set(row.choices.filter(c=>c.decision.status==='candidate').map(c=>c.groupId));
 for(const choice of row.choices){choice.conditionSupported=isDollVueGroupVisible(row.config,row.config.groups.find(g=>g.id===choice.groupId),groups);
  if(choice.decision.status==='candidate'&&choice.reference?.startsWith('/option-assets/')) refs.set(choice.reference,{reference:choice.reference,label:row.brand+' '+choice.group+' '+choice.option});}
}
await server.close();await fs.writeFile(root+'/fresh-candidates.json',JSON.stringify(data,null,2));
const sha=b=>createHash('sha256').update(b).digest('hex');
await fs.mkdir(root+'/photos',{recursive:true});
const sources=[];
let next=0;
await Promise.all(Array.from({length:4},async()=>{while(next<data.products.length){const i=next++,r=data.products[i];const p=r.photos[0];if(!p)continue;
 const file=root+'/photos/'+r.product.id.split('/').pop()+'.jpg';let bytes=await fs.readFile(file).catch(()=>null);
 if(!bytes){const response=await fetch(p.url,{redirect:'error',signal:AbortSignal.timeout(20000)});if(!response.ok)throw Error('Photo unavailable '+r.product.handle);bytes=Buffer.from(await response.arrayBuffer());await fs.writeFile(file,bytes);}
 const m=await sharp(bytes).metadata();sources.push({index:i,brand:r.brand,id:r.product.id,handle:r.product.handle,file,url:p.url,sha256:sha(bytes),width:m.width,height:m.height});
}}));
sources.sort((a,b)=>a.index-b.index);
const refsChecked=[];
for(const ref of refs.values()){const bytes=await fs.readFile('public'+ref.reference),m=await sharp(bytes).metadata();refsChecked.push({...ref,file:'public'+ref.reference,sha256:sha(bytes),width:m.width,height:m.height});}
async function contacts(items,prefix){for(let start=0;start<items.length;start+=24){const batch=items.slice(start,start+24),tiles=[];
 for(const [i,r]of batch.entries()){const img=await sharp(r.file).resize(220,200,{fit:'contain',background:'#fff'}).png().toBuffer();const label=String(start+i+1)+'. '+(r.handle??r.label).replace(/[^a-zA-Z0-9 #.-]/g,' ').slice(0,38);const text=Buffer.from(`<svg width="220" height="35"><rect width="220" height="35" fill="white"/><text x="4" y="15" font-size="10" font-family="Arial">${label}</text></svg>`);tiles.push({input:img,left:i%6*220,top:Math.floor(i/6)*235},{input:text,left:i%6*220,top:Math.floor(i/6)*235+200});}
 await sharp({create:{width:1320,height:Math.ceil(batch.length/6)*235,channels:3,background:'#ddd'}}).composite(tiles).png().toFile(root+`/${prefix}-${start/24+1}.png`);}}
await contacts(sources,'source-contact');await contacts(refsChecked,'reference-contact');
await fs.writeFile(root+'/asset-byte-review.json',JSON.stringify({sources,references:refsChecked,visualReviewComplete:false},null,2));
console.log(JSON.stringify({sources:sources.length,references:refsChecked.length,brands:data.counts,visualReviewComplete:false}));
