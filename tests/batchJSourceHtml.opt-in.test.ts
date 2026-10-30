import { expect, it } from "vitest";
import { parse } from "node-html-parser";
import { mkdir, writeFile } from "node:fs/promises";

it.skipIf(process.env.BATCH_J_SOURCE_HTML !== "1")("checks the actual private built Batch J sources",async()=>{
  const proof=[];
  for(const path of ["/shop/black-hair-dolls","/shop/brown-skin-dolls","/shop/fuller-dolls","/shop/height-155-159","/shop/height-165-169"].flatMap(p=>p.startsWith("/brands")?[p]:[p,`${p}?page=2`])){
    const response=await fetch(`http://localhost:3027${path}`);
    expect(response.status).toBe(200);
    const root=parse(await response.text());
    expect(root.querySelector('meta[name="robots"]')?.getAttribute("content")).toBe("noindex, nofollow");
    expect(root.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe(`https://dollwow.com${path.split("?")[0]}`);
    const cards=root.querySelectorAll(".catalog-product-card");expect(cards.length).toBeGreaterThan(0);
    expect(cards.every(c=>c.querySelector("img"))).toBe(true);
    const urls=cards.map(c=>`https://dollwow.com${c.querySelector('a[href^="/products/"]')!.getAttribute("href")}`);
    const schemas=root.querySelectorAll('script[type="application/ld+json"]').map(s=>JSON.parse(s.textContent));
    const list=schemas.find(s=>s["@type"]==="CollectionPage").mainEntity;
    expect(list.numberOfItems).toBe(cards.length);
    expect(list.itemListElement.map((i:{url:string})=>i.url)).toEqual(urls);
    const prefix=path.startsWith("/brands")?"brand":"collection";
    const faqSection=root.querySelector(`#${prefix}-faq-heading`)!;
    const visible=(faqSection.closest("details")??faqSection.parentNode).querySelectorAll("article").map(a=>[a.querySelector("h3")?.textContent,a.querySelector("p")?.textContent]);
    expect(schemas.find(s=>s["@type"]==="FAQPage").mainEntity.map((q:{name:string;acceptedAnswer:{text:string}})=>[q.name,q.acceptedAnswer.text])).toEqual(visible);
    const summary=root.querySelector('[data-testid="catalog-selection-summary"]')?.textContent;
    expect(summary).toContain("Shipping, taxes, and any custom options are confirmed at checkout.");
    proof.push({path,cards:cards.length,summary,urls,itemListMatches:true,faqMatches:true});
  }
  await mkdir("data/exports/dol-229-batch-j-2026-10-30",{recursive:true});
  await writeFile("data/exports/dol-229-batch-j-2026-10-30/source-html-proof.json",JSON.stringify({checkedAt:new Date().toISOString(),scope:"LOCAL built HTML, not hosted or external rich-results validation",proof},null,2));
},120000);
