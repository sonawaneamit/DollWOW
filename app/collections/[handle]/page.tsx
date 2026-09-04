import { notFound, permanentRedirect } from "next/navigation";
import { getCatalogBrand, isHiddenCatalogBrand } from "@/lib/catalog/brands";

export default async function LegacyBrandCollectionPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const brand = getCatalogBrand(handle);
  if (!brand || isHiddenCatalogBrand(brand.value)) notFound();
  permanentRedirect(`/brands/${brand.collectionHandle}`);
}
