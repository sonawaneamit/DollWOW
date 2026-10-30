import { afterEach, describe, expect, it, vi } from "vitest";
import { getCustomizationConfig } from "@/lib/customization/configs";
import { mapShopifyProduct } from "@/lib/shopify/mappers";
import { gynoidBodyVersionMappings, verifiedGynoidBodyVersion } from '@/lib/catalog/gynoid-body-versions';

vi.hoisted(() => {
  process.env.SHOPIFY_STORE_DOMAIN = "secure-test.myshopify.com";
  process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN = "test-storefront-token";
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("checkout variant lookup", () => {
  it.each(['complete', 'truncated', 'missing', 'drift'] as const)('verifies Gynoid sibling versions without the single-variant mapper trap: %s', async state => {
    vi.stubEnv('VERCEL_ENV', 'preview');
    vi.stubEnv('NEXT_PUBLIC_DOL273_RELEASE_PREVIEW', '1');
    vi.resetModules();
    const row = gynoidBodyVersionMappings[0];
    const variants = [
      { id: row.standardVariantId, title: 'Standard', availableForSale: true,
        price: { amount: '5299', currencyCode: 'USD' }, selectedOptions: [{ name: 'Body version', value: 'Standard' }] },
      { id: row.deluxeVariantId, title: 'Deluxe', availableForSale: true,
        price: { amount: '5799', currencyCode: 'USD' }, selectedOptions: [{ name: 'Body version', value: 'Deluxe' }] }
    ];
    const parent = { id: row.productId, handle: row.handle, title: 'Gynoid Lisa', vendor: 'Gynoid',
      productType: 'Doll', tags: ['customizable'], stockStatus: { value: 'custom' } };
    const reply = (data: unknown) => new Response(JSON.stringify({ data }), { status: 200, headers: { 'content-type': 'application/json' } });
    const fresh = structuredClone(variants);
    if (state === 'drift') fresh[1].price.amount = '1';
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(reply({ nodes: [{ ...variants[1], product: parent }] }))
      .mockResolvedValueOnce(reply({ nodes: state === 'missing' ? [null] : [{ ...parent,
        variants: { nodes: fresh, pageInfo: { hasNextPage: state === 'truncated' } } }] }));
    vi.stubGlobal('fetch', fetchMock);
    const { getProductsByVariantIds } = await import('@/lib/shopify/storefront');
    if (state === 'complete') {
      const result = await getProductsByVariantIds([variants[1].id]);
      expect(result.get(variants[1].id)?.variants).toEqual(variants);
      expect(verifiedGynoidBodyVersion(result.get(variants[1].id)!, variants[1].id)?.priceUSD).toBe(5799);
    } else {
      await expect(getProductsByVariantIds([variants[1].id])).rejects.toThrow('could not be verified');
    }
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const request = JSON.parse(String(fetchMock.mock.calls[1][1].body));
    expect(request.variables.ids).toEqual([row.productId]);
    expect(request.query).toContain('variants(first: 3)');
    expect(fetchMock.mock.calls[1][1].cache).toBe('no-store');
  });
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
