import { HomeAlive } from "@/components/HomeAlive";
import { HomeContactStrip } from "@/components/ContactChannels";
import { shopifyQueryForFilters } from "@/lib/catalog/filters";
import { getProductByHandle, getProducts } from "@/lib/shopify/storefront";
import type { Product } from "@/types/product";
import { withProtectedProductImages } from "@/lib/catalog/productImage";
import { getHomepageReviews } from "@/lib/reviews/reviews";
import { homepageCardPayload } from '@/lib/catalog/publicPayload';
import { homepageFeatureProducts, homepageBrandLogos, homepageBrands, homepageNewArrivals, homepageBestSellers } from '@/lib/catalog/homepage';
import type { Metadata } from 'next';

export const metadata: Metadata = { alternates: { canonical: 'https://dollwow.com' } };

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
  const [spotlightProducts, products, femaleProducts, maleProducts, readyProducts, bestSellingProducts, recentlyAddedProducts, brandProducts] = await Promise.all([
    Promise.all(HOMEPAGE_SPOTLIGHT_HANDLES.map((handle) => getProductByHandle(handle, { strict: true, revalidate: 120 }))),
    getProducts({ first: 96, strict: true }),
    getProducts({ first: 96, strict: true, query: shopifyQueryForFilters({ bodyType: "female" }) }),
    getProducts({ first: 96, strict: true, query: shopifyQueryForFilters({ bodyType: "male" }) }),
    getProducts({ first: 96, strict: true, query: shopifyQueryForFilters({ availability: "ready_to_ship" }) }),
    getProducts({ first: 96, strict: true, sortKey: "BEST_SELLING", reverse: false }),
    getProducts({ first: 96, strict: true, sortKey: "CREATED_AT", reverse: true }),
    Promise.all(homepageBrandLogos.map(logo => getProducts({first:1, imageFirst:1, revalidate:300, strict:true, query:shopifyQueryForFilters({brand:logo.brand})})))
  ]);

  const curatedProducts = dedupeProducts([...spotlightProducts.filter(isProduct), ...readyProducts, ...femaleProducts, ...maleProducts, ...products]);

  return (
    <>
      <HomeContactStrip />
      <HomeAlive
        products={homepageFeatureProducts(curatedProducts).map(withProtectedProductImages).map(homepageCardPayload)}
        bestSellingProducts={homepageBestSellers(bestSellingProducts).map(withProtectedProductImages).map(homepageCardPayload)}
        recentlyAddedProducts={homepageNewArrivals(recentlyAddedProducts, curatedProducts).map(withProtectedProductImages).map(homepageCardPayload)}
        brands={homepageBrands(brandProducts.flat())}
        customerReviews={getHomepageReviews()}
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
