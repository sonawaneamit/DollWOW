import fs from 'node:fs/promises';import path from 'node:path';import sharp from 'sharp';import {createHash} from 'node:crypto';
const root='data/exports/dol312-both-brands-nov10',fixture=JSON.parse(await fs.readFile('data/draft-previews/mmx-fanreal-dollvue-iris-nov10.json')),data=JSON.parse(await fs.readFile(root+'/fresh-candidates.json'));
const sources=JSON.parse(await fs.readFile(root+'/alternative-sources.json')),landmarks=JSON.parse(await fs.readFile(root+'/alternative-landmarks.json'));
const palettes=new Map(fixture.records.flatMap(r=>r.groups.flatMap(g=>g.options.map(o=>[o.swatch.value,o.pigment]))));const sha=b=>createHash('sha256').update(b).digest('hex');
const proposals=[],tiles=[];
for(const hold of fixture.deferred){
 const row=data.products.find(r=>r.product.handle===hold.handle),choices=row.choices.filter(c=>c.decision.status==='candidate'&&c.decision.attribute==='eye-color'&&c.conditionSupported&&palettes.has(c.reference));
 if(!choices.length||row.excluded||row.hold!=='clear')continue;
 const candidates=sources.filter(s=>s.handle===hold.handle&&s.sha256).map(source=>({source,landmark:landmarks.find(l=>l.file===path.resolve(source.file))})).filter(c=>c.landmark?.face?.[2]>=95&&c.landmark?.leftPupil?.length&&c.landmark?.rightPupil?.length);
 candidates.sort((a,b)=>b.landmark.face[2]-a.landmark.face[2]);
 for(const {source,landmark}of candidates){
  const [fx,fy,fw,fh]=landmark.face,left=Math.max(0,Math.floor(fx-fw*.45)),top=Math.max(0,Math.floor(fy-fh*.8)),width=Math.min(landmark.width-left,Math.ceil(fw*1.9)),height=Math.min(landmark.height-top,Math.ceil(fh*2.1));
  const original=await fs.readFile(source.file);if(sha(original)!==source.sha256)throw Error('Alternative source changed');
  const portrait=await sharp(original).extract({left,top,width,height}).resize({width:600,height:700,fit:'inside'}).png().toBuffer(),m=await sharp(portrait).metadata(),sx=m.width/width,sy=m.height/height;
  const eyes=['left','right'].map(side=>{const eye=landmark[side+'Eye'],p=landmark[side+'Pupil'][0],ew=Math.max(...eye.map(q=>q[0]))-Math.min(...eye.map(q=>q[0])),eh=Math.max(...eye.map(q=>q[1]))-Math.min(...eye.map(q=>q[1]));return {cx:(p[0]-left)*sx,cy:(p[1]-top)*sy,rx:Math.min(ew*.20,eh*.55)*sx,ry:eh*.38*sy};});
  if(eyes.some(e=>e.rx<1||e.ry<1||e.rx>m.width*.025||e.ry>m.height*.025))continue;
  const photo='/images/dollvue/review-mmx-fanreal-nov10/'+sha(portrait)+'.png';await fs.writeFile('public'+photo,portrait);
  const record={handle:row.product.handle,productId:row.product.id,name:row.product.extended.displayName||row.product.title,brand:row.brand,fingerprint:row.fingerprint,
   sourcePosition:source.position,sourceOriginalSHA256:source.sha256,crop:{left,top,width,height},photo,mask:{sha256:sha(portrait),width:m.width,height:m.height,eyes},
   groups:[{id:choices[0].groupId,label:choices[0].group,options:choices.map(c=>({id:c.optionId,label:c.option,swatch:{kind:'image',value:c.reference},pigment:palettes.get(c.reference)}))}],status:'PRIVATE_ALTERNATIVE_REQUIRES_VISUAL_REVIEW'};
  proposals.push(record);
  const overlay=Buffer.from(`<svg width="${m.width}" height="${m.height}">${eyes.map(e=>`<ellipse cx="${e.cx}" cy="${e.cy}" rx="${e.rx}" ry="${e.ry}" fill="none" stroke="red" stroke-width="1"/>`).join('')}</svg>`);
  const marked=await sharp(portrait).composite([{input:overlay}]).png().toBuffer();
  const image=await sharp(marked).resize(240,240,{fit:'contain',background:'#fff'}).png().toBuffer(),i=proposals.length-1;
  const label=Buffer.from(`<svg width="240" height="30"><rect width="240" height="30" fill="white"/><text x="4" y="16" font-size="10">${i+1}. ${record.handle.slice(0,32)} photo ${source.position+1}</text></svg>`);
  tiles.push({input:image,left:i%4*240,top:Math.floor(i/4)*270},{input:label,left:i%4*240,top:Math.floor(i/4)*270+240});break;
 }
}
await fs.writeFile(root+'/alternative-portrait-proposals.json',JSON.stringify(proposals,null,2));
if(tiles.length)await sharp({create:{width:960,height:Math.ceil(proposals.length/4)*270,channels:3,background:'#ddd'}}).composite(tiles).png().toFile(root+'/alternate-portrait-contact.png');
console.log(JSON.stringify({alternativeProposals:proposals.length,approved:0}));
