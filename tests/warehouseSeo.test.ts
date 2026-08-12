import { describe, expect, it } from "vitest";
import { buildWarehouseMetadata, buildWarehouseStructuredData, warehouseFaqItems, warehouseIntro } from "@/lib/catalog/warehouseSeo";
import { sampleProducts } from "@/lib/data/sample-products";

describe("warehouse SEO", () => {
  it("keeps the regional inventory page indexable at its canonical URL", () => {
    const metadata = buildWarehouseMetadata();
    expect(metadata.alternates).toEqual({ canonical: expect.stringMatching(/\/warehouse$/) });
    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(metadata.title).toContain("US Warehouse");
  });

  it("keeps filtered warehouse views out of the index", () => {
    expect(buildWarehouseMetadata({ region: "United States" }).robots).toEqual({ index: false, follow: true });
    expect(buildWarehouseMetadata({ page: "2" }).robots).toEqual({ index: false, follow: true });
  });

  it("publishes collection, breadcrumb, and FAQ data from current products", () => {
    const structuredData = buildWarehouseStructuredData(sampleProducts);
    const collectionPage = structuredData[0] as { mainEntity: { numberOfItems: number } };
    const faqPage = structuredData[2] as { mainEntity: unknown[] };
    expect(structuredData.map((entry) => entry["@type"])).toEqual(["CollectionPage", "BreadcrumbList", "FAQPage"]);
    expect(collectionPage.mainEntity.numberOfItems).toBe(sampleProducts.length);
    expect(faqPage.mainEntity).toHaveLength(warehouseFaqItems.length);
  });

  it("does not turn warehouse location into an arrival promise", () => {
    expect(warehouseIntro).toContain("does not guarantee an arrival date");
  });
});
