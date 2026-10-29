import 'server-only';
import sharp from 'sharp';
import {brandDollVuePreview} from './branding';
import {outlinedText} from './outlinedText';

export const BRANDING_REVIEW_HANDLE='top-fire-doll-grace-162cm-i-cup-silicone-companion-doll';
export const BRANDING_REVIEW_SELECTIONS=[{group:'Skin tone',option:'Dark tan'},{group:'Hairstyle',option:'#2'}];

/** Safe synthetic fixture only; never accepts a customer or generated adult image. */
export async function brandingReviewFixture() {
  const original=await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">
    <rect width="800" height="600" fill="#e8efed"/>
    ${outlinedText('Synthetic QA image',{x:400,y:290,size:26,fill:'#465b54',anchor:'middle'}).svg}
    ${outlinedText('No generation or customer photo',{x:400,y:328,size:18,fill:'#465b54',anchor:'middle'}).svg}
  </svg>`)).webp({quality:95}).toBuffer();
  const preview=await brandDollVuePreview(original,BRANDING_REVIEW_HANDLE,BRANDING_REVIEW_SELECTIONS);
  return {original,preview};
}
