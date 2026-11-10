import {NextResponse} from 'next/server';
import {readFile} from 'node:fs/promises';
import {z} from 'zod';
import {privateDollVueReviewEnabled,privateDollVueBrandReview} from '@/lib/dollvue/privateBrandReview';
import {renderProtectedIris,brandProtectedIris,type IrisPigment} from '@/lib/dollvue/protectedIris';
import {getDollVueProductByHandle} from '@/lib/dollvue/product';
import {getCurrentDollVueHold} from '@/lib/dollvue/currentHold';
import {dollVueReadinessFingerprint} from '@/lib/dollvue/readiness';
import {getCustomizationConfig} from '@/lib/customization/configs';
export const runtime='nodejs';
const schema=z.object({productHandle:z.string().max(180),sourcePosition:z.literal(0),selections:z.array(z.object({groupId:z.string(),optionId:z.string()})).length(1)});
export async function POST(request:Request){
 if(!privateDollVueReviewEnabled())return new NextResponse(null,{status:404});
 if(request.headers.get('origin')!==new URL(request.url).origin)return NextResponse.json({error:'Unverified review request.'},{status:403});
 const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:'Choose one reviewed iris color.'},{status:400});
 const review=await privateDollVueBrandReview(),record=review.records.find(r=>r.handle===parsed.data.productHandle);
 const selection=parsed.data.selections[0],group=record?.groups.find(g=>g.id===selection.groupId),option=group?.options.find(o=>o.id===selection.optionId);
 if(!record||!group||!option)return NextResponse.json({error:'This preview choice is not reviewed.'},{status:409});
 const current=await getDollVueProductByHandle(record.handle).catch(()=>null);
 if(!current||dollVueReadinessFingerprint(current,getCustomizationConfig(current))!==record.fingerprint||await getCurrentDollVueHold(current.id,8000)!=='clear')return NextResponse.json({error:'The source listing changed and needs a fresh review.'},{status:409});
 try{
  // Palette derived from the exact content-addressed reference at preparation.
  if(option.swatch.value!==`/option-assets/${option.pigment.referenceSHA256}.webp`)throw Error('Reference binding changed');
  const source=await readFile(process.cwd()+'/public'+record.photo);
  const rendered=await renderProtectedIris(source,record.mask,option.pigment as IrisPigment);
  const bytes=await brandProtectedIris(rendered.bytes,record.handle,[{group:group.label,option:option.label}]);
  return NextResponse.json({reviewOnly:true,previewDataUrl:'data:image/png;base64,'+bytes.toString('base64'),remaining:5,emailDelivered:false,
   selections:[{groupId:group.id,group:group.label,optionId:option.id,option:option.label}],renderer:rendered.proof.renderer},{headers:{'Cache-Control':'private, no-store'}});
 }catch{return NextResponse.json({error:'This portrait needs a fresh iris-region review.'},{status:409});}
}
