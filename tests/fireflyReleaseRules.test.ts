import {describe,it,expect} from 'vitest';
import type {Product} from '@/types/product';
import type {BrandCustomizationConfig} from '@/types/customization';
import {withFireflyReleaseRules} from '@/lib/customization/firefly-release';
import {resolveCustomization} from '@/lib/customization/resolve';

const config:BrandCustomizationConfig={id:'firefly-test',brandLabel:'Firefly',leadTimeNote:'',rules:[],groups:[
  {id:'premium-body-options-multiple',label:'Body options',display:'cards',selectionMode:'multiple',options:[{id:'loose-joint-free',label:'Loose joints',priceDelta:0}]},
  {id:'standing-add-on',label:'Standing Add-On',display:'cards',options:[{id:'non-standing',label:'Non-standing',priceDelta:0},{id:'standing-free',label:'Standing',priceDelta:0},{id:'standing-without-bolts-orig-120-free',label:'Standing without bolts',priceDelta:0}]}
]};
const product={id:'gid://shopify/Product/10639456305336',handle:'firefly-mary-160cm-max-silicone-companion-doll'} as Product;

describe('exact Firefly release compatibility',()=>{
  for(const standing of ['standing-free','standing-without-bolts-orig-120-free'])for(const order of ['loose-first','standing-first'])it(`${standing} rejects loose joints ${order}`,()=>{
    const selections=order==='loose-first'?{'premium-body-options-multiple':['loose-joint-free'],'standing-add-on':standing}:{'standing-add-on':standing,'premium-body-options-multiple':['loose-joint-free']};
    expect(resolveCustomization(withFireflyReleaseRules(product,config),selections,2850).issues).toHaveLength(1);
  });
  it('allows loose joints with the non-standing configuration',()=>{
    expect(resolveCustomization(withFireflyReleaseRules(product,config),{'premium-body-options-multiple':['loose-joint-free'],'standing-add-on':'non-standing'},2850).issues).toEqual([]);
  });
  it('does not change unrelated IDs or lookalike handles',()=>{
    expect(withFireflyReleaseRules({...product,id:'gid://shopify/Product/1'},config)).toBe(config);
    expect(withFireflyReleaseRules({...product,handle:'another-product'},config)).toBe(config);
  });
});
