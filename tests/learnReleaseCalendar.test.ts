import { describe, expect, it } from "vitest";
import calendar from "@/tests/fixtures/learn-release-october-2026.json";
import { getLearningArticle, getLearningArticles, buildArticleStructuredData } from "@/lib/learn/content";

describe("approved October Learning Center release calendar", () => {
  const slugs = new Set(calendar.map(row => row.slug));
  const visible = (now: number) => getLearningArticles(now).filter(row => slugs.has(row.slug));

  it("has 48 unique release slots, four per Lisbon calendar week", () => {
    expect(calendar).toHaveLength(48);
    expect(slugs.size).toBe(48);
    expect(new Set(calendar.map(row => row.publishedAt)).size).toBe(48);
    for (let week = 1; week <= 12; week += 1) expect(calendar.filter(row => row.week === week)).toHaveLength(4);
  });

  it("exposes no batch articles before the first release and exactly one at its boundary", () => {
    const first = Date.parse(calendar[0].publishedAt);
    expect(visible(first - 1)).toHaveLength(0);
    expect(visible(first).map(row => row.slug)).toEqual([calendar[0].slug]);
  });

  it("checks the actual source file, image, author and visibility boundary of every scheduled article", () => {
    const approvedAlexBylines = new Set(["irontech-head-types-ros-max", "se-doll-lstpe-lightweight-upgrade", "se-doll-vs-starpery-build-comparison", "warehouse-stock-vs-custom-made", "factory-photo-review-worked-example", "doll-clothing-measurements-fit"]);
    for (const row of calendar) {
      const at = Date.parse(row.publishedAt);
      expect(getLearningArticle(row.slug, at - 1), row.slug).toBeNull();
      const article = getLearningArticle(row.slug, at);
      expect(article?.status, row.slug).toBe("scheduled");
      expect(article?.publishedAt, row.slug).toBe(row.publishedAt);
      expect(article?.author, row.slug).toBe(approvedAlexBylines.has(row.slug) ? "alex" : "editorial");
      expect(article?.featuredImage, row.slug).toBe(`/images/learn/${row.slug}.webp`);
      expect(article?.featuredImageAlt.length, row.slug).toBeGreaterThan(20);
      expect(buildArticleStructuredData(article!).datePublished, row.slug).toBe(row.publishedAt);
    }
    expect(visible(Date.parse(calendar.at(-1)!.publishedAt))).toHaveLength(48);
  });

  it("uses local ten o'clock consistently across the Lisbon DST transition", () => {
    for (const row of calendar.filter(row => row.week > 1)) {
      const time = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Lisbon", hour: "2-digit", minute: "2-digit" }).format(new Date(row.publishedAt));
      expect(time, row.slug).toBe("10:00");
    }
  });
});
