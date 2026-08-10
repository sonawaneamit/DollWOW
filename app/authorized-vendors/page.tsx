import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, ExternalLink, FileCheck2, ShieldCheck } from "lucide-react";
import { brandAuthorizations, liveAuthorizedBrands } from "@/lib/catalog/authorizations";
import { brandHubHref, getCatalogBrand } from "@/lib/catalog/brands";

export const metadata: Metadata = {
  title: "Brand Certifications | DollWow",
  description: "View certificates and written confirmations issued by brands authorizing DollWow to sell their products."
};

export default function AuthorizedVendorsPage() {
  const certificateEntries = brandAuthorizations.filter((entry) => entry.status === "certificate");
  const writtenConfirmations = brandAuthorizations.filter((entry) => entry.status === "written-confirmation");

  return (
    <section className="certifications-page shop-visual-shell mx-auto min-h-screen max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="certifications-hero shop-visual-hero">
        <div className="certifications-hero__copy">
          <p className="certifications-eyebrow"><BadgeCheck aria-hidden="true" /> Certifications</p>
          <h1>Proof from the brands we sell.</h1>
          <p>
            These certificates and written confirmations come from the manufacturers. They show that DollWow is approved to offer their products—not that DollWow certifies other sellers.
          </p>
        </div>
        <dl className="certifications-hero__stats" aria-label="Certification summary">
          <div><dt>Certificate files</dt><dd>{certificateEntries.length}</dd></div>
          <div><dt>Catalog brands covered</dt><dd>{liveAuthorizedBrands.length}</dd></div>
          <div><dt>Written confirmations</dt><dd>{writtenConfirmations.length}</dd></div>
        </dl>
      </header>

      <section className="certifications-brand-index" aria-labelledby="represented-brands-heading">
        <div className="certifications-section-heading certifications-section-heading--inline">
          <div>
            <p className="certifications-eyebrow"><ShieldCheck aria-hidden="true" /> Current catalog</p>
            <h2 id="represented-brands-heading">Browse approved brands</h2>
          </div>
          <p>Select a brand to see its current dolls.</p>
        </div>
        <div className="certifications-brand-list">
          {liveAuthorizedBrands.map((brand) => (
            <Link key={brand.value} href={brandHubHref(brand.value)}>
              {brand.label}<ArrowRight aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>

      <section className="certifications-files" aria-labelledby="certificate-grid-heading">
        <div className="certifications-section-heading">
          <p className="certifications-eyebrow"><FileCheck2 aria-hidden="true" /> Certificates on file</p>
          <h2 id="certificate-grid-heading">Brand-issued authorization</h2>
          <p>Open a card to inspect the complete document supplied by the manufacturer.</p>
        </div>

        <div className="certifications-grid">
          {certificateEntries.map((entry) => {
            const coveredBrands = entry.relatedBrandValues?.map((value) => getCatalogBrand(value)?.label ?? value) ?? [];
            return (
              <article key={entry.id} id={entry.id} className="certification-card">
                <a href={entry.certificateSrc!} target="_blank" rel="noreferrer" className="certification-card__preview" aria-label={`Open ${entry.brand} authorization certificate`}>
                  <Image
                    src={entry.certificatePreviewSrc!}
                    alt={`${entry.brand} certificate authorizing DollWow as a retailer`}
                    fill
                    sizes="(max-width: 760px) 100vw, 240px"
                    className="object-contain"
                  />
                  <span><ExternalLink aria-hidden="true" /> Open document</span>
                </a>
                <div className="certification-card__body">
                  <p className="certification-card__status"><BadgeCheck aria-hidden="true" /> Certificate supplied</p>
                  <h3>{entry.brand}</h3>
                  <p>
                    Issued by {entry.certificateIssuer ?? entry.brand} to confirm DollWow as an approved retailer.
                  </p>
                  {coveredBrands.length ? <p className="certification-card__covers">Also covers: {coveredBrands.join(", ")}</p> : null}
                  <div className="certification-card__actions">
                    {entry.brandValue ? <Link href={brandHubHref(entry.brandValue)}>Browse brand <ArrowRight aria-hidden="true" /></Link> : <span>Products coming soon</span>}
                    <a href={entry.certificateSrc!} target="_blank" rel="noreferrer">View certificate <ExternalLink aria-hidden="true" /></a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {writtenConfirmations.length ? (
        <section className="certifications-written" aria-labelledby="written-confirmations-heading">
          <div className="certifications-section-heading certifications-section-heading--inline">
            <div>
              <p className="certifications-eyebrow"><ShieldCheck aria-hidden="true" /> Confirmed directly</p>
              <h2 id="written-confirmations-heading">Written brand confirmations</h2>
            </div>
            <p>Approval is on file while a public certificate is not available.</p>
          </div>
          <div className="certifications-written__grid">
            {writtenConfirmations.map((entry) => (
              <article key={entry.id}>
                <span className="certifications-written__icon"><ShieldCheck aria-hidden="true" /></span>
                <div>
                  <h3>{entry.brand}</h3>
                  <p>The manufacturer has confirmed in writing that DollWow is approved to sell its products.</p>
                  {entry.brandValue ? <Link href={brandHubHref(entry.brandValue)}>Browse brand <ArrowRight aria-hidden="true" /></Link> : null}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}
