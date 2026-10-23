import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { buildArticleFaqStructuredData, buildArticleStructuredData, getLearningArticle } from "@/lib/learn/content";

const pages = [
  ["most-realistic-sex-dolls", "2026-08-11", 10],
  ["custom-sex-dolls", "2026-08-12", 12],
  ["sexdolltech-alternatives", "2026-08-12", 10],
  ["implanted-hair-vs-wig", "2026-08-11", 12]
] as const;

describe("existing guide evidence and intent boundaries", () => {
  for (const [slug, reviewed, faqCount] of pages) {
    it(`preserves publication and visible FAQ ownership for ${slug}`, () => {
      const article = getLearningArticle(slug)!;
      expect(article).not.toBeNull();
      expect(article.status).toBe("production");
      expect(article.author).toBe("alex");
      expect(article.lastReviewed).toBe(reviewed);
      expect(article.publishedAt).toBeUndefined();
      expect(new URL(buildArticleStructuredData(article).url).pathname).toBe(`/learn/${slug}`);
      expect(buildArticleFaqStructuredData(article)?.mainEntity).toHaveLength(faqCount);
      expect(article.body).not.toMatch(/listed dry weight|Exact dry weight|PDP|SERP|keyword cluster|crawlable/);
    });
  }

  it("uses an evidence worksheet instead of an invented realism winner", () => {
    const body = getLearningArticle("most-realistic-sex-dolls")!.body;
    expect(body).toContain("we have not tested every doll under identical lighting");
    expect(body).toContain("Evidence to request");
    expect(body).toContain("/shop/realistic-sex-dolls");
    expect(body).toContain("an unspecified figure is not a verified complete-doll weight");
  });

  it("keeps custom guidance distinct from current shopping availability", () => {
    const body = getLearningArticle("custom-sex-dolls")!.body;
    expect(body).toContain("A Build Record You Can Actually Check");
    expect(body).toContain("not features available on every doll");
    expect(body).toContain("/shop/custom");
    expect(body).toContain("this guide is the configuration checklist, not an availability promise");
  });

  it("does not present an untested competitor superiority table as evidence", () => {
    const body = getLearningArticle("sexdolltech-alternatives")!.body;
    expect(body).toContain("not a hands-on SexDollTech review or a verified current price comparison");
    expect(body).toContain("Evidence needed from each offer");
    expect(body).toContain("An unanswered field is not proof of poor quality");
    expect(body).not.toContain("DollWow Advantage");
  });

  it("does not turn a manufacturer's accessory list into a hair specification", () => {
    const article = getLearningArticle("implanted-hair-vs-wig")!;
    expect(article.body).toContain("does not identify the exact wig, fiber, or permitted heat treatment");
    expect(article.body).toContain("do not choose a temperature by guesswork");
    expect(buildArticleStructuredData(article).citation).toContain("https://www.irontechdoll.com/help-faq/");
    expect(fs.existsSync(`public${article.featuredImage}`)).toBe(true);
  });
});
