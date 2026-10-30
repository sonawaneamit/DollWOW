import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CatalogSelectionSummary, batchCSelectionSummaryEnabled } from "@/components/CatalogSelectionSummary";
import { sampleProducts } from "@/lib/data/sample-products";

afterEach(() => vi.unstubAllEnvs());
const product = (amount: string, currencyCode = "USD") => ({ ...sampleProducts[0], priceRange: { ...sampleProducts[0].priceRange, minVariantPrice: { amount, currencyCode } } });
const render = (products: ReturnType<typeof product>[]) => renderToStaticMarkup(<CatalogSelectionSummary products={products} />);

describe("scoped private catalog selection summary", () => {
  it("reports current page starting prices without a landed or whole-catalog promise", () => {
    const html = render([product("1999"), product("850.50")]);
    expect(html).toContain("Starting prices on this page: $850.50 to $1,999.00 USD");
    expect(html).toContain("Shipping, taxes, and any custom options are confirmed at checkout.");
    expect(html).toContain('href="/shipping"');
    expect(html).not.toMatch(/free shipping|all taxes included|in stock|lowest price/i);
  });
  it.each(["", " ", "NaN", "Infinity", "-1", "0"])("does not turn invalid price %j into a free or guessed quote", amount => {
    expect(render([product("1999"), product(amount)])).toBe("");
  });
  it("omits mixed currencies and empty data rather than a misleading range", () => {
    expect(render([product("1999"), product("850", "EUR")])).toBe("");
    expect(render([])).toBe("");
  });
  it("uses one price when all visible cards have the same starting price", () => {
    expect(render([product("1999"), product("1999")])).toContain("$1,999.00 USD");
    expect(render([product("1999")])).not.toContain(" to ");
  });
  it("requires an exact private flag, preview environment and one of four scoped paths", () => {
    vi.stubEnv("DOL229_BUYER_SUMMARY", "1");
    for (const environment of ["production", "development", ""]) {
      vi.stubEnv("VERCEL_ENV", environment);
      expect(batchCSelectionSummaryEnabled("/brands/erovenus-dolls")).toBe(false);
    }
    vi.stubEnv("VERCEL_ENV", "preview");
    for (const path of ["/brands/erovenus-dolls", "/brands/climax-dolls", "/shop/curvy-dolls", "/shop/brunette-dolls"]) expect(batchCSelectionSummaryEnabled(path)).toBe(true);
    for (const path of ["/brands/ido-dolls", "/brands/md-dolls", "/brands/top-fire-dolls", "/brands/moonvale-dolls", "/shop/anime-dolls"]) expect(batchCSelectionSummaryEnabled(path)).toBe(false);
    vi.stubEnv("DOL229_BUYER_SUMMARY", "0");
    expect(batchCSelectionSummaryEnabled("/brands/erovenus-dolls")).toBe(false);
  });
});
