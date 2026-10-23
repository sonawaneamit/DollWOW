import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { parse } from "node-html-parser";
import { afterEach, describe, expect, it, vi } from "vitest";
import CollectionPage from "@/app/(store)/shop/[collection]/page";
import BrandHubPage from "@/app/brands/[brand]/page";
import { collectionPresets } from "@/lib/catalog/filters";
import { collectionBuyerNotes, collectionComparisonRows, collectionFaqItems, collectionRelatedLinks, collectionIntro, collectionUsesPlainGuidance } from "@/lib/catalog/collectionSeo";
import { brandSeoProfile, buildBrandStructuredData } from "@/lib/catalog/brandSeo";
import { getCatalogBrand } from "@/lib/catalog/brands";

vi.mock("@/lib/shopify/storefront", () => ({ getSeoCatalogProducts: vi.fn(async () => []), getProducts: vi.fn(async () => []) }));
vi.mock("@/components/ProductGrid", () => ({ ProductGrid: () => <div>Product grid</div> }));
vi.mock("@/components/ProductFilters", () => ({ ProductFilters: () => <div>Filters</div> }));
afterEach(() => vi.unstubAllEnvs());

const collections = ["black-dolls", "futa-sex-dolls", "petite-dolls", "custom", "cheap-sex-dolls", "lightweight-sex-dolls", "new-sex-dolls"];
const banned = /4 to 6 hours|collection membership|not a universal|does not prove|not a promise|Human Build Check|Doll Passport|Lifetime Repair Concierge|Arrival-Right Guarantee|approval path|supported path|Care 365/i;

describe("reviewed shopping copy", () => {
  for (const handle of collections) {
    it(`keeps ${handle} short, plain and backed by visible question-answer pairs`, async () => {
      vi.stubEnv("VERCEL_ENV", "preview");
      const preset = collectionPresets[handle];
      const intro = collectionIntro(preset, handle);
      const faqs = collectionFaqItems(handle, preset);
      const text = JSON.stringify({ intro, faqs, notes: collectionBuyerNotes(handle, preset), comparison: collectionComparisonRows(handle, preset) });
      expect(collectionUsesPlainGuidance(handle)).toBe(true);
      expect(intro.split(/(?<=[.!?])\s+/)).toHaveLength(handle === "black-dolls" ? 2 : 3);
      expect(intro.split(/\s+/).length).toBeLessThan(65);
      expect(text).not.toMatch(banned);
      const html = renderToStaticMarkup(await CollectionPage({ params: Promise.resolve({ collection: handle }), searchParams: Promise.resolve({}) }));
      const dom = parse(html);
      const comparison = dom.querySelector("#collection-comparison-heading")!.closest("details")!;
      expect(comparison.querySelectorAll("ul > li")).toHaveLength(3);
      expect(comparison.querySelector("table")).toBeNull();
      expect(comparison.querySelector('a[href="/care-for-life"]')).not.toBeNull();
      const cards = dom.querySelector("#collection-faq-heading")!.closest("details")!.querySelectorAll("article");
      expect(cards.map(card => ({ question: card.querySelector("h3")?.textContent, answer: card.querySelector("p")?.textContent }))).toEqual(faqs);
      const schema = dom.querySelectorAll('script[type="application/ld+json"]').map(node => JSON.parse(node.textContent)).find(row => row["@type"] === "FAQPage");
      expect(schema.mainEntity.map((row: {name: string; acceptedAnswer: {text: string}}) => ({question: row.name, answer: row.acceptedAnswer.text}))).toEqual(faqs);
    });
  }

  it("states the petite range once in buyer copy", () => {
    const preset = collectionPresets["petite-dolls"];
    const text = JSON.stringify({ intro: collectionIntro(preset, "petite-dolls"), notes: collectionBuyerNotes("petite-dolls", preset), faqs: collectionFaqItems("petite-dolls", preset), comparison: collectionComparisonRows("petite-dolls", preset) });
    expect(text.match(/121 to 154/g)).toHaveLength(1);
    expect(collectionFaqItems("petite-dolls", preset)[0].answer).toContain("We call 4 ft to 5 ft 1 in petite");
  });

  it("keeps custom support once in the comparison and starts with body choices", () => {
    const preset = collectionPresets.custom;
    expect(collectionComparisonRows("custom", preset)[0].factor).toBe("Build around your favorite body");
    expect(JSON.stringify(collectionComparisonRows("custom", preset))).not.toContain("Care for Life");
    expect(collectionRelatedLinks("custom", preset)[0].href).not.toBe("/shop/futa-sex-dolls");
  });

  it("shows Dolls Castle's existing certificate and three plain bullets", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    const brand = getCatalogBrand("dolls-castle")!;
    const profile = brandSeoProfile(brand);
    expect(profile.intro.split(/(?<=[.!?])\s+/)).toHaveLength(3);
    expect(JSON.stringify(profile)).not.toMatch(banned);
    expect(JSON.stringify(profile)).not.toMatch(/known for custom doll development|ownership path|hybrid path|retain the final build record/i);
    const dom = parse(renderToStaticMarkup(await BrandHubPage({params: Promise.resolve({brand: "dolls-castle"}), searchParams: Promise.resolve({})})));
    const comparison = dom.querySelector("#brand-comparison-heading")!.closest("details")!;
    expect(comparison.querySelectorAll("li")).toHaveLength(3);
    expect(comparison.querySelector("table")).toBeNull();
    const authorization = dom.querySelector("#brand-authorization-heading")!.closest("details")!;
    expect(authorization.querySelector('a[aria-label="Open Dolls Castle authorization certificate"]')).not.toBeNull();
    const faq = buildBrandStructuredData(brand, []).find(row => row["@type"] === "FAQPage");
    expect(faq).toBeDefined();
    expect(dom.querySelector("#brand-faq-heading")!.closest("details")!.querySelectorAll("article")).toHaveLength(profile.faqs.length);
  });

  it("does not replace unreviewed collection or brand comparisons", () => {
    expect(collectionUsesPlainGuidance("tpe")).toBe(false);
    expect(collectionUsesPlainGuidance("brunette-dolls")).toBe(false);
    expect(brandSeoProfile(getCatalogBrand("irontech")!).comparisonBullets).toBeUndefined();
  });

  for (const handle of ["moonvale-dolls", "tantaly-dolls"]) {
    it(`keeps ${handle} plain and holds unconfirmed issuer attribution`, async () => {
      vi.stubEnv("VERCEL_ENV", "preview");
      const brand = getCatalogBrand(handle)!;
      const profile = brandSeoProfile(brand);
      expect(profile.intro.split(/(?<=[.!?])\s+/)).toHaveLength(3);
      expect(JSON.stringify(profile)).not.toMatch(banned);
      const dom = parse(renderToStaticMarkup(await BrandHubPage({params: Promise.resolve({brand: handle}), searchParams: Promise.resolve({})})));
      const comparison = dom.querySelector("#brand-comparison-heading")!.closest("details")!;
      expect(comparison.querySelectorAll("li")).toHaveLength(3);
      expect(comparison.querySelector("table")).toBeNull();
      const faqs = dom.querySelector("#brand-faq-heading")!.closest("details")!.querySelectorAll("article");
      expect(faqs.map(card => ({ question: card.querySelector("h3")?.textContent, answer: card.querySelector("p")?.textContent }))).toEqual(profile.faqs);
      if (handle === "moonvale-dolls") {
        const authorization = dom.querySelector("#brand-authorization-heading")!.closest("details")!;
        expect(authorization.textContent).not.toMatch(/certificate shared|SY Doll/);
        expect(authorization.querySelector("img")).toBeNull();
      } else {
        expect(comparison.textContent).toContain("first-year ownership support and ongoing repair guidance");
        expect(comparison.querySelector('a[href="/care-for-life"]')).not.toBeNull();
      }
    });
  }
});
