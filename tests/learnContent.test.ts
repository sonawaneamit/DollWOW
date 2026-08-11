import { describe, expect, it } from "vitest";
import { buildArticleFaqStructuredData, getLearningArticle } from "@/lib/learn/content";

describe("Learning Center content ownership", () => {
  it("keeps the best TPE guide distinct from the broad best-dolls guide", () => {
    const tpeGuide = getLearningArticle("best-tpe-sex-dolls");
    const broadGuide = getLearningArticle("best-sex-dolls");

    expect(tpeGuide?.primaryKeyword).toBe("best TPE sex dolls");
    expect(tpeGuide?.body).toContain("Six Current TPE Starting Points");
    expect(broadGuide?.secondaryKeywords).not.toContain("best TPE sex doll");
  });

  it("publishes a complete FAQ schema for the best TPE guide", () => {
    const article = getLearningArticle("best-tpe-sex-dolls");
    expect(article).not.toBeNull();
    const faq = buildArticleFaqStructuredData(article!);
    expect(faq?.mainEntity).toHaveLength(10);
  });

  it("does not leak internal production language into the public guide", () => {
    const article = getLearningArticle("best-tpe-sex-dolls");
    expect(article?.body).not.toMatch(/PDP|SERP|search volume|crawlable/i);
  });
});
