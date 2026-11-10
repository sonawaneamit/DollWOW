import Link from 'next/link';
import {privateDollVueBrandReview} from '@/lib/dollvue/privateBrandReview';
export const metadata={title:'Private DollVue review',robots:{index:false,follow:false,nocache:true}};
export const dynamic='force-dynamic';
export default async function Review(){
 const review=await privateDollVueBrandReview();
 return <main className="container content-page"><h1>MMX and Fanreal: private DollVue review</h1>
 <p>Eye-color previews use the actual doll’s original portrait and keep every pixel outside the reviewed iris regions unchanged. Colors are approximate; this does not simulate glass-eye patterns or material.</p>
 <p>No customer allowance, email or cart is used. Nothing here enables a product publicly. Hair, makeup, skin and other cosmetic options remain in the wider work queue; these are not claimed ready by the eye-color preview.</p>
 {['MMX','Fanreal'].map(brand=><section key={brand}><h2>{brand}: {review.records.filter(r=>r.brand===brand).length} portrait previews</h2><ul>{review.records.filter(r=>r.brand===brand).map(r=><li key={r.handle}><Link href={'/review/dollvue/'+r.handle}>{r.name}</Link></li>)}</ul></section>)}
 <details><summary>Products needing another source or a separate review ({review.deferred.length})</summary><ul>{review.deferred.map(r=><li key={r.handle}>{r.handle}: {r.reason.replaceAll('-',' ')}</li>)}</ul></details>
 </main>;
}
