import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { CatalogCardWeight } from "@/components/CatalogCardWeight";
import { sampleProducts } from "@/lib/data/sample-products";
import { MD_MENU_TAG } from "@/lib/customization/ido-md";
import type { Product } from "@/types/product";

const product=(weightLb:number|undefined):Product=>({...sampleProducts[0],tags:[],extended:{...sampleProducts[0].extended,brand:"Climax",weightLb}});
const render=(p:ReturnType<typeof product>)=>renderToStaticMarkup(<CatalogCardWeight product={p}/>);
describe("private catalog card weight",()=>{
  it("uses the mapped weight with dual units, not a complete-doll or shipping assertion",()=>{
    const html=render(product(22));
    expect(html).toContain("Listed weight: 22.0 lb / 10 kg");
    expect(html).not.toMatch(/shipping|complete|lightweight/i);
  });
  it.each([undefined,0,-5,NaN,Infinity])("omits unknown or invalid %s",n=>expect(render(product(n))).toBe(""));
  it("omits head-only weights and does not infer packing weight",()=>{
    expect(render({...product(22),tags:["head-only"]})).toBe("");
    expect(render({...product(undefined),extended:{...product(undefined).extended,measurements:{"Packing weight":"50 kg"}}})).toBe("");
  });
  it("preserves the existing qualified MD body-weight label",()=>{
    const p=product(66.1);p.tags=[MD_MENU_TAG];p.extended.brand="MD";p.extended.measurements={"Factory body weight":"30 kg"};
    expect(render(p)).toContain("Body weight: 66.1 lb / 30 kg");
    p.extended.measurements={};expect(render(p)).toContain("Listed weight:");
  });
  it("defaults shared cards/grids off and wires only through the existing private scope",()=>{
    expect(readFileSync("components/ProductCard.tsx","utf8")).toContain("showListedWeight = false");
    expect(readFileSync("components/ProductGrid.tsx","utf8")).toContain("showListedWeight = false");
    for(const path of ["app/brands/[brand]/page.tsx","app/(store)/shop/[collection]/page.tsx"])
      expect(readFileSync(path,"utf8")).toContain("showListedWeight={showSelectionSummary}");
  });
});
