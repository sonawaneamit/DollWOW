import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { removableCatalogFilters } from "@/lib/catalog/filterRemoval";
import { ActiveCatalogFilters } from "@/components/ActiveCatalogFilters";
import { collectionPresets } from "@/lib/catalog/filters";

const preset=collectionPresets["curvy-dolls"].filters;
describe("private Curvy active-filter removal",()=>{
  it("removes only the selected facet and pagination, preserving other query values",()=>{
    const rows=removableCatalogFilters({...preset,material:"silicone",price:"1500-1999",sort:"price-asc"},preset,{material:"silicone",price:"1500-1999",sort:"price-asc",page:"2",utm_source:["one","two"]},"/shop/curvy-dolls");
    const url=new URL(rows.find(r=>r.key==="material")!.href!,"https://dollwow.com");
    expect(url.searchParams.has("material")).toBe(false);expect(url.searchParams.has("page")).toBe(false);
    expect(url.searchParams.get("price")).toBe("1500-1999");expect(url.searchParams.get("sort")).toBe("price-asc");
    expect(url.searchParams.getAll("utm_source")).toEqual(["one","two"]);
    expect(url.pathname).toBe("/shop/curvy-dolls");expect(url.hash).toBe("#collection-products");
  });
  it("keeps fixed collection predicates non-removable even if repeated in the URL",()=>{
    const rows=removableCatalogFilters(preset,preset,{look:preset.look,bodyType:preset.bodyType},"/shop/curvy-dolls");
    expect(rows.length).toBeGreaterThan(0);expect(rows.every(r=>r.href===null)).toBe(true);
  });
  it("handles array-valued facets and the last removable filter",()=>{
    const rows=removableCatalogFilters({...preset,material:"silicone"},preset,{material:["silicone","tpe"],page:"8"},"/shop/curvy-dolls");
    expect(rows.find(r=>r.key==="material")!.href).toBe("/shop/curvy-dolls#collection-products");
  });
  it("renders keyboard links with explicit accessible removal labels and no removal for the owner facet",()=>{
    const html=renderToStaticMarkup(<ActiveCatalogFilters filters={{...preset,material:"silicone"}} preset={preset} raw={{material:"silicone"}} basePath="/shop/curvy-dolls"/>);
    expect(html).toContain('aria-label="Active filters"');expect(html).toContain('aria-label="Remove Full silicone filter"');
    expect(html).not.toContain('aria-label="Remove Curvy');
  });
});

describe("private Brunette active-filter removal",()=>{
  const hairPreset=collectionPresets["brunette-dolls"].filters;
  it("removes the material and page while preserving price, sort and raw query arrays",()=>{
    const rows=removableCatalogFilters({...hairPreset,material:"silicone",price:"1500-1999",sort:"price-asc"},hairPreset,{material:"silicone",price:"1500-1999",sort:"price-asc",page:"2",utm_source:["one","two"]},"/shop/brunette-dolls");
    const url=new URL(rows.find(row=>row.key==="material")!.href!,"https://dollwow.com");
    expect(url.pathname).toBe("/shop/brunette-dolls");expect(url.searchParams.has("material")).toBe(false);expect(url.searchParams.has("page")).toBe(false);
    expect(url.searchParams.get("price")).toBe("1500-1999");expect(url.searchParams.get("sort")).toBe("price-asc");expect(url.searchParams.getAll("utm_source")).toEqual(["one","two"]);
    expect(url.hash).toBe("#collection-products");
  });
  it("does not make the fixed hair preset removable, even when repeated in the URL",()=>{
    const rows=removableCatalogFilters(hairPreset,hairPreset,{look:hairPreset.look,bodyType:hairPreset.bodyType},"/shop/brunette-dolls");
    expect(rows.length).toBeGreaterThan(0);expect(rows.every(row=>row.href===null)).toBe(true);
    const html=renderToStaticMarkup(<ActiveCatalogFilters filters={{...hairPreset,material:"silicone"}} preset={hairPreset} raw={{material:"silicone"}} basePath="/shop/brunette-dolls"/>);
    expect(html).toContain('aria-label="Remove Full silicone filter"');expect(html).not.toContain('aria-label="Remove Brunette');
  });
});
