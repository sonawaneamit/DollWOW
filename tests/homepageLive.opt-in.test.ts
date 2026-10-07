import {expect, it} from 'vitest';
import fs from 'node:fs';
import * as secrets from 'node:util';
import {homepageBestSellers, homepageNewArrivals, homepageBrandKey, homepageFeatureProducts} from '@/lib/catalog/homepage';

it.skipIf(process.env.HOMEPAGE_LIVE_VERIFY !== '1')('records current read-only order and exact live brand dispositions', async () => {
  Object.assign(process.env, secrets.parseEnv(fs.readFileSync('.env.local','utf8')));
  const {getProducts,getSeoCatalogProducts} = await import('@/lib/shopify/storefront');
  const newest = await getProducts({first:96,sortKey:'CREATED_AT',reverse:true,strict:true});
  const best = await getProducts({first:96,sortKey:'BEST_SELLING',reverse:false,strict:true});
  const live = await getSeoCatalogProducts({first:5000,strict:true});
  const brands = [...new Set(live.map(p => p.extended.brand?.trim() || p.vendor))].map(name => {
    const products = live.filter(p => (p.extended.brand?.trim() || p.vendor) === name);
    return {name,count:products.length,key:homepageBrandKey(products[0]),eligible:homepageFeatureProducts(products).length};
  });
  const report = {checkedAt:new Date().toISOString(),catalogCount:live.length,brands,
    new:{sortKey:'CREATED_AT',reverse:true,upstream:newest.map(p=>p.id),selected:homepageNewArrivals(newest).map(p=>p.id)},
    bestsellers:{sortKey:'BEST_SELLING',reverse:false,upstream:best.map(p=>p.id),selected:homepageBestSellers(best).map(p=>p.id)},
    mutations:0};
  fs.writeFileSync('/Volumes/Extreme Pro/Projects/DollWOW/data/exports/dollvue-readiness-2026-10-07/homepage-implementation/live-order-and-brands.json',JSON.stringify(report,null,2));
  expect(report.new.selected).toHaveLength(8);
  expect(report.bestsellers.selected).toHaveLength(8);
},180000);
