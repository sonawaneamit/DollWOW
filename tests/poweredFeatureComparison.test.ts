import { describe, expect, it } from "vitest";
import { comparisonFaqs, comparisonFaqSchema, comparisonPreviewEnabled, comparisonSources, featureComparisons } from "../lib/learn/poweredFeatureComparison";

describe("DOL-288 comparison preview", () => {
  it("fails closed outside an explicitly enabled development/preview environment", () => {
    expect(comparisonPreviewEnabled("production", "1")).toBe(false);
    expect(comparisonPreviewEnabled(undefined, "1")).toBe(false);
    expect(comparisonPreviewEnabled("preview", undefined)).toBe(false);
    expect(comparisonPreviewEnabled("preview", "1")).toBe(true);
    expect(comparisonPreviewEnabled("development", "1")).toBe(true);
  });
  it("keeps all twelve reported brands distinct", () => {
    expect(featureComparisons).toHaveLength(12);
    expect(new Set(featureComparisons.map(row => row.brand)).size).toBe(12);
    expect(featureComparisons.some(row => row.brand === "Lusandy")).toBe(false);
    expect(featureComparisons.some(row => row.brand === "Yuedoll")).toBe(false);
  });
  it("does not turn research leads into manufacturer-confirmed facts", () => {
    for (const row of featureComparisons) {
      if (row.evidence === "Manufacturer documentation") expect(row.sources.length).toBeGreaterThan(0);
      for (const source of row.sources) expect(comparisonSources.some(s => s.id === source)).toBe(true);
    }
    expect(featureComparisons.find(row => row.brand === "Irontech")?.check).toContain("different body exclusions");
    expect(featureComparisons.find(row => row.brand === "Top Fire")?.check).toContain("conflict");
  });
  it("generates FAQ schema from exactly the visible question/answer data", () => {
    const schema = comparisonFaqSchema();
    expect(schema.mainEntity).toHaveLength(comparisonFaqs.length);
    schema.mainEntity.forEach((entry, i) => {
      expect(entry.name).toBe(comparisonFaqs[i].question);
      expect(entry.acceptedAnswer.text).toBe(comparisonFaqs[i].answer);
    });
  });
});
