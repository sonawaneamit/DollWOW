import { Suspense } from "react";
import { GoldButton } from "@/components/GoldButton";
import { SupportLeadForm } from "@/components/SupportLeadForm";

export const metadata = { title: "Supplier Partnerships" };

export default function SupplierPage() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="text-sm uppercase tracking-[0.18em] text-gold-300">Supplier partnerships</p>
      <h1 className="mt-2 text-4xl font-semibold text-ivory-50">A premium buying concierge for serious doll customers</h1>
      <p className="mt-4 max-w-3xl text-ivory-400">DollWow is building a clear, support-led storefront for high-ticket buyers who need better product details, comparison help, discreet support, and trustworthy checkout.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {["Clean product pages", "Human buyer support", "Clear stock and delivery notes", "Supplier authorization workflow", "Price-list and asset tracking", "No fake social proof"].map((item) => (
          <div key={item} className="rounded-[18px] border border-gold-500/16 bg-ink-800/72 p-5 text-ivory-200">{item}</div>
        ))}
      </div>
      <div className="mt-8">
        <GoldButton href="mailto:support@dollwow.com">Contact DollWow</GoldButton>
      </div>
      <div className="mt-10">
        <Suspense fallback={<div className="rounded-[24px] border border-gold-500/16 bg-ink-800/72 p-8 text-ivory-400">Loading supplier form...</div>}>
          <SupportLeadForm defaultSource="supplier" />
        </Suspense>
      </div>
    </section>
  );
}
