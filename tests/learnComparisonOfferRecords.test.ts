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
    facts: ["$1,899", "$2,199", "Keep the original head", "35 kg / 77.2 lb", "52.5 kg / 115.7 lb"] },
  { slug: "irontech-vs-wm-build-comparison", date: "2026-11-11T10:00:00.000Z",
    facts: ["166 cm 2.0 E-cup body, S44 ROS MAX head", "165 cm D-cup body, head 216", "$3,199", "$2,300", "37.5 kg body only", "23 kg", "rather than assuming ROS MAX and S-TPE are equivalent options", "not to pull the eyelids"] },
  { slug: "md-vs-ido-doll-build-comparison", date: "2026-12-21T10:00:00.000Z",
    facts: ["M37, 166 cm F-cup", "ID8H, 167 cm F-cup", "$1,399", "$2,599", "not the Tatiana-1", "Bonnie's body weighs 41 kg", "packed weight is 53 kg", "39 kg", "availability before planning around a dispatch date"] },
  { slug: "funwest-vs-dolls-castle-build-comparison", date: "2026-12-28T10:00:00.000Z",
    facts: ["Bea starts at $1,349", "Nyla at $1,999", "head 006", "37.2 kg / 82 lb", "5.3 kg", "42.5 kg", "97 cm and 97.5 cm", "hip-measurement discrepancy"] }
];

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe("four existing comparison owners", () => {
  it.each(cases)("preserves ownership, release and qualified offer facts for $slug", ({ slug, date, facts }) => {
    const article = getLearningArticle(slug, Date.parse(date))!;
    expect(article.publishedAt).toBe(date);
    expect(article.status).toBe("scheduled");
    expect(article.lastReviewed).toBe(slug === "se-doll-vs-starpery-build-comparison" ? "2026-10-23" : "2026-10-16");
    expect(article.hideReviewDate).toBe(true);
    for (const fact of facts) expect(article.body, fact).toContain(fact);
    expect(article.body).not.toMatch(/NEEDS MARTIN|SERP|GSC|DataForSEO|Sources:|checked on|checked the|snapshot|basis not specified|weight note above|not a confirmed complete weight|dated starting prices|What these two records show|(?:15|16|23) October/);
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
    dom.querySelectorAll('script').forEach(node => node.remove());
    expect(dom.text).not.toContain('Last reviewed');
    for (const fact of facts) expect(dom.text, fact).toContain(fact);
    expect(dom.querySelectorAll("table").length).toBeGreaterThan(0);
  });
});
