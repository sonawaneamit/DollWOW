import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, MessageCircle, PackageCheck, Ruler, Scale, ShieldCheck, Truck } from "lucide-react";
import { BrandAuthorizationCard } from "@/components/BrandAuthorizationCard";
import { PdpTrackers } from "@/components/PdpTrackers";
import { WishlistButton } from "@/components/WishlistButton";
import { CompareButton } from "@/components/compare/CompareButton";
import { ProductBuyActions } from "@/components/ProductBuyActions";
import { ProductGallery } from "@/components/ProductGallery";
import { ProductLowerAlive } from "@/components/ProductLowerAlive";
import { ProductOptions } from "@/components/ProductOptions";
import { ResponsiveDetails } from "@/components/ResponsiveDetails";
import { WarehouseStatusBadge } from "@/components/WarehouseStatusBadge";
import { scoreSimilarProducts } from "@/lib/catalog/similar";
import { getCatalogBrand } from "@/lib/catalog/brands";
import { isLiveAuthorizedBrand } from "@/lib/catalog/authorizations";
import { productDisplayName, productDisplayNameForUi, productPdpTitle, productPublicTitle } from "@/lib/catalog/naming";
import {
  buildPdpFitChecks,
  buildPdpMetadata,
  buildProductFaqStructuredData,
  buildProductStructuredData
} from "@/lib/catalog/pdpSeo";
import { primaryProductSpecs, productHeroIntro, productMeasurementSpecs } from "@/lib/catalog/productSpecs";
import { getProductAdminMetafieldsByHandle } from "@/lib/shopify/admin";
import { DisplayMoney } from "@/components/CurrencyProvider";
import { getProductByHandle, getProducts } from "@/lib/shopify/storefront";

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params;
  const product = await getProductByHandle(handle);
  if (!product) return {};
  const metadata = buildPdpMetadata(product);
  if ((product.tags || []).some((tag) => /^dollwow-test$/i.test(tag))) {
    return { ...metadata, robots: { index: false, follow: false } };
  }
  return metadata;
}

export default async function ProductPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const [storefrontProduct, adminProductData] = await Promise.all([getProductByHandle(handle), getProductAdminMetafieldsByHandle(handle)]);
  if (!storefrontProduct) notFound();
  const product = mergeAdminMetafields(storefrontProduct, adminProductData);
  const relatedBrand = getCatalogBrand(product.extended.brand ?? product.vendor);
  const brandTag = relatedBrand?.tags[0] ?? relatedBrand?.value;
  const brandQuery = brandTag ? `tag:${JSON.stringify(brandTag)}` : `title:${JSON.stringify(product.extended.brand ?? product.vendor)}`;
  const brandProducts = await getProducts({
    query: brandQuery,
    first: 600,
    imageFirst: 1,
    cacheKey: `pdp-related-brand-v2-${(relatedBrand?.value ?? product.extended.brand ?? product.vendor).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    revalidate: 3600
  });
  const price = product.priceRange.minVariantPrice;
  const firstAvailable = product.variants.find((variant) => variant.availableForSale) ?? product.variants[0];
  const alternatives = scoreSimilarProducts(product, brandProducts, 5);
  const displayTitle = productPublicTitle(product);
  const displayName = productDisplayName(product);
  const displayNameUi = productDisplayNameForUi(product);
  const pdpTitle = productPdpTitle(product);
  const intro = productHeroIntro(product);
  const heroSpecs = primaryProductSpecs(product);
  const measurements = productMeasurementSpecs(product);
  const fitChecks = buildPdpFitChecks(product);
  const productStructuredData = buildProductStructuredData(product);
  const faqStructuredData = buildProductFaqStructuredData(product);
  const productBrand = product.extended.brand ?? product.vendor;
  const hasAuthorizationSection = isLiveAuthorizedBrand(productBrand);

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productStructuredData) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }} />
      <ToneBand tone="deep" className="pt-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <ProductGallery product={product} />
          <div id="overview" className="flex flex-col justify-center scroll-mt-24">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm  text-gold-300">{product.extended.brand ?? product.vendor}</p>
              <WarehouseStatusBadge status={product.extended.stockStatus} />
              <CompareButton
                entry={{ productHandle: product.handle, productTitle: displayTitle, brand: product.extended.brand ?? product.vendor, imageUrl: (product.featuredImage ?? product.images[0])?.url, unitPrice: Number(price.amount), currencyCode: price.currencyCode, merchandiseId: firstAvailable?.id, material: product.extended.material, heightCm: product.extended.heightCm, weightLb: product.extended.weightLb, cupSize: product.extended.cupSize, productType: product.productType, measurements: product.extended.measurements, warehouseRegions: product.extended.warehouseRegions, stockStatus: product.extended.stockStatus, customAvailable: product.extended.customAvailable }}
                label
                className="min-h-11 rounded-full border border-gold-500/24 px-3 text-sm font-semibold text-ivory-200 hover:border-gold-300/55 hover:text-gold-200"
              />
            </div>
            {displayNameUi ? <p className="mt-3 text-base font-medium  text-gold-200/90">{displayNameUi}</p> : null}
            <h1 className="mt-2 text-3xl font-semibold leading-tight text-ivory-50 sm:text-4xl">{displayNameUi ? pdpTitle : displayTitle}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <strong className="text-3xl text-gold-300"><DisplayMoney amount={price.amount} currencyCode={price.currencyCode} /></strong>
              <span className="text-sm text-ivory-500">Base configuration</span>
            </div>
            <p className="mt-4 max-w-2xl text-base leading-7 text-ivory-300">{intro}</p>
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
            {firstAvailable && (
              <ProductBuyActions
                merchandiseId={firstAvailable.id}
                productTitle={displayTitle}
                productDisplayName={displayName || undefined}
                productHandle={product.handle}
                productImage={product.featuredImage ?? product.images[0] ?? null}
                brand={productBrand}
                unitPrice={Number(price.amount)}
                currencyCode={price.currencyCode}
                deliveryEstimate={product.extended.deliveryEstimate}
                readyToShip={product.extended.stockStatus === "ready_to_ship"}
                customAvailable={product.extended.customAvailable}
                warehouseCountry={product.extended.warehouseCountry}
                warehouseRegions={product.extended.warehouseRegions}
              />
            )}
            <nav aria-label="Product page sections" className="pdp-quick-nav">
              <a href="#overview">Overview</a>
              <a href="#build-studio">{product.extended.stockStatus === "ready_to_ship" ? "Included" : "Options"}</a>
              <a href="#product-specs">Specs</a>
              {hasAuthorizationSection ? <a href="#authorization">Authorization</a> : null}
            </nav>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
              <WishlistButton
                entry={{
                  productHandle: product.handle,
                  productTitle: displayTitle,
                  brand: product.extended.brand ?? product.vendor,
                  imageUrl: (product.featuredImage ?? product.images[0])?.url,
                  imageAlt: (product.featuredImage ?? product.images[0])?.altText ?? displayTitle,
                  unitPrice: Number(price.amount),
                  currencyCode: price.currencyCode,
                  readyToShip: product.extended.stockStatus === "ready_to_ship"
                }}
                label
                className="font-semibold text-ivory-300 hover:text-gold-200"
              />
              <Link
                href="/support"
                className="inline-flex items-center gap-2 font-semibold text-ivory-300 underline-offset-4 transition hover:text-gold-200 hover:underline"
              >
                <MessageCircle className="h-4 w-4 text-gold-300" /> Ask a specialist before buying
              </Link>
            </div>
          </div>
        </div>
      </ToneBand>

      <ToneBand tone="blush" className="pdp-builder-band">
        <div id="build-studio" className="scroll-mt-28">
          <ProductOptions product={product} />
        </div>
      </ToneBand>

      <ToneBand tone="deep" className="pdp-details-band">
        <ProductSpecSummary product={product} measurements={measurements} fitChecks={fitChecks} />
      </ToneBand>

      <ProductLowerAlive product={product} similarProducts={alternatives} />
      {hasAuthorizationSection ? (
        <ToneBand tone="deep" className="pdp-authorization-band">
          <div id="authorization" className="scroll-mt-24">
            <BrandAuthorizationCard brand={productBrand} />
          </div>
        </ToneBand>
      ) : null}
      <PdpTrackers product={product} />
    </div>
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
      <p className="text-sm  text-ivory-600">{label}</p>
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
    ["Warehouse", product.extended.stockStatus === "ready_to_ship" ? (product.extended.warehouseRegions?.join(", ") || product.extended.warehouseCountry) : ""],
    ["Delivery", product.extended.deliveryEstimate]
  ].filter((row): row is [string, string] => Boolean(row[1]));
  const measurementGroups = groupMeasurements(measurements);

  return (
    <ResponsiveDetails
      id="product-specs"
      className="pdp-spec-summary scroll-mt-24"
      labelledBy="product-specs-heading"
      summary={<summary className="pdp-spec-summary-head">
        <div>
          <p className="alive-eyebrow">
            <span />
            Product specs
          </p>
          <h2 id="product-specs-heading">Measurements and details</h2>
        </div>
        <div>
          <p>Use these specs for clothing fit, storage planning, lifting comfort, and overall size comparison before checkout.</p>
          <span className="pdp-spec-toggle">View all measurements</span>
        </div>
      </summary>}
    >

      <div className="pdp-spec-summary-grid">
        <div className="pdp-detail-grid">
          {detailRows.map(([label, value]) => (
            <div key={label} className="alive-spec-cell">
              <p>{label}</p>
              <strong>{value}</strong>
            </div>
          ))}
        </div>

        <div className="pdp-spec-dashboard">
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

        </div>
      </div>
    </ResponsiveDetails>
  );
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

function fitCheckVisual(index: number) {
  return [
    { icon: <PackageCheck className="h-5 w-5" />, toneClass: "is-olive" },
    { icon: <Ruler className="h-5 w-5" />, toneClass: "is-copper" },
    { icon: <Scale className="h-5 w-5" />, toneClass: "is-rose" },
    { icon: <Truck className="h-5 w-5" />, toneClass: "is-copper" }
  ][index] ?? { icon: <Scale className="h-5 w-5" />, toneClass: "is-copper" };
}

function measurementGroupVisual(title: string) {
  if (title === "Core size") {
    return { icon: <Scale className="h-5 w-5" />, toneClass: "is-copper", note: "Key size markers shoppers compare first." };
  }
  if (title === "Body proportions") {
    return { icon: <Ruler className="h-5 w-5" />, toneClass: "is-rose", note: "Useful for clothing fit and silhouette expectations." };
  }
  return { icon: <ShieldCheck className="h-5 w-5" />, toneClass: "is-olive", note: "Reference dimensions often checked before purchase." };
}
