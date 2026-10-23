import { describe, expect, it } from "vitest";
import { sampleProducts } from "@/lib/data/sample-products";
import { productCanonicalHandle } from "@/lib/catalog/productCanonical";
import { buildPdpMetadata, buildProductStructuredData } from "@/lib/catalog/pdpSeo";
import { env } from "@/lib/utils/env";

const pairs = [
  ["wm-joanna-158cm-m-cup-tpe-companion-doll-honjb", "yl-joanna-158cm-m-cup-tpe-companion-doll-honjb"],
  ["wm-frantiska-153cm-n-cup-tpe-companion-doll-kq0mz", "yl-frantiska-153cm-n-cup-tpe-companion-doll-kq0mz"],
  ["wm-alessia-154cm-i-cup-tpe-companion-doll-1ymco", "irontech-alessia-154cm-i-cup-tpe-companion-doll-1ymco"],
  ["wm-vanora-151cm-e-cup-tpe-companion-doll-ve922", "yl-vanora-151cm-e-cup-tpe-companion-doll-ve922"]
];

describe("individually approved product canonicals", () => {
  it.each(pairs)("points only the approved copy %s at its main record", (alias, main) => {
    const product = { ...sampleProducts[0], handle: alias, seo: { title: "An existing unique authored title", description: "Existing description." } };
    const before = JSON.stringify(product);
    const url = `${env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")}/products/${main}`;
    const metadata = buildPdpMetadata(product);
    const schema = buildProductStructuredData(product);
    expect(productCanonicalHandle(product)).toBe(main);
    expect(productCanonicalHandle({ handle: main })).toBe(main);
    expect(metadata.alternates?.canonical).toBe(url);
    expect(metadata.openGraph).toMatchObject({ url });
    expect(metadata.title).toBe(product.seo.title);
    expect(metadata.description).toBe(product.seo.description);
    expect(schema).toMatchObject({ "@id": `${url}#product`, url, sku: alias, offers: { url, price: product.priceRange.minVariantPrice.amount } });
    expect(JSON.stringify(product)).toBe(before);
  });

  it.each(["wm-vera-155cm-g-cup-tpe-companion-doll-1qghg", "wm-vanora-158cm-j-cup-tpe-companion-doll-ve922", "wm-joanna-158cm-m-cup-tpe-companion-doll-honjb-rts-us", "wm-joanna-158cm-m-cup-tpe-companion-doll-honjb-rts-uk", "__proto__", "constructor"])("does not infer an alias for %s", (handle) => {
    expect(productCanonicalHandle({ handle })).toBe(handle);
  });
});
