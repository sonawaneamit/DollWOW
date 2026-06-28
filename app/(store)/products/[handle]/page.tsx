import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Camera, CheckCircle2, ChevronRight, Clock3, MessageCircle, PackageCheck, Scale, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { GoldButton } from "@/components/GoldButton";
import { ProductBuyActions } from "@/components/ProductBuyActions";
import { ProductGallery } from "@/components/ProductGallery";
import { ProductLowerAlive } from "@/components/ProductLowerAlive";
import { ProductOptions } from "@/components/ProductOptions";
import { WarehouseStatusBadge } from "@/components/WarehouseStatusBadge";
import { getCatalogBrand } from "@/lib/catalog/brands";
import { productBodyType } from "@/lib/catalog/bodyType";
import { productDisplayName, productDisplayNameForUi, productPdpTitle, productPublicTitle } from "@/lib/catalog/naming";
import {
  buildPdpDecisionNotes,
  buildPdpFitChecks,
  buildPdpMetadata,
  buildPdpSearchFit,
  buildPdpTrustSignals,
  buildProductFaqStructuredData,
  buildProductStructuredData
} from "@/lib/catalog/pdpSeo";
import { primaryProductSpecs, productHeroIntro, productMeasurementSpecs } from "@/lib/catalog/productSpecs";
import { getProductAdminMetafieldsByHandle } from "@/lib/shopify/admin";
import { formatMoney } from "@/lib/utils/currency";
import { getProductByHandle, getProducts } from "@/lib/shopify/storefront";

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params;
  const product = await getProductByHandle(handle);
  if (!product) return {};
  return buildPdpMetadata(product);
}

export default async function ProductPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const [storefrontProduct, allProducts, adminProductData] = await Promise.all([
    getProductByHandle(handle),
    getProducts({ first: 8 }),
    getProductAdminMetafieldsByHandle(handle)
  ]);
  if (!storefrontProduct) notFound();
  const product = mergeAdminMetafields(storefrontProduct, adminProductData);
  const price = product.priceRange.minVariantPrice;
  const firstAvailable = product.variants.find((variant) => variant.availableForSale) ?? product.variants[0];
  const alternatives = allProducts.filter((item) => item.id !== product.id).slice(0, 4);
  const displayTitle = productPublicTitle(product);
  const displayName = productDisplayName(product);
  const displayNameUi = productDisplayNameForUi(product);
  const pdpTitle = productPdpTitle(product);
  const bodyType = productBodyType(product);
  const intro = productHeroIntro(product);
  const heroSpecs = primaryProductSpecs(product);
  const measurements = productMeasurementSpecs(product);
  const searchFit = buildPdpSearchFit(product);
  const decisionNotes = buildPdpDecisionNotes(product);
  const trustSignals = buildPdpTrustSignals(product);
  const fitChecks = buildPdpFitChecks(product);
  const productStructuredData = buildProductStructuredData(product);
  const faqStructuredData = buildProductFaqStructuredData(product);

  return (
    <main className="pb-28 lg:pb-0">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productStructuredData) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }} />
      <ToneBand tone="deep" className="pt-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <ProductGallery product={product} />
          <div className="flex flex-col justify-center">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm uppercase tracking-[0.18em] text-gold-300">{product.extended.brand ?? product.vendor}</p>
              <WarehouseStatusBadge status={product.extended.stockStatus} />
            </div>
            {displayNameUi ? <p className="mt-3 text-base font-medium uppercase tracking-[0.16em] text-gold-200/90">{displayNameUi}</p> : null}
            <h1 className="mt-2 text-3xl font-semibold leading-tight text-ivory-50 sm:text-4xl">{displayNameUi ? pdpTitle : displayTitle}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <strong className="text-3xl text-gold-300">{formatMoney(price.amount, price.currencyCode)}</strong>
              <span className="text-sm text-ivory-500">Base configuration</span>
            </div>
            <Link
              href={`/compare?product=${encodeURIComponent(product.handle)}&title=${encodeURIComponent(displayTitle)}`}
              className="mt-3 inline-flex w-fit items-center gap-2 rounded-full border border-gold-500/18 bg-ivory-50/[0.045] px-3 py-2 text-sm font-semibold text-ivory-100 transition hover:border-gold-300/60 hover:bg-ivory-50/[0.07]"
            >
              <Scale className="h-4 w-4 text-gold-300" />
              Found it cheaper? We&apos;ll check the price
            </Link>
            <p className="mt-4 max-w-2xl text-base leading-7 text-ivory-300">{intro}</p>
            <ProductSearchFitCard title={searchFit.title} summary={searchFit.summary} chips={searchFit.chips.map((chip) => chip.label)} />
            <ProductDecisionNotes notes={decisionNotes} />
            <ProductTrustSignalGrid signals={trustSignals} />
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-ivory-300">
              {heroSpecs.map((spec) => (
                <Spec key={spec.label} label={spec.label} value={spec.value} />
              ))}
            </div>
            <div className="mt-5 grid gap-2 text-sm text-ivory-300 sm:grid-cols-3">
              <TrustLine icon={<ShieldCheck className="h-4 w-4" />} text="Discreet billing" />
              <TrustLine icon={<Truck className="h-4 w-4" />} text="Timing confirmed" />
              <TrustLine icon={<CheckCircle2 className="h-4 w-4" />} text="Team QC support" />
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <GoldButton href={`/compare?product=${encodeURIComponent(product.handle)}&title=${encodeURIComponent(displayTitle)}`} variant="secondary">
                <Scale className="h-4 w-4" /> Found this somewhere else?
              </GoldButton>
              <GoldButton href="/support" variant="secondary">
                <MessageCircle className="h-4 w-4" /> Ask before buying
              </GoldButton>
            </div>
            {firstAvailable && (
              <ProductBuyActions
                merchandiseId={firstAvailable.id}
                productTitle={displayTitle}
                productDisplayName={displayName || undefined}
                productHandle={product.handle}
                productImage={product.featuredImage ?? product.images[0] ?? null}
                bodyType={bodyType}
                readyToShip={product.extended.stockStatus === "ready_to_ship"}
              />
            )}
          </div>
        </div>
        <ProductSpecSummary product={product} measurements={measurements} fitChecks={fitChecks} />
      </ToneBand>

      <ToneBand tone="blush">
        <div id="build-studio" className="scroll-mt-28">
          <ProductOptions product={product} />
        </div>
      </ToneBand>

      <ProductLowerAlive product={product} similarProducts={alternatives} />
    </main>
  );
}

function mergeAdminMetafields(
  product: NonNullable<Awaited<ReturnType<typeof getProductByHandle>>>,
  adminData: Awaited<ReturnType<typeof getProductAdminMetafieldsByHandle>>
) {
  if (!adminData) return product;
  return {
    ...product,
    extended: {
      ...product.extended,
      measurements: adminData.measurements || product.extended.measurements,
      headModel: adminData.headModel || product.extended.headModel
    }
  };
}

function ProductSearchFitCard({ title, summary, chips }: { title: string; summary: string; chips: string[] }) {
  return (
    <section className="pdp-search-fit tone-card mt-5" aria-label={title}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-300">{title}</p>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ivory-300">{summary}</p>
      </div>
      <div className="pdp-search-fit-chips">
        {chips.map((chip) => (
          <span key={chip}>{chip}</span>
        ))}
      </div>
    </section>
  );
}

function ProductDecisionNotes({ notes }: { notes: Array<{ title: string; body: string }> }) {
  return (
    <section className="pdp-decision-notes" aria-label="Quick buying notes">
      {notes.map((note, index) => {
        const visual = decisionNoteVisual(index);
        return (
          <article key={note.title} className="tone-card pdp-decision-note pdp-visual-card">
            <div className={`pdp-visual-badge ${visual.toneClass}`}>{visual.icon}</div>
            <div className="pdp-visual-copy">
              <p>{note.title}</p>
              <strong>{note.body}</strong>
            </div>
          </article>
        );
      })}
    </section>
  );
}

function ProductTrustSignalGrid({ signals }: { signals: Array<{ title: string; body: string; href: string; label: string }> }) {
  return (
    <section className="pdp-trust-grid" aria-label="Order reassurance">
      {signals.map((signal, index) => {
        const visual = trustSignalVisual(index);
        return (
          <Link key={signal.title} href={signal.href} className="tone-card pdp-trust-card pdp-visual-card">
            <div className={`pdp-visual-badge ${visual.toneClass}`}>{visual.icon}</div>
            <div className="pdp-visual-copy">
              <p>{signal.title}</p>
              <strong>{signal.body}</strong>
              <span>
                {signal.label}
                <ChevronRight className="h-4 w-4" />
              </span>
            </div>
          </Link>
        );
      })}
    </section>
  );
}

function ToneBand({
  tone,
  children,
  className = ""
}: {
  tone: "deep" | "rose" | "blush";
  children: ReactNode;
  className?: string;
}) {
  return (
    <section data-tone={tone} className={`tone-section ${className}`}>
      <div className="tone-inner space-y-8">{children}</div>
    </section>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="tone-card rounded-[14px] p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-ivory-600">{label}</p>
      <p className="mt-1 font-semibold text-ivory-100">{value}</p>
    </div>
  );
}

function TrustLine({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="tone-card flex min-h-11 items-center gap-2 rounded-[12px] px-3">
      <span className="text-gold-300">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

function ProductSpecSummary({
  product,
  measurements,
  fitChecks
}: {
  product: NonNullable<Awaited<ReturnType<typeof getProductByHandle>>>;
  measurements: Array<{ label: string; value: string }>;
  fitChecks: Array<{ title: string; body?: string; lines?: string[] }>;
}) {
  const detailRows = [
    ["Brand", product.extended.brand ?? product.vendor],
    ["Head model", formatHeadModel(product.extended.headModel)],
    ["Material", product.extended.material],
    ["Availability", product.extended.stockStatus === "ready_to_ship" ? "Ready to ship after stock confirmation" : "Factory order"],
    ["Warehouse", product.extended.stockStatus === "ready_to_ship" ? product.extended.warehouseCountry : ""],
    ["Delivery", product.extended.deliveryEstimate]
  ].filter((row): row is [string, string] => Boolean(row[1]));
  const measurementGroups = groupMeasurements(measurements);
  const relatedPaths = productRelatedPaths(product);

  return (
    <section className="pdp-spec-summary" aria-labelledby="product-specs-heading">
      <div className="pdp-spec-summary-head">
        <div>
          <p className="alive-eyebrow">
            <span />
            Product specs
          </p>
          <h2 id="product-specs-heading">Measurements and details</h2>
        </div>
        <p>Use these specs for clothing fit, storage planning, lifting comfort, and overall size comparison before checkout.</p>
      </div>

      <div className="pdp-spec-summary-grid">
        <div className="pdp-detail-grid">
          {detailRows.map(([label, value]) => (
            <div key={label} className="alive-spec-cell">
              <p>{label}</p>
              <strong>{value}</strong>
            </div>
          ))}
        </div>

        <div className="space-y-5">
          <div className="pdp-fit-checks">
            {fitChecks.map((check, index) => {
              const visual = fitCheckVisual(index);
              return (
                <article key={check.title} className="tone-card pdp-fit-check pdp-visual-card">
                  <div className={`pdp-visual-badge ${visual.toneClass}`}>{visual.icon}</div>
                  <div className="pdp-visual-copy">
                    <p>{check.title}</p>
                    {check.lines?.length ? (
                      <ul className="pdp-fit-check-list">
                        {check.lines.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    ) : (
                      <strong>{check.body}</strong>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          {measurementGroups.length > 0 && (
            <div className="pdp-measurement-groups">
              {measurementGroups.map((group) => (
                <section key={group.title} className="pdp-measurement-group">
                  <div className="pdp-measurement-group-head">
                    <div className={`pdp-visual-badge ${measurementGroupVisual(group.title).toneClass}`}>{measurementGroupVisual(group.title).icon}</div>
                    <div>
                      <h3>{group.title}</h3>
                      <p>{measurementGroupVisual(group.title).note}</p>
                    </div>
                  </div>
                  <div className="alive-measurement-table">
                    {group.items.map((spec) => (
                      <div key={spec.label} className="alive-measurement-row">
                        <span>{spec.label}</span>
                        <strong>{spec.value}</strong>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}

          {relatedPaths.length ? (
            <section className="tone-card rounded-[8px] p-5" aria-labelledby="product-related-paths-heading">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-300">Related buying paths</p>
              <h3 id="product-related-paths-heading" className="mt-2 text-lg font-semibold text-ivory-50">
                Compare this doll in context
              </h3>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {relatedPaths.map((path) => (
                  <Link
                    key={path.href}
                    href={path.href}
                    className="rounded-[8px] border border-gold-500/14 bg-ivory-50/[0.045] p-3 text-sm font-semibold text-ivory-100 transition hover:border-gold-300/50 hover:bg-ivory-50/[0.07]"
                  >
                    {path.label}
                    <span className="mt-1 block text-xs font-normal leading-5 text-ivory-500">{path.description}</span>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function productRelatedPaths(product: NonNullable<Awaited<ReturnType<typeof getProductByHandle>>>) {
  const paths: Array<{ label: string; href: string; description: string }> = [
    { label: "All sex dolls", href: "/shop/sex-dolls", description: "Compare this listing against the full DollWow catalog." }
  ];
  const material = String(product.extended.material || "").toLowerCase();
  const brand = getCatalogBrand(product.extended.brand || product.vendor);

  if (brand) {
    paths.push({
      label: `${brand.label} brand hub`,
      href: `/brands/${brand.collectionHandle}`,
      description: `Compare current ${brand.label} listings, options, and buyer guidance.`
    });
  }

  if (material.includes("tpe")) {
    paths.push(
      { label: "TPE dolls", href: "/shop/tpe", description: "Compare material, weight, price, and care tradeoffs." },
      { label: "TPE vs silicone guide", href: "/learn/tpe-vs-silicone-sex-dolls", description: "Review material differences before checkout." }
    );
  }

  if (material.includes("silicone")) {
    paths.push(
      { label: "Silicone dolls", href: "/shop/silicone", description: "Compare premium material builds and sculpt detail." },
      { label: "Most realistic guide", href: "/learn/most-realistic-sex-dolls", description: "Review realism factors beyond photos." }
    );
  }

  if (product.extended.bodyType === "male") {
    paths.push(
      { label: "Male dolls", href: "/shop/male-dolls", description: "Compare male body-type listings and measurements." },
      { label: "Male doll guide", href: "/learn/male-sex-doll-buying-guide", description: "Review body scale, material, and option checks." }
    );
  }

  if (product.extended.heightCm && product.extended.heightCm < 155) {
    paths.push(
      { label: "Mini sex dolls", href: "/shop/mini-sex-dolls", description: "Compare compact builds, storage, and handling." },
      { label: "Mini doll guide", href: "/learn/mini-sex-dolls", description: "Review size, privacy, and storage tradeoffs." }
    );
  }

  if (product.extended.stockStatus === "ready_to_ship") {
    paths.push(
      { label: "Ready-to-ship dolls", href: "/shop/ready-to-ship", description: "Compare timing, stock path, and fixed configuration." },
      { label: "Ready vs custom guide", href: "/learn/ready-to-ship-vs-custom-sex-dolls", description: "Understand the order path tradeoffs." }
    );
  } else {
    paths.push(
      { label: "Custom dolls", href: "/shop/custom", description: "Compare factory-order paths and product-specific options." },
      { label: "Ready vs custom guide", href: "/learn/ready-to-ship-vs-custom-sex-dolls", description: "Understand timing, options, and approval steps." }
    );
  }

  paths.push(
    { label: "Sex doll cost guide", href: "/learn/sex-doll-cost", description: "Compare delivered value beyond the base price." },
    { label: "Compare a listing", href: `/compare?product=${encodeURIComponent(product.handle)}&title=${encodeURIComponent(productPublicTitle(product))}`, description: "Ask DollWow to review another offer before checkout." }
  );

  const seen = new Set<string>();
  return paths.filter((path) => {
    if (seen.has(path.href)) return false;
    seen.add(path.href);
    return true;
  }).slice(0, 8);
}

function formatHeadModel(value?: string) {
  const text = String(value || "").trim();
  if (!text) return "";
  const normalized = text.match(/(?:head[-_\s]*)?([a-z]?\d+[a-z-]*)/i)?.[1];
  if (normalized) return `Head #${normalized.toUpperCase()}`;
  if (/^head\b/i.test(text)) return text.replace(/^head[-_\s]*/i, "Head #");
  return `Head #${text}`;
}

function groupMeasurements(measurements: Array<{ label: string; value: string }>) {
  const groups = [
    { title: "Core size", labels: ["Height", "Weight", "Cup size", "Feet Length"] },
    { title: "Body proportions", labels: ["Bust", "Waist", "Hip", "Shoulders Width", "Arms Length", "Legs Length"] },
    { title: "Depth and fit", labels: ["Vagina Depth", "Anus Depth", "Oral Depth"] }
  ];

  return groups
    .map((group) => ({
      title: group.title,
      items: group.labels
        .map((label) => measurements.find((measurement) => measurement.label === label))
        .filter((item): item is { label: string; value: string } => Boolean(item))
    }))
    .filter((group) => group.items.length > 0);
}

function decisionNoteVisual(index: number) {
  return [
    { icon: <Scale className="h-5 w-5" />, toneClass: "is-copper" },
    { icon: <Sparkles className="h-5 w-5" />, toneClass: "is-rose" },
    { icon: <Clock3 className="h-5 w-5" />, toneClass: "is-olive" }
  ][index] ?? { icon: <CheckCircle2 className="h-5 w-5" />, toneClass: "is-copper" };
}

function trustSignalVisual(index: number) {
  return [
    { icon: <ShieldCheck className="h-5 w-5" />, toneClass: "is-copper" },
    { icon: <Camera className="h-5 w-5" />, toneClass: "is-rose" },
    { icon: <PackageCheck className="h-5 w-5" />, toneClass: "is-olive" }
  ][index] ?? { icon: <ShieldCheck className="h-5 w-5" />, toneClass: "is-copper" };
}

function fitCheckVisual(index: number) {
  return [
    { icon: <PackageCheck className="h-5 w-5" />, toneClass: "is-olive" },
    { icon: <Sparkles className="h-5 w-5" />, toneClass: "is-copper" },
    { icon: <Scale className="h-5 w-5" />, toneClass: "is-rose" },
    { icon: <Truck className="h-5 w-5" />, toneClass: "is-copper" }
  ][index] ?? { icon: <Scale className="h-5 w-5" />, toneClass: "is-copper" };
}

function measurementGroupVisual(title: string) {
  if (title === "Core size") {
    return { icon: <Scale className="h-5 w-5" />, toneClass: "is-copper", note: "Key size markers shoppers compare first." };
  }
  if (title === "Body proportions") {
    return { icon: <Sparkles className="h-5 w-5" />, toneClass: "is-rose", note: "Useful for clothing fit and silhouette expectations." };
  }
  return { icon: <ShieldCheck className="h-5 w-5" />, toneClass: "is-olive", note: "Reference dimensions often checked before purchase." };
}
