import {afterEach,beforeEach,expect,it,vi} from 'vitest';
const mocks=vi.hoisted(()=>({rpc:vi.fn(),client:vi.fn(),send:vi.fn()}));
vi.mock('@/lib/supabase/client',()=>({getSupabaseServerClient:mocks.client}));
vi.mock('@/lib/email/sendEmail',()=>({sendEmail:mocks.send}));
import {deliverNextDollVueCreditReceipt} from '@/lib/dollvue/creditReceipts';
import {POST} from '@/app/api/internal/dollvue-credit-receipts/route';
const secret='isolated-owner-test-secret-32-characters';
const row=()=>({shop:'fixture.myshopify.com',order_id:'100',email:'qa@example.invalid',credits:12,
  claim_token:'11111111-1111-4111-8111-111111111111',status:'sending'});
beforeEach(()=>{
  vi.clearAllMocks();mocks.client.mockReturnValue({rpc:mocks.rpc});
  mocks.rpc.mockImplementation(async name=>name==='dollvue_claim_credit_receipt'?{data:[row()],error:null}:{data:true,error:null});
  mocks.send.mockResolvedValue({delivered:true,provider:'synthetic'});
  vi.stubEnv('VERCEL_ENV','production');vi.stubEnv('DOLLVUE_CREDIT_FULFILMENT_ENABLED','true');vi.stubEnv('DOLLVUE_RECEIPT_WORKER_SECRET',secret);
});
afterEach(()=>vi.unstubAllEnvs());
const request=(authorization=`Bearer ${secret}`)=>new Request('https://example.invalid/api/internal/dollvue-credit-receipts',{
  method:'POST',headers:{authorization},
});
it('does not send without a database or an unclaimed pending receipt',async()=>{
  mocks.client.mockReturnValueOnce(null);expect(await deliverNextDollVueCreditReceipt()).toBe('unavailable');
  mocks.rpc.mockResolvedValueOnce({data:[],error:null});expect(await deliverNextDollVueCreditReceipt()).toBe('idle');
  expect(mocks.send).not.toHaveBeenCalled();
});
it('refuses malformed claims and hides database errors',async()=>{
  mocks.rpc.mockResolvedValueOnce({data:[{...row(),credits:99999}],error:null});
  expect(await deliverNextDollVueCreditReceipt()).toBe('review');
  mocks.rpc.mockResolvedValueOnce({data:null,error:{message:'private'}});
  expect(await deliverNextDollVueCreditReceipt()).toBe('unavailable');expect(mocks.send).not.toHaveBeenCalled();
});
it('sends one confirmation only to the claimed recipient, without tokenized URLs or BCC',async()=>{
  expect(await deliverNextDollVueCreditReceipt()).toBe('accepted');
  expect(mocks.send).toHaveBeenCalledTimes(1);
  const message=mocks.send.mock.calls[0][0];
  expect(message.to).toBe('qa@example.invalid');expect(message.replyTo).toBe('hello@dollwow.com');expect(message.bcc).toBeUndefined();
  expect(message.text).toContain('12 extra non-explicit');expect(message.html).not.toContain(row().claim_token);
  expect(mocks.rpc).toHaveBeenCalledWith('dollvue_complete_credit_receipt',{
    p_shop:row().shop,p_order_id:'100',p_claim_token:row().claim_token,p_accepted:true,
  });
});
it.each(['reject','throw'])('quarantines %s instead of blindly resending or regranting',async mode=>{
  if(mode==='throw') mocks.send.mockRejectedValueOnce(new Error('ambiguous delivery'));
  else mocks.send.mockResolvedValueOnce({delivered:false,provider:'none'});
  expect(await deliverNextDollVueCreditReceipt()).toBe('review');
  expect(mocks.rpc).toHaveBeenCalledWith('dollvue_complete_credit_receipt',expect.objectContaining({p_accepted:false}));
  expect(mocks.rpc.mock.calls.some(c=>c[0]==='dollvue_grant_paid_credits')).toBe(false);
});
it('does not report accepted when receipt persistence loses its claim',async()=>{
  mocks.rpc.mockImplementation(async name=>name==='dollvue_claim_credit_receipt'?{data:[row()],error:null}:{data:false,error:null});
  expect(await deliverNextDollVueCreditReceipt()).toBe('review');expect(mocks.send).toHaveBeenCalledTimes(1);
});
it('is off on preview or without activation, even with a valid private token',async()=>{
  vi.stubEnv('VERCEL_ENV','preview');expect((await POST(request())).status).toBe(410);
  vi.stubEnv('VERCEL_ENV','production');vi.stubEnv('DOLLVUE_CREDIT_FULFILMENT_ENABLED','');
  expect((await POST(request())).status).toBe(410);expect(mocks.send).not.toHaveBeenCalled();
});
it('requires a configured strong worker token and rejects unauthorized calls before database access',async()=>{
  vi.stubEnv('DOLLVUE_RECEIPT_WORKER_SECRET','short');expect((await POST(request())).status).toBe(503);
  vi.stubEnv('DOLLVUE_RECEIPT_WORKER_SECRET',secret);expect((await POST(request('Bearer wrong'))).status).toBe(401);
  expect(mocks.client).not.toHaveBeenCalled();
});
it('returns safe provider-acceptance status without exposing customer/order details',async()=>{
  const result=await POST(request());expect(result.status).toBe(200);expect(await result.json()).toEqual({status:'accepted'});
});
