import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const root='data/exports/dol312-both-brands-nov10';
const read=async f=>JSON.parse(await fs.readFile(f,'utf8'));
const review=await read('data/draft-previews/mmx-fanreal-dollvue-iris-nov10.json');
const catalog=await read(root+'/fresh-candidates.json');
const originals=(await read(root+'/asset-byte-review.json')).sources;
const examples=await read(root+'/live-example-sources.json');
const landmarks=[...await read(root+'/eye-landmarks.json'),...await read(root+'/live-example-landmarks.json')];
// Exact images visually reviewed as suitable full-photo sources in the source
// contact sheets. All other reviewed sources use the already verified eye detail.
const safeCovers=new Set([2,3,4,5,7,9,11,12,14,15,16,18,19,21,22,24,25,26,27,28,30,39,42,43,45,46,47,48,49,50,51,52,55,56,57,58,59,60,61,62,63,66,67,68,69,71,72,73,74,75,76,77,79,81,83,84,86,88,89,90,95,97,100,101,104,107,108,109,110,112,113,114,115,116,117,118,119,120,121,122,123,124,125,127,128,129,130,131,132,133,134,135,136,137,138,139]);
const registry=await read('lib/dollvue/readiness-registry.json'),release={};
for(const r of review.records){
 const current=catalog.products.find(p=>p.product.id===r.productId);
 assert(current?.product.handle===r.handle&&current.hold==='clear'&&current.fingerprint===r.fingerprint);
 const primary=current.photos[r.sourcePosition];assert(primary);
 const choices=r.groups.flatMap(g=>g.options.map(o=>({groupId:g.id,optionId:o.id,reference:o.swatch.value})));
 const pigments=Object.fromEntries(r.groups.flatMap(g=>g.options.map(o=>[o.swatch.value,o.pigment])));
 const sourcePositions=[r.sourcePosition],imageDigests={...Object.fromEntries(Object.entries(pigments).map(([ref,pigment])=>[ref,pigment.referenceSHA256])),[primary.url]:r.sourceOriginalSHA256};
 const fullSources={};
 const candidates=[...originals.filter(p=>p.handle===r.handle&&safeCovers.has(p.index+1)).map(p=>({...p,position:0})),...examples.filter(p=>p.handle===r.handle&&!(r.brand==='MMX'&&p.position===1))];
 for(const p of candidates){
  const match=current.photos[p.position];if(!match||match.url!==p.url)continue;
  const l=landmarks.find(l=>l.file===path.resolve(p.file));if(!l?.leftPupil?.length||!l?.rightPupil?.length)continue;
  const eyes=['left','right'].map(side=>{const eye=l[side+'Eye'],c=l[side+'Pupil'][0],w=Math.max(...eye.map(p=>p[0]))-Math.min(...eye.map(p=>p[0])),h=Math.max(...eye.map(p=>p[1]))-Math.min(...eye.map(p=>p[1]));return {cx:c[0],cy:c[1],rx:Math.min(w*.20,h*.55),ry:h*.38};});
  if(eyes.some(e=>Math.min(e.rx,e.ry)*Math.min(1,1200/Math.max(l.width,l.height))<1||e.rx>l.width*.025||e.ry>l.height*.025))continue;
  fullSources[p.position]={sha256:p.sha256,width:l.width,height:l.height,eyes};
  if(!sourcePositions.includes(p.position))sourcePositions.push(p.position);
  imageDigests[p.url]=p.sha256;
 }
 sourcePositions.sort((a,b)=>Number(!fullSources[a])-Number(!fullSources[b])||a-b);
 release[r.productId]={portrait:{position:r.sourcePosition,photo:r.photo,mask:r.mask},fullSources,pigments};
 registry[r.productId]={productId:r.productId,policy:'appearance-v1',fingerprint:r.fingerprint,status:'ready',sourcePositions,imageDigests,choices,renderer:'protected-iris'};
}
assert.equal(Object.keys(release).length,128);
await fs.writeFile('lib/dollvue/live-iris-sources.json',JSON.stringify(release)+'\n');
await fs.writeFile('lib/dollvue/readiness-registry.json',JSON.stringify(registry,null,2)+'\n');
console.log({products:128,fullPhotoProducts:Object.values(release).filter(p=>Object.keys(p.fullSources).length).length,fullPhotoSources:Object.values(release).reduce((n,p)=>n+Object.keys(p.fullSources).length,0)});
