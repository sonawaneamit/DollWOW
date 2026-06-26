import { HomeAlive } from "@/components/HomeAlive";
import { shopifyQueryForFilters } from "@/lib/catalog/filters";
import { getProductByHandle, getProducts } from "@/lib/shopify/storefront";
import type { Product } from "@/types/product";

const HOMEPAGE_SPOTLIGHT_HANDLES = [
  "sedoll-carry-150cm-g-cup-tpe-companion-doll-1xx8o",
  "starpery-adele-153cm-e-cup-silicone-head-companion-doll-1dn4l",
  "172cm-5ft8-e-cup-silicone-sex-doll-ida-belle"
];

export default async function HomePage() {
  const [spotlightProducts, products, femaleProducts, maleProducts, readyProducts] = await Promise.all([
    Promise.all(HOMEPAGE_SPOTLIGHT_HANDLES.map((handle) => getProductByHandle(handle, { revalidate: 120 }))),
    getProducts({ first: 96 }),
    getProducts({ first: 36, query: shopifyQueryForFilters({ bodyType: "female" }) }),
    getProducts({ first: 36, query: shopifyQueryForFilters({ bodyType: "male" }) }),
    getProducts({ first: 36, query: shopifyQueryForFilters({ availability: "ready_to_ship" }) })
  ]);

  const curatedProducts = dedupeProducts([...spotlightProducts.filter(isProduct), ...readyProducts, ...femaleProducts, ...maleProducts, ...products]);

  return <HomeAlive products={curatedProducts} />;
}

function dedupeProducts<T extends { id: string }>(products: T[]) {
  const seen = new Set<string>();
  return products.filter((product) => {
    if (seen.has(product.id)) return false;
    seen.add(product.id);
    return true;
  });
}

function isProduct(product: Product | null): product is Product {
  return Boolean(product);
}
