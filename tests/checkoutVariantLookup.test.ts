import { afterEach, describe, expect, it, vi } from "vitest";
import { getCustomizationConfig } from "@/lib/customization/configs";
import { mapShopifyProduct } from "@/lib/shopify/mappers";

vi.hoisted(() => {
  process.env.SHOPIFY_STORE_DOMAIN = "secure-test.myshopify.com";
  process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN = "test-storefront-token";
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("checkout variant lookup", () => {
  it("uses one minimal exact-node query and validates a variant that would be beyond a 30-variant product connection", async () => {
    const requested = "gid://shopify/ProductVariant/999";
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      data: {
        nodes: [{
          id: requested,
          title: "Variant 31",
          availableForSale: true,
          price: { amount: "2499.00", currencyCode: "USD" },
          selectedOptions: [{ name: "Build", value: "31" }],
          product: {
            id: "gid://shopify/Product/1",
            handle: "large-variant-product",
            title: "Large Variant Product",
            vendor: "Secure Brand",
            productType: "Doll",
            tags: ["customizable"],
            displayName: { value: "Large Variant Product" },
            brand: { value: "Secure Brand" },
            sourceTitle: null,
            material: { value: "Silicone" },
            stockStatus: { value: "custom" },
            irontechUlwEligibility: null,
            customizationGroups: { value: "[]" }
          }
        }, {
          id: "gid://shopify/ProductVariant/unrequested",
          title: "Unexpected variant",
          availableForSale: true,
          price: { amount: "1.00", currencyCode: "USD" },
          selectedOptions: [],
          product: {
            id: "gid://shopify/Product/2",
            handle: "unexpected-product",
            title: "Unexpected Product",
            vendor: "Secure Brand",
            productType: "Doll",
            tags: ["customizable"],
            displayName: null,
            brand: { value: "Secure Brand" },
            sourceTitle: null,
            material: { value: "Silicone" },
            stockStatus: { value: "custom" },
            irontechUlwEligibility: null,
            customizationGroups: { value: "[]" }
          }
        }]
      }
    }), { status: 200, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    const { getProductsByVariantIds } = await import("@/lib/shopify/storefront");
    const products = await getProductsByVariantIds([requested, requested]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(init.body)) as { query: string; variables: { ids: string[] } };
    expect(body.variables.ids).toEqual([requested]);
    expect(body.query).toContain("nodes(ids: $ids)");
    expect(body.query).toContain("featuredImage { url altText width height }");
    expect(body.query).not.toMatch(/\b(images|media|variants)\s*\(/);
    expect(products.size).toBe(1);
    expect(products.get(requested)?.variants).toEqual([
      expect.objectContaining({ id: requested, title: "Variant 31", availableForSale: true })
    ]);
  });

  it("produces the same checkout configuration as the full mapper for representative customization families", async () => {
    const importedGroups = JSON.stringify([{
      id: "skin-tone",
      label: "Skin tone",
      display: "cards",
      options: [
        { id: "default", label: "Factory default", priceDelta: 0 },
        { id: "tan", label: "Tan", priceDelta: 45 }
      ]
    }]);
    const cases = [
      { id: "wm-model-a", vendor: "WM Dolls", title: "WM Model A", bodyType: "male", heightCm: "170", cupSize: "", featuredImageUrl: "https://cdn.test/wm-model-a.jpg" },
      { id: "wm-model-b", vendor: "WM Dolls", title: "WM Model B", bodyType: "female", heightCm: "165", cupSize: "F", featuredImageUrl: "https://cdn.test/wm-model-b.jpg" },
      { id: "rosretty-model", vendor: "Rosretty Dolls", title: "Rosretty Silicone Model", bodyType: "female", heightCm: "165", cupSize: "E", featuredImageUrl: "https://cdn.test/rosretty-model.jpg" },
      { id: "irontech-model-a", vendor: "Irontech Dolls", title: "Irontech Model A", bodyType: "male", heightCm: "170", cupSize: "", featuredImageUrl: null },
      { id: "irontech-model-b", vendor: "Irontech Dolls", title: "Irontech Model B", bodyType: "female", heightCm: "165", cupSize: "F", featuredImageUrl: null },
      { id: "starpery-model-h", vendor: "Starpery", title: "Starpery Model H", bodyType: "female", heightCm: "161", cupSize: "H", featuredImageUrl: null },
      { id: "se-model", vendor: "SE Doll", title: "SE Model", bodyType: "female", heightCm: "165", cupSize: "E", featuredImageUrl: null }
    ];
    const variants = cases.map((item, index) => {
      const id = `gid://shopify/ProductVariant/${index + 1}`;
      const product = {
        id: `gid://shopify/Product/${index + 1}`,
        handle: item.id,
        title: item.title,
        vendor: item.vendor,
        productType: "Doll",
        tags: [item.vendor, "customizable"],
        featuredImage: item.featuredImageUrl ? { url: item.featuredImageUrl, altText: item.title, width: 800, height: 1200 } : null,
        displayName: { value: item.title },
        bodyType: { value: item.bodyType },
        brand: { value: item.vendor },
        sourceTitle: { value: item.title },
        material: { value: "Full silicone" },
        heightCm: { value: item.heightCm },
        cupSize: { value: item.cupSize },
        stockStatus: { value: "custom" },
        irontechUlwEligibility: item.vendor === "Irontech Dolls" ? {
          value: JSON.stringify({ status: "verified", bodyModel: item.title, source: "irontech-production-data" })
        } : undefined,
        customizationGroups: item.vendor === "SE Doll" ? { value: importedGroups } : undefined
      };
      const variant = {
        id,
        title: "Default Title",
        availableForSale: true,
        price: { amount: "2000.00", currencyCode: "USD" },
        selectedOptions: []
      };
      return { product, variant };
    });
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      data: { nodes: variants.map(({ product, variant }) => ({ ...variant, product })) }
    }), { status: 200, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    const { getProductsByVariantIds } = await import("@/lib/shopify/storefront");
    const mapped = await getProductsByVariantIds(variants.map(({ variant }) => variant.id));

    for (const { product, variant } of variants) {
      const fullProduct = mapShopifyProduct({
        ...product,
        description: "",
        images: { edges: product.featuredImage ? [{ node: product.featuredImage }] : [] },
        variants: { edges: [{ node: variant }] },
        priceRange: { minVariantPrice: variant.price, maxVariantPrice: variant.price }
      });
      expect(getCustomizationConfig(mapped.get(variant.id)!)).toEqual(getCustomizationConfig(fullProduct));
    }

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const query = (JSON.parse(String(init.body)) as { query: string }).query;
    expect(query).toContain("bodyType:");
    expect(query).toContain("heightCm:");
    expect(query).toContain("cupSize:");
    expect(query).toContain("featuredImage { url altText width height }");
    expect(query).not.toMatch(/\b(images|media|variants)\s*(?:\{|\()/);
  });
});
