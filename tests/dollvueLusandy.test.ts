import { describe, expect, it } from "vitest";
import { dollVueGroups, isDollVueCatalogProduct, isDollVueProduct } from "@/lib/dollvue/config";
import type { BrandCustomizationConfig } from "@/types/customization";
import type { Product } from "@/types/product";

const handle = "lusandy-nadia-159cm-g-cup-silicone-companion-doll";

describe("Lusandy Nadia DollVue eligibility", () => {
  it("enables the approved custom Nadia listing but not an RTS listing", () => {
    const product = { handle, extended: { stockStatus: "custom" } } as Product;
    const rts = { handle, extended: { stockStatus: "ready_to_ship" } } as Product;

    expect(isDollVueProduct(handle)).toBe(true);
    expect(isDollVueCatalogProduct(product)).toBe(true);
    expect(isDollVueCatalogProduct(rts)).toBe(false);
  });

  it("recognizes supplier labels prefixed with SELECT", () => {
    const config: BrandCustomizationConfig = {
      id: "lusandy-nadia",
      brandLabel: "Lusandy",
      leadTimeNote: "",
      rules: [],
      groups: [
        {
          id: "select-skin-tone",
          label: "SELECT SKIN TONE",
          selectionMode: "single",
          display: "swatches",
          options: [
            {
              id: "tan",
              label: "Tan",
              priceDelta: 0,
              dollVueEnabled: true,
              swatch: { kind: "image", value: "https://example.com/tan.jpg", label: "Tan" }
            }
          ]
        }
      ]
    };

    expect(dollVueGroups(config)).toEqual([
      {
        id: "select-skin-tone",
        label: "SELECT SKIN TONE",
        options: [{ id: "tan", label: "Tan", swatch: { kind: "image", value: "https://example.com/tan.jpg", label: "Tan" } }]
      }
    ]);
  });
});
