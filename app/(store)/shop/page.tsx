import { ProductFilters } from "@/components/ProductFilters";
import { ProductGrid } from "@/components/ProductGrid";
import { getProducts } from "@/lib/shopify/storefront";

export const metadata = { title: "Shop Dolls" };

export default async function ShopPage() {
  const products = await getProducts();

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-gold-300">Shop Dolls</p>
          <h1 className="mt-2 text-4xl font-semibold text-ivory-50">Browse the catalog</h1>
          <p className="mt-3 max-w-2xl text-ivory-400">Filter by practical needs: delivery, material, size, weight, budget, and custom options.</p>
        </div>
        <ProductFilters />
      </div>
      <ProductGrid products={products} />
    </section>
  );
}
