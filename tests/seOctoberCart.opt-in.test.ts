import {test,expect,vi} from 'vitest';
import {readFile,writeFile} from 'node:fs/promises';
import {parseEnv} from 'node:util';
import {execFileSync} from 'node:child_process';
import {getCustomizationConfig} from '@/lib/customization/configs';
import {getDefaultSelections} from '@/lib/customization/resolve';
vi.mock('server-only',()=>({}));
test.skipIf(process.env.SE_OCTOBER_CART!=='1')('verifies SE promotional and restored prices in real carts without orders',async()=>{
 Object.assign(process.env,parseEnv(await readFile('.env.local','utf8')));
 process.env.DOLLWOW_TEMPLATE_RELEASE='1';
 const {getProductByHandle}=await import('@/lib/shopify/storefront');
 const {POST}=await import('@/app/api/cart/checkout/route');
 const evidence=[];
 const cases=[
  {handle:'sedoll-lita-b-163cm-c-cup-silicone-companion-doll-1fl7h',choices:{'head-silicone-type':'ros-free','premium-head-body-options-multiple':['movable-eyelids']},during:[62.3],after:[89]},
  {handle:'sedoll-lita-b-163cm-c-cup-silicone-companion-doll-1fl7h',choices:{'body-makeup':'master-body-makeup'},during:[135],after:[150]},
  {handle:'sedoll-lita-b-163cm-c-cup-silicone-companion-doll-1fl7h',choices:{'premium-head-body-options-multiple':['real-skin-texture']},during:[125],after:[250]},
  ...['sedoll-akina-157cm-h-cup-tpe-companion-doll-z7mv2','sedoll-alba-a-161cm-f-cup-tpe-companion-doll-11id7','sedoll-annika-163cm-e-cup-tpe-companion-doll-1eowu'].map(handle=>({handle,choices:{material:'stpe-free','body-weight':'lstpe-lightweight'},during:[90],after:[100,100]}))
 ];
 for(const spec of cases){
  const p=await getProductByHandle(spec.handle);expect(p).toBeTruthy();
  const config=getCustomizationConfig(p!);const defaults=getDefaultSelections(config);
  for(const [date,expected]of [['2026-10-15T12:00:00Z',spec.during],['2026-11-01T08:00:00Z',spec.after]] as const){
   if(process.env.SE_CHECKOUT_DEPLOYMENT && expected===spec.after)continue;
   const selections={...defaults,...spec.choices};
   let response;
   if(process.env.SE_CHECKOUT_DEPLOYMENT){
    const body=execFileSync('vercel',['curl','/api/cart/checkout','--deployment',process.env.SE_CHECKOUT_DEPLOYMENT,'--','--silent','--request','POST','--header','Content-Type: application/json','--data',JSON.stringify({lines:[{merchandiseId:p!.variants[0].id,quantity:1,selections}]})],{encoding:'utf8',timeout:60000});
    expect(JSON.parse(body).error,body).toBeUndefined();
    response=new Response(body,{status:200});
   }else try{vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(new Date(date));
    response=await POST(new Request('http://localhost/api/cart/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({lines:[{merchandiseId:p!.variants[0].id,quantity:1,selections}]})}));
   }finally{vi.useRealTimers()}
   const cart=await response.json();expect(response.status,JSON.stringify({handle:spec.handle,date,cart})).toBe(200);
   const r=await fetch(`https://${process.env.SHOPIFY_STORE_DOMAIN!.replace(/^https?:\/\//,'')}/api/2026-04/graphql.json`,{method:'POST',headers:{'Content-Type':'application/json','X-Shopify-Storefront-Access-Token':process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!},body:JSON.stringify({query:`query($id:ID!){cart(id:$id){lines(first:20){nodes{attributes{key value}merchandise{...on ProductVariant{id price{amount currencyCode}}}}}}}`,variables:{id:cart.id}})});
   const data=await r.json();expect(data.errors).toBeUndefined();const lines=data.data.cart.lines.nodes;
   const prices=lines.filter((l:any)=>l.merchandise.id!==p!.variants[0].id).map((l:any)=>Number(l.merchandise.price.amount)).sort((a:number,b:number)=>a-b);
   expect(prices,JSON.stringify({handle:spec.handle,date,lines})).toEqual(expected);
   evidence.push({handle:spec.handle,date,prices,lines});
  }
 }
 await writeFile(`/Volumes/Extreme Pro/Projects/DollWOW/data/exports/se-october-${process.env.SE_CHECKOUT_DEPLOYMENT?'hosted':'live'}-cart-evidence.json`,JSON.stringify(evidence,null,2));
},240000);
