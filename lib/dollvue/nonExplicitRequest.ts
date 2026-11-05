import 'server-only';
import {createHash} from 'node:crypto';
import {z} from 'zod';
import {nonExplicitReviewedInputs,type NonExplicitInputReview} from './nonExplicitReview';
import {NON_EXPLICIT_PROVIDER_VERSION} from './nonExplicitProvider';

const digest=z.string().regex(/^[a-f0-9]{64}$/);
const requestSchema=z.object({
  productId:z.string().min(1).max(180),appearanceFingerprint:digest,
  sourcePosition:z.number().int().min(0).max(7),sourceUrl:z.string().min(1).max(2048),
  referenceUrls:z.array(z.string().min(1).max(2048)).min(1).max(2),
  selections:z.array(z.object({groupId:z.string().min(1).max(180),optionId:z.string().min(1).max(180)}).strict()).min(1).max(12),
  prompt:z.string().min(1).max(8000).refine(value=>value.trim().length>0),
  aspectRatio:z.enum(['1:1','3:2','16:9','21:9','9:16','2:3','3:4','4:5']),
  renderVersion:z.string().min(1).max(120),
}).strict();
export type NonExplicitRequest=z.infer<typeof requestSchema>;
const hash=(value:string)=>createHash('sha256').update(value).digest('hex');

/** Server-loaded facts only. A matching content review is required before reserving;
 * byte pins still need verification before transport. This never grants eligibility.
 */
export function nonExplicitRequestFingerprint(input:unknown,review:unknown):string|null {
  const parsed=requestSchema.safeParse(input);
  if(!parsed.success) return null;
  const request=parsed.data;
  const inputs=nonExplicitReviewedInputs(request,review);
  if(!inputs||new Set(request.selections.map(s=>s.groupId)).size!==request.selections.length) return null;
  const selections=[...request.selections].sort((a,b)=>a.groupId<b.groupId?-1:a.groupId>b.groupId?1:0);
  return hash(JSON.stringify({
    version:'non-explicit-request-v1',provider:NON_EXPLICIT_PROVIDER_VERSION,
    render:request.renderVersion,aspectRatio:request.aspectRatio,product:request.productId,appearance:request.appearanceFingerprint,
    sourcePosition:request.sourcePosition,reviewedAt:(review as NonExplicitInputReview).reviewedAt,
    inputs,selections,promptHash:hash(request.prompt),
  }));
}
