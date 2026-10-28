import {afterEach,describe,expect,it,vi} from 'vitest';
import snapshots from '@/data/draft-previews/se-elf-pdps.json';
import specs from '@/data/draft-previews/se-elf-oct27.json';
import {getPrivateDraftPreview,privateDraftRecipe} from '@/lib/catalog/privateDraftPreview';
import {seElfLocalImagePath} from '@/lib/catalog/seElfPreview';
import {getCustomizationConfig} from '@/lib/customization/configs';
import {getDefaultSelections,resolveCustomization} from '@/lib/customization/resolve';
import {isOwnedOptionAsset} from '@/lib/assets/option-assets.mjs';
import {serverValidateAndRepriceLine,serverValidateAndRepriceLines} from '@/lib/cart/server-validation';

afterEach(()=>vi.unstubAllEnvs());
function preview(){vi.stubEnv('VERCEL_ENV','preview');vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV','preview');vi.stubEnv('NEXT_PUBLIC_DOL275_PREVIEW','1');}

describe('four SE Elf private PDPs',()=>{
 it('is absent outside explicit preview, including production with flag',async()=>{
  for(const env of ['production','development','preview']){
   vi.stubEnv('VERCEL_ENV',env);vi.stubEnv('NEXT_PUBLIC_DOL275_PREVIEW',env==='preview'?'':'1');
   for(const p of snapshots)expect(await getPrivateDraftPreview(p.handle)).toBeNull();
  }
 });
 it('keeps exact source identity/specs/prices and non-sale fake variants',async()=>{
  preview();
  for(const [i,raw] of snapshots.entries()){
   const p=(await getPrivateDraftPreview(raw.handle))!,s=specs[i];
   expect(p.id).toBe(`preview:se-elf:${s.sku}`);
   expect(p.extended).toMatchObject({heightCm:s.heightCm,headModel:s.head,cupSize:s.cup,deliveryEstimate:'Est. 3 weeks',stockStatus:'custom'});
   expect(p.priceRange.minVariantPrice.amount).toBe(s.priceUsd.toFixed(2));
   expect(p.tags).toContain('dollwow-test');expect(p.variants.every(v=>!v.availableForSale&&v.id.startsWith('preview:'))).toBe(true);
   expect(p.images).toHaveLength(3);
   for(const image of p.images)expect(seElfLocalImagePath(p,image.url)).toBe(`public${image.url}`);
   expect(seElfLocalImagePath(p,'/images/other.jpg')).toBeNull();
  }
 });
 it('preserves existing 21/22 head library without W entries; photographed head defaults',async()=>{
  preview();
  for(const raw of snapshots){
   const p=(await getPrivateDraftPreview(raw.handle))!,c=getCustomizationConfig(p),d=getDefaultSelections(c);
   const head=c.groups.find(g=>g.id==='choose-head')!;
   expect(head.options).toHaveLength(49);expect(d['choose-head']).toBe('factory-default');
   expect(head.options.map(o=>o.label)).toEqual(expect.arrayContaining(['21-1','21-2','22-1','22-2','22-3','22-4','22-5']));
   expect(head.options.some(o=>/^W0?(21|22)/i.test(o.id+' '+o.label))).toBe(false);
   for(const g of c.groups)for(const o of g.options)if(o.swatch?.kind==='image')expect(isOwnedOptionAsset(o.swatch.value)).toBe(true);
   expect(resolveCustomization(c,d,Number(p.priceRange.minVariantPrice.amount)).issues).toEqual([]);
   expect(await privateDraftRecipe(p,c)).toBeNull();
  }
 });
 it('rejects preview carts before upstream lookup, single and multi line',async()=>{
  const input={merchandiseId:snapshots[0].variants[0].id,quantity:1};
  await expect(serverValidateAndRepriceLine(input)).rejects.toThrow('Preview products');
  await expect(serverValidateAndRepriceLines([input])).rejects.toThrow('Preview products');
 });
});
