import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { BrandAuthorizationCard } from "@/components/BrandAuthorizationCard";
import { catalogBrands, getCatalogBrand, brandCollectionRedirectHref } from "@/lib/catalog/brands";
import { getBrandAuthorization, isLiveAuthorizedBrand } from "@/lib/catalog/authorizations";
import { brandHubHandles, brandRelatedLinks, brandSeoProfile } from "@/lib/catalog/brandSeo";
import { catalogFilterOptions } from "@/lib/catalog/filters";
import { homepageFeatureProducts, homepageBrands } from "@/lib/catalog/homepage";
import { buildSitemapSegments, productSitemapBrand } from "@/lib/seo/sitemapSegments";
import { getLearningArticles } from "@/lib/learn/content";
import { sampleProducts } from "@/lib/data/sample-products";

describe("IDO/MD authorized brand release integration", () => {
  it.each(["ido"]) // MD unlaunched; add "md" back at MD launch
  ("connects %s discovery, guides, certificates and public sitemap grouping", async value => {
    const brand = getCatalogBrand(value)!;
    const href = `/brands/${value}-dolls`;
    expect(brand.collectionHandle).toBe(`${value}-dolls`);
    expect(brandHubHandles).toContain(brand.collectionHandle);
    expect(brandCollectionRedirectHref(brand.collectionHandle)).toBe(href);
    expect(catalogFilterOptions.brands.filter(item => item.value === value)).toHaveLength(1);
    expect(isLiveAuthorizedBrand(value)).toBe(true);
    const authorization = getBrandAuthorization(value)!;
    expect(authorization.status).toBe("certificate");
    for (const src of [authorization.certificateSrc!, authorization.certificatePreviewSrc!]) {
      const bytes = readFileSync(`public${src}`);
      const metadata = await sharp(bytes).metadata();
      expect(metadata.width).toBeGreaterThanOrEqual(720);
      expect(metadata.exif).toBeUndefined();
      expect(metadata.xmp).toBeUndefined();
      await expect(sharp(bytes).raw().toBuffer()).resolves.toBeInstanceOf(Buffer);
    }
    const html = renderToStaticMarkup(<BrandAuthorizationCard brand={value} variant="brand" />);
    expect(html).toContain(`href="${authorization.certificateSrc}"`);
    expect(html).toContain("Certified to sell");
    expect(html).toContain('href="/authorized-vendors"');

    const articles = new Set(getLearningArticles().map(article => `/learn/${article.slug}`));
    const guides = brandRelatedLinks(brand).filter(link => link.href.startsWith("/learn/"));
    expect(guides.length).toBeGreaterThanOrEqual(3);
    for (const guide of guides) expect(articles.has(guide.href), guide.href).toBe(true);
    expect(brandSeoProfile(brand).comparisonRows).toHaveLength(3);
    expect(brandSeoProfile(brand).buyerNotes).toHaveLength(3);

    // Simulate public Storefront records only; this never reads or publishes drafts.
    for (const alias of [brand.value, brand.label, ...brand.aliases, ...brand.tags]) {
      const product = { ...sampleProducts[0], handle: `reviewed-${value}`, vendor: alias, tags: [], extended: {} };
      expect(productSitemapBrand(product)).toBe(value);
      expect(homepageFeatureProducts([product])).toEqual([product]);
      expect(homepageBrands([product])).toEqual([]);
      const segments = buildSitemapSegments([product]);
      expect(segments[`products-${value}.xml`]).toEqual([{ url: `https://dollwow.com/products/reviewed-${value}` }]);
      expect(segments["brands.xml"]).toContainEqual({ url: `https://dollwow.com${href}` });
      expect(segments["products-other.xml"]).toBeUndefined();
      expect(buildSitemapSegments([{ ...product, tags: ["dollwow-test"] }])[`products-${value}.xml`]).toBeUndefined();
    }
    expect(buildSitemapSegments([])[`products-${value}.xml`]).toBeUndefined();
  });

  it("keeps unrelated draft brands out of this release", () => {
    for (const value of ["aibei", "evas", "jk", "funwest", "mmx", "firefly", "gynoid", "sino"]) {
      expect(catalogBrands.some(brand => brand.value === value)).toBe(false);
      expect(getBrandAuthorization(value)).toBeNull();
    }
  });

  it("uses the shared registry and profile in navigation, sidebar and brand pages", () => {
    const read = (file: string) => readFileSync(file, "utf8");
    expect(read("components/Header.tsx")).toContain("catalogFilterOptions.brands.map");
    expect(read("components/ProductFilters.tsx")).toContain("options={catalogFilterOptions.brands}");
    const page = read("app/brands/[brand]/page.tsx");
    for (const binding of ["catalogBrands.map", "brandSeoProfile(brand)", "brandRelatedLinks(brand)", "BrandAuthorizationCard brand={brand.value}", "profile.faqs", "profile.buyerNotes"]) {
      expect(page).toContain(binding);
    }
  });
});
