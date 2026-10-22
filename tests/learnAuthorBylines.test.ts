import { describe, expect, it } from "vitest";
import { buildArticleStructuredData, getLearnAuthors, getLearningArticles, learnAuthorUrl } from "@/lib/learn/content";

const auditTime = Date.parse("2026-10-22T23:54:00Z");
const migrated = ["irontech-head-types-ros-max", "se-doll-lstpe-lightweight-upgrade", "se-doll-vs-starpery-build-comparison", "warehouse-stock-vs-custom-made", "factory-photo-review-worked-example", "doll-clothing-measurements-fit"];

describe("approved existing guide authors", () => {
  it("uses only Alex and Jesse with their existing profiles for the audited visible guides", () => {
    const profiles = getLearnAuthors();
    const articles = getLearningArticles(auditTime);
    expect(articles.length).toBe(56);
    for (const article of articles) {
      expect(["alex", "jesse"]).toContain(article.author);
      const author = profiles[article.author];
      expect(article.authorDisplayName).toBe(author.displayName);
      expect(article.authorTitle).toBe(author.title);
      expect(buildArticleStructuredData(article).author).toMatchObject({
        "@type": "Person", name: author.displayName, jobTitle: author.title,
        url: learnAuthorUrl(article.author)
      });
    }
  });

  it("assigns the six approved topic-fit previews to Alex without changing schedules", () => {
    const articles = getLearningArticles(auditTime);
    for (const slug of migrated) {
      const article = articles.find(item => item.slug === slug)!;
      expect(article.author).toBe("alex");
      expect(article.status).toBe("scheduled");
      expect(article.lastReviewed).toBe("2026-10-16");
      expect(Date.parse(article.publishedAt!)).toBeLessThan(auditTime);
    }
  });

  it("retains approved credentials and the honest catalog-avatar disclosure", () => {
    const authors = getLearnAuthors();
    expect(Object.keys(authors).sort()).toEqual(["alex", "jesse"]);
    expect(authors.jesse.title).toBe("Licensed Sexologist and DollWow Intimacy Education Editor");
    expect(authors.alex.title).toBe("Doll Collector and DollWow Product Educator with 20+ Years of Experience");
    for (const author of Object.values(authors)) {
      expect(author.privacyNote).toContain("catalog-doll editorial avatar");
      expect(author.imageAlt).toContain("Editorial avatar");
    }
  });
});
