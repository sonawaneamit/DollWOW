import { describe, expect, it } from "vitest";
import { buildDollVueCollectionInformation, dollVueCollectionFaqs } from "@/lib/catalog/dollVueCollectionSeo";

describe("DollVue collection neutral information", () => {
  it("keeps page identity without adding product-list or readiness claims", () => {
    const entries = buildDollVueCollectionInformation();
    expect(entries.map(entry => entry["@type"])).toEqual(["CollectionPage", "BreadcrumbList", "FAQPage"]);
    expect(entries[0].url).toMatch(/\/shop\/dollvue-enabled$/);
    expect(JSON.stringify(entries)).not.toMatch(/verified ready|1602|reviewed registry|\/products\//i);
  });
  it("uses the same limitations for visible FAQ and schema", () => {
    const faq = buildDollVueCollectionInformation().find(entry => entry["@type"] === "FAQPage");
    expect(faq?.mainEntity).toEqual(dollVueCollectionFaqs.map(item => ({
      "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer }
    })));
    expect(JSON.stringify(dollVueCollectionFaqs)).toContain("one or two supported");
    expect(JSON.stringify(dollVueCollectionFaqs)).toContain("approximate visual preview");
  });
});
