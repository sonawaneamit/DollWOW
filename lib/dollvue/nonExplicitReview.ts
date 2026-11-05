import 'server-only';
import {z} from 'zod';
import {isOwnedOptionAsset} from '@/lib/assets/option-assets.mjs';

const digest=z.string().regex(/^[a-f0-9]{64}$/);
const reviewSchema=z.object({
  policy:z.literal('non-explicit-inputs-v1'),productId:z.string().min(1),appearanceFingerprint:digest,
  reviewedAt:z.iso.datetime({offset:true}),sourcePositions:z.array(z.number().int().min(0).max(7)).min(1),
  imageDigests:z.record(z.string(),digest),
}).strict();
export type NonExplicitInputReview=z.infer<typeof reviewSchema>;

/** Content approval is separate from the appearance-readiness registry. The caller
 * supplies current server-loaded product facts, never browser-provided pins or review.
 * This function does not waive a product hold or perform visual classification.
 */
export function nonExplicitReviewedInputs(input:{
  productId:string;appearanceFingerprint:string;sourcePosition:number;sourceUrl:string;referenceUrls:readonly string[];
},review:unknown) {
  const parsed=reviewSchema.safeParse(review);
  if(!parsed.success) return null;
  const record=parsed.data;
  if(record.productId!==input.productId||record.appearanceFingerprint!==input.appearanceFingerprint||
    !record.sourcePositions.includes(input.sourcePosition)||input.referenceUrls.length<1||input.referenceUrls.length>2) return null;
  const urls=[input.sourceUrl,...input.referenceUrls];
  if(urls.some(url=>!isOwnedOptionAsset(url)||!record.imageDigests[url])) return null;
  return urls.map((url,index)=>({url,sha256:record.imageDigests[url],optionReference:index>0}));
}
