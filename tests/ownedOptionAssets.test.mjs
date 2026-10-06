import {describe, it, expect} from 'vitest';
import {isOwnedOptionAsset, ownedOptionGroups, optionAssetViolations, optionAssetKey} from '../lib/assets/option-assets.mjs';

describe('owned option imagery', () => {
  it('only trusts this store, not arbitrary Shopify shops or proxy URLs', () => {
    expect(isOwnedOptionAsset('https://cdn.shopify.com/s/files/1/0960/7531/7432/files/a.jpg?v=1')).toBe(true);
    for (const url of ['https://cdn.shopify.com/s/files/1/0000/1111/2222/files/a.jpg', '//rosemarydoll.com/a.jpg', 'https://dollwow.com.evil.test/a.jpg', '/api/proxy?url=https://rosemarydoll.com/a.jpg', 'https://dollwow.com/product-media/a.jpg?url=external', 'https://user@dollwow.com/product-media/a.jpg']) {
      expect(isOwnedOptionAsset(url)).toBe(false);
    }
  });
  it('removes unresolved external images without changing choices, rules, or prices', () => {
    const groups = [{id:'heads', label:'Head', options:[{id:'a', label:'A', priceDelta:225, swatch:{kind:'image',value:'https://unverified.invalid/a.jpg'}}]}];
    const clean = ownedOptionGroups(groups);
    expect(clean[0].options[0]).toEqual({id:'a',label:'A',priceDelta:225,dollVueEnabled:false,swatch:undefined});
    expect(optionAssetViolations(groups)).toHaveLength(1);
    expect(groups[0].options[0].swatch.value).toContain('unverified.invalid');
  });
  it('keeps colors and owned imagery unchanged', () => {
    const groups = [{id:'skin', options:[{id:'a',swatch:{kind:'color',value:'#fff'}},{id:'b',swatch:{kind:'image',value:'/option-assets/test.webp'}}]}];
    expect(ownedOptionGroups(groups)).toEqual(groups);
  });
  it('uses deterministic URL-specific keys', () => {
    expect(optionAssetKey('a')).toBe('af63dc4c8601ec8c');
    expect(optionAssetKey('a')).not.toBe(optionAssetKey('b'));
  });
});
