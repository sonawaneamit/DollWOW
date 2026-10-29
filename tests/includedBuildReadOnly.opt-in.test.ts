import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { getProducts } from "@/lib/shopify/storefront";
import { getCustomizationConfig } from "@/lib/customization/configs";
import { getDefaultSelections, resolveCustomization } from "@/lib/customization/resolve";
import { verifiedFixedBuildFacts } from "@/lib/customization/included-build";

describe.skipIf(process.env.DOL314_READ_ONLY_PREFLIGHT !== "1")("bounded current catalog fixed-fact review", () => {
  it("captures product-specific menus across brands without mutating menus or price resolution", async () => {
    const records = [];
    for (const brand of ["FunWest", "Top Fire", "Irontech", "SE Doll", "Dolls Castle"]) {
      const products = await getProducts({ query: `vendor:${JSON.stringify(brand)}`, first: 2, imageFirst: 1, includeCustomizationGroups: true, strict: true, cache: "no-store" });
      for (const product of products) {
        const original = JSON.stringify(product);
        const config = getCustomizationConfig(product);
        const defaults = getDefaultSelections(config);
        const base = Number(product.variants[0]?.price.amount);
        const before = resolveCustomization(config, defaults, base);
        const facts = verifiedFixedBuildFacts(product.extended.customizationGroups ?? [], config.rules);
        expect(JSON.stringify(product)).toBe(original);
        expect(resolveCustomization(getCustomizationConfig(product), defaults, base)).toEqual(before);
        records.push({ brand, product, sourceMenuSHA256: createHash("sha256").update(JSON.stringify(product.extended.customizationGroups ?? [])).digest("hex"), facts, quote: { base, optionPriceDelta: before.optionPriceDelta, totalPrice: before.totalPrice, requiresPriceConfirmation: before.requiresPriceConfirmation } });
      }
    }
    expect(new Set(records.map(record => record.brand)).size).toBeGreaterThanOrEqual(3);
    const directory = "data/exports/dol-314-2026-10-29";
    await mkdir(directory, { recursive: true });
    await writeFile(`${directory}/source-review-private.json`, JSON.stringify({ checkedAt: new Date().toISOString(), records }, null, 2));
    console.info(JSON.stringify({ productCount: records.length, brands: [...new Set(records.map(record => record.brand))], factCounts: records.map(record => ({ brand: record.brand, handle: record.product.handle, facts: record.facts.length })) }));
  }, 120000);
});
