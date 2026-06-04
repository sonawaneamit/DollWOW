import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import Link from "next/link";
import { BadgeCheck, Camera, CheckCircle2, ClipboardCheck, CreditCard, MessageCircle, PackageCheck, Scale, ShieldCheck, Sparkles, Star, Truck } from "lucide-react";
import { DollDetailsCard } from "@/components/DollDetailsCard";
import { GoldButton } from "@/components/GoldButton";
import { HumanHelpCTA } from "@/components/HumanHelpCTA";
import { ProductBuyActions } from "@/components/ProductBuyActions";
import { ProductFAQ } from "@/components/ProductFAQ";
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
  const firstAvailable = product.variants.find((variant) => variant.availableForSale) ?? product.variants[0];
  const alternatives = allProducts.filter((item) => item.id !== product.id).slice(0, 4);
  const intro = productIntro(product.description);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-8 sm:px-6 lg:px-8 lg:pb-12">
      <div className="space-y-8">
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

        <div id="build-studio" className="scroll-mt-28">
          <ProductOptions product={product} />
        </div>

        <OrderTimeline product={product} />
        <BuyerConfidence />
        <ProductFAQ />
        <DollDetailsCard product={product} />
        <HumanHelpCTA source="product" />
        <SimilarDolls products={alternatives} product={product} />
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

function OrderTimeline({ product }: { product: NonNullable<Awaited<ReturnType<typeof getProductByHandle>>> }) {
  const readyToShip = product.extended.stockStatus === "ready_to_ship";
  const steps = readyToShip
    ? [
        { label: "Order placed", detail: "Secure Shopify checkout creates the order.", eta: "Today", icon: <CreditCard className="h-5 w-5" /> },
        { label: "Team review", detail: "We check product, address, and fulfillment notes.", eta: "1 business day", icon: <ClipboardCheck className="h-5 w-5" /> },
        { label: "Warehouse handoff", detail: "Inventory timing and discreet packaging are confirmed.", eta: "1-2 days", icon: <PackageCheck className="h-5 w-5" /> },
        { label: "Plain-box shipping", detail: "Tracking is shared once the order leaves.", eta: "After handoff", icon: <Truck className="h-5 w-5" /> }
      ]
    : [
        { label: "Order placed", detail: "Your build details are captured as Shopify order notes.", eta: "Today", icon: <CreditCard className="h-5 w-5" /> },
        { label: "Specialist QC review", detail: "We check compatibility, pricing, timing, and supplier notes.", eta: "1-2 days", icon: <ClipboardCheck className="h-5 w-5" /> },
        { label: "Built to order", detail: "The supplier prepares the selected configuration.", eta: product.extended.deliveryEstimate ?? "4-8 weeks", icon: <Sparkles className="h-5 w-5" /> },
        { label: "Private QC photos", detail: "Where supplier QC photos are available, we request them before shipment.", eta: "Before shipping", icon: <Camera className="h-5 w-5" />, featured: true },
        { label: "Plain-box shipping", detail: "Tracking is shared after final release.", eta: "Final step", icon: <Truck className="h-5 w-5" /> }
      ];

  return (
    <section className="rounded-[28px] border border-gold-500/18 bg-[linear-gradient(135deg,rgba(26,17,13,0.9),rgba(7,4,3,0.96))] p-5 shadow-soft sm:p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-gold-300">After checkout</p>
          <h2 className="mt-2 text-2xl font-semibold text-ivory-50">What happens after you order</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ivory-400">
            {readyToShip ? "Ready-to-ship orders move through confirmation and warehouse release." : "Custom builds are reviewed before anything is made or shipped, so the long lead time feels less mysterious."}
          </p>
        </div>
        <span className="w-fit rounded-full border border-gold-500/18 bg-ivory-50/[0.045] px-4 py-2 text-sm font-semibold text-gold-200">
          {readyToShip ? product.extended.deliveryEstimate ?? "Fast warehouse timing" : product.extended.deliveryEstimate ?? "Custom build timing"}
        </span>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {steps.map((step) => (
          <div
            key={step.label}
            className={[
              "rounded-[20px] border p-4",
              step.featured ? "border-[#4f9c8a]/45 bg-[#4f9c8a]/10" : "border-gold-500/14 bg-ink-950/48"
            ].join(" ")}
          >
            <div className={step.featured ? "text-[#9bd7c9]" : "text-gold-300"}>{step.icon}</div>
            <p className="mt-3 font-semibold text-ivory-50">{step.label}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-ivory-600">{step.eta}</p>
            <p className="mt-2 text-sm leading-6 text-ivory-400">{step.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function BuyerConfidence() {
  const items = [
    { title: "Verified reviews coming with launch orders", text: "We will show only verified buyer feedback once DollWow orders exist. No invented testimonials.", icon: <Star className="h-5 w-5" /> },
    { title: "Privacy-first support", text: "Questions can stay practical: product link, timing, budget, shipping, and comparison details.", icon: <ShieldCheck className="h-5 w-5" /> },
    { title: "Hand-checked before fulfillment", text: "Custom selections are reviewed for compatibility before production or shipment.", icon: <BadgeCheck className="h-5 w-5" /> }
  ];

  return (
    <section className="grid gap-4 rounded-[28px] border border-gold-500/18 bg-ink-800/64 p-5 sm:p-7 lg:grid-cols-[0.85fr_1.15fr]">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-gold-300">Confidence</p>
        <h2 className="mt-2 text-2xl font-semibold text-ivory-50">Trust without fake social proof</h2>
        <p className="mt-3 text-sm leading-6 text-ivory-400">
          This category needs reassurance, but we should earn it plainly: real order process, real privacy cues, real verified reviews once they exist.
        </p>
      </div>
      <div className="grid gap-3">
        {items.map((item) => (
          <div key={item.title} className="flex gap-3 rounded-[18px] border border-gold-500/14 bg-ink-950/45 p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-gold-300/10 text-gold-300">{item.icon}</span>
            <span>
              <span className="block font-semibold text-ivory-50">{item.title}</span>
              <span className="mt-1 block text-sm leading-6 text-ivory-400">{item.text}</span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function SimilarDolls({
  products,
  product
}: {
  products: NonNullable<Awaited<ReturnType<typeof getProducts>>>;
  product: NonNullable<Awaited<ReturnType<typeof getProductByHandle>>>;
}) {
  return (
    <section className="rounded-[28px] border border-gold-500/18 bg-ink-800/58 p-5 sm:p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-gold-300">Similar dolls</p>
          <h2 className="mt-2 text-2xl font-semibold text-ivory-50">People may compare these next</h2>
          <p className="mt-2 text-sm leading-6 text-ivory-400">Matched from the current Shopify catalog by nearby specs, material, or price band.</p>
        </div>
        <div className="flex gap-2">
          <GoldButton href="/help-me-choose" variant="secondary">Help me choose</GoldButton>
          <GoldButton href="/shop" variant="secondary">Browse all</GoldButton>
        </div>
      </div>
      <div className="mt-5">
        <ProductGrid products={products.map((item) => item)} />
      </div>
      {product.extended.material && <p className="mt-4 text-xs text-ivory-600">Current reference: {product.extended.material}, {product.extended.heightCm ? `${product.extended.heightCm} cm` : "height pending"}.</p>}
    </section>
  );
}

function productIntro(description: string) {
  const cleaned = description.replace(/\s+/g, " ").trim();
  const firstSpecIndex = cleaned.search(/\bHeight:|\bBrand:|\bWe provide\b/i);
  const intro = firstSpecIndex > 40 ? cleaned.slice(0, firstSpecIndex).trim() : cleaned;
  if (intro.length > 260) return `${intro.slice(0, 257).trim()}...`;
  return intro || "A DollWow catalog item with details, availability, and configuration confirmed before fulfillment.";
}
