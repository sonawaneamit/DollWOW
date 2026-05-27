import { notFound } from "next/navigation";
import { Scale } from "lucide-react";
import { DollDetailsCard } from "@/components/DollDetailsCard";
import { GoldButton } from "@/components/GoldButton";
import { HumanHelpCTA } from "@/components/HumanHelpCTA";
import { ProductGrid } from "@/components/ProductGrid";
import { ProductImageFrame } from "@/components/ProductImageFrame";
import { ProductOptions } from "@/components/ProductOptions";
import { WarehouseStatusBadge } from "@/components/WarehouseStatusBadge";
import { formatMoney } from "@/lib/utils/currency";
import { getProductByHandle, getProducts } from "@/lib/shopify/storefront";

export default async function ProductPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const [product, allProducts] = await Promise.all([getProductByHandle(handle), getProducts({ first: 8 })]);
  if (!product) notFound();
  const price = product.priceRange.minVariantPrice;
  const alternatives = allProducts.filter((item) => item.id !== product.id).slice(0, 3);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
        <div>
          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <ProductImageFrame product={product} priority />
            <div className="flex flex-col justify-center">
              <p className="text-sm uppercase tracking-[0.18em] text-gold-300">{product.extended.brand ?? product.vendor}</p>
              <h1 className="mt-3 text-4xl font-semibold text-ivory-50">{product.title}</h1>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <strong className="text-3xl text-gold-300">{formatMoney(price.amount, price.currencyCode)}</strong>
                <WarehouseStatusBadge status={product.extended.stockStatus} />
              </div>
              <p className="mt-4 text-ivory-400">{product.description}</p>
              <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-ivory-300">
                <Spec label="Material" value={product.extended.material ?? "Confirm"} />
                <Spec label="Delivery" value={product.extended.deliveryEstimate ?? "Confirm"} />
                <Spec label="Height" value={product.extended.heightCm ? `${product.extended.heightCm} cm` : "Confirm"} />
                <Spec label="Weight" value={product.extended.weightLb ? `${product.extended.weightLb} lb` : "Confirm"} />
              </div>
              <div className="mt-6">
                <GoldButton href="/compare" variant="secondary">
                  <Scale className="h-4 w-4" /> Found this somewhere else?
                </GoldButton>
              </div>
            </div>
          </div>
          <div className="mt-8 space-y-8">
            <DollDetailsCard product={product} />
            <HumanHelpCTA source="product" />
            <section>
              <h2 className="mb-4 text-2xl font-semibold text-ivory-50">Other good options</h2>
              <ProductGrid products={alternatives} />
            </section>
          </div>
        </div>
        <ProductOptions product={product} />
      </div>
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[14px] border border-gold-500/12 bg-ink-800/70 p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-ivory-600">{label}</p>
      <p className="mt-1 font-semibold text-ivory-100">{value}</p>
    </div>
  );
}
