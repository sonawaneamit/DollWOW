import { describe, expect, it } from "vitest";
import { productBodyType } from "@/lib/catalog/bodyType";
import { homepageNewArrivals, homepageBestSellers, homepageFeatureProducts, homepageBrandKey, homepageBrandLogos, homepageBrands, isHomepageMaleProduct, uniqueHomepageModels, homepageModelKey, selectHomepageDiscovery } from "@/lib/catalog/homepage";
import { catalogBrands } from '@/lib/catalog/brands';
import { existsSync } from 'node:fs';
import type { Product } from "@/types/product";

function makeProduct(overrides: Partial<Product> & { extended?: Product["extended"] } = {}): Product {
  return {
    id: "gid://shopify/Product/1",
    handle: "test-doll",
    title: "Test doll",
    description: "",
    vendor: "Lusandy",
    productType: "Sex Dolls",
    tags: [],
    featuredImage: null,
    images: [],
    variants: [],
    priceRange: {
      minVariantPrice: { amount: "599", currencyCode: "USD" },
      maxVariantPrice: { amount: "599", currencyCode: "USD" }
    },
    extended: {},
    ...overrides
  };
}

describe("homepage catalog classification", () => {
  it('resolves every eligible catalog alias to its exact canonical value', () => {
    const eligible = new Set(['wm','angelkiss','irontech','fanreal','starpery','avant','sy','yl','erovenus','sedoll','dolls-castle','jarliet','hr']);
    for (const brand of catalogBrands) {
      for (const name of [brand.value, brand.label, brand.collectionHandle, ...brand.tags, ...brand.aliases]) {
        const product = makeProduct({vendor:name});
        expect(homepageBrandKey(product)).toBe(brand.value);
        expect(homepageFeatureProducts([product]).length, name).toBe(eligible.has(brand.value) ? 1 : 0);
      }
    }
  });

  it('does not guess brand identity from titles, partial names, or parent-brand relationships', () => {
    for (const vendor of ['Unknown', 'Moonvale', 'Real Lady', 'Lusandy collaboration', 'S E Doll', 'Climax', 'Zelex']) {
      expect(homepageFeatureProducts([makeProduct({vendor, title:'WM Dolls Irontech'})])).toEqual([]);
    }
    expect(homepageFeatureProducts([makeProduct({vendor:'WM Dolls', extended:{brand:'Unknown'}})])).toEqual([]);
    expect(homepageFeatureProducts([makeProduct({vendor:'Lusandy'})])).toHaveLength(1);
  });

  it.each([homepageNewArrivals, homepageBestSellers])('filters before taking eight without changing upstream order', select => {
    const products = Array.from({length:20}, (_, index) => makeProduct({id:String(index), title:`Model ${index}`, handle:`model-${index}`, vendor:index % 2 ? 'WM Dolls' : 'Piper'}));
    expect(select(products).map(product => product.id)).toEqual(['1','3','5','7','9','11','13','15']);
    expect(select([])).toEqual([]);
    expect(select([makeProduct({vendor:'Unknown'})])).toEqual([]);
  });

  it('offers only exact official logo files for brands with an eligible live product', () => {
    expect(homepageBrands([])).toEqual([]);
    expect(homepageBrands([makeProduct({vendor:'Iron Tech'})]).map(brand => brand.brand)).toEqual(['irontech']);
    expect(homepageBrands([makeProduct({vendor:'Moonvale'})])).toEqual([]);
    for (const logo of homepageBrandLogos) {
      expect(existsSync(`public${logo.src}`)).toBe(true);
      expect(logo.href.startsWith('/brands/')).toBe(true);
    }
  });

  it.each([
    "lusandy-lsd-t01-pleasure-hip-silicone-torso-us-rts",
    "lusandy-lsd-t01-pleasure-hip-silicone-torso-eu-rts-599",
    "lusandy-lsd-t01-pleasure-hip-silicone-torso-eu-rts"
  ])("does not classify the T01 torso as male: %s", (handle) => {
    const product = makeProduct({ handle, title: "Lusandy LSD-T01 Pleasure Hip Silicone Torso" });

    expect(productBodyType(product)).toBe("unknown");
    expect(isHomepageMaleProduct(product)).toBe(false);
  });

  it("keeps explicit and inferred male dolls in the male rail", () => {
    expect(isHomepageMaleProduct(makeProduct({ extended: { bodyType: "male" } }))).toBe(true);
    expect(isHomepageMaleProduct(makeProduct({ tags: ["male-doll"] }))).toBe(true);
    expect(isHomepageMaleProduct(makeProduct({ title: "Masculine companion" }))).toBe(true);
  });

  it("keeps the heads options-sheet SKU out of homepage features", () => {
    const heads = makeProduct({ id: "heads", handle: "lusandy-sex-doll-heads" });
    const doll = makeProduct({ id: "doll", handle: "published-doll" });

    expect(homepageNewArrivals([heads, doll])).toEqual([doll]);
  });

  it("shows one card per public model within a homepage rail", () => {
    const firstBill = makeProduct({ id: "bill-1", handle: "irontech-bill-1", title: "Irontech Bill 176cm Silicone" });
    const duplicateBill = makeProduct({ id: "bill-2", handle: "irontech-bill-2", title: "Irontech Bill 176cm Silicone" });
    const james = makeProduct({ id: "james", handle: "irontech-james", title: "Irontech James 176cm Silicone" });

    expect(uniqueHomepageModels([firstBill, duplicateBill, james])).toEqual([firstBill, james]);
  });

  it('collapses regional warehouse copies without collapsing different builds or brands', () => {
    const ellen = makeProduct({title:'Erovenus Ellen 112.5cm D-Cup Silicone Companion Doll', vendor:'Erovenus', handle:'erovenus-ellen'});
    const copies = ['au','eu','ca','us'].map(region => ({...ellen, id:region, handle:`erovenus-ellen-rts-${region}`, extended:{stockStatus:'ready_to_ship' as const, warehouseCountry:region}}));
    expect(uniqueHomepageModels(copies)).toHaveLength(1);
    expect(homepageModelKey(copies[0])).toBe(homepageModelKey(ellen));
    expect(homepageModelKey({...ellen, title:'Erovenus Ellen 165cm D-Cup Silicone Companion Doll'})).not.toBe(homepageModelKey(ellen));
    expect(homepageModelKey({...ellen, vendor:'WM'})).not.toBe(homepageModelKey(ellen));
  });

  it('does not promote an existing custom model just because a warehouse copy was added', () => {
    const custom = makeProduct({id:'custom',title:'Ellen 165cm Silicone',extended:{stockStatus:'custom'}});
    const stock = {...custom,id:'stock',extended:{stockStatus:'ready_to_ship' as const}};
    const fresh = makeProduct({id:'fresh',title:'Alice 170cm Silicone'});
    expect(homepageNewArrivals([stock, fresh], [custom]).map(p=>p.id)).toEqual(['fresh']);
    expect(homepageBestSellers([stock, fresh, custom]).map(p=>p.id)).toEqual(['stock','fresh']);
  });

  it('balances discovery brands and prefers unexposed models without emptying sparse categories', () => {
    const pool = Array.from({length:20}, (_, i)=>makeProduct({id:String(i),title:`Model ${i}`,handle:`model-${i}`,vendor:i < 10 ? 'WM' : 'Irontech'}));
    const exposure = new Map(pool.slice(0,8).map(p=>[homepageModelKey(p),1]));
    const first = selectHomepageDiscovery(pool, exposure);
    expect(first).toHaveLength(8);
    expect(first.every(p=>Number(p.id)>=8)).toBe(true);
    expect(first.slice(0,2).map(homepageBrandKey)).toEqual(['wm','irontech']);
    const second = selectHomepageDiscovery(pool, exposure);
    expect(second).toHaveLength(8);
    expect(new Set(second.map(homepageModelKey)).size).toBe(8);
    expect(selectHomepageDiscovery([pool[0],pool[0]],exposure)).toEqual([pool[0]]);
  });
});
