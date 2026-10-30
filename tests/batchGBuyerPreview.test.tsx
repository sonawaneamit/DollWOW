import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, expect, it, vi } from "vitest";
import { batchGBuyerPreviewEnabled } from "@/lib/catalog/batchGBuyerPreview";
import { CatalogSelectionSummary } from "@/components/CatalogSelectionSummary";
import { sampleProducts } from "@/lib/data/sample-products";
import { brandSeoProfile, buildBrandStructuredData } from "@/lib/catalog/brandSeo";
import { getCatalogBrand } from "@/lib/catalog/brands";
import { generateMetadata } from "@/app/brands/[brand]/page";

const handles=["ai-tech-dolls","avant-dolls","funwest-dolls","6ye-dolls"];
const setup=()=>{vi.stubEnv("VERCEL_ENV","preview");vi.stubEnv("DOL229_BATCH_G_BUYER_SUMMARY","1");};
afterEach(()=>vi.unstubAllEnvs());
it("requires exact flag and preview, excludes Fanreal and held hubs",()=>{
  setup();
  for(const h of handles)expect(batchGBuyerPreviewEnabled(`/brands/${h}`)).toBe(true);
  for(const h of ["fanreal-dolls","ido-dolls","md-dolls","top-fire-dolls"])expect(batchGBuyerPreviewEnabled(`/brands/${h}`)).toBe(false);
  expect(batchGBuyerPreviewEnabled("/dollvue")).toBe(false);
  vi.stubEnv("VERCEL_ENV","production");expect(batchGBuyerPreviewEnabled("/brands/avant-dolls")).toBe(false);
  vi.stubEnv("VERCEL_ENV","preview");vi.stubEnv("DOL229_BATCH_G_BUYER_SUMMARY","0");expect(batchGBuyerPreviewEnabled("/brands/avant-dolls")).toBe(false);
});
it("retains6YE and Fanreal, shortens only exact private build guidance",()=>{
  const before=handles.map(h=>brandSeoProfile(getCatalogBrand(h)!));
  const fanreal=brandSeoProfile(getCatalogBrand("fanreal-dolls")!);
  setup();
  expect(brandSeoProfile(getCatalogBrand("6ye-dolls")!)).toEqual(before[3]);
  expect(brandSeoProfile(getCatalogBrand("fanreal-dolls")!)).toEqual(fanreal);
  expect(brandSeoProfile(getCatalogBrand("ai-tech-dolls")!).intro).toContain("does not mean interactive hardware is included");
  expect(brandSeoProfile(getCatalogBrand("avant-dolls")!).intro).toContain("Ask for the finished weight if it is missing");
  expect(brandSeoProfile(getCatalogBrand("funwest-dolls")!).intro).toContain("complete dolls and torsos");
  for(const h of handles.slice(0,3))expect(brandSeoProfile(getCatalogBrand(h)!).intro.split(/\s+/).length).toBeLessThan(55);
  vi.stubEnv("VERCEL_ENV","production");expect(handles.map(h=>brandSeoProfile(getCatalogBrand(h)!))).toEqual(before);
});
it("noindexes only four flagged brand owners",async()=>{
  setup();
  for(const h of handles)expect((await generateMetadata({params:Promise.resolve({brand:h})})).robots).toEqual({index:false,follow:false});
  expect((await generateMetadata({params:Promise.resolve({brand:"fanreal-dolls"})})).robots).not.toEqual({index:false,follow:false});
  vi.stubEnv("VERCEL_ENV","production");expect((await generateMetadata({params:Promise.resolve({brand:"avant-dolls"})})).robots).not.toEqual({index:false,follow:false});
});
it("omits invalid prices rather than inventing a quote",()=>{
  const p=(amount:string,currencyCode="USD")=>({...sampleProducts[0],priceRange:{...sampleProducts[0].priceRange,minVariantPrice:{amount,currencyCode}}});
  const render=(products:ReturnType<typeof p>[])=>renderToStaticMarkup(<CatalogSelectionSummary products={products}/>);
  for(const a of [""," ","NaN","Infinity","0","-1"])expect(render([p(a)])).toBe("");
  expect(render([])).toBe("");expect(render([p("1999"),p("2999","EUR")])).toBe("");
  expect(render([p("1999"),p("2999")])).toContain("$1,999.00 to $2,999.00 USD");
});
it("matches the whole visible page while retaining default24 contract",()=>{
  const products=Array.from({length:36},(_,i)=>({...sampleProducts[0],handle:`visible-${i}`}));
  const build=(visiblePage:boolean)=>{
    const list=buildBrandStructuredData(getCatalogBrand("funwest-dolls")!,products,{visiblePage})[0].mainEntity!;
    if(Array.isArray(list))throw Error("Expected ItemList");
    return list;
  };
  expect(build(false).itemListElement).toHaveLength(24);
  expect(build(true).numberOfItems).toBe(36);
  expect(build(true).itemListElement.map(i=>new URL(i.url).pathname)).toEqual(products.map(p=>`/products/${p.handle}`));
});
