import { describe, expect, it } from 'vitest';
import manifest from '../data/pricing/dol276-approved-price-release.json';
import { validateFunwestPriceScope, priceMutationVariables } from '../scripts/pricing/release-funwest-approved-prices.mjs';

const products = () => manifest.rows.map(row=>({id:row.id,handle:row.handle,status:'ACTIVE',brand:{value:'FunWest Dolls'},variants:{pageInfo:{hasNextPage:false},nodes:row.variantIds.map(id=>({id,price:row.before.toFixed(2),compareAtPrice:null}))}}));
describe('approved price write scope',()=>{
  it('accepts all164 exact active identities and emits only variant ID and price',()=>{
    expect(validateFunwestPriceScope(manifest,products())).toHaveLength(164);
    for(const row of manifest.rows){
      const variables=priceMutationVariables(row);
      expect(Object.keys(variables).sort()).toEqual(['productId','variants']);
      expect(variables.productId).toBe(row.id);
      expect(variables.variants).toEqual(row.variantIds.map(id=>({id,price:row.after.toFixed(2)})));
      expect(Object.keys(variables.variants[0]).sort()).toEqual(['id','price']);
    }
  });
  for(const [name,mutate] of [
    ['changed price',p=>p[0].variants.nodes[0].price='1.00'],
    ['draft status',p=>p[0].status='DRAFT'],
    ['different brand',p=>p[0].brand.value='MD'],
    ['compare-at drift',p=>p[0].variants.nodes[0].compareAtPrice='9999.00'],
    ['truncated variants',p=>p[0].variants.pageInfo.hasNextPage=true],
    ['different variant',p=>p[0].variants.nodes[0].id='gid://shopify/ProductVariant/0'],
    ['missing product',p=>p.pop()],
  ]) it(`rejects ${name} before writes`,()=>{const p=products();mutate(p);expect(()=>validateFunwestPriceScope(manifest,p)).toThrow();});
});
