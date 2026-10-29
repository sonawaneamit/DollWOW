import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import {DollVue} from '@/components/dollvue/DollVue';
import {protectedProductImageUrl} from '@/lib/catalog/productImage';

export const dynamic='force-dynamic';
export const metadata:Metadata={title:'DollVue Allowance Review',robots:{index:false,follow:false}};
const handle='top-fire-doll-grace-162cm-i-cup-silicone-companion-doll';

export default function DollVueExhaustedReview() {
  if(process.env.VERCEL_ENV!=='preview'&&process.env.NODE_ENV!=='development') notFound();
  return <>
    <p style={{margin:0,padding:'8px 16px',background:'#e3eee8',color:'#17251f',fontSize:13}}>
      QA fixture: zero allowance. No account, generation or purchase changes.
    </p>
    <DollVue product={{handle,name:'Grace',brand:'Top Fire Doll',photos:[{
      position:0,url:protectedProductImageUrl(handle,0,'card'),alt:'Clothed Grace product reference',
    }]}} groups={[]} freePreviews={5} initialRemaining={0} verifiedEmail="QA fixture" live={false}/>
  </>;
}
