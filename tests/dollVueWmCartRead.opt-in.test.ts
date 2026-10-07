import fs from 'node:fs/promises';
import path from 'node:path';
import { expect, it, vi } from 'vitest';
import { getProductByHandle } from '@/lib/shopify/storefront';
import { resolveDollVueEligibility } from '@/lib/dollvue/eligibility';
import { getDefaultSelections, nextMultipleSelection, resolveCustomization } from '@/lib/customization/resolve';
import { promotionPricingForSelections } from '@/lib/promotions/optionPricing';
import { productDisplayName, productPublicTitle } from '@/lib/catalog/naming';
import { env } from '@/lib/utils/env';
import { POST } from '@/app/dollvue/cart/route';
import registry from '@/lib/dollvue/readiness-registry.json';
import type { DollVueReadinessRecord } from '@/lib/dollvue/readiness';

const root = '/Volumes/Extreme Pro/Projects/DollWOW/data/exports/dollvue-readiness-2026-10-07';

it.skipIf(process.env.DOLLVUE_WM_CART_READ !== '1')('validates all proposed WM cart handlers using current reads only', async () => {
  const proposalPath = process.env.DOLLVUE_WM_CART_PROPOSAL_FILE || path.join(root,'wm-family-preparation-20/reviewed-wm-16-record-proposal.json');
  const proposal = JSON.parse(await fs.readFile(proposalPath,'utf8')) as {
    records: Record<string,DollVueReadinessRecord>; verification: Array<{id:string;handle:string;draft?:boolean}>;
  };
  if (!process.env.DOLLVUE_WM_CART_PROPOSAL_FILE) expect(proposal.verification).toHaveLength(16);
  expect(proposal.verification.length).toBeGreaterThan(0);
  expect(proposal.verification.map(row => row.id).sort()).toEqual(Object.keys(proposal.records).sort());
  expect(new Set(proposal.verification.map(row => row.handle)).size).toBe(proposal.verification.length);
  const requested = JSON.parse(process.env.DOLLVUE_WM_CART_SELECTIONS || '[{"groupId":"eye-color","optionId":"no-2"}]') as Array<{groupId:string;optionId:string}>;
  expect(requested.length).toBeGreaterThan(0);
  expect(requested.length).toBeLessThanOrEqual(2);
  const active = proposal.verification.filter(row => !row.draft);
  const drafts = proposal.verification.filter(row => row.draft);
  const targets = [...active,...drafts.slice(0,1)];
  const output = path.join(path.dirname(proposalPath),`cart-handler-read-${Date.now()}.json`);
  const origin = new URL(env.NEXT_PUBLIC_SITE_URL).origin;
  const startedAt = new Date().toISOString();
  const nativeFetch = globalThis.fetch;
  const counts = {storefrontReads:0,adminReads:0,tokenRenewals:0,blockedRequests:0};
  const results: Array<Record<string,unknown>> = [];
  vi.stubGlobal('fetch', async (input: Parameters<typeof fetch>[0], init?: RequestInit) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    const method = init?.method || (input instanceof Request ? input.method : 'GET');
    const body = typeof init?.body === 'string' && url.pathname.endsWith('/graphql.json') ? JSON.parse(init.body) : null;
    if (url.hostname === env.SHOPIFY_STORE_DOMAIN && method === 'POST' && body &&
      /^query\b/.test(body.query.trim()) && !/\bmutation\b/.test(body.query)) {
      if (url.pathname.includes('/admin/')) counts.adminReads++;
      else counts.storefrontReads++;
    } else if (url.hostname === env.SHOPIFY_STORE_DOMAIN && method === 'POST' && url.pathname === '/admin/oauth/access_token') {
      counts.tokenRenewals++;
    } else {
      counts.blockedRequests++;
      throw new Error('Only current Shopify queries and token renewal are allowed');
    }
    return nativeFetch(input,init);
  });
  try {
    for (const target of targets) {
      const result: Record<string,unknown> = {id:target.id,handle:target.handle,draft:Boolean(target.draft),status:'FAIL'};
      results.push(result);
      try {
        expect((registry as Record<string,DollVueReadinessRecord>)[target.id]).toEqual(proposal.records[target.id]);
        const product = await getProductByHandle(target.handle,{strict:true,cache:'no-store'});
        if (target.draft) {
          expect(product).toBeNull();
          const response = await POST(new Request(`${origin}/dollvue/cart`,{method:'POST',
            headers:{Origin:origin,'Content-Type':'application/json'},
            body:JSON.stringify({productHandle:target.handle,selections:requested})}));
          result.httpStatus = response.status;
          result.payload = await response.json();
          expect(response.status).toBe(404);
          result.status = 'PASS';
          continue;
        }
        expect(product?.id).toBe(target.id);
        const eligibility = resolveDollVueEligibility(product!);
        expect(eligibility.available).toBe(true);
        const now = new Date();
        const initial = promotionPricingForSelections(product!,eligibility.config,{},now).config;
        const selections = getDefaultSelections(initial);
        for (const choice of requested) {
          const group = initial.groups.find(group => group.id === choice.groupId)!;
          expect(group).toBeDefined();
          selections[group.id] = group.selectionMode === 'multiple'
            ? nextMultipleSelection(group.options,selections[group.id],choice.optionId) : choice.optionId;
        }
        const priced = promotionPricingForSelections(product!,eligibility.config,selections,now).config;
        const variant = product!.variants.find(item => item.availableForSale)!;
        expect(variant).toBeDefined();
        const basePrice = Number(variant.price.amount || product!.priceRange.minVariantPrice.amount);
        const currencyCode = variant.price.currencyCode || product!.priceRange.minVariantPrice.currencyCode;
        const expected = resolveCustomization(priced,selections,basePrice);
        expect(expected.issues).toEqual([]);
        expect(expected.requiresPriceConfirmation).toBe(false);
        const name = productDisplayName(product!);
        const attributes = [...(name ? [{key:'DollWow Reference Name',value:name}] : []),...expected.cartAttributes];
        const charge = expected.optionPriceDelta > 0 ? {
          amount:expected.optionPriceDelta,currencyCode,title:name || productPublicTitle(product!),
          items:expected.selectedOptions.filter(option => option.priceDelta > 0).map(option => ({
            group:option.groupLabel,label:option.optionLabel,amount:option.priceDelta,
          })),
        } : undefined;
        const response = await POST(new Request(`${origin}/dollvue/cart`,{method:'POST',
          headers:{Origin:origin,'Content-Type':'application/json'},
          body:JSON.stringify({productHandle:target.handle,selections:requested}),
        }));
        const payload = await response.json();
        Object.assign(result,{httpStatus:response.status,payload,expected:{basePrice,currencyCode,
          unitPrice:expected.totalPrice,optionPriceDelta:expected.optionPriceDelta,selections:expected.selections,
          attributes,customizationCharge:charge ?? null}});
        expect(response.status,JSON.stringify(payload)).toBe(200);
        expect(response.headers.get('cache-control')).toBe('no-store');
        expect(payload.item.merchandiseId).toBe(variant.id);
        expect(payload.item.productHandle).toBe(target.handle);
        expect(payload.item.currencyCode).toBe(currencyCode);
        expect(payload.item.readyToShip).toBe(false);
        expect(payload.item.unitPrice).toBe(expected.totalPrice);
        expect(payload.item.unitPrice).toBe(basePrice + expected.optionPriceDelta);
        expect(payload.item.unitPrice).toBeGreaterThan(0);
        expect(payload.item.selections).toEqual(expected.selections);
        expect(payload.item.attributes).toEqual(attributes);
        expect(payload.item.customizationCharge).toEqual(charge);
        result.status = 'PASS';
      } catch (error) {
        result.error = error instanceof Error ? error.message : String(error);
      }
    }
  } finally {
    vi.unstubAllGlobals();
    await fs.writeFile(output,JSON.stringify({startedAt,completedAt:new Date().toISOString(),proposalPath,
      route:'POST /dollvue/cart',execution:'Actual local handler; unmocked current Shopify reads and hold checks',
      requestedSelections:requested,privateDrafts: drafts.length,representativeDraftChecks:Math.min(drafts.length,1),
      summary:{activeCases:active.length,passed:results.filter(row=>row.status==='PASS').length,
        failed:results.filter(row=>row.status==='FAIL').length,...counts},
      shopifyMutations:0,generationCalls:0,mailCalls:0,results},null,2),{mode:0o600,flag:'wx'});
    console.info(JSON.stringify({output,passed:results.filter(row=>row.status==='PASS').length,
      failures:results.filter(row=>row.status==='FAIL').map(row=>({handle:row.handle,error:row.error})),...counts}));
  }
  expect(results.filter(row=>row.status!=='PASS')).toEqual([]);
  expect(counts.blockedRequests).toBe(0);
},240000);
