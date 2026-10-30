import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, MessageCircle, PackageCheck, Ruler, Scale, ShieldCheck, Truck } from "lucide-react";
import { BrandAuthorizationCard } from "@/components/BrandAuthorizationCard";
import { PdpTrackers } from "@/components/PdpTrackers";
import { WishlistButton } from "@/components/WishlistButton";
import { CompareButton } from "@/components/compare/CompareButton";
import { ProductBuyActions } from "@/components/ProductBuyActions";
import { AfterpayMessaging } from "@/components/AfterpayMessaging";
import { ProductGallery } from "@/components/ProductGallery";
import { ContextualCatalogLinks } from '@/components/ContextualCatalogLinks';
import { contextualLinksEnabled, productContextualLinks } from '@/lib/catalog/contextualLinks';
import { dealerPreviewProductFetch, dealerPublicTags, keepsWizardOpen } from "@/lib/customization/dealerPreviewBuilder";
import { ProductLowerAlive } from "@/components/ProductLowerAlive";
import { ProductOptions } from "@/components/ProductOptions";
import { ProductEditorialPreview, supportsProductEditorialPreview } from "@/components/ProductEditorialPreview";
import { ResponsiveDetails } from "@/components/ResponsiveDetails";
import { WarehouseStatusBadge } from "@/components/WarehouseStatusBadge";
import { WarehouseLocationBadge } from "@/components/WarehouseLocationBadge";
import { scoreSimilarProducts } from "@/lib/catalog/similar";
import { getCatalogBrand } from "@/lib/catalog/brands";
import { isLiveAuthorizedBrand } from "@/lib/catalog/authorizations";
import { productDisplayName, productDisplayNameForUi, productPdpHeading, productPublicTitle } from "@/lib/catalog/naming";
import {
  buildPdpFitChecks,
  buildPdpMetadata,
  buildProductFaqStructuredData,
  buildProductStructuredData
} from "@/lib/catalog/pdpSeo";
import { isHeadOnlyProduct, primaryProductSpecs, productHeroIntro, productMeasurementSpecs } from "@/lib/catalog/productSpecs";
import { protectedProductImageUrlFor, withProtectedProductImages } from "@/lib/catalog/productImage";
import { hasEditorialIntro } from "@/lib/catalog/editorialIntro";
import { getPrivateDraftPreview } from '@/lib/catalog/privateDraftPreview';
import { gynoidPreviewStoreDiscount } from '@/lib/catalog/gynoidPreview';
import {gynoidVersionPreviewMappings} from '@/lib/catalog/gynoidVersionPreview';
import { withPreviewEditorialFixture } from "@/lib/catalog/previewEditorialFixture";
import { getProductAdminMetafieldsByHandle } from "@/lib/shopify/admin";
import { DisplayMoney } from "@/components/CurrencyProvider";
import { CareForLifePanel } from "@/components/care/CareForLifePanel";
import { FactoryApprovalPdpPreview } from "@/components/factory-approval/FactoryApprovalPreview";
import { getProductByHandle, getProducts } from "@/lib/shopify/storefront";
import { isDollVueCatalogProduct, dollVueUrl } from "@/lib/dollvue/config";
import { DollVueBadge } from "@/components/dollvue/DollVueBadge";
import { SeDollPdpFreebieBlock } from "@/components/promotions/SeDollSeptemberPromotion";
import { IrontechAutumnPdpPromotion } from "@/components/promotions/IrontechAutumnPromotion";
import { FanrealSeptemberPdpPromotion } from "@/components/promotions/FanrealSeptemberPromotion";
import { JinsanOctoberPdpPromotion } from "@/components/promotions/JinsanOctoberPromotion";
import { IdoOctoberPdpPromotion } from "@/components/promotions/IdoOctoberPromotion";
import { MdOctoberPdpPromotion } from "@/components/promotions/MdOctoberPromotion";
import { previewPromotionClock } from "@/lib/promotions/optionPricing";
import { withPreviewCustomizationFixture } from "@/lib/customization/previewFixture";
import { loadTemplateRecipe } from "@/lib/customization/template-loader";
import { getCustomizationConfig } from "@/lib/customization/configs";
import { publicProductPayload, publicCustomizationConfig } from "@/lib/catalog/publicPayload";

export const revalidate = 60;

type ProductPageSearchParams = { editorialPreview?: string; promoClock?: string | string[] };

export async function generateMetadata({ params, searchParams }: { params: Promise<{ handle: string }>; searchParams: Promise<ProductPageSearchParams> }): Promise<Metadata> {
  const { handle } = await params;
  const { editorialPreview } = await searchParams;
  const product = await getProductByHandle(handle);
  if (!product) return {};
  const metadata = buildPdpMetadata(withProtectedProductImages(product));
  if (editorialPreview === "1" || (product.tags || []).some((tag) => /^dollwow-test$/i.test(tag))) {
    return { ...metadata, robots: { index: false, follow: false } };
  }
  return metadata;
}

export default async function ProductPage({ params, searchParams }: { params: Promise<{ handle: string }>; searchParams: Promise<ProductPageSearchParams> }) {
  const { handle } = await params;
  const { editorialPreview, promoClock: requestedPromoClock } = await searchParams;
  const promoClock = previewPromotionClock(requestedPromoClock);
  const [storefrontProduct, adminProductData] = await Promise.all([
    getProductByHandle(handle, dealerPreviewProductFetch(handle)),
    getProductAdminMetafieldsByHandle(handle)
  ]);
  if (!storefrontProduct) notFound();
  const product = withPreviewCustomizationFixture(
    withPreviewEditorialFixture(mergeAdminMetafields(storefrontProduct, adminProductData))
  );
  const isPrivateDraft = Boolean(await getPrivateDraftPreview(handle));
  const publicProduct = stripSupplierFreeProductLabels(publicProductPayload(withProtectedProductImages(product)));
  // FunWest/Top Fire supplier labels carry "(FREE)" sale slogans; the builder already shows "included".
  // Strip only the public payload so template runtime hashes keep binding to the source menu.
  const customizationConfig = stripSupplierFreeLabels(product.extended.brand ?? product.vendor, publicCustomizationConfig(getCustomizationConfig(product)));
  const templateRecipe = await loadTemplateRecipe(product);
  const relatedBrand = getCatalogBrand(product.extended.brand ?? product.vendor);
  const brandTag = relatedBrand?.tags[0] ?? relatedBrand?.value;
  const brandQuery = brandTag ? `tag:${JSON.stringify(brandTag)}` : `title:${JSON.stringify(product.extended.brand ?? product.vendor)}`;
  const brandProducts = await getProducts({
    query: brandQuery,
    first: 600,
    imageFirst: 1,
    cacheKey: `pdp-related-brand-v3-${(relatedBrand?.value ?? product.extended.brand ?? product.vendor).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    revalidate: 3600
  });
  const price = product.priceRange.minVariantPrice;
  const firstAvailable = product.variants.find((variant) => variant.availableForSale) ?? product.variants[0];
  const heroImage = product.featuredImage ?? product.images[0] ?? null;
  const heroImageUrl = protectedProductImageUrlFor(product, heroImage);
  const alternatives = scoreSimilarProducts(product, brandProducts, 5);
  const displayTitle = productPublicTitle(product);
  const displayName = productDisplayName(product);
  const displayNameUi = productDisplayNameForUi(product);
  const isCastleOct22 = product.tags.some(tag => tag.startsWith('options:dolls-castle-oct22-'));
  const pdpHeading = isPrivateDraft || isCastleOct22 ? productPublicTitle(product) : productPdpHeading(product);
  const intro = productHeroIntro(product);
  const heroSpecs = primaryProductSpecs(product);
  const measurements = productMeasurementSpecs(product);
  const fitChecks = buildPdpFitChecks(product);
  const productStructuredData = buildProductStructuredData(publicProduct);
  const faqStructuredData = buildProductFaqStructuredData(product);
  const productBrand = product.extended.brand ?? product.vendor;
  const contextualLinks = !isPrivateDraft && editorialPreview !== "1" && contextualLinksEnabled(`/products/${product.handle}`) ? productContextualLinks(product) : [];
  const contextualBrand = contextualLinks.find(link => link.kind === 'brand');
  const hasAuthorizationSection = isLiveAuthorizedBrand(productBrand);
  const showEditorialPreview = editorialPreview === "1" && supportsProductEditorialPreview(product);
  const showLiveEditorial = hasEditorialIntro(product.extended.editorialIntro);
  const gynoidStoreDiscount = gynoidPreviewStoreDiscount(product, Number(product.priceRange.minVariantPrice.amount));
  const gynoidBodyVersion = isPrivateDraft && gynoidVersionPreviewMappings.find(row => row.productId === product.id && row.handle === product.handle);

  return (
    <div>
      {isPrivateDraft ? <p className="mx-auto max-w-7xl px-4 py-3 text-sm font-semibold text-gold-300">Private draft preview. Not published.</p> : null}
      {gynoidStoreDiscount ? <p className="mx-auto max-w-7xl px-4 pb-3 text-sm text-text-dim">Gynoid is excluded from the sitewide 10% discount. Preview policy only; live checkout settings are unchanged.</p> : null}
      {gynoidBodyVersion ? <p className="mx-auto max-w-7xl px-4 pb-3 text-sm text-text-dim">The family photos and measurements below describe the Standard body. Deluxe adds factory life-cast hand and foot detailing. {gynoidBodyVersion.model === 'M13' ? 'M13 body weight: Standard 30 kg, Deluxe 32 kg (+/-3 kg); bust: Standard 89 cm, Deluxe 91 cm.' : 'M21 body weight: Standard and Deluxe 30 kg (+/-3 kg).'} Body weights exclude the head. Choose the body version in the step-by-step build selector.</p> : null}
      {!isPrivateDraft && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productStructuredData) }} />}
      {!isPrivateDraft && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }} />}
      <ToneBand tone="deep" className="pt-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="min-w-0">
            <ProductGallery product={publicProduct} />
            {isDollVueCatalogProduct(product) ? (
              <Link
                href={dollVueUrl(product.handle)}
                className="dollvue-pdp-entry dollvue-pdp-star"
                aria-label={`Preview ${displayTitle} with DollVue`}
              >
                <span className="dollvue-pdp-entry-copy">
                  <span className="dollvue-pdp-wordmark">
                    DollVue<sup>™</sup>
                    <Image
                      className="dollvue-pdp-wordmark-badge"
                      src="/images/dollvue/landing/dollvue-verified-check-transparent.png"
                      alt=""
                      width={24}
                      height={24}
                      aria-hidden="true"
                    />
                  </span>
                  <strong>See every choice before you choose.</strong>
                  <small>Preview this doll <span aria-hidden="true">→</span></small>
                </span>
                <span className="dollvue-pdp-entry-art" aria-hidden="true">
                  <Image
                    className="dollvue-pdp-entry-art-image dollvue-pdp-entry-art-image--desktop"
                    src="/images/dollvue/home/dollvue-skin-tone-strip-desktop.png"
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 34vw, 56vw"
                  />
                  <Image
                    className="dollvue-pdp-entry-art-image dollvue-pdp-entry-art-image--mobile"
                    src="/images/dollvue/home/dollvue-skin-tone-strip-mobile.png"
                    alt=""
                    fill
                    sizes="56vw"
                  />
                </span>
              </Link>
            ) : null}
            <SeDollPdpFreebieBlock product={publicProduct} />
            <IrontechAutumnPdpPromotion product={publicProduct} promoClock={promoClock} />
            <FanrealSeptemberPdpPromotion product={publicProduct} promoClock={promoClock} />
            <JinsanOctoberPdpPromotion product={publicProduct} promoClock={promoClock ?? new Date().toISOString()} />
            <IdoOctoberPdpPromotion product={publicProduct} promoClock={promoClock ?? new Date().toISOString()} />
            <MdOctoberPdpPromotion product={publicProduct} promoClock={promoClock ?? new Date().toISOString()} />
          </div>
          <div id="overview" className="flex flex-col justify-center scroll-mt-24">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm  text-gold-300">{contextualBrand ? <Link data-contextual-brand href={contextualBrand.href} className="underline underline-offset-4">{productBrand}</Link> : productBrand}</p>
              <WarehouseStatusBadge status={product.extended.stockStatus} />
              {product.extended.stockStatus === "ready_to_ship" ? (
                <WarehouseLocationBadge regions={product.extended.warehouseRegions} country={product.extended.warehouseCountry} />
              ) : null}
              <CompareButton
                entry={{ productHandle: product.handle, productTitle: displayTitle, brand: product.extended.brand ?? product.vendor, tags: publicProduct.tags, imageUrl: heroImageUrl, unitPrice: Number(price.amount), currencyCode: price.currencyCode, merchandiseId: firstAvailable?.id, material: product.extended.material, heightCm: product.extended.heightCm, weightLb: product.extended.weightLb, cupSize: product.extended.cupSize, productType: product.productType, measurements: product.extended.measurements, warehouseRegions: product.extended.warehouseRegions, stockStatus: product.extended.stockStatus, customAvailable: product.extended.customAvailable }}
                label
                className="min-h-11 rounded-full border border-gold-500/24 px-3 text-sm font-semibold text-ivory-200 hover:border-gold-300/55 hover:text-gold-200"
              />
            </div>
            {displayNameUi && displayNameUi !== pdpHeading ? <p className="mt-3 text-base font-medium  text-gold-200/90">{displayNameUi}</p> : null}
            <h1 className="mt-2 flex flex-wrap items-baseline gap-x-2 text-3xl font-semibold leading-tight text-ivory-50 sm:text-4xl">
              <span>{pdpHeading}</span>
              {isDollVueCatalogProduct(product) ? <DollVueBadge /> : null}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <strong className="text-3xl text-gold-300"><DisplayMoney amount={price.amount} currencyCode={price.currencyCode} /></strong>
              <span className="text-sm text-ivory-500">Base configuration</span>
            </div>
            <AfterpayMessaging amount={Number(price.amount)} currencyCode={price.currencyCode} pageType="product" itemSkus={firstAvailable?.id} itemCategories={product.productType} eligible={Boolean(firstAvailable?.availableForSale)} usesDisplayCurrency />
            <p className="mt-4 max-w-2xl text-base leading-7 text-ivory-300">{intro}</p>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-ivory-300">
              {heroSpecs.map((spec) => (
                <Spec key={spec.label} label={spec.label} value={spec.value} />
              ))}
            </div>
            <div className="mt-5 grid gap-2 text-sm text-ivory-300 sm:grid-cols-2">
              <TrustLine icon={<ShieldCheck className="h-4 w-4" />} text="Discreet billing" />
              <TrustLine icon={<CheckCircle2 className="h-4 w-4" />} text="Team QC support" />
            </div>
            {isPrivateDraft ? <a href="#build-studio" className="mt-5 inline-flex min-h-12 items-center text-accent underline">Customize your doll</a> : firstAvailable && (
              <ProductBuyActions
                merchandiseId={firstAvailable.id}
                productTitle={displayTitle}
                productDisplayName={displayName || undefined}
                productHandle={product.handle}
                productImage={heroImage ? { ...heroImage, url: heroImageUrl! } : null}
                brand={productBrand}
                unitPrice={Number(price.amount)}
                currencyCode={price.currencyCode}
                deliveryEstimate={product.extended.deliveryEstimate}
                stockStatus={product.extended.stockStatus}
                readyToShip={product.extended.stockStatus === "ready_to_ship"}
                customAvailable={product.extended.customAvailable}
                warehouseCountry={product.extended.warehouseCountry}
                warehouseRegions={product.extended.warehouseRegions}
                requiresChoice={product.tags.includes("options:top-fire-headless-body-v1") ? "Choose your head" : undefined}
              />
            )}
            {product.extended.stockStatus !== "ready_to_ship" ? (
              <FactoryApprovalPdpPreview />
            ) : null}
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
                  imageUrl: heroImageUrl,
                  imageAlt: heroImage?.altText ?? displayTitle,
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

      {showEditorialPreview || showLiveEditorial ? (
        <ProductEditorialPreview product={publicProduct} editorial={publicProduct.extended.editorialIntro} preview={showEditorialPreview} />
      ) : null}

      <ToneBand tone="blush" className="pdp-builder-band">
        <div id="build-studio" className="scroll-mt-28">
          <ProductOptions product={publicProduct} config={customizationConfig} promoClock={promoClock} templateRecipe={templateRecipe} draftPreview={isPrivateDraft}
            presetChoicePreview={(process.env.DOLLWOW_TEMPLATE_RELEASE === "1" || (process.env.NODE_ENV !== "production" && process.env.DOLLWOW_EXACT_UPGRADE_PILOT === "1")) && product.tags.some(tag => tag.startsWith("options:se-"))} />
        </div>
      </ToneBand>

      <ToneBand tone="deep" className="py-8">
        <CareForLifePanel compact />
      </ToneBand>

      <ToneBand tone="deep" className="pdp-details-band">
        <ProductSpecSummary product={product} measurements={measurements} fitChecks={fitChecks} />
        <ContextualCatalogLinks links={contextualLinks.filter(link => link.kind !== 'brand')} label="Compare this doll" />
      </ToneBand>

      <ProductLowerAlive product={publicProduct} similarProducts={alternatives.map(withProtectedProductImages).map(publicProductPayload).map((item) => keepsWizardOpen(product.handle) ? { ...item, tags: dealerPublicTags(item.tags) ?? item.tags } : item)} />
      {hasAuthorizationSection ? (
        <ToneBand tone="deep" className="pdp-authorization-band">
          <div id="authorization" className="scroll-mt-24">
            <BrandAuthorizationCard brand={productBrand} />
            {product.id.startsWith('preview:gynoid:') ? <p className="mt-4 text-sm leading-6 text-ivory-300">Gynoid confirms M8 connectors on all bodies currently on sale. Gynoid does not offer an adapter.</p> : null}
          </div>
        </ToneBand>
      ) : null}
      {!isPrivateDraft && <PdpTrackers product={publicProduct} />}
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
      headModel: adminData.headModel || product.extended.headModel,
      bodyCode: adminData.bodyCode || product.extended.bodyCode,
      editorialIntro: adminData.editorialIntro || product.extended.editorialIntro
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
  const namedGynoidHead = product.id.startsWith('preview:gynoid:');
  const detailRows = [
    ["Brand", product.extended.brand ?? product.vendor],
    ...(product.extended.headModel ? [["Head model", namedGynoidHead ? product.extended.headModel : formatHeadModel(product.extended.headModel)]] : []),
    ...(namedGynoidHead && product.extended.bodyCode ? [["Body model", product.extended.bodyCode]] : []),
    ...(namedGynoidHead && product.extended.measurements?.['Factory body weight'] ? [["Factory body weight", product.extended.measurements['Factory body weight']]] : []),
    ...(namedGynoidHead && product.extended.measurements?.Underbust ? [["Underbust", product.extended.measurements.Underbust]] : []),
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
          <p>{isHeadOnlyProduct(product) ? "Head-only specs: model, functions, oral depth and delivery. No body is included." : "Use these specs for clothing fit, storage planning, lifting comfort, and overall size comparison before checkout."}</p>
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
  const normalized = text.match(/^(?:head[-_\s#]*)?([a-z]*\d+[a-z-]*)$/i)?.[1];
  if (normalized) return `Head #${normalized.toUpperCase()}`;
  if (/^head\b/i.test(text)) return text.replace(/^head[-_\s]*/i, "Head #");
  return `Head #${text}`;
}

function groupMeasurements(measurements: Array<{ label: string; value: string }>) {
  const groups = [
    { title: "Core size", labels: ["Height", "Weight", "Body weight", "Listed weight", "Packing weight", "Cup size", "Feet Length"] },
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

function stripSupplierFreeLabels<T extends { groups: Array<{ options: Array<{ label: string }> }> }>(brand: string | undefined | null, config: T): T {
  if (!brand || !/funwest|top[- ]?fire/i.test(brand)) return config;
  return {
    ...config,
    groups: config.groups.map((group) => ({
      ...group,
      ...(typeof (group as { description?: unknown }).description === "string"
        ? { description: ((group as { description?: string }).description as string).replace(/\(FREE\)\s*items/gi, "included items").replace(supplierFreeLabel, "").replace(/\bFunwest\b/g, "FunWest").trim() }
        : {}),
      options: group.options.map((option) => stripFreeOption(option))
    }))
  };
}

const supplierFreeLabel = /\s*\(FREE\)/gi;
// One brand spelling on the page: the FunWest import writes "Funwest" in add-on labels.
const cleanDealerLabel = (label: string) => label.replace(supplierFreeLabel, "").replace(/\bFunwest\b/g, "FunWest").trim();
function stripFreeOption<O extends { label: string; swatch?: unknown }>(option: O): O {
  const swatch = option.swatch as { label?: string } | undefined;
  return {
    ...option,
    label: cleanDealerLabel(option.label),
    ...(swatch && typeof swatch.label === "string" ? { swatch: { ...swatch, label: cleanDealerLabel(swatch.label) } } : {})
  };
}

// The public product payload also carries the raw imported menu (extended.customizationGroups).
function stripSupplierFreeProductLabels<P extends { vendor?: string; extended: { brand?: string; customizationGroups?: Array<{ options: Array<{ label: string; swatch?: unknown }> }> } }>(product: P): P {
  const brand = product.extended.brand ?? product.vendor;
  const groups = product.extended.customizationGroups;
  if (!brand || !/funwest|top[- ]?fire/i.test(brand)) return product;
  const tags = dealerPublicTags((product as { tags?: string[] }).tags);
  return {
    ...product,
    ...(tags ? { tags } : {}),
    extended: { ...product.extended, ...(groups ? { customizationGroups: groups.map((group) => ({ ...group, ...stripFreeDescription(group), options: group.options.map(stripFreeOption) })) } : {}) }
  };
}

function stripFreeDescription(group: object): { description?: string } {
  const description = (group as { description?: unknown }).description;
  return typeof description === "string"
    ? { description: description.replace(/\(FREE\)\s*items/gi, "included items").replace(supplierFreeLabel, "").replace(/\bFunwest\b/g, "FunWest").trim() }
    : {};
}
