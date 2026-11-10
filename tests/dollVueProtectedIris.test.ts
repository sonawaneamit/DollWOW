import sharp from 'sharp';
import {createHash} from 'node:crypto';
import {expect,it} from 'vitest';
import {renderProtectedIris} from '@/lib/dollvue/protectedIris';
const width=400,height=400;
const source=await sharp({create:{width,height,channels:3,background:'#765039'}}).png().toBuffer();
const mask={width,height,sha256:createHash('sha256').update(source).digest('hex'),eyes:[{cx:160,cy:150,rx:8,ry:5},{cx:240,cy:150,rx:8,ry:5}]};
const pigment={rgb:[24,105,165] as [number,number,number],referenceSHA256:'a'.repeat(64)};
it('retains every original pixel outside reviewed iris regions',async()=>{
 const result=await renderProtectedIris(source,mask,pigment);
 expect(result.proof.insideChangedPixels).toBeGreaterThan(0);
 const before=await sharp(source).raw().toBuffer(),after=await sharp(result.bytes).raw().toBuffer();
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const outside=mask.eyes.every(e=>((x-e.cx)/e.rx)**2+((y-e.cy)/e.ry)**2>=1);
  if(outside){const p=(y*width+x)*3;if(!before.subarray(p,p+3).equals(after.subarray(p,p+3)))throw Error(`Outside pixel changed at ${x},${y}`);}
 }
});
it('refuses a changed source, oversize region, or unbound reference',async()=>{
 await expect(renderProtectedIris(source,{...mask,sha256:'0'.repeat(64)},pigment)).rejects.toThrow('binding changed');
 await expect(renderProtectedIris(source,{...mask,eyes:mask.eyes.map(e=>({...e,rx:80}))},pigment)).rejects.toThrow('Invalid reviewed iris region');
 await expect(renderProtectedIris(source,mask,{...pigment,referenceSHA256:'unbound'})).rejects.toThrow('binding changed');
});
