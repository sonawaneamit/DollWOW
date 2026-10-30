import {it,expect,vi} from 'vitest';
import fs from 'node:fs/promises';
import type {Product} from '@/types/product';
import type {CustomizationSelections} from '@/types/customization';
import {getCustomizationConfig} from '@/lib/customization/configs';
import {getDefaultSelections,resolveCustomization} from '@/lib/customization/resolve';
import {templateConfigurationPresets} from '@/lib/customization/template-presets';
import {serverValidateAndRepriceLine} from '@/lib/cart/server-validation';
import {createVerifiedNamedUpgradeCart,type Request} from '@/lib/cart/exact-upgrade-pilot';
import {storefrontAuthHeaders} from '@/lib/shopify/auth';

const staged=vi.hoisted(()=>new Map<string,Product>());
vi.mock('@/lib/shopify/storefront',()=>({getProductsByVariantIds:async()=>staged}));

it.skipIf(process.env.DOL262_REPRICE!=='1')('checks affected intended-runtime server pricing without creating carts',async()=>{
  const dir='data/exports/dol-262-2026-10-30';
  const products=JSON.parse(await fs.readFile(`${dir}/products-runtime-private.json`,'utf8')) as Product[];
  const previous=JSON.parse(await fs.readFile(`${dir}/checkout-qa-private.json`,'utf8'));
  const affected=previous.results.filter((r:{pass:boolean})=>!r.pass);
  const results=[];
  for(const product of products){
    staged.set(product.variants[0].id,product);
    const config=getCustomizationConfig(product),base=Number(product.variants[0].price.amount);
    for(const c of affected){
      const [groupId,optionId]=c.case.split('/');
      const selections=getDefaultSelections(config);
      const enable=(id:string,choice:string)=>{const group=config.groups.find(g=>g.id===id)!;for(const condition of group.visibleWhen?.[0]??[])enable(condition.groupId,condition.optionId);selections[id]=group.selectionMode==='multiple'?[choice]:choice;};
      enable(groupId,optionId);
      const resolved=resolveCustomization(config,selections,base);
      const paidDependent=groupId.startsWith('premium-head-options-for-extra-head');
      try{
        const line=await serverValidateAndRepriceLine({merchandiseId:product.variants[0].id,quantity:1,selections:resolved.selections});
        expect(paidDependent).toBe(false);expect(line.namedUpgradeAttributes).toBeDefined();
        expect(line.customizationCharge?.items.some(item=>item.dependencyDetails?.scope==='firefly-free-details-v1')).toBe(true);
        results.push({handle:product.handle,case:c.case,state:'SERVER_REPRICE_PASS_NOT_SHOPIFY_CART'});
      }catch(error){
        if(!paidDependent)throw error;
        expect(String(error)).toContain('verified exact-price');
        results.push({handle:product.handle,case:c.case,state:'EXPECTED_PAID_DEPENDENCY_BLOCK',error:String(error)});
      }
    }
  }
  expect(results).toHaveLength(32);
  await fs.writeFile(`${dir}/affected-server-repricing.json`,JSON.stringify({at:new Date().toISOString(),results},null,2));
  console.log(JSON.stringify({affected:results.length,serverPasses:results.filter(r=>r.state==='SERVER_REPRICE_PASS_NOT_SHOPIFY_CART').length,retainedPaidDependencyBlocks:results.filter(r=>r.state==='EXPECTED_PAID_DEPENDENCY_BLOCK').length,shopifyWrites:0,cartsCreated:0}));
});

it.skipIf(process.env.DOL262_CHECKOUT!=='1')('verifies staged Firefly merchandise and exact Shopify cart charges',async()=>{
  const dir='data/exports/dol-262-2026-10-30';
  const read=async(p:string)=>JSON.parse(await fs.readFile(p,'utf8'));
  const products=await read(`${dir}/products-runtime-private.json`) as Product[];
  const named=await read(`${dir}/named-candidate-private.json`);
  const templates=await read(`${dir}/template-candidate-private.json`);
  const bindings=products.flatMap(p=>named.payload.groups[named.payload.parents[p.variants[0].id]].map((b:object)=>({...b,parentVariantId:p.variants[0].id})));
  const request:Request=async<T>(query:string,variables:Record<string,unknown>)=>{
    const response=await fetch(`https://${process.env.SHOPIFY_STORE_DOMAIN!.replace(/^https?:\/\//,'')}/api/2026-07/graphql.json`,{method:'POST',headers:{'Content-Type':'application/json',...storefrontAuthHeaders(process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!)},body:JSON.stringify({query,variables})});
    const result=await response.json();if(!response.ok||result.errors)throw new Error(JSON.stringify(result.errors??response.status));return result.data as T;
  };
  const ids=[...new Set([...products.map(p=>p.variants[0].id),...bindings.map(b=>b.merchandiseId)])];
  const markets=[];
  for(const country of ['US','DE','GB','FR']){
    const result=await request<{nodes:Array<{id:string,availableForSale:boolean,price:{amount:string,currencyCode:string}}|null>}>(`query($ids:[ID!]!,$country:CountryCode!) @inContext(country:$country){nodes(ids:$ids){... on ProductVariant{id availableForSale price{amount currencyCode}}}}`,{ids,country},{cache:'no-store'});
    const unavailable=result.nodes.filter(n=>!n?.availableForSale);
    markets.push({country,requested:ids.length,unavailable:unavailable.length,unavailableIds:ids.filter((_,i)=>!result.nodes[i]?.availableForSale),currencies:[...new Set(result.nodes.map(n=>n?.price.currencyCode))]});
  }
  await fs.writeFile(`${dir}/market-preflight.json`,JSON.stringify({at:new Date().toISOString(),markets},null,2));
  expect(markets[0].unavailable).toBe(0);
  const results=[];
  for(const p of products){
    staged.set(p.variants[0].id,p);
    const config=getCustomizationConfig(p),base=Number(p.variants[0].price.amount);
    const entry=templates.payload.entries.find((e:{productId:string})=>e.productId===p.id);
    const presets=templateConfigurationPresets(templates.payload.bindings[entry.bindingKey],config,config,base,getDefaultSelections(config));
    const cases:Array<{name:string,selections:CustomizationSelections}>=[{name:'default',selections:getDefaultSelections(config)},...presets.map(t=>({name:t.label,selections:t.selections}))];
    if(p===products[0])for(const g of config.groups)for(const o of g.options.filter(o=>(o.priceDelta??0)>0)){
      const selections=getDefaultSelections(config);
      const enable=(id:string,optionId:string)=>{const group=config.groups.find(g=>g.id===id)!;for(const condition of group.visibleWhen?.[0]??[])enable(condition.groupId,condition.optionId);selections[id]=group.selectionMode==='multiple'?[optionId]:optionId;};
      enable(g.id,o.id);
      const resolved=resolveCustomization(config,selections,base);
      cases.push({name:`${g.id}/${o.id}`,selections:resolved.selections});
    }
    for(const c of cases){
      try{
        const line=await serverValidateAndRepriceLine({merchandiseId:p.variants[0].id,quantity:1,selections:c.selections});
        if(!line.namedUpgradeAttributes)throw new Error('Server does not support dependent paid-option removal for this configuration');
        const cart=await createVerifiedNamedUpgradeCart([line],[],request,bindings);
        results.push({handle:p.handle,case:c.name,pass:true,cartId:cart.id,totalQuantity:cart.totalQuantity,amount:base+(line.customizationCharge?.amount??0)});
      }catch(error){results.push({handle:p.handle,case:c.name,pass:false,error:String(error)});}
      await fs.writeFile(`${dir}/checkout-qa-private.json`,JSON.stringify({at:new Date().toISOString(),parentLookup:'corrected intended runtime; actual Shopify merchandise and carts',results},null,2));
    }
  }
  console.log(JSON.stringify({markets,cases:results.length,passed:results.filter(r=>r.pass).length,failures:results.filter(r=>!r.pass)}));
  expect(results.filter(r=>!r.pass)).toEqual([]);
  expect(markets.every(m=>m.unavailable===0),'Supported-market availability remains a release gate').toBe(true);
},240000);
