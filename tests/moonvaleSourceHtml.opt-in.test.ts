import { expect, it } from "vitest";
import { parse } from "node-html-parser";
import { mkdir, writeFile } from "node:fs/promises";

it.skipIf(process.env.MOONVALE_SOURCE_HTML !== "1")("verifies the actual private built Moonvale source", async () => {
  const response = await fetch("http://localhost:3020/brands/moonvale-dolls");
  expect(response.status).toBe(200);
  const root = parse(await response.text());
  expect(root.querySelector('meta[name="robots"]')?.getAttribute("content")).toBe("noindex, nofollow");
  expect(root.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe("https://dollwow.com/brands/moonvale-dolls");
  const cards = root.querySelectorAll(".catalog-product-card");
  expect(cards.length).toBeGreaterThan(0);
  const urls=cards.map(c=>`https://dollwow.com${c.querySelector('a[href^="/products/"]')!.getAttribute("href")}`);
  const schemas=root.querySelectorAll('script[type="application/ld+json"]').map(s=>JSON.parse(s.textContent));
  const list=schemas.find(s=>s["@type"]==="CollectionPage").mainEntity;
  expect(list.numberOfItems).toBe(cards.length);
  expect(list.itemListElement.map((i:{url:string})=>i.url)).toEqual(urls);
  expect(root.querySelector('[data-testid="catalog-selection-summary"]')?.textContent).toContain("Starting prices on this page:");
  expect(root.textContent).toContain("Certificate shown: SY Doll. It does not name Moonvale separately.");
  const visible=root.querySelector("#brand-faq-heading")!.closest("details")!.querySelectorAll("article").map(a=>[a.querySelector("h3")?.textContent,a.querySelector("p")?.textContent]);
  expect(schemas.find(s=>s["@type"]==="FAQPage").mainEntity.map((q:{name:string;acceptedAnswer:{text:string}})=>[q.name,q.acceptedAnswer.text])).toEqual(visible);
  await mkdir("data/exports/dol-229-moonvale-2026-10-30",{recursive:true});
  await writeFile("data/exports/dol-229-moonvale-2026-10-30/source-html-proof.json",JSON.stringify({checkedAt:new Date().toISOString(),scope:"LOCAL built HTML, not hosted or external rich-results validation",cards:cards.length,urls,summary:root.querySelector('[data-testid="catalog-selection-summary"]')?.textContent,certificate:"SY Doll, unchanged",schemaParity:true,faqMatches:true},null,2));
},120000);
