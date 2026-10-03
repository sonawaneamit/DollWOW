import {test,expect,vi} from 'vitest';
import {readFile,writeFile} from 'node:fs/promises';
import {parseEnv} from 'node:util';
import {execFileSync} from 'node:child_process';
import {getCustomizationConfig} from '@/lib/customization/configs';
import {getDefaultSelections} from '@/lib/customization/resolve';
vi.mock('server-only',()=>({}));

test.skipIf(process.env.SE_HEAD_CART!=='1')('verifies separate head/lightweight prices and exact face attributes in real carts',async()=>{
 Object.assign(process.env,parseEnv(await readFile('.env.local','utf8')));
 process.env.DOLLWOW_TEMPLATE_RELEASE='1';
 const {getProductByHandle}=await import('@/lib/shopify/storefront');
 const {POST}=await import('@/app/api/cart/checkout/route');
 const evidence=[];
 const cases=[
  {handle:'sedoll-akina-157cm-h-cup-tpe-companion-doll-z7mv2',head:'silicone-144so',face:'#144SO (ROS)'},
  {handle:'sedoll-alba-a-161cm-f-cup-tpe-companion-doll-11id7',head:'silicone-134sc',face:'#134SC (Non-ROS)'},
  {handle:'sedoll-annika-163cm-e-cup-tpe-companion-doll-1eowu',head:'silicone-076sc-2',face:'#076SC-2 (Non-ROS)'}
 ];
 for(const spec of cases){
  const p=await getProductByHandle(spec.handle);expect(p).toBeTruthy();
  const config=getCustomizationConfig(p!);const defaults=getDefaultSelections(config);
  for(const lightweight of [false,true])for(const after of [false,true]){
   if(process.env.SE_HEAD_DEPLOYMENT&&after)continue;
   const selections={...defaults,material:'stpe-free','skin-tone':'light-tan','silicone-head-upgrade':spec.head,...(lightweight?{'body-weight':'lstpe-lightweight'}:{})};
   const date=after?'2026-11-01T08:00:00Z':'2026-10-15T12:00:00Z';
   const payload={lines:[{merchandiseId:p!.variants[0].id,quantity:1,selections}]};
   let response;
   if(process.env.SE_HEAD_DEPLOYMENT){
    const body=execFileSync('vercel',['curl','/api/cart/checkout','--deployment',process.env.SE_HEAD_DEPLOYMENT,'--','--silent','--request','POST','--header','Content-Type: application/json','--data',JSON.stringify(payload)],{encoding:'utf8',timeout:60000});
    const parsed=JSON.parse(body);expect(parsed.error,body).toBeUndefined();response=new Response(body,{status:200});
   }else try{
    vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(new Date(date));
    response=await POST(new Request('http://localhost/api/cart/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}));
   }finally{vi.useRealTimers()}
   const cart=await response.json();expect(response.status,JSON.stringify({spec,date,cart})).toBe(200);
   const r=await fetch(`https://${process.env.SHOPIFY_STORE_DOMAIN!.replace(/^https?:\/\//,'')}/api/2026-04/graphql.json`,{method:'POST',headers:{'Content-Type':'application/json','X-Shopify-Storefront-Access-Token':process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!},body:JSON.stringify({query:'query($id:ID!){cart(id:$id){lines(first:20){nodes{attributes{key value}merchandise{...on ProductVariant{id price{amount currencyCode}product{title}}}}}}}',variables:{id:cart.id}})});
   const data=await r.json();expect(data.errors).toBeUndefined();const lines=data.data.cart.lines.nodes;
   const extras=lines.filter((l:any)=>l.merchandise.id!==p!.variants[0].id);
   const prices=extras.map((l:any)=>Number(l.merchandise.price.amount)).sort((a:number,b:number)=>a-b);
   const expected=after?(lightweight?[100,100,100]:[100,100]):(lightweight?[90,100]:[100]);
   expect(prices,JSON.stringify(lines)).toEqual(expected);
   const head=extras.find((l:any)=>l.merchandise.product.title==='SE Doll Silicone Head Upgrade');expect(head).toBeTruthy();
   expect(head.attributes).toContainEqual({key:'Customization',value:`Silicone Head Upgrade: ${spec.face}`});
   expect(lines.find((l:any)=>l.merchandise.id===p!.variants[0].id).attributes.some((a:any)=>a.value.includes('Light Tan'))).toBe(true);
   evidence.push({handle:spec.handle,face:spec.face,lightweight,checkedAt:new Date().toISOString(),simulatedDate:process.env.SE_HEAD_DEPLOYMENT?null:date,prices,lines});
  }
  if(!process.env.SE_HEAD_DEPLOYMENT){
   const valid={...defaults,material:'stpe-free','skin-tone':'light-tan','silicone-head-upgrade':spec.head};
   for(const selections of [{...valid,'skin-tone':'natural'},{...valid,material:'regular-tpe-default'},{...valid,'silicone-head-upgrade':'silicone-999so'}]){
    const r=await POST(new Request('http://localhost/api/cart/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({lines:[{merchandiseId:p!.variants[0].id,quantity:1,selections}]})}));
    expect(r.status,JSON.stringify(await r.json())).toBe(400);
   }
  }
 }
 await writeFile(`/Volumes/Extreme Pro/Projects/DollWOW/data/exports/se-head-${process.env.SE_HEAD_DEPLOYMENT?'hosted':'local'}-cart-evidence.json`,JSON.stringify(evidence,null,2));
},240000);
