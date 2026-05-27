import { CompareListingForm } from "@/components/CompareListingForm";

export const metadata = { title: "Compare a Listing" };

export default function ComparePage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-[24px] border border-gold-500/16 bg-ink-800/72 p-6 sm:p-8">
        <p className="text-sm uppercase tracking-[0.18em] text-gold-300">LIVE Price Comparison</p>
        <h1 className="mt-2 text-4xl font-semibold text-ivory-50">Paste a product link</h1>
        <p className="mt-3 text-ivory-400">We extract what we can, look for a DollWow match, and show when a human should verify before you pay.</p>
        <div className="mt-7">
          <CompareListingForm />
        </div>
      </div>
    </section>
  );
}
