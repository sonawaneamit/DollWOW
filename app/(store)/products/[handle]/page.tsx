import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { CheckCircle2, MessageCircle, Scale, ShieldCheck, Truck } from "lucide-react";
import { DollDetailsCard } from "@/components/DollDetailsCard";
import { GoldButton } from "@/components/GoldButton";
import { HumanHelpCTA } from "@/components/HumanHelpCTA";
import { ProductGrid } from "@/components/ProductGrid";
import { ProductGallery } from "@/components/ProductGallery";
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
  const intro = productIntro(product.description);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-8 sm:px-6 lg:px-8 lg:pb-12">
      <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
        <div>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <ProductGallery product={product} />
            <div className="flex flex-col justify-center">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm uppercase tracking-[0.18em] text-gold-300">{product.extended.brand ?? product.vendor}</p>
                <WarehouseStatusBadge status={product.extended.stockStatus} />
              </div>
              <h1 className="mt-3 text-3xl font-semibold leading-tight text-ivory-50 sm:text-4xl">{product.title}</h1>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <strong className="text-3xl text-gold-300">{formatMoney(price.amount, price.currencyCode)}</strong>
                <span className="text-sm text-ivory-500">Base configuration</span>
              </div>
              <p className="mt-4 max-w-2xl text-base leading-7 text-ivory-300">{intro}</p>
              <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-ivory-300">
                <Spec label="Material" value={product.extended.material ?? "Confirm"} />
                <Spec label="Delivery" value={product.extended.deliveryEstimate ?? "Confirm"} />
                <Spec label="Height" value={product.extended.heightCm ? `${product.extended.heightCm} cm` : "Confirm"} />
                <Spec label="Weight" value={product.extended.weightLb ? `${product.extended.weightLb} lb` : "Confirm"} />
              </div>
              <div className="mt-5 grid gap-2 text-sm text-ivory-300 sm:grid-cols-3">
                <TrustLine icon={<ShieldCheck className="h-4 w-4" />} text="Discreet billing" />
                <TrustLine icon={<Truck className="h-4 w-4" />} text="Timing confirmed" />
                <TrustLine icon={<CheckCircle2 className="h-4 w-4" />} text="Human QC support" />
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <GoldButton href="/compare" variant="secondary">
                  <Scale className="h-4 w-4" /> Found this somewhere else?
                </GoldButton>
                <GoldButton href="/support" variant="secondary">
                  <MessageCircle className="h-4 w-4" /> Ask before buying
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

function TrustLine({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex min-h-11 items-center gap-2 rounded-[12px] border border-gold-500/12 bg-ink-900/60 px-3">
      <span className="text-gold-300">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

function productIntro(description: string) {
  const cleaned = description.replace(/\s+/g, " ").trim();
  const firstSpecIndex = cleaned.search(/\bHeight:|\bBrand:|\bWe provide\b/i);
  const intro = firstSpecIndex > 40 ? cleaned.slice(0, firstSpecIndex).trim() : cleaned;
  if (intro.length > 260) return `${intro.slice(0, 257).trim()}...`;
  return intro || "A DollWow catalog item with details, availability, and configuration confirmed before fulfillment.";
}
