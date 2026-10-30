import { describe, expect, it } from "vitest";
import { mkdir, writeFile } from "node:fs/promises";
import { parse } from "node-html-parser";

describe.skipIf(process.env.DOL229_SOURCE_HTML !== "1")("Batch C current-source HTML", () => {
  it("renders current card links, useful price summaries and valid matching FAQ without JavaScript", async () => {
    const proof = [];
    for (const path of ["/brands/erovenus-dolls", "/brands/climax-dolls", "/shop/curvy-dolls", "/shop/brunette-dolls"]) {
      const response = await fetch(`http://localhost:3019${path}`);
      expect(response.status).toBe(200);
      const root = parse(await response.text());
      expect(root.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe(`https://dollwow.com${path}`);
      const summary = root.querySelector('[data-testid="catalog-selection-summary"]');
      expect(summary?.textContent).toContain("Starting prices on this page:");
      expect(summary?.textContent).toContain("Shipping, taxes, and any custom options are confirmed at checkout.");
      const cards = root.querySelectorAll(".catalog-product-card");
      expect(cards.length).toBeGreaterThan(0);
      expect(cards.every(card => card.querySelector('a[href^="/products/"]') && card.querySelector("img"))).toBe(true);
      const schemas = root.querySelectorAll('script[type="application/ld+json"]').map(script => JSON.parse(script.textContent));
      const page = schemas.find(schema => schema["@type"] === "CollectionPage");
      expect(page.mainEntity["@type"]).toBe("ItemList");
      expect(page.mainEntity.itemListElement.length).toBeGreaterThan(0);
      expect(schemas.some(schema => schema["@type"] === "BreadcrumbList")).toBe(true);
      expect(schemas.some(schema => schema["@type"] === "Organization")).toBe(true);
      const faq = schemas.find(schema => schema["@type"] === "FAQPage");
      const prefix = path.startsWith("/brands") ? "brand" : "collection";
      const visible = root.querySelector(`#${prefix}-faq-heading`)!.closest("details")!.querySelectorAll("article").map(article => [article.querySelector("h3")?.textContent, article.querySelector("p")?.textContent]);
      expect(faq.mainEntity.map((q: { name: string; acceptedAnswer: { text: string } }) => [q.name, q.acceptedAnswer.text])).toEqual(visible);
      proof.push({ path, status: response.status, title: root.querySelector("title")?.textContent, h1: root.querySelector("main h1")?.textContent, summary: summary?.textContent, cards: cards.length, types: schemas.map(schema => schema["@type"]), faqMatchesVisible: true });
    }
    await mkdir("data/exports/dol-229-2026-10-30", { recursive: true });
    await writeFile("data/exports/dol-229-2026-10-30/source-html-proof.json", JSON.stringify({ checkedAt: new Date().toISOString(), scope: "LOCAL built route / semantic JSON checks, not external rich-results validator or hosted release proof", proof }, null, 2));
  }, 120000);
});
