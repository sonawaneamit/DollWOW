import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { batchKBuyerPreviewEnabled } from "@/lib/catalog/batchKBuyerPreview";
import { CatalogSelectionSummary } from "@/components/CatalogSelectionSummary";
import { sampleProducts } from "@/lib/data/sample-products";
import { buildCollectionStructuredData, collectionIntro, collectionFaqItems } from "@/lib/catalog/collectionSeo";
import { collectionPresets } from "@/lib/catalog/filters";
import { generateMetadata } from "@/app/(store)/shop/[collection]/page";

afterEach(()=>vi.unstubAllEnvs());
const handles=["height-170-plus","latina-dolls","sex-dolls"];
const setup=()=>{vi.stubEnv("VERCEL_ENV","preview");vi.stubEnv("DOL229_BATCH_K_BUYER_SUMMARY","1");};
const product=(amount:string,currencyCode="USD")=>({...sampleProducts[0],priceRange:{...sampleProducts[0].priceRange,minVariantPrice:{amount,currencyCode}}});
describe("private Batch K buyer pass",()=>{
  it("requires the exact three preview paths and excludes held or generation routes",()=>{
    setup();
    for(const h of handles)expect(batchKBuyerPreviewEnabled(`/shop/${h}`)).toBe(true);
    for(const p of ["/shop/dollvue-enabled","/dollvue","/dollvue/generate","/brands/ido-dolls","/brands/md-dolls","/brands/top-fire-dolls","/shop/height-under-155",""])expect(batchKBuyerPreviewEnabled(p)).toBe(false);
    vi.stubEnv("VERCEL_ENV","production");expect(batchKBuyerPreviewEnabled("/shop/height-170-plus")).toBe(false);
    vi.stubEnv("VERCEL_ENV","preview");vi.stubEnv("DOL229_BATCH_K_BUYER_SUMMARY","0");expect(batchKBuyerPreviewEnabled("/shop/height-170-plus")).toBe(false);
  });
  it("preserves Shop All, held Hybrid and all three FAQs",()=>{
    const original=collectionIntro(collectionPresets["sex-dolls"],"sex-dolls");
    const hybrid={intro:collectionIntro(collectionPresets.hybrid,"hybrid"),faq:collectionFaqItems("hybrid",collectionPresets.hybrid)};
    const faqs=handles.map(h=>collectionFaqItems(h,collectionPresets[h]));
    setup();
    expect(collectionIntro(collectionPresets["sex-dolls"],"sex-dolls")).toBe(original);
    expect({intro:collectionIntro(collectionPresets.hybrid,"hybrid"),faq:collectionFaqItems("hybrid",collectionPresets.hybrid)}).toEqual(hybrid);
    expect(batchKBuyerPreviewEnabled("/shop/hybrid")).toBe(false);
    expect(handles.map(h=>collectionFaqItems(h,collectionPresets[h]))).toEqual(faqs);
    expect(collectionIntro(collectionPresets["height-170-plus"],"height-170-plus")).toContain("170 cm or more");
    expect(collectionIntro(collectionPresets["latina-dolls"],"latina-dolls")).toContain("not verified nationality");
  });
  it("noindexes only the flagged previews while preserving production metadata",async()=>{
    const original=await Promise.all(handles.map(collection=>generateMetadata({params:Promise.resolve({collection}),searchParams:Promise.resolve({})})));
    setup();
    for(const collection of handles)expect((await generateMetadata({params:Promise.resolve({collection}),searchParams:Promise.resolve({})})).robots).toEqual({index:false,follow:false});
    vi.stubEnv("VERCEL_ENV","production");
    expect(await Promise.all(handles.map(collection=>generateMetadata({params:Promise.resolve({collection}),searchParams:Promise.resolve({})})))).toEqual(original);
  });
  it("omits empty, invalid, zero or mixed-currency prices",()=>{
    const render=(products:ReturnType<typeof product>[])=>renderToStaticMarkup(<CatalogSelectionSummary products={products}/>);
    for(const amount of [""," ","NaN","Infinity","-1","0"])expect(render([product(amount)])).toBe("");
    expect(render([])).toBe("");expect(render([product("1999"),product("2999","EUR")])).toBe("");
    expect(render([product("1999"),product("2999")])).toContain("$1,999.00 to $2,999.00 USD");
  });
  it("matches the complete visible page while retaining the default 24-item contract",()=>{
    const products=Array.from({length:36},(_,i)=>({...product("1999"),handle:`visible-${i}`}));
    const list=(visiblePage:boolean)=>{const e=buildCollectionStructuredData({handle:"sex-dolls",preset:collectionPresets["sex-dolls"],products},{visiblePage})[0].mainEntity!;if(Array.isArray(e))throw Error("Expected ItemList");return e;};
    expect(list(false).itemListElement).toHaveLength(24);expect(list(true).numberOfItems).toBe(36);
    expect(list(true).itemListElement.map(i=>new URL(i.url).pathname)).toEqual(products.map(p=>`/products/${p.handle}`));
  });
});
