import fs from 'node:fs/promises';import path from 'node:path';import sharp from 'sharp';import {createHash} from 'node:crypto';
const root='data/exports/dol312-both-brands-nov10',data=JSON.parse(await fs.readFile(root+'/fresh-candidates.json')),assets=JSON.parse(await fs.readFile(root+'/asset-byte-review.json')),landmarks=JSON.parse(await fs.readFile(root+'/eye-landmarks.json'));
const directory='public/images/dollvue/review-mmx-fanreal-nov10';await fs.mkdir(directory,{recursive:true});
const sha=b=>createHash('sha256').update(b).digest('hex');const records=[],deferred=[];
const palettes=new Map();
for(const ref of assets.references.filter(r=>/ MMX/.test(' '+r.label)||/Fanreal Eyes E/.test(r.label))){
 if(!/Eye Color Regular #|Eyes E\d/.test(ref.label))continue;
 if(/Eyes E1[123]/.test(ref.label))continue; // Multicolour pattern changes need texture projection, not pigment-only rendering.
 const decoded=await sharp(ref.file).removeAlpha().raw().toBuffer({resolveWithObject:true}),w=decoded.info.width,h=decoded.info.height;
 const mmx=/MMX/.test(ref.label),cx=(mmx?.472:.48)*w,cy=(mmx?.54:.48)*h,rx=(mmx?.095:.19)*w,ry=(mmx?.095:.19)*h;
 const pixels=[];
 for(let y=Math.floor(cy-ry);y<cy+ry;y++)for(let x=Math.floor(cx-rx);x<cx+rx;x++){
  const radius=Math.sqrt(((x-cx)/rx)**2+((y-cy)/ry)**2);if(radius<.45||radius>.9)continue;const i=(y*w+x)*3,rgb=[...decoded.data.subarray(i,i+3)];
  if(Math.max(...rgb)>225 || Math.max(...rgb)<30)continue;pixels.push(rgb);
 }
 const rgb=[0,1,2].map(c=>Math.round(pixels.reduce((n,p)=>n+p[c],0)/pixels.length));
 if(pixels.length&&rgb.every(Number.isFinite))palettes.set(ref.reference,{rgb,referenceSHA256:ref.sha256});
}
for(const row of data.products){
 const source=assets.sources.find(s=>s.id===row.product.id),landmark=landmarks.find(l=>l.file===path.resolve(source.file));
 let reason=row.excluded?'torso-or-ready-to-ship':row.hold!=='clear'?'current-hold-not-clear':null;
 const choices=row.choices.filter(c=>c.decision.status==='candidate'&&c.decision.attribute==='eye-color'&&c.conditionSupported&&palettes.has(c.reference));
 if(!reason&&(!landmark?.face||!landmark.leftPupil?.length||!landmark.rightPupil?.length))reason='needs-alternative-single-face-source';
 if(!reason&&!choices.length)reason='no-source-supported-iris-pigment-choice';
 if(reason){deferred.push({handle:row.product.handle,brand:row.brand,reason});continue;}
 const [fx,fy,fw,fh]=landmark.face;
 const left=Math.max(0,Math.floor(fx-fw*.45)),top=Math.max(0,Math.floor(fy-fh*.8));
 const width=Math.min(landmark.width-left,Math.ceil(fw*1.9)),height=Math.min(landmark.height-top,Math.ceil(fh*2.1));
 const original=await fs.readFile(source.file);if(sha(original)!==source.sha256)throw Error('Source changed');
 const portrait=await sharp(original).extract({left,top,width,height}).resize({width:600,height:700,fit:'inside'}).png().toBuffer();
 const m=await sharp(portrait).metadata(),sx=m.width/width,sy=m.height/height;
 const eyes=['left','right'].map(side=>{
  const eye=landmark[side+'Eye'],pupil=landmark[side+'Pupil'][0],eyeWidth=Math.max(...eye.map(p=>p[0]))-Math.min(...eye.map(p=>p[0])),eyeHeight=Math.max(...eye.map(p=>p[1]))-Math.min(...eye.map(p=>p[1]));
  return {cx:(pupil[0]-left)*sx,cy:(pupil[1]-top)*sy,rx:Math.min(eyeWidth*.20,eyeHeight*.55)*sx,ry:eyeHeight*.38*sy};
 });
 if(eyes.some(e=>e.rx<1||e.ry<1||e.rx>m.width*.025||e.ry>m.height*.025)){deferred.push({handle:row.product.handle,brand:row.brand,reason:'iris-localization-needs-manual-review'});continue;}
 const url='/images/dollvue/review-mmx-fanreal-nov10/'+sha(portrait)+'.png';await fs.writeFile('public'+url,portrait);
 records.push({handle:row.product.handle,productId:row.product.id,name:row.product.extended.displayName||row.product.title,brand:row.brand,fingerprint:row.fingerprint,
  sourcePosition:0,sourceOriginalSHA256:source.sha256,crop:{left,top,width,height},photo:url,
  mask:{sha256:sha(portrait),width:m.width,height:m.height,eyes},
  groups:[{id:choices[0].groupId,label:choices[0].group,options:choices.map(c=>({id:c.optionId,label:c.option,swatch:{kind:'image',value:c.reference},pigment:palettes.get(c.reference)}))}],
  status:'PRIVATE_PORTRAIT_AND_IRIS_MASK_REVIEW_REQUIRED'});
}
await fs.writeFile('data/draft-previews/mmx-fanreal-dollvue-iris-nov10.json',JSON.stringify({scope:'Reference-guided iris pigment only; original portrait pixels protected. Not a factory pattern/material simulation. No provider call.',records,deferred},null,2));
for(let start=0;start<records.length;start+=24){const batch=records.slice(start,start+24),tiles=[];
 for(const [i,r]of batch.entries()){
 const overlay=Buffer.from(`<svg width="${r.mask.width}" height="${r.mask.height}">${r.mask.eyes.map(e=>`<ellipse cx="${e.cx}" cy="${e.cy}" rx="${e.rx}" ry="${e.ry}" fill="none" stroke="red" stroke-width="1"/>`).join('')}</svg>`);
 const marked=await sharp('public'+r.photo).composite([{input:overlay}]).png().toBuffer();
 const image=await sharp(marked).resize(200,220,{fit:'contain',background:'#fff'}).png().toBuffer();
 const text=Buffer.from(`<svg width="200" height="30"><rect width="200" height="30" fill="white"/><text x="4" y="16" font-size="9">${start+i+1}. ${r.handle.slice(0,33)}</text></svg>`);
 tiles.push({input:image,left:i%6*200,top:Math.floor(i/6)*250},{input:text,left:i%6*200,top:Math.floor(i/6)*250+220});}
 await sharp({create:{width:1200,height:Math.ceil(batch.length/6)*250,channels:3,background:'#ddd'}}).composite(tiles).png().toFile(root+'/iris-mask-contact-'+(start/24+1)+'.png');
}
console.log(JSON.stringify({prepared:records.length,byBrand:Object.fromEntries(['MMX','Fanreal'].map(b=>[b,records.filter(r=>r.brand===b).length])),deferred:deferred.length,palettes:palettes.size,publicWrites:0}));
