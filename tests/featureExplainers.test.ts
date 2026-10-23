import { describe, expect, it } from "vitest";
import { buildArticleFaqStructuredData, buildArticleStructuredData, getLearningArticle } from "@/lib/learn/content";

describe("manufacturer-specific feature explainers", () => {
  it("uses the existing ROS owner with a three-sentence direct answer and visible FAQ schema", () => {
    const article = getLearningArticle("irontech-head-types-ros-max", Date.parse("2026-10-23T00:00:00Z"))!;
    const opening = article.body.split("\n\n")[0];
    expect(opening).toContain("head designs");
    expect(opening).not.toContain("blinking");
    expect(opening.match(/[.!?](?:\s|$)/g)?.length).toBe(3);
    expect(article.body).not.toContain("mismatch between its written compatibility list");
    expect(article.body).not.toContain("fit matrix");
    expect(article.body).toContain("Every Irontech head fits every Irontech body.");
    expect(article.body).not.toContain("| Label you encounter |");
    expect(article.body).not.toMatch(/colour|Do not treat|Factory guidance|Factory configuration|without paying for assumptions/);
    const [body, faqs] = article.body.split("## FAQs");
    expect(body.match(/doesn't include blinking or dynamic eye movement/g)).toHaveLength(1);
    expect(faqs.match(/doesn't include blinking or dynamic eye movement/g)).toHaveLength(1);
    expect(article.lastReviewed).toBe("2026-10-23");
    expect(Date.parse(article.lastReviewed!)).toBeGreaterThanOrEqual(Date.parse(article.publishedAt!));
    expect(article.author).toBe("alex");
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
    expect(article.body).toContain("Irontech EVO: What It Changes");
    expect(article.body).toContain("A published joint angle isn't a goal to push toward");
    expect(article.body).toContain("Hands and toes are separate choices");
    expect(article.body).toContain("Don't assume an EVO body includes either upgrade");
    expect(article.lastReviewed).toBe("2026-10-23");
    expect(article.body).toContain("Care for Life and Lifetime Repair Concierge");
    expect(article.author).toBe("alex");
    expect(buildArticleStructuredData(article).citation).toContain("https://www.irontechdoll.com/sex-doll-skeleton-evo-body-hand-toe-skeleton/");
    expect(article.body).toContain("/learn/sex-doll-storage");
    expect(buildArticleFaqStructuredData(article)?.mainEntity.length).toBeGreaterThan(5);
  });
});
