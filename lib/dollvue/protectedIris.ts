import 'server-only';
import sharp from 'sharp';
import {createHash} from 'node:crypto';
import {brandDollVuePreview} from './branding';

export type IrisRegion={cx:number;cy:number;rx:number;ry:number};
export type ProtectedIrisSource={sha256:string;width:number;height:number;eyes:IrisRegion[]};
export type IrisPigment={rgb:[number,number,number];referenceSHA256:string};
const sha=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');

/** Reference-guided color projection, not a replacement face generator.
 * Masks are trusted, source-specific review records; never customer coordinates.
 * Exact decoded source pixels are retained outside the bounded iris masks.
 * Pattern-changing contacts and geometry edits require a different renderer.
 */
export async function renderProtectedIris(source:Buffer,mask:ProtectedIrisSource,pigment:IrisPigment) {
  if(sha(source)!==mask.sha256 || !/^[a-f0-9]{64}$/.test(pigment.referenceSHA256))throw Error('Iris source/reference binding changed');
  if(mask.eyes.length!==2 || mask.eyes.some(e=>![e.cx,e.cy,e.rx,e.ry].every(Number.isFinite) || e.rx<1 || e.ry<1 ||
    e.rx>mask.width*.025 || e.ry>mask.height*.025 || e.cx-e.rx<0 || e.cy-e.ry<0 || e.cx+e.rx>=mask.width || e.cy+e.ry>=mask.height))throw Error('Invalid reviewed iris region');
  if(pigment.rgb.some(c=>!Number.isFinite(c)||c<0||c>255))throw Error('Invalid reference pigment');
  const decoded=await sharp(source,{limitInputPixels:25_000_000}).rotate().removeAlpha().raw().toBuffer({resolveWithObject:true});
  const {width,height,channels}=decoded.info;
  if(width!==mask.width || height!==mask.height || channels!==3)throw Error('Source dimensions changed');
  const out=Buffer.from(decoded.data),changedMask=Buffer.alloc(width*height);
  const luminance=(r:number,g:number,b:number)=>.2126*r+.7152*g+.0722*b;
  const targetLum=luminance(...pigment.rgb);if(targetLum<3)throw Error('Reference pigment is too dark');
  for(const eye of mask.eyes)for(let y=Math.floor(eye.cy-eye.ry);y<=Math.ceil(eye.cy+eye.ry);y++)for(let x=Math.floor(eye.cx-eye.rx);x<=Math.ceil(eye.cx+eye.rx);x++){
    const radius=Math.sqrt(((x-eye.cx)/eye.rx)**2+((y-eye.cy)/eye.ry)**2);if(radius>=1)continue;
    const p=y*width+x,i=p*3,lum=luminance(decoded.data[i],decoded.data[i+1],decoded.data[i+2]);
    // Retain the original pupil and catchlights; do not paint a new eye.
    if(lum<25 || lum>185)continue;
    const alpha=Math.min(1,(1-radius)/.22);
    for(let c=0;c<3;c++)out[i+c]=Math.round(decoded.data[i+c]*(1-alpha)+Math.min(255,lum*pigment.rgb[c]/targetLum)*alpha);
    changedMask[p]=1;
  }
  let insideChangedPixels=0,outsideChangedPixels=0;
  for(let p=0;p<width*height;p++)if(out[p*3]!==decoded.data[p*3]||out[p*3+1]!==decoded.data[p*3+1]||out[p*3+2]!==decoded.data[p*3+2]){
    if(changedMask[p])insideChangedPixels++;else outsideChangedPixels++;
  }
  if(outsideChangedPixels || !insideChangedPixels)throw Error('Iris locality check failed');
  return {bytes:await sharp(out,{raw:{width,height,channels:3}}).png().toBuffer(),
    proof:{renderer:'reference-guided-iris-pigment-v1',insideChangedPixels,outsideChangedPixels,width,height,
      sourceSHA256:mask.sha256,referenceSHA256:pigment.referenceSHA256,providerCalls:0}};
}

/** Append the existing footer without recompressing the protected photograph. */
export async function brandProtectedIris(bytes:Buffer,handle:string,selections:Array<{group:string;option:string}>) {
  const photo=await sharp(bytes).metadata();
  if(!photo.width||!photo.height||photo.width>1600||photo.height>1600)throw Error('Protected portrait dimensions are unsupported');
  // The standard footer uses a minimum-size QR. Lay it out on a full-width
  // canvas first so the QR cannot overlap text on a compact portrait.
  const base=await sharp(bytes).resize({width:Math.max(1000,photo.width),height:1600,fit:'inside'}).png().toBuffer({resolveWithObject:true});
  const branded=await brandDollVuePreview(base.data,handle,selections),meta=await sharp(branded).metadata();
  if(meta.width!==base.info.width||!meta.height||meta.height<=base.info.height)throw Error('Protected footer dimensions changed');
  const footer=await sharp(branded).extract({left:0,top:base.info.height,width:base.info.width,height:meta.height-base.info.height})
    .resize({width:photo.width}).png().toBuffer({resolveWithObject:true});
  return sharp({create:{width:photo.width,height:photo.height+footer.info.height,channels:3,background:'#fff'}})
    .composite([{input:bytes,left:0,top:0},{input:footer.data,left:0,top:photo.height}]).png().toBuffer();
}
