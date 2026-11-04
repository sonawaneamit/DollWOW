import "server-only";

import { connection } from "next/server";
import { ProductCard } from "@/components/ProductCard";
import { isDollVueCatalogProduct } from "@/lib/dollvue/config";
import { getSeoCatalogProducts } from "@/lib/shopify/storefront";
import styles from "./DollVueLanding.module.css";

export async function DollVueArrivals() {
  await connection();
  const catalog = await getSeoCatalogProducts({ first: 5000, strict: true, includeDollVueEligibility: true });
  const latestEligibleProducts = catalog
    .filter(isDollVueCatalogProduct)
    .sort((a, b) => (b.extended.sourceReleaseRank ?? 0) - (a.extended.sourceReleaseRank ?? 0))
    .slice(0, 9);

  return latestEligibleProducts.map((product, index) => (
    <div className={styles.productRailItem} key={product.id}>
      <ProductCard product={product} priority={index < 3} />
    </div>
  ));
}
