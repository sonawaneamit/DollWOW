import {timingSafeEqual} from 'node:crypto';
import {NextResponse} from 'next/server';
import {deliverNextDollVueCreditReceipt} from '@/lib/dollvue/creditReceipts';

export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=60;

export async function POST(request:Request) {
  if(process.env.DOLLVUE_CREDIT_FULFILMENT_ENABLED!=='true'||process.env.VERCEL_ENV!=='production') {
    return NextResponse.json({status:'disabled'},{status:410});
  }
  const secret=process.env.DOLLVUE_RECEIPT_WORKER_SECRET;
  if(!secret || secret.length<32) return NextResponse.json({error:'Worker authentication unavailable.'},{status:503});
  const expected=Buffer.from(`Bearer ${secret}`),provided=Buffer.from(request.headers.get('authorization')??'');
  if(expected.length!==provided.length||!timingSafeEqual(expected,provided)) {
    return NextResponse.json({error:'Unauthorized.'},{status:401});
  }
  try {
    const status=await deliverNextDollVueCreditReceipt();
    return NextResponse.json({status},{status:['idle','accepted'].includes(status)?200:503});
  } catch {return NextResponse.json({error:'Receipt processing requires review.'},{status:503});}
}
