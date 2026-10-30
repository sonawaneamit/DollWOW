import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { parse } from "node-html-parser";
import { afterEach, describe, expect, it, vi } from "vitest";
import BrandHubPage, { generateMetadata } from "@/app/brands/[brand]/page";
import { CatalogSelectionSummary } from "@/components/CatalogSelectionSummary";
import { moonvaleBuyerPreviewEnabled } from "@/lib/catalog/moonvaleBuyerPreview";
import { buildBrandStructuredData } from "@/lib/catalog/brandSeo";
import { getCatalogBrand } from "@/lib/catalog/brands";
import { sampleProducts } from "@/lib/data/sample-products";
import { getProducts } from "@/lib/shopify/storefront";

vi.mock("@/lib/shopify/storefront", () => ({ getProducts: vi.fn(async () => []) }));
vi.mock("@/components/ProductGrid", () => ({ ProductGrid: () => <div>Product grid</div> }));
vi.mock("@/components/ProductFilters", () => ({ ProductFilters: () => <div>Filters</div> }));
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });
const setup = () => { vi.stubEnv("VERCEL_ENV", "preview"); vi.stubEnv("DOL229_MOONVALE_BUYER_SUMMARY", "1"); };
const product = (amount: string, currencyCode = "USD") => ({ ...sampleProducts[0], priceRange: { ...sampleProducts[0].priceRange, minVariantPrice: { amount, currencyCode } } });

describe("private Moonvale buyer summary", () => {
  it("requires exact brand, private flag and preview environment", () => {
    setup();
    expect(moonvaleBuyerPreviewEnabled("moonvale")).toBe(true);
    for (const brand of ["sy", "md", "ido", "moonvale-dolls", ""]) expect(moonvaleBuyerPreviewEnabled(brand)).toBe(false);
    vi.stubEnv("VERCEL_ENV", "production");
    expect(moonvaleBuyerPreviewEnabled("moonvale")).toBe(false);
    vi.stubEnv("VERCEL_ENV", "preview"); vi.stubEnv("DOL229_MOONVALE_BUYER_SUMMARY", "0");
    expect(moonvaleBuyerPreviewEnabled("moonvale")).toBe(false);
  });
  it("uses current page prices and rejects unknown or mixed data", () => {
    const render = (products: ReturnType<typeof product>[]) => renderToStaticMarkup(<CatalogSelectionSummary products={products} />);
    expect(render([product("2599"), product("2999")])).toContain("$2,599.00 to $2,999.00 USD");
    for (const amount of ["", " ", "NaN", "Infinity", "-1", "0"]) expect(render([product(amount)])).toBe("");
    expect(render([product("2599"), product("2999", "EUR")])).toBe("");
    expect(render([])).toBe("");
  });
  it("keeps the exact SY certificate and qualifies it only in the new private pass", async () => {
    setup();
    const render = async () => parse(renderToStaticMarkup(await BrandHubPage({params:Promise.resolve({brand:"moonvale-dolls"}),searchParams:Promise.resolve({})})));
    const dom = await render();
    expect(dom.textContent).toContain("Certificate shown: SY Doll. It does not name Moonvale separately.");
    expect(dom.querySelector('a[aria-label="Open SY Dolls authorization certificate"]')?.getAttribute("href")).toBe("/images/authorizations/sy-doll-authorized.jpg");
    expect(getProducts).toHaveBeenLastCalledWith(expect.objectContaining({strict:true}));
    expect((await generateMetadata({params:Promise.resolve({brand:"moonvale-dolls"})})).robots).toEqual({index:false,follow:false});
    vi.stubEnv("VERCEL_ENV", "production");
    expect((await render()).textContent).not.toContain("Certificate shown:");
    expect((await generateMetadata({params:Promise.resolve({brand:"moonvale-dolls"})})).robots).not.toEqual({index:false,follow:false});
  });
  it("matches a complete visible list without changing the existing default builder", () => {
    const products = Array.from({length:36},(_,index)=>({...product("2599"),handle:`model-${index}`}));
    const brand = getCatalogBrand("moonvale-dolls")!;
    const list = (visiblePage:boolean) => {
      const entity=buildBrandStructuredData(brand,products,{visiblePage})[0].mainEntity!;
      if(Array.isArray(entity)) throw Error("Expected ItemList");
      return entity;
    };
    expect(list(false).itemListElement).toHaveLength(24);
    expect(list(true).numberOfItems).toBe(36);
    expect(list(true).itemListElement.map(i=>new URL(i.url).pathname)).toEqual(products.map(p=>`/products/${p.handle}`));
  });
});
