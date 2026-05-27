import { BadgeCheck, Lock, Truck, Users } from "lucide-react";
import { CompareListingForm } from "@/components/CompareListingForm";
import { GoldButton } from "@/components/GoldButton";
import { HumanHelpCTA } from "@/components/HumanHelpCTA";
import { ProductGrid } from "@/components/ProductGrid";
import { TrustBadge } from "@/components/TrustBadge";
import { getProducts } from "@/lib/shopify/storefront";

export default async function HomePage() {
  const products = await getProducts({ first: 6 });
  const ready = products.filter((product) => product.extended.stockStatus === "ready_to_ship").slice(0, 3);

  return (
    <div>
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_0.8fr] lg:px-8 lg:py-18">
        <div className="flex flex-col justify-center">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-gold-300">DollWow.com</p>
          <h1 className="mt-5 max-w-4xl font-display text-5xl font-semibold leading-[1.02] text-ivory-50 sm:text-6xl">
            Find the right doll. <span className="gold-text">Buy with confidence.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-ivory-400">
            Compare listings, choose a practical fit, customize what matters, and get private human support before checkout.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <GoldButton href="/shop">Shop Dolls</GoldButton>
            <GoldButton href="/compare" variant="secondary">Compare a Listing</GoldButton>
            <GoldButton href="/help-me-choose" variant="secondary">Help Me Choose</GoldButton>
          </div>
        </div>
        <div className="rounded-[24px] border border-gold-500/20 bg-ink-800/80 p-5 shadow-glow">
          <p className="text-xs uppercase tracking-[0.18em] text-gold-300">LIVE Price Comparison</p>
          <h2 className="mt-3 text-2xl font-semibold text-ivory-50">Paste a listing link from any website</h2>
          <p className="mt-2 text-sm text-ivory-400">
            We check the page, compare against DollWow, and tell you when a human should verify the match.
          </p>
          <div className="mt-5">
            <CompareListingForm compact />
          </div>
        </div>
      </section>

      <section className="mx-auto flex max-w-7xl flex-wrap gap-3 px-4 sm:px-6 lg:px-8">
        <TrustBadge icon={BadgeCheck} label="Best price match" />
        <TrustBadge icon={Lock} label="Discreet shipping" />
        <TrustBadge icon={Truck} label="Delivery checked" />
        <TrustBadge icon={Users} label="Human support" />
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-gold-300">Handpicked favorites</p>
            <h2 className="mt-2 text-3xl font-semibold text-ivory-50">Popular right now</h2>
          </div>
          <GoldButton href="/shop" variant="secondary">View all</GoldButton>
        </div>
        <ProductGrid products={products.slice(0, 3)} />
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 pb-14 sm:px-6 lg:grid-cols-3 lg:px-8">
        <Feature href="/help-me-choose" title="Help Me Choose" copy="Answer a few practical questions and get 3 to 5 useful recommendations." />
        <Feature href="/warehouse" title="Doll Warehouse" copy={`${ready.length || products.length} ready-to-ship options with location and delivery notes.`} />
        <Feature href="/customize" title="Customize Your Doll" copy="Choose simple option groups and see a clear selected-items summary." />
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <HumanHelpCTA source="home" />
      </section>
    </div>
  );
}

function Feature({ href, title, copy }: { href: string; title: string; copy: string }) {
  return (
    <a href={href} className="rounded-[20px] border border-gold-500/16 bg-ink-800/72 p-6 transition hover:border-gold-300/45">
      <h3 className="text-2xl font-semibold text-ivory-50">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-ivory-400">{copy}</p>
    </a>
  );
}
