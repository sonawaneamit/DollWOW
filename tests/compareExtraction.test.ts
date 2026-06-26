import { describe, expect, it } from "vitest";
import { extractProductFromHtml } from "@/lib/compare/extractProduct";

describe("extractProductFromHtml", () => {
  it("extracts product, price, and promo evidence from merchant HTML", () => {
    const parsed = extractProductFromHtml(
      `
      <html>
        <head>
          <title>WM 165cm Silicone Doll</title>
          <meta property="og:image" content="https://example.com/product.jpg" />
          <script type="application/ld+json">
            {"@type":"Product","name":"WM 165cm Silicone Doll","brand":{"name":"WM Dolls"},"offers":{"price":"2199","priceCurrency":"USD"}}
          </script>
        </head>
        <body>
          <p>Limited time sale: use code SAVE10 for 10% off.</p>
          <p>Free shipping and free care kit included.</p>
          <p>Ready to ship.</p>
          <span>$2,199</span><span>$1,999</span>
        </body>
      </html>
      `,
      "https://vendor.example/products/wm-165"
    );

    expect(parsed.title).toBe("WM 165cm Silicone Doll");
    expect(parsed.price).toBe(2199);
    expect(parsed.salePrice).toBe(1999);
    expect(parsed.couponCode).toBe("SAVE10");
    expect(parsed.couponPercent).toBe(10);
    expect(parsed.freeShipping).toBe(true);
    expect(parsed.freebies?.join(" ")).toContain("free care kit");
    expect(parsed.stockStatus?.toLowerCase()).toContain("ready");
    expect(parsed.promoText?.join(" ")).toContain("Limited time sale");
  });
});
