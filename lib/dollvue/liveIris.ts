import 'server-only';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import sharp from 'sharp';
import {normalizeReviewedImage} from './reviewedImages';
import {brandProtectedIris, renderProtectedIris, type IrisPigment, type ProtectedIrisSource} from './protectedIris';
import sourceData from './live-iris-sources.json';

type LiveIrisRecord = {portrait:{position:number;photo:string;mask:ProtectedIrisSource}; fullSources:Record<string,ProtectedIrisSource>; pigments:Record<string,IrisPigment>};
const records = sourceData as unknown as Readonly<Record<string, LiveIrisRecord>>;

export async function renderLiveIris(input: {id:string; handle:string; position:number; sourceUrl:string; sourceDigest:string; reference:string; origin:string; labels:Array<{group:string;option:string}>}) {
  const record = records[input.id];
  const pigment = record?.pigments[input.reference];
  if (!record || !pigment) throw new Error('Eye color not supported');
  let mask = record.fullSources[input.position];
  let bytes: Buffer;
  if (mask) {
    if (mask.sha256 !== input.sourceDigest) throw new Error('Photo changed');
    const original = await normalizeReviewedImage({url: input.sourceUrl, sha256: input.sourceDigest, origin: input.origin});
    const photo = await sharp(Buffer.from(original.split(',', 2)[1], 'base64')).rotate()
      .resize({width:1200,height:1200,fit:'inside',withoutEnlargement:true}).png().toBuffer({resolveWithObject:true});
    const sx=photo.info.width/mask.width, sy=photo.info.height/mask.height;
    bytes=photo.data;
    mask={width:photo.info.width,height:photo.info.height,sha256:createHash('sha256').update(bytes).digest('hex'),
      eyes:mask.eyes.map(e=>({cx:e.cx*sx,cy:e.cy*sy,rx:e.rx*sx,ry:e.ry*sy}))};
  } else {
    if (input.position !== record.portrait.position || !/^\/images\/dollvue\/review-mmx-fanreal-nov10\/[a-f0-9]{64}\.webp$/.test(record.portrait.photo)) throw new Error('Photo not supported');
    mask=record.portrait.mask;
    bytes=await readFile(process.cwd()+'/public'+record.portrait.photo);
  }
  const rendered=await renderProtectedIris(bytes,mask,pigment);
  const branded=await brandProtectedIris(rendered.bytes,input.handle,input.labels);
  return sharp(branded).webp({quality:92}).toBuffer();
}
