import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, expect, it, vi } from "vitest";
import { parse } from "node-html-parser";
import owners from "@/tests/fixtures/learn-author-assignments-october-2026.json";
import { getLearnAuthors, getLearningArticle, learnAuthorUrl } from "@/lib/learn/content";
import LearnArticlePage, { generateMetadata } from "@/app/learn/[slug]/page";

vi.mock("@/lib/shopify/storefront", () => ({
  getProducts: vi.fn().mockResolvedValue([]),
  getProductsByHandles: vi.fn().mockResolvedValue([])
}));

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

it("renders every scheduled attribution at its release boundary without changing the public clock", async () => {
  vi.useFakeTimers();
  vi.stubGlobal("React", React);
  const profiles = getLearnAuthors();
  const scheduled = Object.entries(owners).filter(([slug]) =>
    getLearningArticle(slug, Date.parse("2030-01-01T00:00:00Z"))?.status === "scheduled");
  expect(scheduled).toHaveLength(42);
  for (const [slug, key] of scheduled) {
    const article = getLearningArticle(slug, Date.parse("2030-01-01T00:00:00Z"))!;
    const params = Promise.resolve({ slug });
    const boundary = Date.parse(article.publishedAt!);
    vi.setSystemTime(boundary - 1);
    expect(await generateMetadata({ params }), slug).toEqual({});
    await expect(LearnArticlePage({ params })).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
    vi.setSystemTime(boundary);
    const dom = parse(renderToStaticMarkup(await LearnArticlePage({ params })));
    const profile = profiles[key];
    const byline = dom.querySelectorAll("p").find(node => /^By\s/.test(node.text.trim()));
    expect(byline?.text, slug).toContain(`By ${profile.displayName}`);
    expect(byline?.text, slug).toContain(profile.title);
    expect(byline?.querySelector("a")?.getAttribute("href"), slug).toBe(profile.profilePath);
    const schema = dom.querySelectorAll('script[type="application/ld+json"]')
      .map(node => JSON.parse(node.text)).find(node => node["@type"] === "Article");
    expect(schema.author, slug).toMatchObject({
      "@type": "Person", name: profile.displayName, jobTitle: profile.title, url: learnAuthorUrl(key)
    });
    expect(schema.datePublished, slug).toBe(article.publishedAt);
  }
});
