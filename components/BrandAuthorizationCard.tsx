import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, ExternalLink, ShieldCheck } from "lucide-react";
import { getBrandAuthorization, isLiveAuthorizedBrand } from "@/lib/catalog/authorizations";
import { getCatalogBrand } from "@/lib/catalog/brands";

type BrandAuthorizationCardProps = {
  brand: string | undefined | null;
  variant?: "product" | "brand";
};

export function BrandAuthorizationCard({ brand, variant = "product" }: BrandAuthorizationCardProps) {
  const authorization = getBrandAuthorization(brand);
  const catalogBrand = getCatalogBrand(brand);
  const isAuthorized = Boolean(authorization || isLiveAuthorizedBrand(brand));

  if (!isAuthorized) return null;

  const label = catalogBrand?.label ?? authorization?.brand ?? brand ?? "this brand";
  const certificateIssuer = authorization?.certificateIssuer ?? label;
  const relatedBrandNote = catalogBrand?.value ? authorization?.relatedBrandNotes?.[catalogBrand.value] : undefined;
  const hasCertificate = authorization?.status === "certificate" && authorization.certificateSrc && authorization.certificatePreviewSrc;
  const isWrittenConfirmation = authorization?.status === "written-confirmation";
  const compact = variant === "product";
  const statusEyebrow = hasCertificate ? "Brand certification" : "Approved seller";
  const statusTitle = hasCertificate ? `Certified to sell ${label}` : `Approved to sell ${label}`;

  return (
    <section className={`overflow-hidden rounded-lg border border-border bg-surface text-text shadow-card ${variant === "brand" ? "my-8 md:grid md:grid-cols-[220px_1fr]" : "sm:grid sm:grid-cols-[96px_1fr]"}`} aria-label={`${label} authorization`}>
      {hasCertificate ? (
        <a href={authorization.certificateSrc!} target="_blank" rel="noreferrer" className={`group relative block border-b border-border bg-[#f8efe8] sm:border-b-0 sm:border-r ${compact ? "min-h-28" : "min-h-40"}`} aria-label={`Open ${label} authorization certificate`}>
          <Image
            src={authorization.certificatePreviewSrc!}
            alt={`${label} certification authorizing DollWow as a retailer`}
            fill
            sizes={variant === "brand" ? "220px" : "96px"}
            className="object-contain p-3 transition duration-300 group-hover:scale-[1.025]"
          />
        </a>
      ) : (
        <div className={`flex items-center justify-center border-b border-border bg-accent-tint text-accent sm:border-b-0 sm:border-r ${compact ? "min-h-24" : "min-h-40"}`}>
          <ShieldCheck className={compact ? "h-8 w-8" : "h-12 w-12"} strokeWidth={1.4} />
        </div>
      )}
      <div className={compact ? "p-4" : "p-5 sm:p-6"}>
        <p className="flex items-center gap-2 text-sm font-semibold text-accent">
          <BadgeCheck className="h-4 w-4" />
          {statusEyebrow}
        </p>
        <h2 className={`mt-2 font-semibold text-text ${compact ? "text-lg" : "text-xl"}`}>{statusTitle}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-text-dim">
          {hasCertificate
            ? relatedBrandNote ?? `DollWow is an approved seller for ${label}. View the authorization certificate shared by ${certificateIssuer}.`
            : isWrittenConfirmation
              ? `DollWow is an approved seller for ${label}. Brand confirmation is on file.`
              : `DollWow is an approved seller for ${label}.`}
        </p>
        <div className={`${compact ? "mt-3" : "mt-4"} flex flex-wrap gap-3`}>
          {hasCertificate ? (
            <a href={authorization.certificateSrc!} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-button bg-accent px-4 text-sm font-semibold text-white transition-colors hover:bg-accent-hover">
              View certificate <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : null}
          <Link href="/authorized-vendors" className="inline-flex min-h-11 items-center rounded-button border-2 border-accent px-4 text-sm font-semibold text-accent transition-colors hover:bg-accent-tint">
            {hasCertificate ? "All certifications" : "All seller approvals"}
          </Link>
        </div>
      </div>
    </section>
  );
}
