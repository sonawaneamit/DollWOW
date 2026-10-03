import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {parseEnv} from 'node:util';

// Reuse exact reviewed charges for this verified live menu; never match by price alone.
const audit=JSON.parse(await fs.readFile('/tmp/october-live-menu-audit.json','utf8'));
const product=audit.find(p=>p.handle==='irontech-miyuki-148cm-d-cup-silicone-companion-doll-11bvn');
assert(product);
const path=new URL('../lib/cart/evidence/named-upgrades-release.json',import.meta.url);
const registry=JSON.parse(await fs.readFile(path,'utf8'));
const hash=p=>createHash('sha256').update(JSON.stringify(p)).digest('hex');
assert.equal(registry.approval.payloadHash,hash(registry.payload));
const bindings=[...registry.payload.groups[registry.payload.parents[product.variant]]];
const pool=Object.values(registry.payload.groups).flat();
const added=[];
for(const group of product.groups)for(const option of group.options){
 if(!['head-type','ironai-talkx-box','add-extra-head'].includes(group.id)||!option.priceDelta)continue;
 const matches=b=>b.group===group.label&&(b.choiceLabels?.includes(option.label)||b.label===option.label)&&b.unitAmount===option.priceDelta&&b.currencyCode==='USD'&&!b.readOnly;
 if(bindings.some(matches))continue;
 const candidates=[...new Map(pool.filter(b=>matches(b)&&b.productTitle.startsWith('Irontech Dolls -')).map(b=>[b.merchandiseId,b])).values()];
 assert.equal(candidates.length,1,`Missing or ambiguous charge: ${option.label}`);
 bindings.push(candidates[0]);added.push(candidates[0]);
}
const env=parseEnv(await fs.readFile('.env.local','utf8'));
const ids=[...new Set(added.map(b=>b.merchandiseId))];
const evidence=[];
for(const country of ['US','PT','GB','DE']){
 const r=await fetch(`https://${env.SHOPIFY_STORE_DOMAIN.replace(/^https?:\/\//,'')}/api/2026-04/graphql.json`,{method:'POST',headers:{'Content-Type':'application/json','X-Shopify-Storefront-Access-Token':env.SHOPIFY_STOREFRONT_ACCESS_TOKEN},body:JSON.stringify({query:'query($ids:[ID!]!,$country:CountryCode!) @inContext(country:$country){nodes(ids:$ids){...on ProductVariant{id availableForSale requiresShipping price{amount currencyCode} product{title}}}}',variables:{ids,country}})});
 const j=await r.json();assert(!j.errors,JSON.stringify(j.errors));
 assert.equal(j.data.nodes.length,ids.length);
 for(const binding of added){const v=j.data.nodes.find(v=>v?.id===binding.merchandiseId);assert(v?.availableForSale);assert.equal(v.requiresShipping,false);assert.equal(v.product.title,binding.productTitle);if(country==='US'){assert.equal(v.price.currencyCode,'USD');assert.equal(Number(v.price.amount),binding.unitAmount);}}
 evidence.push({country,verified:ids.length});
}
registry.payload.groups['irontech-miyuki-verified-october-2026']=bindings;
registry.payload.parents[product.variant]='irontech-miyuki-verified-october-2026';
registry.payload.releaseId='named-upgrades-2026-10-03-october-expiry';
registry.approval={payloadHash:hash(registry.payload),evidenceRef:'docs/catalog/october-promo-release-2026-10-03.md',reviewedAt:new Date().toISOString()};
await fs.writeFile(path,JSON.stringify(registry)+'\n');
await fs.writeFile('/tmp/miyuki-checkout-repair.json',JSON.stringify({parent:product.variant,added,evidence},null,2));
console.log(JSON.stringify({parent:product.variant,added:added.length,evidence}));
