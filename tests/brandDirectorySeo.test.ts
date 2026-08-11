import { describe, expect, it } from "vitest";
import { catalogBrands } from "@/lib/catalog/brands";
import {
  brandDirectoryFaqs,
  brandDirectoryIntro,
  buildBrandDirectoryStructuredData
} from "@/lib/catalog/brandDirectorySeo";

describe("brand directory SEO", () => {
  it("provides a useful comparison answer without declaring a universal winner", () => {
    expect(brandDirectoryIntro).toContain("There is no single best brand for everyone");
    expect(brandDirectoryFaqs).toHaveLength(6);
    expect(brandDirectoryFaqs[0].answer).toContain("There is no universal best brand");
  });

  it("publishes every visible brand once in the directory schema", () => {
    const itemList = buildBrandDirectoryStructuredData(catalogBrands)[1];
    const entries = itemList.itemListElement as Array<{ url: string }>;
    expect(entries).toHaveLength(catalogBrands.length);
    expect(new Set(entries.map((item) => item.url)).size).toBe(catalogBrands.length);
  });

  it("keeps the approved missing-product service path customer facing", () => {
    const missingProductAnswer = brandDirectoryFaqs.find((item) => item.question.includes("particular brand"));
    expect(missingProductAnswer?.answer).toContain("live chat or hello@dollwow.com");
    expect(missingProductAnswer?.answer).not.toMatch(/PDP|SERP|crawlable|search volume/i);
  });
});
