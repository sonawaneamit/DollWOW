import 'server-only';
import {notFound} from 'next/navigation';

export function privateDollVueReviewEnabled(){
  return process.env.VERCEL_ENV==='preview' && process.env.DOLLWOW_DOL312_PREVIEW==='1';
}

/** Lazy, preview-only fixture. Never imported by customer eligibility or registry. */
export async function privateDollVueBrandReview(){
  if(!privateDollVueReviewEnabled())notFound();
  return (await import('@/data/draft-previews/mmx-fanreal-dollvue-iris-nov10.json')).default;
}
