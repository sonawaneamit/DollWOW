import {createHash} from 'node:crypto';
import {NextResponse} from 'next/server';
import {z} from 'zod';
import {validShopifyWebhookSignature} from '@/lib/shopify/webhookSignature';
import {canonicalWebhookShopDomain,expectedWebhookShopDomain} from '@/lib/shopify/webhookShop';
import {approvedPaidCreditOrder} from '@/lib/dollvue/creditPacks';
import {dollVueEmailHash} from '@/lib/dollvue/session';
import {getSupabaseServerClient} from '@/lib/supabase/client';

export const runtime='nodejs';
export const dynamic='force-dynamic';
const limit=2*1024*1024;
const orderId=z.union([z.string().regex(/^[1-9]\d{0,18}$/),z.number().int().positive().max(Number.MAX_SAFE_INTEGER)]).transform(String);

async function limitedBody(request:Request) {
  if(Number(request.headers.get('content-length'))>limit) throw new Error('size');
  const reader=request.body?.getReader();
  if(!reader) return Buffer.alloc(0);
  const parts:Uint8Array[]=[];let bytes=0;
  try {
    while(true) {
      const {done,value}=await reader.read();if(done) break;
      bytes+=value.byteLength;
      if(bytes>limit) {await reader.cancel();throw new Error('size');}
      parts.push(value);
    }
  } finally {reader.releaseLock();}
  return Buffer.concat(parts);
}

export async function POST(request:Request) {
  // Do not register or enable while checkout, moderation and receipt delivery are unfinished.
  if(process.env.DOLLVUE_CREDIT_FULFILMENT_ENABLED!=='true' || process.env.VERCEL_ENV!=='production') {
    return NextResponse.json({status:'disabled'},{status:410});
  }
  const secret=process.env.SHOPIFY_WEBHOOK_SECRET||process.env.SHOPIFY_CLIENT_SECRET;
  if(!secret) return NextResponse.json({error:'Webhook authentication unavailable.'},{status:503});
  let raw:Buffer;
  try {raw=await limitedBody(request);} catch {return NextResponse.json({error:'Webhook body rejected.'},{status:413});}
  if(!validShopifyWebhookSignature(raw,request.headers.get('x-shopify-hmac-sha256'),secret)) {
    return NextResponse.json({error:'Invalid webhook signature.'},{status:401});
  }
  const shop=canonicalWebhookShopDomain(request.headers.get('x-shopify-shop-domain'));
  if(!shop) return NextResponse.json({error:'Unexpected shop.'},{status:403});
  let expected:string;
  try {expected=await expectedWebhookShopDomain();} catch {return NextResponse.json({error:'Shop verification unavailable.'},{status:503});}
  if(shop!==expected) return NextResponse.json({error:'Unexpected shop.'},{status:403});
  const topic=request.headers.get('x-shopify-topic');
  if(!['orders/paid','orders/cancelled','refunds/create'].includes(topic??'')) {
    return NextResponse.json({error:'Unexpected topic.'},{status:400});
  }
  const db=getSupabaseServerClient();
  if(!db) return NextResponse.json({error:'Credit storage unavailable.'},{status:503});
  let payload:unknown;
  try {payload=JSON.parse(raw.toString('utf8'));} catch {return NextResponse.json({error:'Invalid JSON.'},{status:400});}
  if(topic!=='orders/paid') {
    const parsed=z.object(topic==='refunds/create'?{order_id:orderId}:{id:orderId}).safeParse(payload);
    if(!parsed.success) return NextResponse.json({error:'Invalid order identity.'},{status:400});
    const id='order_id' in parsed.data?parsed.data.order_id:parsed.data.id;
    const {error}=await db.rpc('dollvue_hold_credit_order',{
      p_shop:shop,p_order_id:id,p_reason:topic==='refunds/create'?'refund':'cancelled',
    });
    return NextResponse.json(error?{error:'Credit review requires retry.'}:{status:'review'}, {status:error?503:200});
  }
  let grant:ReturnType<typeof approvedPaidCreditOrder>;
  try {grant=approvedPaidCreditOrder(payload);} catch {
    return NextResponse.json({error:'Payment requires review.'},{status:422});
  }
  if(!grant) return NextResponse.json({status:'ignored'});
  const hash=dollVueEmailHash(grant.email);
  const lines=[...grant.lines].sort((a,b)=>a.lineId.localeCompare(b.lineId));
  const fingerprint=createHash('sha256').update(JSON.stringify({order:grant.orderId,emailHash:hash,currency:grant.currency,lines})).digest('hex');
  const {data,error}=await db.rpc('dollvue_grant_paid_credits',{
    p_shop:shop,p_order_id:grant.orderId,p_email_hash:hash,p_email:grant.email,
    p_credits:lines.reduce((sum,line)=>sum+line.credits,0),p_fingerprint:fingerprint,
  });
  // Receipt is queued atomically with credit; no unsafe duplicate grant on mail retry.
  if(error || !['granted','duplicate','review'].includes(data)) return NextResponse.json({error:'Credit fulfilment requires retry.'},{status:503});
  return NextResponse.json({status:data});
}
