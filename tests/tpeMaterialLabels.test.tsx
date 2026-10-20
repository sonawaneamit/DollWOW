import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { TpeMaterialLabels } from "@/components/TpeMaterialLabels";

describe("TPE label comparison pilot", () => {
  it("renders the reviewed material hierarchy and links without client JavaScript", () => {
    const html = renderToStaticMarkup(<TpeMaterialLabels />);
    expect(html).toContain("Understand the labels before comparing builds");
    for (const label of ["TPE: material family", "SE STPE: branded range", "SE LSTPE: construction option"]) {
      expect(html).toContain(label);
    }
    expect(html).toContain("not a new outer material");
    expect(html).toContain('href="#collection-products"');
    expect(html).toContain('href="/learn/se-doll-lstpe-lightweight-upgrade"');
    expect(html).toContain('href="https://www.sedoll.com/stpe-series-introduces-a-new-custom-option-lstpe-lightweight-upgrade/"');
    expect(html).not.toMatch(/\b(?:157H|161F|163E|sale|in stock|guaranteed|kg|lifespan|PDP|SERP)\b/i);
  });

  it("keeps the module below the product grid and exclusive to the TPE collection", () => {
    const route = readFileSync(new URL("../app/(store)/shop/[collection]/page.tsx", import.meta.url), "utf8");
    expect(route).toContain('id="collection-products"');
    expect(route).toContain('{collection === "tpe" ? <TpeMaterialLabels /> : null}');
    expect(route.indexOf("<TpeMaterialLabels />")).toBeGreaterThan(route.indexOf("<ProductGrid"));
    expect(route.indexOf("<TpeMaterialLabels />")).toBeGreaterThan(route.indexOf('id="collection-buyer-notes-heading"'));
  });
});
