import { describe, expect, it, vi } from "vitest";
import { sampleProducts } from "@/lib/data/sample-products";
import type { Product } from "@/types/product";
import { buildSitemapSegments, escapeSitemapXml, getSitemapSegments, productSitemapBrand, renderSitemap, renderSitemapIndex } from "@/lib/seo/sitemapSegments";
import { GET as childGET } from "@/app/sitemaps/[file]/route";

vi.mock("@/lib/shopify/storefront", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/shopify/storefront")>(),
  getSeoCatalogProducts: vi.fn(async () => [])
}));

function product(overrides: Partial<Product> = {}): Product {
  return { ...sampleProducts[0], handle: "example", vendor: "WM Dolls", tags: [], extended: {}, ...overrides };
}

describe("segmented sitemaps", () => {
  it("groups by canonical brand fields and aliases, not handle prefixes", () => {
    expect(productSitemapBrand(product({ handle: "irontch-typo", vendor: "Irontech Dolls" }))).toBe("irontech");
    expect(productSitemapBrand(product({ vendor: "unknown", tags: ["brand:wm"] }))).toBe("wm");
    expect(productSitemapBrand(product({ vendor: "unknown", extended: { brand: "SE Doll" } }))).toBe("sedoll");
    expect(productSitemapBrand(product({ vendor: "New Unmapped Brand" }))).toBe("other");
  });

  it("deduplicates globally and preserves canonical production hosts", () => {
    const input = product();
    const segments = buildSitemapSegments([input, input]);
    const urls = Object.values(segments).flat().map((entry) => entry.url);
    expect(urls.length).toBe(new Set(urls).size);
    expect(urls.every((url) => new URL(url).origin === "https://dollwow.com")).toBe(true);
    expect(segments["products-wm.xml"]).toHaveLength(1);
    expect(segments["collections.xml"].some((entry) => entry.url.endsWith("/shop/dollvue-enabled"))).toBe(true);
    expect(segments["pages.xml"].some((entry) => entry.url.endsWith("/shop/dollvue-enabled"))).toBe(false);
  });

  it("keeps hidden brands, system charges and tests excluded", () => {
    const segments = buildSitemapSegments([
      product({ tags: ["DOLLWOW-TEST"] }), product({ tags: ["dollwow-system"] }),
      product({ tags: ["custom-option-charge"] }), product({ vendor: "Zelex" }),
      product({ tags: ["zelex"] }), product({ handle: "//evil.test" })
    ]);
    expect(Object.keys(segments).filter((key) => key.startsWith("products-"))).toEqual([]);
  });

  it("never uses stock-check dates or invented refresh dates", () => {
    const segments = buildSitemapSegments([product({ updatedAt: "2026-09-01T12:00:00Z", extended: { stockLastCheckedAt: "2026-10-07" } })]);
    expect(segments["products-wm.xml"][0].lastModified).toBe("2026-09-01T12:00:00.000Z");
    for (const file of ["pages.xml", "brands.xml", "collections.xml"]) {
      expect(segments[file].every((entry) => !entry.lastModified)).toBe(true);
    }
    expect(buildSitemapSegments([product({ updatedAt: "invalid" })])["products-wm.xml"][0].lastModified).toBeUndefined();
    expect(segments["learn.xml"].every((entry) => Boolean(entry.lastModified))).toBe(true);
  });

  it("lists only nonempty children plus the unchanged image sitemap", () => {
    const xml = renderSitemapIndex({ "products-wm.xml": [{ url: "https://dollwow.com/products/example" }], "products-other.xml": [] });
    expect(xml).toContain("<sitemapindex");
    expect(xml).toContain("https://dollwow.com/sitemaps/products-wm.xml");
    expect(xml).toContain("https://dollwow.com/sitemap-images.xml");
    expect(xml).not.toContain("products-other");
  });

  it("escapes XML and guards sitemap limits", () => {
    expect(escapeSitemapXml("<&>\"'")).toBe("&lt;&amp;&gt;&quot;&apos;");
    expect(renderSitemap([{ url: "https://dollwow.com/?a=1&b=2" }])).toContain("a=1&amp;b=2");
    expect(() => renderSitemap(Array.from({ length: 50001 }, () => ({ url: "https://dollwow.com/" })))).toThrow();
  });

  it("loads only the public catalog without sample or preview fallback", async () => {
    const { getSeoCatalogProducts } = await import("@/lib/shopify/storefront");
    await getSitemapSegments();
    expect(getSeoCatalogProducts).toHaveBeenCalledWith({ first: Number.MAX_SAFE_INTEGER, revalidate: 3600, strict: true });
  });

  it("returns XML for populated routes and 404 for unknown or empty routes", async () => {
    for (const file of ["unknown.xml", "products-nonexistent.xml", "__proto__", "products-other.xml"]) {
      expect((await childGET(new Request("https://preview.test"), { params: Promise.resolve({ file }) })).status).toBe(404);
    }
    const response = await childGET(new Request("https://preview.test"), { params: Promise.resolve({ file: "pages.xml" }) });
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/xml");
    expect(await response.text()).not.toContain("preview.test");
  });
});
