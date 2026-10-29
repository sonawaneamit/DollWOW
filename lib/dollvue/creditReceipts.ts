import 'server-only';
import {z} from 'zod';
import {getSupabaseServerClient} from '@/lib/supabase/client';
import {sendEmail} from '@/lib/email/sendEmail';

const receiptSchema=z.object({
  shop:z.string().regex(/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/),
  order_id:z.string().regex(/^[1-9]\d{0,18}$/),
  email:z.string().email().max(180),credits:z.number().int().min(1).max(3000),
  claim_token:z.uuid(),status:z.literal('sending'),
});
export type CreditReceiptResult='idle'|'accepted'|'review'|'unavailable';

/** One bounded job. Neither webhook retries nor mail failures re-grant credits. */
export async function deliverNextDollVueCreditReceipt():Promise<CreditReceiptResult> {
  const db=getSupabaseServerClient();
  if(!db) return 'unavailable';
  const claimed=await db.rpc('dollvue_claim_credit_receipt');
  if(claimed.error || !Array.isArray(claimed.data)) return 'unavailable';
  if(!claimed.data.length) return 'idle';
  const parsed=receiptSchema.safeParse(claimed.data[0]);
  if(!parsed.success) return 'review';
  const receipt=parsed.data;
  let accepted=false;
  try {
    const result=await sendEmail({
      to:receipt.email,replyTo:'hello@dollwow.com',subject:'Your extra DollVue previews are ready',
      text:`Your ${receipt.credits} extra non-explicit DollVue previews are now available.\n\nUse the same email you used at checkout to verify your access. Your account details are never included in a preview image.\n\nReturn to DollVue: https://dollwow.com/dollvue\n\nQuestions? Reply to the DollWOW team.`,
      html:`<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#17251f"><p>DollVue - Powered by DollWOW.com</p><h1>Your extra previews are ready</h1><p>Your ${receipt.credits} extra non-explicit DollVue previews are now available.</p><p>Verify with the same email you used at checkout. Your account details are never included in a preview image.</p><p><a href="https://dollwow.com/dollvue">Return to DollVue</a></p><p>Questions? Reply to the DollWOW team.</p></div>`,
    });
    accepted=result.delivered;
  } catch {
    // Ambiguous provider errors require review, not an automatic duplicate email.
  }
  const completed=await db.rpc('dollvue_complete_credit_receipt',{
    p_shop:receipt.shop,p_order_id:receipt.order_id,p_claim_token:receipt.claim_token,p_accepted:accepted,
  });
  if(completed.error || completed.data!==true) return 'review';
  return accepted?'accepted':'review';
}
