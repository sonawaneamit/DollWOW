import {notFound} from 'next/navigation';
import {DollVue} from '@/components/dollvue/DollVue';

export default function CheckPage() {
  if(process.env.NODE_ENV !== 'development') notFound();
  return <DollVue product={{handle:'ui-check',name:'Layout test',brand:'Test fixture',photos:[
    {position:0,url:'/option-swatches/care-kit.svg',alt:'Neutral test image'}
  ]}} groups={Array.from({length:8},(_,i)=>({id:`group-${i}`,label:`Appearance ${i+1}`,options:[
    {id:'a',label:`Choice ${i+1} A`,swatch:{kind:'image' as const,value:'/option-swatches/care-kit.svg'}},
    {id:'b',label:`Choice ${i+1} B`,swatch:{kind:'image' as const,value:'/option-swatches/care-kit.svg'}}
  ]}))} freePreviews={5} initialRemaining={5} verifiedEmail="te•••@example.com" live={true}/>;
}
