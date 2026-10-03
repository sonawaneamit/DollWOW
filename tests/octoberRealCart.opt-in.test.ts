import {test,expect,vi} from 'vitest';
import {readFile,writeFile} from 'node:fs/promises';
import {parseEnv} from 'node:util';
import {getCustomizationConfig} from '@/lib/customization/configs';
import {getDefaultSelections} from '@/lib/customization/resolve';
import {promotionPricingForSelections} from '@/lib/promotions/optionPricing';
vi.mock('server-only',()=>({}));
test.skipIf(process.env.OCTOBER_CART!=='1').each([
 {handle:'real-lady-sienna-170cm-r15-silicone-doll',choices:{'premium-head-body-options-multiple':['gel-butt-free']},end:'2026-11-06T12:00:00Z',prices:[150],label:'Gel Butt'},
 {handle:'irontech-miyuki-148cm-d-cup-silicone-companion-doll-11bvn',choices:{'head-type':'ros-max-upgrade-free','ironai-talkx-box':'ironai-talkx-box-free','add-extra-head':'silicone-s20'},end:'2026-11-09T12:00:00Z',prices:[119,180,299],label:'S20'}
])('checks $handle promotion and expiry against actual Shopify carts',async({handle,choices,end,prices,label})=>{
 Object.assign(process.env,parseEnv(await readFile('.env.local','utf8')));
 process.env.DOLLWOW_TEMPLATE_RELEASE='1';
 const {getProductByHandle}=await import('@/lib/shopify/storefront');
 const {POST}=await import('@/app/api/cart/checkout/route');
 const p=await getProductByHandle(handle);expect(p).toBeTruthy();
 const config=getCustomizationConfig(p!);
 const evidence=[];
 try{for(const [date,expected] of [['2026-10-15T12:00:00Z',[]],[end,prices]] as const){
  const priced=promotionPricingForSelections(p!,config,{},new Date(date)).config;
  const selections={...getDefaultSelections(priced),...Object.fromEntries(Object.entries(choices).filter(([,v])=>v!==undefined).map(([id,value])=>[id,priced.groups.find(g=>g.id===id)?.selectionMode==='multiple'?(Array.isArray(value)?value:[value]):value]))};
  vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(new Date(date));
  const response=await POST(new Request('http://localhost/api/cart/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({lines:[{merchandiseId:p!.variants[0].id,quantity:1,selections}]})}));
  vi.useRealTimers();const cart=await response.json();expect(response.status,JSON.stringify(cart)).toBe(200);
  const r=await fetch(`https://${process.env.SHOPIFY_STORE_DOMAIN!.replace(/^https?:\/\//,'')}/api/2026-04/graphql.json`,{method:'POST',headers:{'Content-Type':'application/json','X-Shopify-Storefront-Access-Token':process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!},body:JSON.stringify({query:`query($id:ID!){cart(id:$id){lines(first:20){nodes{attributes{key value}merchandise{...on ProductVariant{id price{amount currencyCode}}}}}}}`,variables:{id:cart.id}})});
  const j=await r.json();expect(j.errors).toBeUndefined();const lines=j.data.cart.lines.nodes;
  await writeFile('/tmp/october-cart-latest.json',JSON.stringify({date,lines},null,2));
  expect(lines.length).toBe(expected.length+1);expect(lines.some((l:any)=>l.attributes.some((a:any)=>a.value.includes(label)))).toBe(true);
  expect(lines.filter((l:any)=>l.merchandise.id!==p!.variants[0].id).map((l:any)=>Number(l.merchandise.price.amount)).sort((a:number,b:number)=>a-b)).toEqual(expected);
  evidence.push({serverClock:date,expectedSurcharge:expected,lines,checkoutUrl:cart.checkoutUrl});
 }}finally{vi.useRealTimers()}
 await writeFile(`/tmp/october-${handle}-cart-checks.json`,JSON.stringify(evidence,null,2));
},180000);
