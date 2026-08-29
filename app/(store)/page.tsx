import { HomeAlive } from "@/components/HomeAlive";
import { HomeContactStrip } from "@/components/ContactChannels";
import { shopifyQueryForFilters } from "@/lib/catalog/filters";
import { getProductByHandle, getProducts } from "@/lib/shopify/storefront";
import type { Product } from "@/types/product";
import { withProtectedProductImages } from "@/lib/catalog/productImage";

const HOMEPAGE_SPOTLIGHT_HANDLES = [
  "irontech-vivian-153cm-f-cup-silicone-head-companion-doll-qryli",
  "starpery-freya-165cm-g-cup-silicone-head-companion-doll-46ftg",
  "jarliet-dolls-quine-167cm-b-cup-silicone-companion-doll-etgn7",
  "erovenus-doris-112-5cm-d-cup-silicone-companion-doll-fhw2l",
  "yl-isla-158cm-e-cup-silicone-companion-doll-1iikg",
  "sedoll-carry-150cm-g-cup-tpe-companion-doll-1xx8o",
  "hr-dolls-zeki-165cm-e-cup-silicone-companion-doll-1imsn"
];

export default async function HomePage() {
  const [spotlightProducts, products, femaleProducts, maleProducts, readyProducts, bestSellingProducts, recentlyAddedProducts] = await Promise.all([
    Promise.all(HOMEPAGE_SPOTLIGHT_HANDLES.map((handle) => getProductByHandle(handle, { revalidate: 120 }))),
    getProducts({ first: 96 }),
    getProducts({ first: 36, query: shopifyQueryForFilters({ bodyType: "female" }) }),
    getProducts({ first: 36, query: shopifyQueryForFilters({ bodyType: "male" }) }),
    getProducts({ first: 36, query: shopifyQueryForFilters({ availability: "ready_to_ship" }) }),
    getProducts({ first: 36, sortKey: "BEST_SELLING", reverse: false }),
    getProducts({ first: 14, sortKey: "CREATED_AT", reverse: true })
  ]);

  const curatedProducts = dedupeProducts([...spotlightProducts.filter(isProduct), ...readyProducts, ...femaleProducts, ...maleProducts, ...products]);

  return (
    <>
      <HomeContactStrip />
      <HomeAlive
        products={curatedProducts.map(withProtectedProductImages)}
        bestSellingProducts={bestSellingProducts.map(withProtectedProductImages)}
        recentlyAddedProducts={recentlyAddedProducts.map(withProtectedProductImages)}
      />
    </>
  );
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
