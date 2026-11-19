import assert from 'node:assert/strict';
import test from 'node:test';
// @ts-expect-error Node 26 runs this source test directly with type stripping.
import { bfcmOffer, bfcmPreviewConfig, bfcmCalculatedCart, withBfcmPreview } from '../../lib/promotions/bfcmBrandPreview.ts';
const now = new Date('2026-11-20T12:00:00Z');
const product = (brand: string, price: number, overrides = {}) => ({ handle:'test-doll', title:brand+' Doll', vendor:'DollWow', productType:'Custom doll', tags:[],priceRange:{minVariantPrice:{amount:String(price),currencyCode:'USD'},maxVariantPrice:{amount:String(price),currencyCode:'USD'}},variants:[{id:'test',price:{amount:String(price),currencyCode:'USD'}}],extended:{brand,material:'Silicone',heightCm:170,stockStatus:'custom',...overrides} } as any);
test('Top Fire cash saving, TPE/hybrid exclusions and cutoff',()=>{
 assert.equal(bfcmOffer(product('Top Fire',2349),now)?.price,2199);
 for(const material of ['TPE','Hybrid','Silicone head + TPE body']) assert.equal(bfcmOffer(product('Top Fire',2349,{material}),now),null);
 assert.equal(bfcmOffer(product('Top Fire',2349),new Date('2026-12-11T04:59:00Z')),null);
});
test('Climax stock excluded, torso gifts without cash, full-size percentage',()=>{
 assert.equal(bfcmOffer(product('Climax',1799,{stockStatus:'ready_to_ship'}),now),null);
 const torso={...product('Climax',881),productType:'Silicone torso doll'};
 assert.equal(bfcmOffer(torso,now)?.price,881);
 assert.deepEqual(bfcmOffer(torso,now)?.gifts,['second-head','gel-butt']);
 assert.equal(bfcmOffer(product('Climax',1799),now)?.price,1619);
});
test('Galatea only, three exact gifts',()=>{
 assert.equal(bfcmOffer(product('Dolls Castle',1999),now),null);
 assert.deepEqual(bfcmOffer(product('Galatea',1999),now)?.gifts,['body-heating','vaginal-suction','oral-heating']);
});
test('6YE recognizes title/tags rather than generic vendor, mini has no head',()=>{
 assert.equal(bfcmOffer(product('6YE',1599),now)?.price,1519);
 assert.deepEqual(bfcmOffer(product('6YE',500,{heightCm:105}),now)?.gifts,[]);
});
test('IDO separate expiry and both source gifts',()=>{
 assert.equal(bfcmOffer(product('IDO',2716.3),now)?.price,2599);
 assert.deepEqual(bfcmOffer(product('IDO',2716.3),now)?.gifts,['random-wig','moving-pad']);
 assert.equal(bfcmOffer(product('IDO',2716.3,{stockStatus:'ready_to_ship'}),now)?.price,2499);
 assert.equal(bfcmOffer(product('IDO',2716.3),new Date('2026-12-01T00:00:00Z')),null);
});
test('production and disabled preview never change any price',()=>{
 const p=product('Top Fire',2349);
 assert.equal(withBfcmPreview(p,'production',now,true),p);
 assert.equal(withBfcmPreview(p,'preview',now,false),p);
 assert.equal(withBfcmPreview(p,'preview',now,true).variants[0].price.amount,'2199.00');
});
test('single extra head, paid hair untouched, ambiguous limbs left alone',()=>{
 const config:any={id:'test',groups:[{id:'an-extra-head',label:'Extra head',selectionMode:'multiple',display:'cards',options:[{id:'head1',label:'Head 1',priceDelta:459}]},{id:'hair',label:'Hair',display:'cards',options:[{id:'human',label:'Human hair',priceDelta:200}]},{id:'limbs',label:'Limbs',display:'cards',options:[{id:'hard',label:'Hard hands',priceDelta:80},{id:'wired',label:'Wired feet',priceDelta:60}]}],rules:[]};
 const result=bfcmPreviewConfig(config,bfcmOffer(product('Climax',1799),now)!,now);
 assert.equal(result.config.groups[0].selectionMode,'single');assert.equal(result.config.groups[0].options[0].priceDelta,0);
 assert.equal(result.config.groups[1].options[0].priceDelta,200);assert.equal(result.config.groups[2].options[0].priceDelta,80);assert.equal(result.flags.length,1);
 assert.equal(config.groups[0].options[0].priceDelta,459);
});
test('code applied once at cart subtotal threshold',()=>{
 assert.deepEqual(bfcmCalculatedCart(899.99),{subtotal:899.99,discount:0,total:899.99});
 assert.deepEqual(bfcmCalculatedCart(900),{subtotal:900,discount:299,total:601});
 assert.equal(bfcmCalculatedCart(2199).total,1900);
});

test('existing included head picker is not duplicated and percentage variants floor to dollars',()=>{
 const config:any={id:'test',groups:[{id:'included-extra-head',label:'Included Extra Head',selectionMode:'single',options:[{id:'none',label:'None',priceDelta:0},{id:'included-extra-a',label:'Head A',priceDelta:0}]}],rules:[]};
 const offer=bfcmOffer(product('Climax',1799),now)!;
 const result=bfcmPreviewConfig(config,offer,now);
 assert.equal(result.config.groups.filter((g:any)=>/head/.test(g.id)).length,1);
 assert.equal(withBfcmPreview(product('Climax',1799),'preview',now,true).variants[0].price.amount,'1619.00');
 assert.equal(withBfcmPreview(product('6YE',1599),'preview',now,true).variants[0].price.amount,'1519.00');
});

test('confirmed cosmetic and limb gifts carry preview-only default selection',()=>{
 const config:any={id:'test',groups:[{id:'upgrades',selectionMode:'multiple',options:[{id:'gel-butt-free',label:'Gel Butt',priceDelta:50},{id:'wired-hands',label:'Wired hands and feet',priceDelta:60},{id:'hair',label:'Human hair',priceDelta:200}]}],rules:[]};
 const result=bfcmPreviewConfig(config,bfcmOffer(product('Climax',1799),now)!,now);
 const options=result.config.groups[0].options;
 assert.equal(options[0].priceDelta,0);assert.equal(options[0].bfcmIncluded,true);
 assert.equal(options[1].priceDelta,0);assert.equal(options[1].bfcmIncluded,true);
 assert.equal(options[2].priceDelta,200);assert.equal(options[2].bfcmIncluded,undefined);
 assert.equal(config.groups[0].options[0].bfcmIncluded,undefined);
});
