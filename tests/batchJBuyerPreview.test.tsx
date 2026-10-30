import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { batchJBuyerPreviewEnabled } from "@/lib/catalog/batchJBuyerPreview";
import { CatalogSelectionSummary } from "@/components/CatalogSelectionSummary";
import { sampleProducts } from "@/lib/data/sample-products";
import { buildCollectionStructuredData, collectionIntro, collectionFaqItems } from "@/lib/catalog/collectionSeo";
import { collectionPresets } from "@/lib/catalog/filters";
import { generateMetadata } from "@/app/(store)/shop/[collection]/page";

afterEach(()=>vi.unstubAllEnvs());
const handles=["black-hair-dolls","brown-skin-dolls","fuller-dolls","height-155-159","height-165-169"];
const setup=()=>{vi.stubEnv("VERCEL_ENV","preview");vi.stubEnv("DOL229_BATCH_J_BUYER_SUMMARY","1");};
const product=(amount:string,currencyCode="USD")=>({...sampleProducts[0],priceRange:{...sampleProducts[0].priceRange,minVariantPrice:{amount,currencyCode}}});
describe("private Batch J buyer pass",()=>{
  it("requires the exact five preview paths and excludes held or generation routes",()=>{
    setup();
    for(const h of handles)expect(batchJBuyerPreviewEnabled(`/shop/${h}`)).toBe(true);
    for(const p of ["/shop/dollvue-enabled","/dollvue","/dollvue/generate","/brands/ido-dolls","/brands/md-dolls","/brands/top-fire-dolls","/shop/height-under-155",""])expect(batchJBuyerPreviewEnabled(p)).toBe(false);
    vi.stubEnv("VERCEL_ENV","production");expect(batchJBuyerPreviewEnabled("/shop/black-hair-dolls")).toBe(false);
    vi.stubEnv("VERCEL_ENV","preview");vi.stubEnv("DOL229_BATCH_J_BUYER_SUMMARY","0");expect(batchJBuyerPreviewEnabled("/shop/black-hair-dolls")).toBe(false);
  });
  it("retains Fuller copy and all five FAQs, without height or shade grants",()=>{
    const original=collectionIntro(collectionPresets["fuller-dolls"],"fuller-dolls");
    const faqs=handles.map(h=>collectionFaqItems(h,collectionPresets[h]));
    setup();
    expect(collectionIntro(collectionPresets["fuller-dolls"],"fuller-dolls")).toBe(original);
    expect(handles.map(h=>collectionFaqItems(h,collectionPresets[h]))).toEqual(faqs);
    expect(collectionIntro(collectionPresets["height-155-159"],"height-155-159")).toContain("155 to 159 cm inclusive");
    expect(collectionIntro(collectionPresets["height-165-169"],"height-165-169")).toContain("165 to 169 cm inclusive");
    expect(collectionIntro(collectionPresets["brown-skin-dolls"],"brown-skin-dolls")).toContain("Shade names differ");
    expect(collectionIntro(collectionPresets["black-hair-dolls"],"black-hair-dolls")).toContain("does not grant every");
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
    const list=(visiblePage:boolean)=>{const e=buildCollectionStructuredData({handle:"fuller-dolls",preset:collectionPresets["fuller-dolls"],products},{visiblePage})[0].mainEntity!;if(Array.isArray(e))throw Error("Expected ItemList");return e;};
    expect(list(false).itemListElement).toHaveLength(24);expect(list(true).numberOfItems).toBe(36);
    expect(list(true).itemListElement.map(i=>new URL(i.url).pathname)).toEqual(products.map(p=>`/products/${p.handle}`));
  });
});
