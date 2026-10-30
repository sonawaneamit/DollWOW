import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { batchDBuyerPreviewEnabled } from "@/lib/catalog/batchDBuyerPreview";
import { CatalogSelectionSummary } from "@/components/CatalogSelectionSummary";
import { sampleProducts } from "@/lib/data/sample-products";
import { brandSeoProfile, buildBrandStructuredData } from "@/lib/catalog/brandSeo";
import { getCatalogBrand } from "@/lib/catalog/brands";
import { buildCollectionStructuredData, collectionIntro } from "@/lib/catalog/collectionSeo";
import { collectionPresets } from "@/lib/catalog/filters";
import { generateMetadata as brandMetadata } from "@/app/brands/[brand]/page";
import { generateMetadata as collectionMetadata } from "@/app/(store)/shop/[collection]/page";

afterEach(() => vi.unstubAllEnvs());
const setup = () => { vi.stubEnv("VERCEL_ENV", "preview"); vi.stubEnv("DOL229_BATCH_D_BUYER_SUMMARY", "1"); };
const product = (amount: string, currencyCode = "USD") => ({...sampleProducts[0],priceRange:{...sampleProducts[0].priceRange,minVariantPrice:{amount,currencyCode}}});

describe("private Batch D buyer pass", () => {
  it("scopes activation to four paths and never production or Mini", () => {
    setup();
    for(const path of ["/shop/ready-to-ship","/shop/blonde-dolls","/shop/tan-skin-dolls","/brands/il-doll"]) expect(batchDBuyerPreviewEnabled(path)).toBe(true);
    for(const path of ["/shop/mini-sex-dolls","/shop/mini-dolls","/brands/ido-dolls","/brands/md-dolls","/brands/top-fire-dolls","/brands/moonvale-dolls",""]) expect(batchDBuyerPreviewEnabled(path)).toBe(false);
    vi.stubEnv("VERCEL_ENV","production"); expect(batchDBuyerPreviewEnabled("/brands/il-doll")).toBe(false);
    vi.stubEnv("VERCEL_ENV","preview"); vi.stubEnv("DOL229_BATCH_D_BUYER_SUMMARY","0"); expect(batchDBuyerPreviewEnabled("/brands/il-doll")).toBe(false);
  });
  it("keeps ready/mini copy and production profiles unchanged while shortening private copy", () => {
    const il=getCatalogBrand("il-doll")!;
    const before=brandSeoProfile(il);
    const ready=collectionIntro(collectionPresets["ready-to-ship"],"ready-to-ship");
    const mini=collectionIntro(collectionPresets["mini-sex-dolls"],"mini-sex-dolls");
    setup();
    expect(brandSeoProfile(il).intro.split(/\s+/).length).toBeLessThan(50);
    expect(JSON.stringify(brandSeoProfile(il).buyerNotes)).not.toContain("ordering path");
    expect(collectionIntro(collectionPresets["ready-to-ship"],"ready-to-ship")).toBe(ready);
    expect(collectionIntro(collectionPresets["mini-sex-dolls"],"mini-sex-dolls")).toBe(mini);
    expect(collectionIntro(collectionPresets["blonde-dolls"],"blonde-dolls")).toContain("pictured wig may not be included");
    expect(collectionIntro(collectionPresets["tan-skin-dolls"],"tan-skin-dolls")).toContain("Shade names vary by manufacturer");
    vi.stubEnv("VERCEL_ENV","production"); expect(brandSeoProfile(il)).toEqual(before);
  });
  it("noindexes only the flagged brand and collections", async () => {
    setup();
    expect((await brandMetadata({params:Promise.resolve({brand:"il-doll"})})).robots).toEqual({index:false,follow:false});
    for(const collection of ["ready-to-ship","blonde-dolls","tan-skin-dolls"]){
      expect((await collectionMetadata({params:Promise.resolve({collection}),searchParams:Promise.resolve({})})).robots).toEqual({index:false,follow:false});
    }
    vi.stubEnv("VERCEL_ENV","production");
    expect((await brandMetadata({params:Promise.resolve({brand:"il-doll"})})).robots).not.toEqual({index:false,follow:false});
  });
  it("omits unknown, zero and mixed prices without inventing free offers", () => {
    const render=(products:ReturnType<typeof product>[])=>renderToStaticMarkup(<CatalogSelectionSummary products={products}/>);
    for(const amount of ["", " ", "NaN", "Infinity", "-1", "0"]) expect(render([product(amount)])).toBe("");
    expect(render([product("1999"),product("2999","EUR")])).toBe("");
    expect(render([])).toBe("");
    expect(render([product("1999"),product("2999")])).toContain("$1,999.00 to $2,999.00 USD");
  });
  it.each(["brand","collection"])("keeps complete visible %s schema and the default24contract",kind=>{
    const products=Array.from({length:36},(_,index)=>({...product("1999"),handle:`visible-${index}`}));
    const build=(visiblePage:boolean)=>kind==="brand"?buildBrandStructuredData(getCatalogBrand("il-doll")!,products,{visiblePage}):buildCollectionStructuredData({handle:"blonde-dolls",preset:collectionPresets["blonde-dolls"],products},{visiblePage});
    const list=(flag:boolean)=>{const e=build(flag)[0].mainEntity!;if(Array.isArray(e))throw Error("Expected ItemList");return e;};
    expect(list(false).itemListElement).toHaveLength(24);
    expect(list(true).numberOfItems).toBe(36);
    expect(list(true).itemListElement.map(i=>new URL(i.url).pathname)).toEqual(products.map(p=>`/products/${p.handle}`));
  });
});
