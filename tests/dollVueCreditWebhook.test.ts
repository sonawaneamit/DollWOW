import {createHmac} from 'node:crypto';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
const mocks=vi.hoisted(()=>({rpc:vi.fn(),shop:vi.fn(),client:vi.fn()}));
vi.mock('@/lib/shopify/webhookShop',()=>({
  canonicalWebhookShopDomain:(value:string|null)=>value&&/^[a-z0-9-]+\.myshopify\.com$/.test(value)?value:null,
  expectedWebhookShopDomain:mocks.shop,
}));
vi.mock('@/lib/supabase/client',()=>({getSupabaseServerClient:mocks.client}));
vi.mock('@/lib/dollvue/session',()=>({dollVueEmailHash:()=> 'a'.repeat(64)}));
import {POST} from '@/app/api/webhooks/shopify/dollvue-credits/route';
import {DOLLVUE_CREDIT_PACKS} from '@/lib/dollvue/creditPacks';
const secret='synthetic-test-secret';
const pack=DOLLVUE_CREDIT_PACKS[0];
const paid=()=>({id:100,email:'QA@example.invalid',currency:'USD',financial_status:'paid',test:false,cancelled_at:null,total_price:'5.00',
  line_items:[{id:200,product_id:pack.productId,variant_id:pack.variantId,quantity:1,price:'5.00',total_discount:'0.00'}]});
function request(payload:unknown=paid(),headers:Record<string,string>={}) {
  const body=JSON.stringify(payload);
  return new Request('https://example.invalid/api/webhooks/shopify/dollvue-credits',{method:'POST',body,
    headers:{'x-shopify-hmac-sha256':createHmac('sha256',secret).update(body).digest('base64'),
      'x-shopify-topic':'orders/paid','x-shopify-shop-domain':'fixture.myshopify.com',...headers}});
}
beforeEach(()=>{
  vi.clearAllMocks();vi.stubEnv('VERCEL_ENV','production');vi.stubEnv('DOLLVUE_CREDIT_FULFILMENT_ENABLED','true');
  vi.stubEnv('SHOPIFY_WEBHOOK_SECRET',secret);mocks.shop.mockResolvedValue('fixture.myshopify.com');
  mocks.client.mockReturnValue({rpc:mocks.rpc});mocks.rpc.mockResolvedValue({data:'granted',error:null});
});
afterEach(()=>vi.unstubAllEnvs());
it('is disabled by default and in preview, without storage access',async()=>{
  vi.stubEnv('DOLLVUE_CREDIT_FULFILMENT_ENABLED','');expect((await POST(request())).status).toBe(410);
  vi.stubEnv('DOLLVUE_CREDIT_FULFILMENT_ENABLED','true');vi.stubEnv('VERCEL_ENV','preview');
  expect((await POST(request())).status).toBe(410);expect(mocks.client).not.toHaveBeenCalled();
});
it('rejects forged signatures before canonical shop lookup or storage',async()=>{
  expect((await POST(request(paid(),{'x-shopify-hmac-sha256':'forged'}))).status).toBe(401);
  expect(mocks.shop).not.toHaveBeenCalled();expect(mocks.rpc).not.toHaveBeenCalled();
});
it('rejects a signed callback from another shop',async()=>{
  expect((await POST(request(paid(),{'x-shopify-shop-domain':'other.myshopify.com'}))).status).toBe(403);
  expect(mocks.rpc).not.toHaveBeenCalled();
});
it('rejects unknown topics and oversized declared bodies',async()=>{
  expect((await POST(request(paid(),{'x-shopify-topic':'orders/create'}))).status).toBe(400);
  expect((await POST(request(paid(),{'content-length':String(3*1024*1024)}))).status).toBe(413);
  expect(mocks.rpc).not.toHaveBeenCalled();
});
it.each(['granted','duplicate','review'])('returns only durable %s outcome',async status=>{
  mocks.rpc.mockResolvedValue({data:status,error:null});
  const result=await POST(request());expect(result.status).toBe(200);expect(await result.json()).toEqual({status});
  expect(mocks.rpc).toHaveBeenCalledWith('dollvue_grant_paid_credits',expect.objectContaining({
    p_order_id:'100',p_credits:5,p_email:'qa@example.invalid',p_email_hash:'a'.repeat(64),p_fingerprint:expect.stringMatching(/^[a-f0-9]{64}$/),
  }));
});
it('does not grant on an unpaid or discounted order',async()=>{
  expect((await POST(request({...paid(),financial_status:'pending'}))).status).toBe(422);
  expect((await POST(request({...paid(),total_price:'0.00'}))).status).toBe(422);
  expect(mocks.rpc).not.toHaveBeenCalled();
});
it('keeps database errors and unexpected RPC responses retryable without exposing details',async()=>{
  mocks.rpc.mockResolvedValue({data:null,error:{message:'private database detail'}});
  const result=await POST(request());expect(result.status).toBe(503);
  expect(await result.text()).not.toContain('private database detail');
  mocks.rpc.mockResolvedValue({data:null,error:null});expect((await POST(request())).status).toBe(503);
});
it.each([['refunds/create',{order_id:100},'refund'],['orders/cancelled',{id:100,cancelled_at:'2026-10-29T10:00:00Z'},'cancelled']] as const)(
  'records %s as review, not an invented refund or replay',async(topic,payload,reason)=>{
    mocks.rpc.mockResolvedValue({data:null,error:null});
    expect((await POST(request(payload,{'x-shopify-topic':topic}))).status).toBe(200);
    expect(mocks.rpc).toHaveBeenCalledWith('dollvue_hold_credit_order',{p_shop:'fixture.myshopify.com',p_order_id:'100',p_reason:reason});
  });
it('retries a refund hold failure instead of claiming it recorded',async()=>{
  mocks.rpc.mockResolvedValue({data:null,error:{message:'fixture'}});
  expect((await POST(request({order_id:100},{'x-shopify-topic':'refunds/create'}))).status).toBe(503);
});
it('does not treat a signed paid body with a changed topic header as cancellation',async()=>{
  expect((await POST(request(paid(),{'x-shopify-topic':'orders/cancelled'}))).status).toBe(400);
  expect(mocks.rpc).not.toHaveBeenCalled();
});
