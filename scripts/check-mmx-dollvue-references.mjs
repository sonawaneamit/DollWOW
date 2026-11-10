import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const root='data/exports/dol312-mmx-nov10';
const inv=JSON.parse(await fs.readFile(`${root}/option-inventory.json`));
const refs=new Map();
for(const r of inv.rows)if(r.decision.status==='candidate'&&r.ownedImage){
  if(!refs.has(r.reference))refs.set(r.reference,{reference:r.reference,group:r.group,option:r.option,occurrences:0});
  refs.get(r.reference).occurrences++;
}
const rows=[],tiles=[];
for(const r of refs.values()){
  const file=`public${r.reference}`;
  const bytes=await fs.readFile(file),m=await sharp(bytes).metadata();
  if(!m.width||!m.height)throw Error(`Undecodable ${r.reference}`);
  const sha256=createHash('sha256').update(bytes).digest('hex');
  rows.push({...r,sha256,bytes:bytes.length,width:m.width,height:m.height});
  const n=rows.length,label=`${n}. ${r.group} / ${r.option}`.replaceAll('&','&amp;');
  const labelImg=Buffer.from(`<svg width="260" height="40"><rect width="260" height="40" fill="white"/><text x="8" y="18" font-family="Arial" font-size="11" fill="black">${label.slice(0,43)}</text></svg>`);
  const img=await sharp(bytes).resize({width:250,height:210,fit:'inside'}).extend({top:0,bottom:0,left:0,right:0,background:'#fff'}).toBuffer();
  const tile=await sharp({create:{width:260,height:260,channels:3,background:'#fff'}}).composite([{input:img,gravity:'north'},{input:labelImg,top:220,left:0}]).png().toBuffer();
  tiles.push(tile);
}
for(let start=0;start<tiles.length;start+=15){
  const batch=tiles.slice(start,start+15),h=Math.ceil(batch.length/5)*260;
  const image=await sharp({create:{width:1300,height:h,channels:3,background:'#ddd'}})
    .composite(batch.map((input,i)=>({input,left:(i%5)*260,top:Math.floor(i/5)*260}))).png().toBuffer();
  await fs.writeFile(`${root}/appearance-reference-contact-${start/15+1}.png`,image);
}
await fs.writeFile(`${root}/reference-byte-check.json`,JSON.stringify({at:new Date().toISOString(),references:rows,
  checked:rows.length,visualReviewComplete:false,supplierApprovalGranted:false},null,2));
console.log(JSON.stringify({decoded:rows.length,totalBytes:rows.reduce((a,r)=>a+r.bytes,0)}));
