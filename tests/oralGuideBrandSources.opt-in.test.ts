import { describe, expect, it } from "vitest";
import { mkdir, writeFile } from "node:fs/promises";
import { getProducts } from "@/lib/shopify/storefront";
import { getCatalogBrand } from "@/lib/catalog/brands";
import { getCustomizationConfig } from "@/lib/customization/configs";

describe.skipIf(process.env.DOL288_BRAND_SOURCES !== "1")("bounded oral-guide brand source sampling", () => {
  it("reads at most six public records per registered brand without changing products", async () => {
    const samples = [];
    for (const value of ["wm", "sy", "md", "jarliet", "angelkiss", "yl", "top-fire", "sedoll"]) {
      const brand = getCatalogBrand(value)!;
      expect(brand).toBeTruthy();
      const query = `(${brand.tags.map(tag => `tag:${tag}`).join(" OR ")})`;
      const products = await getProducts({ query, first: 6, includeCustomizationGroups: true, imageFirst: 1, strict: true, cache: "no-store" });
      samples.push({ brand: value, query, sampled: products.length, records: products.map(product => ({ product, config: getCustomizationConfig(product) })) });
    }
    const directory = "data/exports/dol-288-redo-2026-10-29";
    await mkdir(directory, { recursive: true });
    await writeFile(`${directory}/brand-samples-private.json`, JSON.stringify({ checkedAt: new Date().toISOString(), scope: "At most six public products per exact registered brand; not exhaustive and not proof of absence or current warehouse stock", samples }, null, 2));
  }, 120000);
});

describe.skipIf(process.env.DOL288_CUSTOM_SOURCES !== "1")("non-warehouse oral-guide candidates", () => {
  it("targets custom WM and MD records instead of treating warehouse menus as installed features", async () => {
    const samples = [];
    for (const value of ["wm", "md"]) {
      const brand = getCatalogBrand(value)!;
      const query = `(${brand.tags.map(tag => `tag:${tag}`).join(" OR ")}) AND -tag:ready_to_ship AND -tag:in-stock`;
      const products = await getProducts({ query, first: 6, includeCustomizationGroups: true, imageFirst: 1, strict: true, cache: "no-store" });
      samples.push({ brand: value, query, sampled: products.length, records: products.map(product => ({ product, config: getCustomizationConfig(product) })) });
    }
    await mkdir("data/exports/dol-288-redo-2026-10-29", { recursive: true });
    await writeFile("data/exports/dol-288-redo-2026-10-29/custom-brand-samples-private.json", JSON.stringify({ checkedAt: new Date().toISOString(), scope: "Two refined non-warehouse queries, six candidates each; not exhaustive or physical factory-fit verification", samples }, null, 2));
    expect(samples).toHaveLength(2);
  }, 60000);
});
