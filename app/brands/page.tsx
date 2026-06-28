import type { Metadata } from "next";
import Link from "next/link";
import { catalogBrands } from "@/lib/catalog/brands";
import { brandSeoProfile } from "@/lib/catalog/brandSeo";

export const metadata: Metadata = {
  title: "Sex Doll Brands: Compare DollWow Brand Hubs",
  description:
    "Compare DollWow sex doll brand hubs by catalog listings, material, size, customization path, buyer guides, and support-confirmed order details.",
  alternates: { canonical: "/brands" }
};

export default function BrandsPage() {
  return (
    <section className="shop-visual-shell mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="shop-visual-hero">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-gold-300">Brand guide</p>
          <h1 className="mt-2 text-4xl font-semibold text-ivory-50">Compare sex doll brands on DollWow</h1>
          <p className="mt-3 max-w-3xl text-ivory-400">
            Browse DollWow brand hubs for current catalog listings, buyer notes, material and size context, customization guidance,
            and support paths before checkout.
          </p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {catalogBrands.map((brand) => {
          const profile = brandSeoProfile(brand);
          return (
            <article key={brand.value} className="rounded-[8px] border border-gold-500/14 bg-ink-900/64 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-300">Brand hub</p>
              <h2 className="mt-2 text-2xl font-semibold text-ivory-50">{brand.label}</h2>
              <p className="mt-3 text-sm leading-6 text-ivory-400">{profile.positioning}</p>
              <Link
                href={`/brands/${brand.collectionHandle}`}
                className="mt-5 inline-flex rounded-full border border-gold-500/18 px-4 py-2 text-sm font-semibold text-ivory-200 hover:border-gold-300/45 hover:text-ivory-50"
              >
                View {brand.label}
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}
