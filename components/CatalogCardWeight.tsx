import type { Product } from "@/types/product";
import { formatWeightDual, isHeadOnlyProduct } from "@/lib/catalog/productSpecs";
import { productWeightLabel } from "@/lib/catalog/mdWeight";

export function CatalogCardWeight({ product }: { product: Product }) {
  const pounds = product.extended.weightLb;
  if (isHeadOnlyProduct(product) || typeof pounds !== "number" || !Number.isFinite(pounds) || pounds <= 0) return null;
  const label = productWeightLabel(product) === "Body weight" ? "Body weight" : "Listed weight";
  return <p className="mt-2 text-sm leading-5 text-text-dim" data-testid="catalog-card-weight">{label}: {formatWeightDual(pounds)}</p>;
}
