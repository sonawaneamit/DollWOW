import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { batchFBuyerPreviewEnabled } from "@/lib/catalog/batchFBuyerPreview";
import { CatalogSelectionSummary } from "@/components/CatalogSelectionSummary";
import { sampleProducts } from "@/lib/data/sample-products";
import { brandSeoProfile, buildBrandStructuredData } from "@/lib/catalog/brandSeo";
import { getCatalogBrand } from "@/lib/catalog/brands";
import { buildCollectionStructuredData, collectionIntro } from "@/lib/catalog/collectionSeo";
import { collectionPresets } from "@/lib/catalog/filters";
import { generateMetadata as brandMetadata } from "@/app/brands/[brand]/page";
import { generateMetadata as collectionMetadata } from "@/app/(store)/shop/[collection]/page";

afterEach(()=>vi.unstubAllEnvs());
const setup=()=>{vi.stubEnv("VERCEL_ENV","preview");vi.stubEnv("DOL229_BATCH_F_BUYER_SUMMARY","1");};
const product=(amount:string,currencyCode="USD")=>({...sampleProducts[0],priceRange:{...sampleProducts[0].priceRange,minVariantPrice:{amount,currencyCode}}});
describe("private Batch F buyer pass",()=>{
  it("requires exact private scope and excludes every DollVue/held hub path",()=>{
    setup();
    for(const p of ["/shop/fair-skin-dolls","/shop/height-160-164","/brands/real-lady-dolls"])expect(batchFBuyerPreviewEnabled(p)).toBe(true);
    for(const p of ["/shop/dollvue-enabled","/dollvue","/dollvue/generate","/brands/ido-dolls","/brands/md-dolls","/brands/top-fire-dolls",""])expect(batchFBuyerPreviewEnabled(p)).toBe(false);
    vi.stubEnv("VERCEL_ENV","production");expect(batchFBuyerPreviewEnabled("/shop/fair-skin-dolls")).toBe(false);
    vi.stubEnv("VERCEL_ENV","preview");vi.stubEnv("DOL229_BATCH_F_BUYER_SUMMARY","0");expect(batchFBuyerPreviewEnabled("/shop/fair-skin-dolls")).toBe(false);
  });
  it("preserves Real Lady, Under155 and Realistic facts, with narrow private copy",()=>{
    const brand=getCatalogBrand("real-lady-dolls")!;
    const before=brandSeoProfile(brand);
    const held=["height-under-155","realistic-sex-dolls"].map(h=>collectionIntro(collectionPresets[h],h));
    setup();
    expect(brandSeoProfile(brand)).toEqual(before);
    expect(["height-under-155","realistic-sex-dolls"].map(h=>collectionIntro(collectionPresets[h],h))).toEqual(held);
    expect(collectionIntro(collectionPresets["height-160-164"],"height-160-164")).toContain("height alone does not tell you");
    expect(collectionIntro(collectionPresets["fair-skin-dolls"],"fair-skin-dolls")).toContain("Shade names differ");
    expect(batchFBuyerPreviewEnabled("/shop/height-under-155")).toBe(false);
    expect(batchFBuyerPreviewEnabled("/shop/realistic-sex-dolls")).toBe(false);
  });
  it("noindexes the three flagged pages without changing production",async()=>{
    setup();
    expect((await brandMetadata({params:Promise.resolve({brand:"real-lady-dolls"})})).robots).toEqual({index:false,follow:false});
    for(const collection of ["fair-skin-dolls","height-160-164"])expect((await collectionMetadata({params:Promise.resolve({collection}),searchParams:Promise.resolve({})})).robots).toEqual({index:false,follow:false});
    vi.stubEnv("VERCEL_ENV","production");expect((await brandMetadata({params:Promise.resolve({brand:"real-lady-dolls"})})).robots).not.toEqual({index:false,follow:false});
  });
  it("does not invent prices or combine currencies",()=>{
    const render=(products:ReturnType<typeof product>[])=>renderToStaticMarkup(<CatalogSelectionSummary products={products}/>);
    for(const amount of [""," ","NaN","Infinity","-1","0"])expect(render([product(amount)])).toBe("");
    expect(render([])).toBe("");expect(render([product("1999"),product("2999","EUR")])).toBe("");
    expect(render([product("1999"),product("2999")])).toContain("$1,999.00 to $2,999.00 USD");
  });
  it.each(["brand","collection"])("keeps complete visible %s schema and the default24contract",kind=>{
    const products=Array.from({length:36},(_,i)=>({...product("1999"),handle:`visible-${i}`}));
    const build=(visiblePage:boolean)=>kind==="brand"?buildBrandStructuredData(getCatalogBrand("real-lady-dolls")!,products,{visiblePage}):buildCollectionStructuredData({handle:"fair-skin-dolls",preset:collectionPresets["fair-skin-dolls"],products},{visiblePage});
    const list=(flag:boolean)=>{const e=build(flag)[0].mainEntity!;if(Array.isArray(e))throw Error("Expected ItemList");return e;};
    expect(list(false).itemListElement).toHaveLength(24);expect(list(true).numberOfItems).toBe(36);
    expect(list(true).itemListElement.map(i=>new URL(i.url).pathname)).toEqual(products.map(p=>`/products/${p.handle}`));
  });
});
