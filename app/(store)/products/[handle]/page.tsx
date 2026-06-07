import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import Link from "next/link";
import { CheckCircle2, MessageCircle, Scale, ShieldCheck, Truck } from "lucide-react";
import { GoldButton } from "@/components/GoldButton";
import { ProductBuyActions } from "@/components/ProductBuyActions";
import { ProductGallery } from "@/components/ProductGallery";
import { ProductLowerAlive } from "@/components/ProductLowerAlive";
import { ProductOptions } from "@/components/ProductOptions";
import { WarehouseStatusBadge } from "@/components/WarehouseStatusBadge";
import { formatMoney } from "@/lib/utils/currency";
import { getProductByHandle, getProducts } from "@/lib/shopify/storefront";

export default async function ProductPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const [product, allProducts] = await Promise.all([getProductByHandle(handle), getProducts({ first: 8 })]);
  if (!product) notFound();
  const price = product.priceRange.minVariantPrice;
  const firstAvailable = product.variants.find((variant) => variant.availableForSale) ?? product.variants[0];
  const alternatives = allProducts.filter((item) => item.id !== product.id).slice(0, 4);
  const intro = productIntro(product.description);

  return (
    <main className="pb-28 lg:pb-0">
      <ToneBand tone="deep" className="pt-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
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
            <Link
              href="/compare"
              className="mt-3 inline-flex w-fit items-center gap-2 rounded-full border border-gold-500/18 bg-ivory-50/[0.045] px-3 py-2 text-sm font-semibold text-ivory-100 transition hover:border-gold-300/60 hover:bg-ivory-50/[0.07]"
            >
              <Scale className="h-4 w-4 text-gold-300" />
              Found it cheaper? We&apos;ll check the price
            </Link>
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
              <TrustLine icon={<CheckCircle2 className="h-4 w-4" />} text="Team QC support" />
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <GoldButton href="/compare" variant="secondary">
                <Scale className="h-4 w-4" /> Found this somewhere else?
              </GoldButton>
              <GoldButton href="/support" variant="secondary">
                <MessageCircle className="h-4 w-4" /> Ask before buying
              </GoldButton>
            </div>
            {firstAvailable && <ProductBuyActions merchandiseId={firstAvailable.id} productTitle={product.title} />}
          </div>
        </div>
      </ToneBand>

      <ToneBand tone="blush">
        <div id="build-studio" className="scroll-mt-28">
          <ProductOptions product={product} />
        </div>
      </ToneBand>

      <ProductLowerAlive product={product} similarProducts={alternatives} />
    </main>
  );
}

function ToneBand({
  tone,
  children,
  className = ""
}: {
  tone: "deep" | "rose" | "blush";
  children: ReactNode;
  className?: string;
}) {
  return (
    <section data-tone={tone} className={`tone-section ${className}`}>
      <div className="tone-inner space-y-8">{children}</div>
    </section>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="tone-card rounded-[14px] p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-ivory-600">{label}</p>
      <p className="mt-1 font-semibold text-ivory-100">{value}</p>
    </div>
  );
}

function TrustLine({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="tone-card flex min-h-11 items-center gap-2 rounded-[12px] px-3">
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
  return intro || "A DollWow product with details, availability, and options confirmed before fulfillment.";
}
