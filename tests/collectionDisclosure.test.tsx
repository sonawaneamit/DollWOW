import {readFileSync} from "node:fs";
import {renderToStaticMarkup} from "react-dom/server";
import {describe, expect, it} from "vitest";
import {CollectionDisclosure} from "@/components/CollectionDisclosure";
import Link from "next/link";

describe("product-first collection guidance", () => {
  it("keeps collapsed content and links in initial server HTML without JavaScript", () => {
    const html=renderToStaticMarkup(<CollectionDisclosure id="example" title="Buying questions"><p>Preserved buyer answer.</p><Link href="/learn/sex-doll-guide">Guide</Link></CollectionDisclosure>);
    expect(html).toContain("<details");
    expect(html).not.toMatch(/<details[^>]*\bopen(?:=|\s|>)/);
    expect(html).toContain("<summary>");
    expect(html).toContain("Preserved buyer answer.");
    expect(html).toContain('href="/learn/sex-doll-guide"');
    expect(html).toContain('id="example"');
  });

  it("places all supplementary blocks after the shared collection grid", () => {
    const route=readFileSync(new URL("../app/(store)/shop/[collection]/page.tsx",import.meta.url),"utf8");
    for(const marker of ['id="collection-comparison-heading"','id="collection-buyer-notes-heading"','id="collection-faq-heading"',"<CareForLifePanel compact"]){
      expect(route.indexOf(marker)).toBeGreaterThan(route.indexOf("<ProductGrid"));
    }
    expect(route).toContain("collection-guide-links");
    expect(route).toContain("<MobileHeroIntro>");
  });
});
