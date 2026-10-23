import { describe, expect, it } from "vitest";
import { buildArticleStructuredData, getLearnAuthors, getLearningArticles, learnAuthorUrl } from "@/lib/learn/content";
import scheduledAuthors from "@/tests/fixtures/learn-author-assignments-october-2026.json";

const auditTime = Date.parse("2026-10-22T23:54:00Z");
const productTopicOverrides = ["sex-doll-reviews", "tpe-vs-silicone-sex-dolls", "used-sex-dolls"];
const migrated = ["irontech-head-types-ros-max", "se-doll-lstpe-lightweight-upgrade", "se-doll-vs-starpery-build-comparison", "warehouse-stock-vs-custom-made", "factory-photo-review-worked-example", "doll-clothing-measurements-fit"];

describe("approved existing guide authors", () => {
  it("covers all 42 remaining scheduled owners with matching existing Person profiles", () => {
    const profiles = getLearnAuthors();
    const future = getLearningArticles(Date.parse("2030-01-01T00:00:00Z"))
      .filter(article => !getLearningArticles(auditTime).some(current => current.slug === article.slug));
    expect(future.map(article => article.slug).sort()).toEqual(Object.keys(scheduledAuthors).filter(slug => !productTopicOverrides.includes(slug)).sort());
    expect(future).toHaveLength(42);
    expect(future.filter(article => article.author === "alex")).toHaveLength(36);
    expect(future.filter(article => article.author === "jesse")).toHaveLength(6);
    for (const article of future) {
      expect(article.author, article.slug).toBe(scheduledAuthors[article.slug as keyof typeof scheduledAuthors]);
      const profile = profiles[article.author];
      expect(article.authorDisplayName).toBe(profile.displayName);
      expect(article.authorTitle).toBe(profile.title);
      expect(article.status).toBe("scheduled");
      expect(article.lastReviewed).toBe("2026-10-16");
      expect(buildArticleStructuredData(article).author).toMatchObject({
        "@type": "Person", name: profile.displayName, jobTitle: profile.title,
        url: learnAuthorUrl(article.author)
      });
    }
  });

  it("uses only Alex and Jesse with their existing profiles for the audited visible guides", () => {
    const profiles = getLearnAuthors();
    const articles = getLearningArticles(auditTime);
    expect(articles.length).toBe(56);
    expect(articles.filter(article => article.author === "alex")).toHaveLength(48);
    expect(articles.filter(article => article.author === "jesse")).toHaveLength(8);
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

  it("applies Martin's three product-topic overrides without claiming a new review", () => {
    const articles = getLearningArticles(auditTime);
    for (const slug of productTopicOverrides) {
      const article = articles.find(article => article.slug === slug)!;
      expect(scheduledAuthors[slug as keyof typeof scheduledAuthors]).toBe("alex");
      expect(article.author, slug).toBe("alex");
      expect(article.status).toBe("production");
      expect(article.lastReviewed).toBe(slug === "tpe-vs-silicone-sex-dolls" ? "2026-08-11" : "2026-08-12");
    }
    expect(articles.find(article => article.slug === "used-sex-dolls")?.reviewOwner)
      .toBe("Jesse, Licensed Sexologist and DollWow Intimacy Education Editor");
  });

  it("assigns the six approved topic-fit previews to Alex without changing schedules", () => {
    const articles = getLearningArticles(auditTime);
    for (const slug of migrated) {
      const article = articles.find(item => item.slug === slug)!;
      expect(article.author).toBe("alex");
      expect(article.status).toBe("scheduled");
      expect(article.lastReviewed).toBe(slug === "irontech-head-types-ros-max" ? "2026-10-23" : "2026-10-16");
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
