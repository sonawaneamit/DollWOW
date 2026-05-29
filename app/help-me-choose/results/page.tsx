import { HumanHelpCTA } from "@/components/HumanHelpCTA";
import { ProductGrid } from "@/components/ProductGrid";
import { getProducts } from "@/lib/shopify/storefront";

export const metadata = { title: "Quiz Results" };

export default async function QuizResultsPage({ searchParams }: { searchParams: Promise<{ ids?: string }> }) {
  const { ids } = await searchParams;
  const idList = ids?.split(",").filter(Boolean) ?? [];
  const products = await getProducts();
  const recommended = idList.length ? products.filter((product) => idList.includes(product.id)) : products.slice(0, 5);

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="text-sm uppercase tracking-[0.18em] text-gold-300">Your recommendations</p>
      <h1 className="mt-2 text-4xl font-semibold text-ivory-50">Good options to review first</h1>
      <p className="mt-3 max-w-3xl text-ivory-400">These are practical starting points. Open a product, compare prices, or ask our team before buying.</p>
      <div className="mt-8">
        <ProductGrid products={recommended} />
      </div>
      <div className="mt-8">
        <HumanHelpCTA source="quiz" />
      </div>
    </section>
  );
}
