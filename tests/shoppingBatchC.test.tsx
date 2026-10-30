import React from "react";
import fs from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { parse } from "node-html-parser";
import { afterEach, describe, expect, it, vi } from "vitest";
import BrandHubPage, { generateMetadata as brandMetadata } from "@/app/brands/[brand]/page";
import CollectionPage, { generateMetadata as collectionMetadata } from "@/app/(store)/shop/[collection]/page";
import { brandSeoProfile } from "@/lib/catalog/brandSeo";
import { getCatalogBrand } from "@/lib/catalog/brands";
import { collectionPresets } from "@/lib/catalog/filters";
import { collectionIntro, collectionBuyerNotes, collectionComparisonRows, collectionFaqItems } from "@/lib/catalog/collectionSeo";

vi.mock("@/lib/shopify/storefront", () => ({ getSeoCatalogProducts: vi.fn(async () => []), getProducts: vi.fn(async () => []) }));
vi.mock("@/components/ProductGrid", () => ({ ProductGrid: () => <div>Product grid</div> }));
vi.mock("@/components/ProductFilters", () => ({ ProductFilters: () => <div>Filters</div> }));
afterEach(() => vi.unstubAllEnvs());
const support = "Care for Life includes first-year ownership support and ongoing repair guidance.";
const banned = /4 to 6 hours|Care 365|DollWow|product form|ordering path|decision-critical|appearance cues|fuller-build grouping|ownership format|ownership products|repair triage|eligible custom order/;

describe("Batch C reviewed shopping copy", () => {
  it.each([
    ["preview","1","erovenus-dolls",true],
    ["production","1","erovenus-dolls",false],
    ["preview","0","erovenus-dolls",false],
    ["preview","1","climax-dolls",false]
  ])("scopes brand filter removal to %s/%s/%s",async(env,flag,handle,enabled)=>{
    vi.stubEnv("VERCEL_ENV",env);vi.stubEnv("DOL229_BUYER_SUMMARY",flag);
    const markup=renderToStaticMarkup(await BrandHubPage({params:Promise.resolve({brand:handle}),searchParams:Promise.resolve({material:"silicone",sort:"price-asc",page:"2"})}));
    const root=parse(markup),nav=root.querySelector('nav[aria-label="Active filters"]');
    expect(Boolean(nav)).toBe(enabled);
    if(enabled){
      expect(nav!.querySelector('a[aria-label="Remove Full silicone filter"]')!.getAttribute("href")).toBe("/brands/erovenus-dolls?sort=price-asc#brand-products");
      expect(nav!.querySelector('a[aria-label*="Erovenus"]')).toBeNull();
      expect(root.querySelector("#brand-products")).toBeTruthy();
    }
  });
  it("explicitly prevents indexing only for flagged private Batch C pages", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("DOL229_BUYER_SUMMARY", "1");
    const brand = () => brandMetadata({params:Promise.resolve({brand:"erovenus-dolls"})});
    const collection = () => collectionMetadata({params:Promise.resolve({collection:"curvy-dolls"}),searchParams:Promise.resolve({})});
    expect((await brand()).robots).toEqual({index:false,follow:false});
    expect((await collection()).robots).toEqual({index:false,follow:false});
    vi.stubEnv("VERCEL_ENV", "production");
    expect((await brand()).robots).not.toEqual({index:false,follow:false});
    expect((await collection()).robots).not.toEqual({index:false,follow:false});
  });
  for (const handle of ["erovenus-dolls", "climax-dolls", "curvy-dolls", "brunette-dolls", "anime-dolls"]) {
    it(`keeps ${handle} concise, plain and matched to visible schema`, async () => {
      vi.stubEnv("VERCEL_ENV", "preview");
      const brand = getCatalogBrand(handle);
      const profile = brand ? brandSeoProfile(brand) : null;
      const preset = collectionPresets[handle];
      const intro = profile?.intro ?? collectionIntro(preset, handle);
      const faqs = profile?.faqs ?? collectionFaqItems(handle, preset);
      const comparison = profile?.comparisonBullets ?? collectionComparisonRows(handle, preset);
      const notes = profile?.buyerNotes ?? collectionBuyerNotes(handle, preset);
      expect(intro.split(/(?<=[.!?])\s+/)).toHaveLength(3);
      expect(intro.split(/\s+/).length).toBeLessThan(55);
      expect(JSON.stringify({ intro, faqs, comparison, notes })).not.toMatch(banned);
      expect(JSON.stringify(comparison)).toContain(support);
      const markup = brand
        ? renderToStaticMarkup(await BrandHubPage({params:Promise.resolve({brand:handle}),searchParams:Promise.resolve({})}))
        : renderToStaticMarkup(await CollectionPage({params:Promise.resolve({collection:handle}),searchParams:Promise.resolve({})}));
      const dom = parse(markup), prefix = brand ? "brand" : "collection";
      const section = dom.querySelector(`#${prefix}-comparison-heading`)!.closest("details")!;
      expect(section.querySelectorAll("ul > li")).toHaveLength(3);
      expect(section.querySelector("table")).toBeNull();
      expect(section.querySelector('a[href="/care-for-life"]')).not.toBeNull();
      const cards = dom.querySelector(`#${prefix}-faq-heading`)!.closest("details")!.querySelectorAll("article");
      expect(cards.map(n=>({question:n.querySelector("h3")?.text,answer:n.querySelector("p")?.text}))).toEqual(faqs);
      const schema = dom.querySelectorAll('script[type="application/ld+json"]').map(n=>JSON.parse(n.text)).find(n=>n["@type"]==="FAQPage");
      expect(schema.mainEntity.map((n:{name:string;acceptedAnswer:{text:string}})=>({question:n.name,answer:n.acceptedAnswer.text}))).toEqual(faqs);
      if(brand){
        const auth = dom.querySelector("#brand-authorization-heading")!.closest("details")!;
        const href = auth.querySelector('a[aria-label*="authorization certificate"]')?.getAttribute("href");
        expect(href).toMatch(/^\/images\/authorizations\//);
        expect(fs.statSync(`public${href}`).size).toBeGreaterThan(1000);
        expect(auth.text).not.toContain("Ltd..");
        expect(auth.text).toContain("DollWOW");
      }
    });
  }
  it("keeps Brunette hair qualifications once in the intro and once in the FAQ", () => {
    const handle="brunette-dolls",preset=collectionPresets[handle];
    expect(collectionIntro(preset,handle)).toContain("wig may not be included");
    expect(collectionBuyerNotes(handle,preset).some(n=>/wig|implanted/i.test(n.body))).toBe(false);
    expect(collectionComparisonRows(handle,preset).some(n=>/wig|implanted/i.test(JSON.stringify(n)))).toBe(false);
    expect(collectionFaqItems(handle,preset).filter(n=>/wig|implanted/i.test(n.answer))).toHaveLength(1);
  });
  it("attributes Erovenus positioning and keeps Anime adult-only safeguards", () => {
    expect(brandSeoProfile(getCatalogBrand("erovenus-dolls")!).positioning).toContain("Erovenus describes");
    expect(collectionIntro(collectionPresets["anime-dolls"],"anime-dolls")).toContain("no school-themed or underage-coded merchandising");
    expect(collectionFaqItems("curvy-dolls",collectionPresets["curvy-dolls"]).at(-1)?.answer).toBe("Proportions and options depend on the model; check the listing or ask us.");
  });
});
