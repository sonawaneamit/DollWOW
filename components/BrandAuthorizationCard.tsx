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

  const label = authorization?.brand ?? catalogBrand?.label ?? brand ?? "this brand";
  const hasCertificate = authorization?.status === "certificate" && authorization.certificateSrc && authorization.certificatePreviewSrc;
  const isWrittenConfirmation = authorization?.status === "written-confirmation";

  return (
    <section className={`my-8 overflow-hidden rounded-[8px] border border-gold-500/24 bg-[linear-gradient(120deg,rgba(65,35,25,0.64),rgba(21,10,8,0.96))] ${variant === "brand" ? "md:grid md:grid-cols-[220px_1fr]" : "sm:grid sm:grid-cols-[154px_1fr]"}`} aria-label={`${label} authorization`}>
      {hasCertificate ? (
        <a href={authorization.certificateSrc!} target="_blank" rel="noreferrer" className="group relative block min-h-40 border-b border-gold-500/16 bg-[#f8efe8] sm:border-b-0 sm:border-r" aria-label={`Open ${label} authorization certificate`}>
          <Image
            src={authorization.certificatePreviewSrc!}
            alt={`${label} authorized vendor certificate`}
            fill
            sizes={variant === "brand" ? "220px" : "154px"}
            className="object-contain p-3 transition duration-300 group-hover:scale-[1.025]"
          />
        </a>
      ) : (
        <div className="flex min-h-40 items-center justify-center border-b border-gold-500/16 bg-[#20110d] text-gold-300 sm:border-b-0 sm:border-r">
          <ShieldCheck className="h-12 w-12" strokeWidth={1.4} />
        </div>
      )}
      <div className="p-5 sm:p-6">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-gold-300">
          <BadgeCheck className="h-4 w-4" />
          Authorized vendor
        </p>
        <h2 className="mt-2 text-xl font-semibold text-ivory-50">Authorized to sell {label}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ivory-300">
          {hasCertificate
            ? `DollWow is an approved seller for ${label}. View the authorization certificate shared by the brand.`
            : isWrittenConfirmation
              ? `DollWow is an approved seller for ${label}. Brand confirmation is on file.`
              : `DollWow is an approved seller for ${label}.`}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {hasCertificate ? (
            <a href={authorization.certificateSrc!} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-[8px] border border-gold-400/45 px-3 py-2 text-sm font-semibold text-gold-200 transition hover:bg-gold-300 hover:text-ink-950">
              View certificate <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : null}
          <Link href="/authorized-vendors" className="inline-flex items-center rounded-[8px] border border-gold-500/22 px-3 py-2 text-sm font-semibold text-ivory-200 transition hover:border-gold-300/50 hover:text-ivory-50">
            All authorized brands
          </Link>
        </div>
      </div>
    </section>
  );
}
