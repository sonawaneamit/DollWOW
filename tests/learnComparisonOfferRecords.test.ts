import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { parse } from "node-html-parser";
import { getLearningArticle, learnArticleUrl } from "@/lib/learn/content";
import LearnArticlePage, { generateMetadata } from "@/app/learn/[slug]/page";

vi.mock("@/lib/shopify/storefront", () => ({
  getProducts: vi.fn().mockResolvedValue([]),
  getProductsByHandles: vi.fn().mockResolvedValue([])
}));

const cases = [
  { slug: "se-doll-vs-starpery-build-comparison", date: "2026-10-19T09:00:00.000Z",
    facts: ["$1,899", "$2,199", "head 129", "not newly measured dimensions"] },
  { slug: "irontech-vs-wm-build-comparison", date: "2026-11-11T10:00:00.000Z",
    facts: ["166 cm 2.0 E-cup body, S44 ROS MAX head", "165 cm D-cup body, head 216", "$3,199", "$2,300", "body only", "Neither record establishes that this WM build uses S-TPE"] },
  { slug: "md-vs-ido-doll-build-comparison", date: "2026-12-21T10:00:00.000Z",
    facts: ["M37, 166 cm F-cup", "ID8H, 167 cm F-cup", "$1,399", "$2,599", "15 October", "not the Tatiana-1", "not fresh warehouse confirmations", "WanZhi's listing just says"] },
  { slug: "funwest-vs-dolls-castle-build-comparison", date: "2026-12-28T10:00:00.000Z",
    facts: ["Bea's base price was still $1,349", "Nyla's $1,999", "head 006", "not weighing equivalent finished dolls", "hip-measurement discrepancy"] }
];

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe("four existing comparison owners", () => {
  it.each(cases)("preserves ownership, release and qualified offer facts for $slug", ({ slug, date, facts }) => {
    const article = getLearningArticle(slug, Date.parse(date))!;
    expect(article.publishedAt).toBe(date);
    expect(article.status).toBe("scheduled");
    expect(article.lastReviewed).toBe("2026-10-16");
    expect(article.body).toContain("23 October 2026");
    for (const fact of facts) expect(article.body, fact).toContain(fact);
    expect(article.body).not.toMatch(/NEEDS MARTIN|SERP|GSC|DataForSEO/);
    expect(article.body).not.toMatch(/\bundefined\b|basis not specified|basis unspecified|decision-critical|Do not\b/);
    expect(article.body).toContain('| Listed weight |');
    const headings = article.body.split("\n").filter(line => line.startsWith("## "));
    expect(new Set(headings).size).toBe(headings.length);
  });

  it.each(cases)("renders complete source HTML/schema only at the preserved release boundary for $slug", async ({ slug, date, facts }) => {
    vi.useFakeTimers();
    vi.stubGlobal("React", React);
    const at = Date.parse(date), params = Promise.resolve({ slug });
    vi.setSystemTime(at - 1);
    expect(await generateMetadata({ params })).toEqual({});
    await expect(LearnArticlePage({ params })).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
    vi.setSystemTime(at);
    const dom = parse(renderToStaticMarkup(await LearnArticlePage({ params })));
    const schema = dom.querySelectorAll('script[type="application/ld+json"]')
      .map(node => JSON.parse(node.text)).find(node => node["@type"] === "Article");
    expect(schema.datePublished).toBe(date);
    expect(schema.mainEntityOfPage).toBe(learnArticleUrl(slug));
    for (const fact of facts) expect(dom.text, fact).toContain(fact);
    expect(dom.querySelectorAll("table").length).toBeGreaterThan(0);
  });
});
