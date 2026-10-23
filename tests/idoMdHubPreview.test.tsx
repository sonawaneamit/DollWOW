import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { parse } from "node-html-parser";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getCatalogBrand } from "@/lib/catalog/brands";
import { brandSeoProfile, buildBrandMetadata } from "@/lib/catalog/brandSeo";
import { usesCompactBrandLayout } from "@/components/BrandHubSection";

vi.mock("@/lib/shopify/storefront", () => ({ getProducts: vi.fn(async () => []) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }), notFound: () => { throw new Error("Not found"); } }));
import BrandHubPage from "@/app/brands/[brand]/page";

afterEach(() => vi.unstubAllEnvs());

describe("DOL-229 IDO and MD review-only hubs", () => {
  it.each(["ido", "md"])("keeps %s production/dev/unset copy and layout unchanged", value => {
    const brand = getCatalogBrand(value)!;
    const baseline = brandSeoProfile(brand, "production");
    for (const deployment of ["production", "development", ""]) {
      expect(brandSeoProfile(brand, deployment)).toEqual(baseline);
      expect(usesCompactBrandLayout(value, deployment)).toBe(false);
    }
    const preview = brandSeoProfile(brand, "preview");
    expect(preview.faqs.slice(0, -1)).toEqual(baseline.faqs);
    expect(preview.buyerNotes.slice(0, -1)).toEqual(baseline.buyerNotes);
    expect(preview.comparisonRows).toEqual(baseline.comparisonRows);
    expect(preview.metaTitle).toBe(baseline.metaTitle);
    expect(preview.metaDescription).toBe(baseline.metaDescription);
    expect(preview.intro.split(/\s+/).length).toBeLessThan(60);
    expect(preview.faqs.at(-1)?.answer).toContain("custom-made doll shipped from the factory");
    expect(preview.buyerNotes.at(-1)?.body).toContain("do not estimate a missing figure");
  });

  it.each(["ido", "md"])("renders %s facts and matching schema after products in collapsed native HTML", async value => {
    vi.stubEnv("VERCEL_ENV", "preview");
    const brand = getCatalogBrand(value)!;
    const profile = brandSeoProfile(brand);
    const html = renderToStaticMarkup(await BrandHubPage({
      params: Promise.resolve({ brand: brand.collectionHandle }), searchParams: Promise.resolve({})
    }));
    const dom = parse(html);
    const schemas = dom.querySelectorAll('script[type="application/ld+json"]').map(script => JSON.parse(script.textContent));
    expect(schemas.find(item => item["@type"] === "CollectionPage").url).toBe(buildBrandMetadata(brand).alternates?.canonical);
    expect(schemas.find(item => item["@type"] === "CollectionPage").description).toBe(profile.intro);
    expect(schemas.find(item => item["@type"] === "FAQPage").mainEntity).toEqual(profile.faqs.map(item => ({
      "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer }
    })));
    dom.querySelectorAll("script").forEach(script => script.remove());
    expect(dom.textContent).toContain(profile.intro);
    for (const faq of profile.faqs) {
      expect(dom.textContent).toContain(faq.question);
      expect(dom.textContent).toContain(faq.answer);
    }
    for (const id of ["brand-comparison-heading", "brand-buyer-notes-heading", "brand-faq-heading", "brand-authorization-heading"]) {
      const disclosure = dom.querySelector(`#${id}`)?.closest("details");
      expect(disclosure).toBeTruthy();
      expect(disclosure?.hasAttribute("open")).toBe(false);
      expect(html.indexOf('id="brand-products"')).toBeLessThan(html.indexOf(`id="${id}"`));
    }
    expect(dom.querySelector("nav.collection-guide-links")?.getAttribute("tabindex")).toBe("0");
  });

  it("does not bring held or unrelated hubs into this preview layout", () => {
    for (const value of ["fanreal", "top-fire", "lusandy", "funwest"]) expect(usesCompactBrandLayout(value, "preview")).toBe(false);
  });
});
