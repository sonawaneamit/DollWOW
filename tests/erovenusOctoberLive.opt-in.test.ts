import {expect,test,vi} from 'vitest';
import {readFile,writeFile} from 'node:fs/promises';
import {parseEnv} from 'node:util';
import {getCustomizationConfig} from '@/lib/customization/configs';
import {getDefaultSelections,resolveCustomization} from '@/lib/customization/resolve';
vi.mock('server-only',()=>({}));

test.skipIf(process.env.EROVENUS_LIVE!=='1')('verifies four published torso menus and real named-charge carts without orders',async()=>{
 Object.assign(process.env,parseEnv(await readFile('.env.local','utf8')));
 const {getProductByHandle}=await import('@/lib/shopify/storefront');
 const drafts=JSON.parse(await readFile('/Volumes/Extreme Pro/Projects/DollWOW/data/exports/erovenus-unread-2026-10-03/drafts.json','utf8'));
 const evidence=[];
 for(const d of drafts){
  const p=await getProductByHandle(d.handle);expect(p).toBeTruthy();
  expect(p!.variants[0].availableForSale).toBe(true);
  expect(Number(p!.variants[0].price.amount)).toBe(d.price);
  const config=getCustomizationConfig(p!);expect(config.groups).toHaveLength(5);
  const defaults=getDefaultSelections(config);
  const paid=config.groups.flatMap(g=>g.options.filter(o=>(o.priceDelta??0)>0).map(o=>({g,o})));
  const unique=paid.filter((x,i,a)=>a.findIndex(y=>y.g.id===x.g.id&&y.o.priceDelta===x.o.priceDelta)===i);
  const cases=d.name==='cinna'?unique:[unique.find(x=>x.g.id==='add-extra-head')!];
  for(const item of [null,...cases]){
   const selections=item?{...defaults,[item.g.id]:item.g.selectionMode==='multiple'?[item.o.id]:item.o.id}:defaults;
   const expected=resolveCustomization(config,selections,d.price);expect(expected.issues).toEqual([]);
   const response=await fetch('https://dollwow.com/api/cart/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({lines:[{merchandiseId:p!.variants[0].id,quantity:1,selections}]})});
   const checkout=await response.json();expect(response.status,JSON.stringify(checkout)).toBe(200);
   const r=await fetch(`https://${process.env.SHOPIFY_STORE_DOMAIN!.replace(/^https?:\/\//,'')}/api/2026-04/graphql.json`,{method:'POST',headers:{'Content-Type':'application/json','X-Shopify-Storefront-Access-Token':process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!},body:JSON.stringify({query:`query($id:ID!){cart(id:$id){lines(first:50){nodes{attributes{key value}merchandise{...on ProductVariant{id price{amount currencyCode}product{title}}}...on CartLine{parentRelationship{parent{id}}}}}}}`,variables:{id:checkout.id}})});
   const result=await r.json();expect(result.errors).toBeUndefined();const lines=result.data.cart.lines.nodes;
   expect(lines).toHaveLength(item?2:1);
   const parent=lines.find((l:any)=>l.merchandise.id===p!.variants[0].id);expect(parent).toBeTruthy();
   expect(Number(parent.merchandise.price.amount)).toBe(d.price);
   if(item){const extra=lines.find((l:any)=>l!==parent);expect(Number(extra.merchandise.price.amount)).toBe(item.o.priceDelta);expect(extra.attributes).toContainEqual({key:'Customization',value:`${item.g.label}: ${item.o.label}`});expect(extra.parentRelationship?.parent?.id).toBeTruthy();}
   evidence.push({name:d.name,choice:item?.o.label??'Default',expected:expected.totalPrice,lines,checkoutUrl:checkout.checkoutUrl,status:'PASS'});
   await writeFile('/tmp/erovenus-four-live-carts.json',JSON.stringify(evidence,null,2));
  }
 }
 console.log(JSON.stringify({status:'PASS',products:drafts.length,carts:evidence.length,noOrdersPlaced:true}));
},600000);
