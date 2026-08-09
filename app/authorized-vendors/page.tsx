import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, ExternalLink, ShieldCheck } from "lucide-react";
import { brandAuthorizations, liveAuthorizedBrands } from "@/lib/catalog/authorizations";
import { brandHubHref, getCatalogBrand } from "@/lib/catalog/brands";

export const metadata: Metadata = {
  title: "Authorized Vendor Certificates | DollWow",
  description: "See DollWow's authorized seller certificates and the brands currently represented in our catalog."
};

export default function AuthorizedVendorsPage() {
  const certificateEntries = brandAuthorizations.filter((entry) => entry.status === "certificate");
  const writtenConfirmations = brandAuthorizations.filter((entry) => entry.status === "written-confirmation");

  return (
    <main className="shop-visual-shell min-h-screen">
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold  text-gold-300">Authorized vendors</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ivory-50 sm:text-5xl">Authorized Vendor Certificates</h1>
          <p className="mt-4 text-base leading-7 text-ivory-300">
            DollWow works with authorized brands and represents their products with clear specifications, respectful customer support, and straightforward order guidance.
          </p>
        </div>

        <section className="mt-10 rounded-[8px] border border-gold-500/18 bg-ink-900/62 p-6 sm:p-7" aria-labelledby="live-authorized-brands">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold  text-gold-300"><BadgeCheck className="h-4 w-4" /> Current catalog</p>
              <h2 id="live-authorized-brands" className="mt-2 text-2xl font-semibold text-ivory-50">Authorized brands on DollWow</h2>
            </div>
            <p className="text-sm text-ivory-400">Select a brand to browse its current listings.</p>
          </div>
          <div className="mt-5 flex flex-wrap gap-2.5">
            {liveAuthorizedBrands.map((brand) => (
              <Link key={brand.value} href={brandHubHref(brand.value)} className="rounded-[8px] border border-gold-500/20 bg-ink-950/55 px-3 py-2 text-sm font-semibold text-ivory-200 transition hover:border-gold-300/50 hover:text-gold-200">
                {brand.label}
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-12" aria-labelledby="certificate-grid-heading">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold  text-gold-300">Certificates on file</p>
            <h2 id="certificate-grid-heading" className="mt-2 text-3xl font-semibold text-ivory-50">Brand authorizations</h2>
            <p className="mt-3 text-sm leading-6 text-ivory-400">Open any certificate to view the full document supplied by the brand.</p>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {certificateEntries.map((entry) => (
              <article key={entry.id} id={entry.id} className="overflow-hidden rounded-[8px] border border-gold-500/18 bg-ink-900/70">
                <a href={entry.certificateSrc!} target="_blank" rel="noreferrer" className="group relative block aspect-[4/3] bg-[#f8efe8]">
                  <Image src={entry.certificatePreviewSrc!} alt={`${entry.brand} authorized vendor certificate`} fill sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw" className="object-contain p-4 transition duration-300 group-hover:scale-[1.02]" />
                </a>
                <div className="border-t border-gold-500/12 p-5">
                  <p className="flex items-center gap-2 text-sm font-semibold  text-gold-300"><BadgeCheck className="h-4 w-4" /> Authorized seller</p>
                  <h3 className="mt-2 text-xl font-semibold text-ivory-50">{entry.brand}</h3>
                  {entry.relatedBrandValues?.length ? (
                    <p className="mt-1 text-sm text-ivory-400">
                      Also covers {entry.relatedBrandValues.map((value) => getCatalogBrand(value)?.label ?? value).join(", ")}.
                    </p>
                  ) : null}
                  <div className="mt-4 flex items-center justify-between gap-3">
                    {entry.brandValue ? <Link href={brandHubHref(entry.brandValue)} className="text-sm font-semibold text-ivory-300 hover:text-gold-200">Browse brand</Link> : <span className="text-sm text-ivory-500">Coming to DollWow</span>}
                    <a href={entry.certificateSrc!} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gold-200 hover:text-gold-100">View certificate <ExternalLink className="h-3.5 w-3.5" /></a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-[8px] border border-gold-500/18 bg-[linear-gradient(120deg,rgba(51,29,22,0.7),rgba(16,8,7,0.88))] p-6 sm:p-7" aria-labelledby="written-confirmations-heading">
          <p className="flex items-center gap-2 text-sm font-semibold  text-gold-300"><ShieldCheck className="h-4 w-4" /> Confirmed in writing</p>
          <h2 id="written-confirmations-heading" className="mt-2 text-2xl font-semibold text-ivory-50">Additional authorized brands</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {writtenConfirmations.map((entry) => (
              <article key={entry.id} className="rounded-[8px] border border-gold-500/16 bg-ink-950/50 p-5">
                <h3 className="text-lg font-semibold text-ivory-100">{entry.brand}</h3>
                <p className="mt-2 text-sm leading-6 text-ivory-400">DollWow is an approved seller. Brand confirmation is on file.</p>
                {entry.brandValue ? <Link href={brandHubHref(entry.brandValue)} className="mt-4 inline-flex text-sm font-semibold text-gold-200 hover:text-gold-100">Browse brand</Link> : <p className="mt-4 text-sm text-ivory-500">Products coming soon.</p>}
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
