import { GoldButton } from "@/components/GoldButton";
import { ProductFilters } from "@/components/ProductFilters";
import { ProductGrid } from "@/components/ProductGrid";
import { compactFilters, filterProducts, filtersFromSearchParams, shopifyQueryForFilters } from "@/lib/catalog/filters";
import { getProducts } from "@/lib/shopify/storefront";

export const metadata = {
  title: "Custom Sex Dolls",
  description: "Shop customizable sex dolls with clear option pricing for material, skin tone, hair, eyes, skeleton features, heating, standing feet, and accessories."
};

export default async function CustomizePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const filters = compactFilters({ ...filtersFromSearchParams(await searchParams), availability: "custom" });
  const products = await getProducts({ query: shopifyQueryForFilters(filters), first: 600 });
  const filteredProducts = filterProducts(products, filters).filter((product) => product.extended.customAvailable);

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-[24px] border border-gold-500/16 bg-ink-800/72 p-8">
        <p className="text-sm  text-gold-300">Customize</p>
        <h1 className="mt-2 text-4xl font-semibold text-ivory-50">Build a doll that feels personal to you</h1>
        <p className="mt-4 max-w-3xl text-ivory-400">Compare available materials, skin tones, eyes, hair, skeleton features, standing feet, heating, and accessories. Prices update as you choose, and we confirm every detail before production.</p>
        <div className="mt-6">
          <GoldButton href="/shop/custom">Shop custom dolls</GoldButton>
        </div>
      </div>
      <div className="mt-8">
        <ProductFilters filters={filters} action="/customize" resetHref="/customize" />
      </div>
      <div className="mt-8">
        <ProductGrid products={filteredProducts} filters={filters} resetHref="/customize" />
      </div>
    </section>
  );
}
