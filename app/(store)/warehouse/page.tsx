import { ProductGrid } from "@/components/ProductGrid";
import { getProducts } from "@/lib/shopify/storefront";

export const metadata = { title: "Doll Warehouse" };

export default async function WarehousePage() {
  const products = (await getProducts()).filter((product) => product.extended.stockStatus === "ready_to_ship");

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="text-sm uppercase tracking-[0.18em] text-gold-300">Doll Warehouse</p>
      <h1 className="mt-2 text-4xl font-semibold text-ivory-50">Ready-to-ship inventory</h1>
      <p className="mt-3 max-w-2xl text-ivory-400">Warehouse location, delivery estimate, and stock freshness are shown clearly. Final stock is verified before checkout.</p>
      <div className="mt-8">
        <ProductGrid products={products} />
      </div>
    </section>
  );
}
