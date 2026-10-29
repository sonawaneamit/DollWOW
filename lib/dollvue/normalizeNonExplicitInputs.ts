import 'server-only';
import {env} from '@/lib/utils/env';
import type {PreparedNonExplicitRequest} from './prepareNonExplicitRequest';
import {nonExplicitRequestFingerprint} from './nonExplicitRequest';
import {nonExplicitReviewedInputs} from './nonExplicitReview';
import {normalizeReviewedImage} from './reviewedImages';
import registry from './non-explicit-review-registry.json';

/** Internal byte-verification stage, not a public endpoint or model permission.
 * Re-derive pins from the server registry; never trust a cached/client pin list.
 * Return these in-memory data URIs directly to the filtered adapter, not URLs.
 * Accounting, current eligibility and rate/region guards remain caller duties.
 */
export async function normalizeNonExplicitInputs(input:Pick<PreparedNonExplicitRequest,'facts'|'fingerprint'>) {
  try {
    // Snapshot before network I/O so a caller cannot swap the next image mid-fetch.
    const facts=structuredClone(input.facts),expected=input.fingerprint;
    const review=(registry as Readonly<Record<string,unknown>>)[facts.productId];
    const fingerprint=nonExplicitRequestFingerprint(facts,review);
    const pins=nonExplicitReviewedInputs(facts,review);
    if(!fingerprint||fingerprint!==expected||!pins) return {ok:false as const,code:'not-reviewed' as const};
    const origin=new URL(env.NEXT_PUBLIC_SITE_URL);
    if(origin.protocol!=='https:'||origin.username||origin.password) return {ok:false as const,code:'unavailable' as const};
    const images:string[]=[];
    for(const pin of pins) images.push(await normalizeReviewedImage({...pin,origin:origin.origin}));
    return {ok:true as const,fingerprint,images,prompt:facts.prompt,aspectRatio:facts.aspectRatio};
  } catch {
    // No partial bundle or private URL/digest/error details cross the boundary.
    return {ok:false as const,code:'unavailable' as const};
  }
}
