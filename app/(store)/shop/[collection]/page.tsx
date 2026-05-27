import { ProductFilters } from "@/components/ProductFilters";
import { ProductGrid } from "@/components/ProductGrid";
import { getProducts } from "@/lib/shopify/storefront";

export default async function CollectionPage({ params }: { params: Promise<{ collection: string }> }) {
  const { collection } = await params;
  const products = await getProducts();
  const filtered = products.filter((product) => {
    const target = collection.replace(/-/g, " ");
    const haystack = [product.title, product.productType, ...product.tags, product.extended.stockStatus, product.extended.material]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(target) || product.tags.includes(collection);
  });

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-gold-300">Collection</p>
          <h1 className="mt-2 text-4xl font-semibold capitalize text-ivory-50">{collection.replace(/-/g, " ")}</h1>
        </div>
        <ProductFilters />
      </div>
      <ProductGrid products={filtered} />
    </section>
  );
}
