import { CompareListingForm } from "@/components/CompareListingForm";

export const metadata = {
  title: "Request a Price Match",
  description: "Send another seller's listing and configured total for a DollWow price-match review."
};

export default async function PriceMatchPage({ searchParams }: { searchParams: Promise<{ product?: string; title?: string }> }) {
  const params = await searchParams;
  return (
    <section className="mx-auto max-w-5xl px-5 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold tracking-[0.14em] text-accent">PRICE MATCH</p>
        <h1 className="mt-3 font-display text-4xl font-semibold leading-tight text-text sm:text-5xl">Found the same doll for less?</h1>
        <p className="mt-4 text-[17px] leading-7 text-text-dim">Send the other seller’s link, final configured price, and a cart screenshot. We review the complete deal—not just the headline price.</p>
      </div>
      <div className="mt-8 rounded-lg bg-surface p-5 shadow-card sm:p-8">
        <CompareListingForm targetProductHandle={params.product} targetProductTitle={params.title} />
      </div>
    </section>
  );
}
