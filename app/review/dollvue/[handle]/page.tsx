import {notFound} from 'next/navigation';
import {DollVue} from '@/components/dollvue/DollVue';
import {privateDollVueBrandReview} from '@/lib/dollvue/privateBrandReview';
export const metadata={title:'Private DollVue portrait review',robots:{index:false,follow:false,nocache:true}};
export const dynamic='force-dynamic';
export default async function ReviewProduct({params}:{params:Promise<{handle:string}>}){
 const {handle}=await params,review=await privateDollVueBrandReview(),record=review.records.find(r=>r.handle===handle);
 if(!record)notFound();
 return <><p className="container">Private eye-color review · original portrait protected · no emails, allowance or cart changes.</p>
 <DollVue key={handle} reviewOnly product={{handle,name:record.name,brand:record.brand,photos:[{position:0,url:record.photo,alt:record.name+' — original portrait crop'}]}}
 groups={record.groups.map(g=>({id:g.id,label:g.label,options:g.options.map(o=>({id:o.id,label:o.label,swatch:{kind:'image' as const,value:o.swatch.value}}))}))}
 freePreviews={5} initialRemaining={5} verifiedEmail="private review" unlimited live />
 </>;
}
