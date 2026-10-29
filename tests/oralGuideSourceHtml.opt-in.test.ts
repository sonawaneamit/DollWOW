import { describe, expect, it } from "vitest";
import { writeFile } from "node:fs/promises";
import { parse } from "node-html-parser";
import { oralGuideExamples, oralGuideQuestions } from "@/lib/learn/oralGuide";

describe.skipIf(process.env.DOL288_SOURCE_HTML !== "1")("oral guide source HTML", () => {
  it("keeps the visible facts, live product links and matching FAQ available before JavaScript", async () => {
    const response = await fetch("http://localhost:3018/review/oral-features");
    expect(response.status).toBe(200);
    const root = parse(await response.text());
    const article = root.querySelector("main > article")!;
    expect(article.querySelector("h1")?.textContent).toBe("Oral features compared");
    expect(root.querySelector('meta[name="robots"]')?.getAttribute("content")).toBe("noindex, nofollow");
    const cards = article.querySelectorAll("#dolls article");
    expect(cards.map(card => card.querySelector("h3")?.textContent)).toEqual(oralGuideExamples.map(example => example.name));
    const links = [...new Set(cards.flatMap(card => card.querySelectorAll("a").map(link => link.getAttribute("href"))))];
    expect(links).toEqual(oralGuideExamples.map(example => `https://dollwow.com/products/${example.handle}`));
    const faq = JSON.parse(article.querySelector('script[type="application/ld+json"]')!.textContent);
    const visible = article.querySelectorAll("#questions details").map(item => [item.querySelector("summary")?.textContent, item.querySelector("p")?.textContent]);
    expect(visible).toEqual(oralGuideQuestions.map(item => [item.question, item.answer]));
    expect(faq.mainEntity.map((item: { name: string; acceptedAnswer: { text: string } }) => [item.name, item.acceptedAnswer.text])).toEqual(visible);
    expect(article.querySelectorAll("tbody tr")).toHaveLength(5);
    expect(article.querySelectorAll("th,td").every(cell => cell.textContent.trim().length > 0)).toBe(true);
    expect(article.querySelector("video source")?.getAttribute("src")).toBe("/images/learn/irontech-features/ros-comparison.mp4");
    await writeFile("data/exports/dol-288-redo-2026-10-29/source-html-proof.json", JSON.stringify({ checkedAt: new Date().toISOString(), status: response.status, sourceHtmlCards: cards.length, liveLinks: links, faqMatchesVisible: true, usefulRows: 5, manufacturerVideoInHtml: true, robots: "noindex, nofollow", scope: "Local current-source HTML only; not hosted or whole-market validation" }, null, 2));
  }, 60000);
});
