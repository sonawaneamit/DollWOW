import {expect, it} from 'vitest';
import {octoberOfferForProduct, octoberProductFacts, seOctoberLightweightStatus, type OctoberProduct} from '@/lib/promotions/october2026';

const lita: OctoberProduct = {
  handle:'sedoll-lita-b-163cm-c-cup-silicone-companion-doll-1fl7h',
  title:'SE Doll Lita B 163cm C-Cup Silicone Customizable Companion Doll',
  vendor:'SE Doll',productType:'Custom silicone doll',tags:[],
  extended:{brand:'SE Doll',material:'Silicone',stockStatus:'custom'}
};
const during=new Date('2026-10-15T12:00:00Z');
it('records the owner-confirmed separate lightweight and silicone-head prices',()=>{
  const status=seOctoberLightweightStatus({brand:'se',material:'tpe',fulfillment:'custom',form:'full-body',bodyCode:'157H',headMaterial:'tpe'},during);
  expect(status).toMatchObject({suggestedMinimumRetailSurchargeUSD:100,siliconeHeadRetailSurchargeUSD:100,combinedRetailSurchargeUSD:200,upgradesChargedSeparately:true,chargeReady:false});
  expect(status.unresolved.join(' ')).not.toContain('additive');
  expect(status).toMatchObject({octoberSupplierSurchargeUSD:72,octoberRetailSurchargeUSD:90,octoberCombinedRetailSurchargeUSD:190});
  expect(status.unresolved.join(' ')).not.toContain('who receives');
});
it('retains previously verified Silicone Pro identity when catalog material is generic silicone',()=>{
  expect(octoberProductFacts(lita).series).toBe('Silicone Pro');
  expect(octoberOfferForProduct(lita,during)?.kind).toBe('se-silicone-pro-full-body');
});
it('does not infer Pro for an unreviewed generic silicone product',()=>{
  expect(octoberOfferForProduct({...lita,handle:'new-unreviewed-se-doll'},during)).toBeNull();
});
it('does not extend eligibility to a conflicting brand, hybrid or ready-to-ship product',()=>{
  expect(octoberOfferForProduct({...lita,extended:{...lita.extended,stockStatus:'ready_to_ship'}},during)).toBeNull();
  expect(octoberOfferForProduct({...lita,extended:{...lita.extended,material:'Hybrid'}},during)).toBeNull();
  expect(octoberProductFacts({...lita,vendor:'WM Doll',extended:{...lita.extended,brand:'WM Doll'}}).series).toBeUndefined();
});
it('still respects the October start and expiry',()=>{
  expect(octoberOfferForProduct(lita,new Date('2026-10-01T06:59:59Z'))).toBeNull();
  expect(octoberOfferForProduct(lita,new Date('2026-10-01T07:00:00Z'))).not.toBeNull();
  expect(octoberOfferForProduct(lita,new Date('2026-11-01T07:00:00Z'))).toBeNull();
});
