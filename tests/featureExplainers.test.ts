import { describe, expect, it } from "vitest";
import { buildArticleFaqStructuredData, buildArticleStructuredData, getLearningArticle } from "@/lib/learn/content";

describe("manufacturer-specific feature explainers", () => {
  it("uses the existing ROS owner with a three-sentence direct answer and visible FAQ schema", () => {
    const article = getLearningArticle("irontech-head-types-ros-max", Date.parse("2026-10-23T00:00:00Z"))!;
    const opening = article.body.split("\n\n")[0];
    expect(opening).toContain("head constructions");
    expect(opening).toContain("excludes dynamic eye movement");
    expect(opening.match(/[.!?](?:\s|$)/g)?.length).toBe(3);
    expect(article.body).toContain("mismatch between its written compatibility list and pictured head labels");
    expect(article.body).toContain("not a complete head-to-body fit matrix");
    expect(buildArticleStructuredData(article).citation).toContain("https://www.irontechdoll.com/ros-silicone-head/");
    const faq = buildArticleFaqStructuredData(article)!;
    expect(faq.mainEntity).toHaveLength(3);
    for (const item of faq.mainEntity) {
      expect(article.body).toContain(item.name);
      expect(item.acceptedAnswer.text.length).toBeGreaterThan(20);
    }
  });

  it("scopes the EVO example to Irontech and preserves model-support limits", () => {
    const article = getLearningArticle("sex-doll-skeleton-options")!;
    expect(article.body).toContain("Irontech EVO: A Manufacturer-Specific Example");
    expect(article.body).toContain("not a target to force on a finished doll");
    expect(article.body).toContain("not an exact ordering matrix");
    expect(article.body).toContain("EVO alone does not prove those separate parts are included or compatible");
    expect(buildArticleStructuredData(article).citation).toContain("https://www.irontechdoll.com/sex-doll-skeleton-evo-body-hand-toe-skeleton/");
    expect(article.body).toContain("/learn/sex-doll-storage");
    expect(buildArticleFaqStructuredData(article)?.mainEntity.length).toBeGreaterThan(5);
  });
});
