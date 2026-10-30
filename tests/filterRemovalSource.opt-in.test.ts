import { expect, it } from "vitest";
import { parse } from "node-html-parser";
import { writeFile } from "node:fs/promises";

it.skipIf(process.env.DOL229_FILTER_HTML !== "1").each(["curvy-dolls","brunette-dolls"])("checks private %s removal links in actual built HTML",async(collection)=>{
  const basePath=`/shop/${collection}`;
  const path=`${basePath}?material=silicone&price=1500-1999&sort=price-asc&page=2`;
  const response=await fetch(`http://localhost:3019${path}`);expect(response.status).toBe(200);
  const root=parse(await response.text());
  const nav=root.querySelector('nav[aria-label="Active filters"]')!;
  expect(nav).toBeTruthy();
  const href=nav.querySelector('a[aria-label="Remove Full silicone filter"]')!.getAttribute("href")!;
  const url=new URL(href,"https://dollwow.com");
  expect(url.pathname).toBe(basePath);expect(url.searchParams.has("material")).toBe(false);
  expect(url.searchParams.has("page")).toBe(false);expect(url.searchParams.get("price")).toBe("1500-1999");
  expect(url.searchParams.get("sort")).toBe("price-asc");expect(url.hash).toBe("#collection-products");
  expect(nav.querySelector('a[aria-label*="Curvy"]')).toBeNull();
  expect(nav.querySelector('a[aria-label*="Brunette"]')).toBeNull();
  const next=await fetch(`http://localhost:3019${url.pathname}${url.search}`);
  const nextRoot=parse(await next.text());expect(next.status).toBe(200);
  expect(nextRoot.querySelector('nav[aria-label="Active filters"] a[aria-label="Remove Full silicone filter"]')).toBeNull();
  expect(nextRoot.querySelector('link[rel="canonical"]')!.getAttribute("href")).toBe(`https://dollwow.com${basePath}`);
  expect(nextRoot.querySelector('meta[name="robots"]')!.getAttribute("content")).toBe("noindex, nofollow");
  const cards=nextRoot.querySelectorAll(".catalog-product-card");
  const list=nextRoot.querySelectorAll('script[type="application/ld+json"]').map(s=>JSON.parse(s.textContent)).find(s=>s["@type"]==="CollectionPage").mainEntity;
  expect(list.itemListElement.map((i:{url:string})=>i.url)).toEqual(cards.map(c=>`https://dollwow.com${c.querySelector('a[href^="/products/"]')!.getAttribute("href")}`));
  await writeFile(`data/exports/dol-229-2026-10-30/${collection}-filter-removal-source-proof.json`,JSON.stringify({at:new Date().toISOString(),path,href,remainingCards:cards.length,noindex:true,canonicalPreserved:true,itemListMatches:true},null,2));
},120000);
