import Link from "next/link";
import { notFound } from "next/navigation";
import { getCatalogBrand } from "@/lib/catalog/brands";
import brands from "./brands.json";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "DollVue brand review",
  robots: { index: false, follow: false },
};

export default function DollVueBrandReview() {
  if (process.env.VERCEL_ENV !== "preview" || process.env.DOLLWOW_ALL_BRAND_LOOK_REVIEW !== "1") notFound();

  return (
    <main className="container py-12">
      <h1 className="font-display text-4xl font-semibold">DollVue brand review</h1>
      <p className="mt-3 max-w-2xl text-text-dim">Open a product, choose a photo, and review the appearance options in Look.</p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(brands).sort(([a], [b]) => a.localeCompare(b)).map(([brand, summary]) => (
          <li key={brand}>
            <Link className="block border border-border bg-surface p-4 font-semibold hover:border-accent" href={`/dollvue/${summary.representative}`}>
              {getCatalogBrand(brand)?.label ?? brand}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
