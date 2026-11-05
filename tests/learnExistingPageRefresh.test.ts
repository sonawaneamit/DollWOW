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
    expect(body).toContain("We haven't tested every doll side by side");
    expect(body).toContain("What to ask for");
    expect(body).toContain("/shop/realistic-sex-dolls");
    expect(body).toContain("an unspecified figure is not a verified complete-doll weight");
  });

  it("keeps custom guidance distinct from current shopping availability", () => {
    const body = getLearningArticle("custom-sex-dolls")!.body;
    expect(body).toContain("A Build Record You Can Actually Check");
    expect(body).toContain("Options vary by doll");
    expect(body).toContain("/shop/custom");
    expect(body).toContain("for the current options");
  });

  it("does not present an untested competitor superiority table as evidence", () => {
    const body = getLearningArticle("sexdolltech-alternatives")!.body;
    expect(body).toContain("not a hands-on SexDollTech review");
    expect(body).toContain("What to check on both listings");
    expect(body).toContain("An unanswered question means you need more information");
    expect(body).not.toContain("DollWow Advantage");
    expect(body).toContain("Human Build Check");
    expect(body).toContain("/care-for-life");
    expect(body).toContain("/best-price-guarantee");
    expect(body).toContain("They aren't claims about what another store does or doesn't offer");
  });

  it("does not turn a manufacturer's accessory list into a hair specification", () => {
    const article = getLearningArticle("implanted-hair-vs-wig")!;
    expect(article.body).toContain("the accessory list doesn't give those details");
    expect(article.body).toContain("Don't guess a styling temperature");
    expect(buildArticleStructuredData(article).citation).toContain("https://www.irontechdoll.com/help-faq/");
    expect(fs.existsSync(`public${article.featuredImage}`)).toBe(true);
  });
});
