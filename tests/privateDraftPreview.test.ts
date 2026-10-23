import {afterEach,describe,expect,it,vi} from 'vitest';
import snapshots from '@/data/draft-previews/castle-oct22.json';
import {getPrivateDraftPreview,privateDraftRecipe} from '@/lib/catalog/privateDraftPreview';
import {getCustomizationConfig} from '@/lib/customization/configs';
import {getDefaultSelections,resolveCustomization} from '@/lib/customization/resolve';
import {templateConfigurationPresets} from '@/lib/customization/template-presets';
import templateRelease from '@/lib/customization/evidence/template-release.json';
import namedRelease from '@/lib/cart/evidence/named-upgrades-release.json';
import {releasedNamedBindings} from '@/lib/cart/named-upgrade-release';
import {upgradeBindingAcceptsChoice} from '@/lib/cart/exact-upgrade-lines';

afterEach(()=>vi.unstubAllEnvs());
describe('Private Castle draft previews',()=>{
 it('binds production checkout for the exact five parents and presets for the four supported models',()=>{
  for(const raw of snapshots){
   const config=getCustomizationConfig(raw as unknown as Parameters<typeof getCustomizationConfig>[0]);
   const bindings=releasedNamedBindings(namedRelease,[raw.variants[0].id]);
   for(const g of config.groups)for(const o of g.options.filter(o=>(o.priceDelta??0)>0)){
    expect(bindings.filter(b=>b.group===g.label&&upgradeBindingAcceptsChoice(b,o.label)&&b.unitAmount===o.priceDelta)).toHaveLength(1);
   }
   const entries=templateRelease.payload.entries.filter(e=>e.productId===raw.id);
   expect(entries).toHaveLength(raw.extended.bodyCode==='S112'?0:1);
   if(entries[0])expect(entries[0].handle).toBe(raw.handle);
  }
  const natalie=snapshots.find(p=>p.extended.bodyCode==='S112')!;
  expect(natalie.extended.measurements).toMatchObject({Waist:'24cm',Underbust:'29.5cm'});
 });
 it('never provides preview records in production or development',async()=>{
  for(const value of ['production','development','']){
   vi.stubEnv('VERCEL_ENV',value);
   for(const p of snapshots)expect(await getPrivateDraftPreview(p.handle)).toBeNull();
  }
 });
 it('provides only exact preview handles, with no sale-capable variants or internal provenance',async()=>{
  vi.stubEnv('VERCEL_ENV','preview');
  expect(await getPrivateDraftPreview('unrelated-product')).toBeNull();
  for(const raw of snapshots){
   const p=(await getPrivateDraftPreview(raw.handle))!;
   expect(p.tags).toContain('dollwow-test');expect(p.images).toHaveLength(8);
   expect(p.variants.every(v=>v.availableForSale===false)).toBe(true);
   expect(JSON.stringify(p)).not.toMatch(/sourceUrl|source_url|drive\.google|gmail|unitCost|"cost"|approval/i);
   expect(p.images.every(i=>new URL(i.url).hostname==='cdn.shopify.com')).toBe(true);
   const config=getCustomizationConfig(p),defaults=getDefaultSelections(config);
   expect(resolveCustomization(config,defaults,Number(p.priceRange.minVariantPrice.amount)).issues).toEqual([]);
   expect(config.groups.every(g=>g.options.every(o=>Number.isFinite(o.priceDelta)))).toBe(true);
  }
 });
 it('has three meaningful supported tiers on four models, and manual-only Natalie',async()=>{
  vi.stubEnv('VERCEL_ENV','preview');
  for(const raw of snapshots){
   const p=(await getPrivateDraftPreview(raw.handle))!,config=getCustomizationConfig(p);
   const recipe=await privateDraftRecipe(p,config);
   const tiers=templateConfigurationPresets(recipe??null,config,config,Number(p.priceRange.minVariantPrice.amount),getDefaultSelections(config));
   if(p.extended.bodyCode==='S112'){expect(recipe).toBeNull();expect(tiers).toEqual([]);continue;}
   expect(tiers.map(t=>t.label),p.handle).toEqual(['Starter','Enthusiast','Collector']);
   expect(tiers.map(t=>t.totalPrice)).toEqual(p.extended.bodyCode==='SZ25'?[1999,2089,2194]:[1999,2119,2264]);
  }
 });
 it('does not transfer unsupported Chiku features or permit both conflicting Galatea mechanisms',async()=>{
  vi.stubEnv('VERCEL_ENV','preview');
  for(const raw of snapshots){
   const p=(await getPrivateDraftPreview(raw.handle))!,config=getCustomizationConfig(p);
   if(p.extended.bodyCode==='SZ25'){
    const labels=config.groups.flatMap(g=>g.options.map(o=>o.label)).join(' ');
    expect(labels).not.toMatch(/hard hands|movable jaw|ROS|oral|soft thighs|soft belly/i);
   }else if(p.extended.bodyCode==='GT06'){
    const group=config.groups.find(g=>g.id==='mechanical-function')!;
    expect(group.selectionMode).toBe('single');
    expect(group.options.map(o=>o.id)).toEqual(['none','auto-blowjob','twisting-waist']);
   }
  }
 });
});
