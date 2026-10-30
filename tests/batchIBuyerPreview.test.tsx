import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, expect, it, vi } from "vitest";
import { batchIBuyerPreviewEnabled } from "@/lib/catalog/batchIBuyerPreview";
import { CatalogSelectionSummary } from "@/components/CatalogSelectionSummary";
import { sampleProducts } from "@/lib/data/sample-products";
import { brandSeoProfile, buildBrandStructuredData } from "@/lib/catalog/brandSeo";
import { getCatalogBrand } from "@/lib/catalog/brands";
import { generateMetadata } from "@/app/brands/[brand]/page";

const handles=["piper-dolls","rosretty-dolls","sy-dolls","yl-dolls"];
const setup=()=>{vi.stubEnv("VERCEL_ENV","preview");vi.stubEnv("DOL229_BATCH_I_BUYER_SUMMARY","1");};
afterEach(()=>vi.unstubAllEnvs());
it("requires exact flag and preview, excludes Fanreal and held hubs",()=>{
  setup();
  for(const h of handles)expect(batchIBuyerPreviewEnabled(`/brands/${h}`)).toBe(true);
  for(const h of ["fanreal-dolls","ido-dolls","md-dolls","top-fire-dolls"])expect(batchIBuyerPreviewEnabled(`/brands/${h}`)).toBe(false);
  expect(batchIBuyerPreviewEnabled("/dollvue")).toBe(false);
  vi.stubEnv("VERCEL_ENV","production");expect(batchIBuyerPreviewEnabled("/brands/rosretty-dolls")).toBe(false);
  vi.stubEnv("VERCEL_ENV","preview");vi.stubEnv("DOL229_BATCH_I_BUYER_SUMMARY","0");expect(batchIBuyerPreviewEnabled("/brands/rosretty-dolls")).toBe(false);
});
it("retains TopFire and held profiles, keeps exact private qualifications",()=>{
  const retained=["top-fire-dolls","ido-dolls","md-dolls","fanreal-dolls"];
  const before=retained.map(h=>brandSeoProfile(getCatalogBrand(h)!));
  const all=handles.map(h=>brandSeoProfile(getCatalogBrand(h)!));
  setup();
  expect(retained.map(h=>brandSeoProfile(getCatalogBrand(h)!))).toEqual(before);
  expect(brandSeoProfile(getCatalogBrand("rosretty-dolls")!).intro).toContain("Ask for the finished weight");
  expect(brandSeoProfile(getCatalogBrand("piper-dolls")!).intro).toContain("Full dolls and torsos are different builds");
  expect(brandSeoProfile(getCatalogBrand("yl-dolls")!).intro).toContain("Do not assume every model uses the same material");
  vi.stubEnv("VERCEL_ENV","production");expect(handles.map(h=>brandSeoProfile(getCatalogBrand(h)!))).toEqual(all);
});
it("noindexes only four flagged brand owners",async()=>{
  setup();
  for(const h of handles)expect((await generateMetadata({params:Promise.resolve({brand:h})})).robots).toEqual({index:false,follow:false});
  expect((await generateMetadata({params:Promise.resolve({brand:"fanreal-dolls"})})).robots).not.toEqual({index:false,follow:false});
  vi.stubEnv("VERCEL_ENV","production");expect((await generateMetadata({params:Promise.resolve({brand:"rosretty-dolls"})})).robots).not.toEqual({index:false,follow:false});
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
    const list=buildBrandStructuredData(getCatalogBrand("piper-dolls")!,products,{visiblePage})[0].mainEntity!;
    if(Array.isArray(list))throw Error("Expected ItemList");
    return list;
  };
  expect(build(false).itemListElement).toHaveLength(24);
  expect(build(true).numberOfItems).toBe(36);
  expect(build(true).itemListElement.map(i=>new URL(i.url).pathname)).toEqual(products.map(p=>`/products/${p.handle}`));
});
