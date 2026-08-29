import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { getCustomizationConfig } from "@/lib/customization/configs";
import { dollVueGroups, isDollVueCatalogProduct, isDollVueProduct } from "@/lib/dollvue/config";
import type { BrandCustomizationConfig } from "@/types/customization";
import type { Product } from "@/types/product";

const nadiaHandle = "lusandy-nadia-159cm-g-cup-silicone-companion-doll";

function product(handle: string, extended: Partial<Product["extended"]> = {}) {
  return {
    id: handle,
    handle,
    title: handle,
    description: "",
    vendor: "Lusandy",
    productType: "Companion Doll",
    tags: [],
    featuredImage: null,
    images: [],
    variants: [],
    priceRange: {
      minVariantPrice: { amount: "0", currencyCode: "USD" },
      maxVariantPrice: { amount: "0", currencyCode: "USD" }
    },
    extended: { brand: "Lusandy", stockStatus: "custom", ...extended }
  } satisfies Product;
}

describe("Lusandy DollVue eligibility", () => {
  it("checks catalog eligibility before returning the access gate", () => {
    const source = readFileSync("app/dollvue/[handle]/page.tsx", "utf8");

    expect(source.indexOf("if (!product || !isDollVueCatalogProduct(product)) notFound();"))
      .toBeLessThan(source.indexOf("if (!session) return"));
  });

  it("enables custom Belle and keeps Nadia enabled", () => {
    const belleHandle = "lusandy-belle-159cm-h-cup-silicone-companion-doll";

    expect(isDollVueProduct(belleHandle)).toBe(true);
    expect(isDollVueCatalogProduct(product(belleHandle))).toBe(true);
    expect(isDollVueProduct(nadiaHandle)).toBe(true);
    expect(isDollVueCatalogProduct(product(nadiaHandle))).toBe(true);
  });

  it("enables approved custom Himari and Chloe listings", () => {
    const handles = [
      "lusandy-himari-157cm-b-cup-silicone-companion-doll",
      "lusandy-chloe-159cm-h-cup-silicone-companion-doll",
      "lusandy-chloe-157cm-b-cup-silicone-companion-doll-draft"
    ];

    for (const handle of handles) {
      expect(isDollVueProduct(handle)).toBe(true);
      expect(isDollVueCatalogProduct(product(handle))).toBe(true);
    }
  });

  it("keeps RTS products, heads, and torsos out", () => {
    expect(isDollVueCatalogProduct(product("lusandy-belle-159cm-h-cup-silicone-companion-doll-us-rts", { stockStatus: "ready_to_ship" }))).toBe(false);
    expect(isDollVueCatalogProduct(product("lusandy-sex-doll-heads"))).toBe(false);
    expect(isDollVueProduct("lusandy-sex-doll-heads")).toBe(false);
    expect(isDollVueCatalogProduct(product("lusandy-maya-93cm-d-cup-silicone-torso"))).toBe(false);
    expect(isDollVueProduct("lusandy-maya-93cm-d-cup-silicone-torso")).toBe(false);
    expect(isDollVueCatalogProduct(product("lusandy-lsd-t01-pleasure-hip-silicone-torso-us-rts", { stockStatus: "custom" }))).toBe(false);
    expect(isDollVueProduct("lusandy-lsd-t01-pleasure-hip-silicone-torso-us-rts")).toBe(false);
    expect(isDollVueCatalogProduct(product("lusandy-full-doll", { bodyType: "torso" as Product["extended"]["bodyType"] }))).toBe(false);
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

  it("runtime-stamps only approved image-backed imported options", () => {
    const option = (id: string, label: string, kind: "image" | "color" = "image") => ({
      id,
      label,
      priceDelta: 0,
      swatch: kind === "image"
        ? ({ kind: "image", value: `https://example.com/${id}.jpg` } as const)
        : ({ kind: "color", value: "#fff" } as const)
    });
    const configured = product(nadiaHandle, {
      customizationGroups: [
        {
          id: "select-skin-tone",
          label: "SELECT SKIN TONE",
          display: "swatches",
          options: [option("tan", "Tan"), option("standard", "Standard"), option("ivory", "Ivory", "color")]
        },
        {
          id: "select-premium-head-body-options-multiple",
          label: "SELECT PREMIUM HEAD & BODY OPTIONS (MULTIPLE)",
          display: "swatches",
          options: [option("freckles", "Add Freckles"), option("texture", "Real Skin Texture"), option("no-change", "No Change")]
        },
        {
          id: "unapproved-group",
          label: "Unapproved group",
          display: "swatches",
          options: [option("one", "One"), option("two", "Two")]
        }
      ]
    });

    const config = getCustomizationConfig(configured);
    expect(config.id).toBe("lusandy-source-verified");
    expect(dollVueGroups(config).map((group) => [group.id, group.options.map((item) => item.id)])).toEqual([
      ["select-skin-tone", ["tan"]],
      ["select-premium-head-body-options-multiple", ["freckles"]]
    ]);
    expect(config.groups.find((group) => group.id === "unapproved-group")?.options.every((item) => item.dollVueEnabled !== true)).toBe(true);
  });
});
