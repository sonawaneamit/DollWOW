import {test,expect,vi} from 'vitest';
import {readFile,writeFile} from 'node:fs/promises';
import {parseEnv} from 'node:util';
import {getCustomizationConfig} from '@/lib/customization/configs';
import {getDefaultSelections,resolveCustomization} from '@/lib/customization/resolve';
import {templateConfigurationPresets} from '@/lib/customization/template-presets';
import {loadTemplateRecipe} from '@/lib/customization/template-loader';
vi.mock('server-only',()=>({}));
test.skipIf(process.env.LUSANDY_LIVE!=='1')('checks existing Lusandy pages and production carts without orders',async()=>{
 Object.assign(process.env,parseEnv(await readFile('.env.local','utf8')));
 process.env.DOLLWOW_TEMPLATE_RELEASE='1';
 const {getProductByHandle}=await import('@/lib/shopify/storefront');
 const evidence=[];
 for(const handle of ['lusandy-sophia-170cm-g-cup-silicone-companion-doll','lusandy-nadia-159cm-g-cup-silicone-companion-doll','lusandy-belle-165cm-d-cup-silicone-companion-doll']){
  const product=await getProductByHandle(handle);expect(product).toBeTruthy();
  const config=getCustomizationConfig(product!);const defaults=getDefaultSelections(config);
  const basePrice=Number(product!.variants[0].price.amount);
  const presets=templateConfigurationPresets((await loadTemplateRecipe(product!))??null,config,config,basePrice,defaults);
  expect(presets.length).toBe(3);
  const html=await fetch(`https://dollwow.com/products/${handle}`).then(r=>r.text());
  expect(html).toContain('lusandy-october-2026');
  const options=config.groups.flatMap(g=>g.options.map(o=>({group:g.id,id:o.id,label:o.label,price:o.priceDelta})));
  const included=options.filter(o=>/super.*weight|anti.puncture|ROS|realistic.*painting|implanted.*eyebrow|extra.soft/i.test(o.label));
  expect(included.length).toBeGreaterThan(5);
  for(const o of included)expect(o.price,JSON.stringify(o)).toBe(0);
  for(const preset of [{id:'default',selections:defaults},...presets]){
   const expected=resolveCustomization(config,preset.selections,basePrice);
   expect(expected.issues).toEqual([]);
   const response=await fetch('https://dollwow.com/api/cart/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({lines:[{merchandiseId:product!.variants[0].id,quantity:1,selections:preset.selections}]})});
   const cart=await response.json();expect(response.status,JSON.stringify(cart)).toBe(200);
   const r=await fetch(`https://${process.env.SHOPIFY_STORE_DOMAIN!.replace(/^https?:\/\//,'')}/api/2026-04/graphql.json`,{method:'POST',headers:{'Content-Type':'application/json','X-Shopify-Storefront-Access-Token':process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!},body:JSON.stringify({query:'query($id:ID!){cart(id:$id){lines(first:50){nodes{quantity attributes{key value}merchandise{...on ProductVariant{id title price{amount currencyCode}product{title}}}}}}}',variables:{id:cart.id}})});
   const result=await r.json();expect(result.errors).toBeUndefined();const lines=result.data.cart.lines.nodes;
   const total=lines.reduce((sum:number,l:any)=>sum+Number(l.merchandise.price.amount)*l.quantity,0);
   expect(total).toBeCloseTo(expected.totalPrice,2);
   evidence.push({handle,preset:preset.id,total,included,lines});
  }
 }
 await writeFile('/Volumes/Extreme Pro/Projects/DollWOW/data/exports/lusandy-october-intake-2026-10-03/live-cart-audit.json',JSON.stringify({at:new Date().toISOString(),evidence},null,2));
},180000);
