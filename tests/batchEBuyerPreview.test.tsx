import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { batchEBuyerPreviewEnabled } from "@/lib/catalog/batchEBuyerPreview";
import { CatalogSelectionSummary } from "@/components/CatalogSelectionSummary";
import { sampleProducts } from "@/lib/data/sample-products";
import { brandSeoProfile, buildBrandStructuredData } from "@/lib/catalog/brandSeo";
import { getCatalogBrand } from "@/lib/catalog/brands";
import { buildCollectionStructuredData, collectionIntro } from "@/lib/catalog/collectionSeo";
import { collectionPresets } from "@/lib/catalog/filters";
import { generateMetadata as brandMetadata } from "@/app/brands/[brand]/page";
import { generateMetadata as collectionMetadata } from "@/app/(store)/shop/[collection]/page";

afterEach(()=>vi.unstubAllEnvs());
const setup=()=>{vi.stubEnv("VERCEL_ENV","preview");vi.stubEnv("DOL229_BATCH_E_BUYER_SUMMARY","1");};
const product=(amount:string,currencyCode="USD")=>({...sampleProducts[0],priceRange:{...sampleProducts[0].priceRange,minVariantPrice:{amount,currencyCode}}});
describe("private Batch E buyer pass",()=>{
  it("requires exact private scope and excludes every DollVue/held hub path",()=>{
    setup();
    for(const p of ["/shop/hips","/shop/redhead-dolls","/shop/slim-dolls","/brands/angelkiss-dolls"])expect(batchEBuyerPreviewEnabled(p)).toBe(true);
    for(const p of ["/shop/dollvue-enabled","/dollvue","/dollvue/generate","/brands/ido-dolls","/brands/md-dolls","/brands/top-fire-dolls",""])expect(batchEBuyerPreviewEnabled(p)).toBe(false);
    vi.stubEnv("VERCEL_ENV","production");expect(batchEBuyerPreviewEnabled("/shop/hips")).toBe(false);
    vi.stubEnv("VERCEL_ENV","preview");vi.stubEnv("DOL229_BATCH_E_BUYER_SUMMARY","0");expect(batchEBuyerPreviewEnabled("/shop/hips")).toBe(false);
  });
  it("keeps Slim and production facts unchanged, with plain model-specific private copy",()=>{
    const angel=getCatalogBrand("angelkiss-dolls")!;
    const before=brandSeoProfile(angel),slim=collectionIntro(collectionPresets["slim-dolls"],"slim-dolls");
    setup();
    expect(brandSeoProfile(angel).intro.split(/\s+/).length).toBeLessThan(50);
    expect(brandSeoProfile(angel).intro).toContain("A silicone head does not mean the whole body is silicone");
    expect(collectionIntro(collectionPresets["slim-dolls"],"slim-dolls")).toBe(slim);
    expect(collectionIntro(collectionPresets.hips,"hips")).toContain("Hips and full torsos are different shapes");
    expect(collectionIntro(collectionPresets["redhead-dolls"],"redhead-dolls")).toContain("pictured wig may not be included");
    vi.stubEnv("VERCEL_ENV","production");expect(brandSeoProfile(angel)).toEqual(before);
  });
  it("noindexes the four flagged pages without changing production",async()=>{
    setup();
    expect((await brandMetadata({params:Promise.resolve({brand:"angelkiss-dolls"})})).robots).toEqual({index:false,follow:false});
    for(const collection of ["hips","redhead-dolls","slim-dolls"])expect((await collectionMetadata({params:Promise.resolve({collection}),searchParams:Promise.resolve({})})).robots).toEqual({index:false,follow:false});
    vi.stubEnv("VERCEL_ENV","production");expect((await brandMetadata({params:Promise.resolve({brand:"angelkiss-dolls"})})).robots).not.toEqual({index:false,follow:false});
  });
  it("does not invent prices or combine currencies",()=>{
    const render=(products:ReturnType<typeof product>[])=>renderToStaticMarkup(<CatalogSelectionSummary products={products}/>);
    for(const amount of [""," ","NaN","Infinity","-1","0"])expect(render([product(amount)])).toBe("");
    expect(render([])).toBe("");expect(render([product("1999"),product("2999","EUR")])).toBe("");
    expect(render([product("1999"),product("2999")])).toContain("$1,999.00 to $2,999.00 USD");
  });
  it.each(["brand","collection"])("keeps complete visible %s schema and the default24contract",kind=>{
    const products=Array.from({length:36},(_,i)=>({...product("1999"),handle:`visible-${i}`}));
    const build=(visiblePage:boolean)=>kind==="brand"?buildBrandStructuredData(getCatalogBrand("angelkiss-dolls")!,products,{visiblePage}):buildCollectionStructuredData({handle:"hips",preset:collectionPresets.hips,products},{visiblePage});
    const list=(flag:boolean)=>{const e=build(flag)[0].mainEntity!;if(Array.isArray(e))throw Error("Expected ItemList");return e;};
    expect(list(false).itemListElement).toHaveLength(24);expect(list(true).numberOfItems).toBe(36);
    expect(list(true).itemListElement.map(i=>new URL(i.url).pathname)).toEqual(products.map(p=>`/products/${p.handle}`));
  });
});
