import { GoldButton } from "@/components/GoldButton";
import { CartPageClient } from "@/components/CartPageClient";
import { TrustLogoStrip } from "@/components/TrustLogoStrip";
import Link from "next/link";
import { Camera, Lock, ShieldCheck, Truck } from "lucide-react";
import type { ReactNode } from "react";

export const metadata = { title: "Cart" };

export default function CartPage({ searchParams }: { searchParams: Promise<{ mockCheckout?: string }> }) {
  void searchParams;
  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-5">
        <p className="text-sm uppercase tracking-[0.18em] text-gold-300">Cart</p>
        <h1 className="mt-2 text-4xl font-semibold text-ivory-50">Saved checkout</h1>
        <p className="mt-3 max-w-2xl text-ivory-400">
          Resume checkout, review the product, or keep browsing.
        </p>
      </div>

      <CartPageClient />

      <div className="mt-6 border border-gold-500/16 bg-ink-800/72 p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-300">Before you pay</p>
            <h2 className="mt-2 text-2xl font-semibold text-ivory-50">Private, clear, and reviewed by our team.</h2>
          </div>
          <GoldButton href="/shop" variant="secondary">Keep shopping</GoldButton>
        </div>
        <div className="mt-5 grid gap-3 text-left sm:grid-cols-2 lg:grid-cols-4">
          <TrustCard icon={<Lock className="h-5 w-5" />} title="Private checkout" body="Neutral billing, plain packaging, and discreet order updates." />
          <TrustCard icon={<Truck className="h-5 w-5" />} title="Clear shipping" body="Warehouse and custom-order timing are shown before you buy." />
          <TrustCard icon={<Camera className="h-5 w-5" />} title="Factory photos" body="Custom builds include photo/video approval before shipment." />
          <TrustCard icon={<ShieldCheck className="h-5 w-5" />} title="Buyer protection" body="Major delivery problems have a documented support process." />
        </div>
        <div className="mt-6">
          <TrustLogoStrip compact />
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/buyer-protection" className="border border-gold-500/18 px-3 py-2 text-sm font-semibold text-ivory-200 hover:border-gold-300/45 hover:text-ivory-50">
            Buyer protection
          </Link>
          <Link href="/shipping-protection" className="border border-gold-500/18 px-3 py-2 text-sm font-semibold text-ivory-200 hover:border-gold-300/45 hover:text-ivory-50">
            Shipping protection
          </Link>
          <Link href="/how-ordering-works" className="border border-gold-500/18 px-3 py-2 text-sm font-semibold text-ivory-200 hover:border-gold-300/45 hover:text-ivory-50">
            How ordering works
          </Link>
        </div>
      </div>
    </section>
  );
}

function TrustCard({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <article className="border border-gold-500/14 bg-[#120907]/65 p-4">
      <div className="mb-3 grid h-10 w-10 place-items-center bg-gold-300/10 text-gold-300">{icon}</div>
      <h2 className="text-sm font-semibold text-ivory-100">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-ivory-300">{body}</p>
    </article>
  );
}
