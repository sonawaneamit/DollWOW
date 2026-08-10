import type { Metadata } from "next";
import { SavedPageClient } from "@/components/SavedPageClient";

export const metadata: Metadata = {
  title: "Saved dolls",
  robots: { index: false, follow: true }
};

export default function SavedPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-5">
        <p className="text-sm  text-gold-300">Saved</p>
        <h1 className="mt-2 text-4xl font-semibold text-ivory-50">Your saved dolls</h1>
        <p className="mt-3 max-w-2xl text-ivory-400">
          A private shortlist that stays on this device. Open a doll to keep customizing, or add it to your cart.
        </p>
      </div>
      <SavedPageClient />
    </section>
  );
}
