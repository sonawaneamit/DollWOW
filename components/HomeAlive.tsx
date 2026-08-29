"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, BadgeCheck, Camera, ChevronLeft, ChevronRight, ImageIcon, Lock, Search, ShieldCheck, Truck } from "lucide-react";
import { homepageNewArrivals, isHomepageMaleProduct, uniqueHomepageModels } from "@/lib/catalog/homepage";
import { storefrontFeatureProducts } from "@/lib/catalog/featured";
import { catalogLookOptions, inferredShapeLookTags, productMatchesLook } from "@/lib/catalog/lookTags";
import { productPublicTitle } from "@/lib/catalog/naming";
import { protectedProductImageUrlFor } from "@/lib/catalog/productImage";
import { productUrl } from "@/lib/catalog/productUrl";
import { WishlistButton } from "@/components/WishlistButton";
import { WarehouseLocationBadge } from "@/components/WarehouseLocationBadge";
import { CareForLifePanel } from "@/components/care/CareForLifePanel";
import { FactoryApprovalHomepagePreview } from "@/components/factory-approval/FactoryApprovalPreview";
import { DollVueBadge } from "@/components/dollvue/DollVueBadge";
import { isDollVueCatalogProduct } from "@/lib/dollvue/config";
import { formatMoney } from "@/lib/utils/currency";
import type { Product } from "@/types/product";

type Rail = {
  key: string;
  eyebrow: string;
  title: string;
  copy: string;
  emptyCopy?: string;
  tone: "deep" | "rose" | "blush";
  href: string;
  products: Product[];
};

type LookTile = {
  key: string;
  label: string;
  eyebrow: string;
  href: string;
  product: Product;
};

type LookDefinition = Omit<LookTile, "product" | "count"> & {
  match: (product: Product) => boolean;
};

const HERO_VIDEO_MEDIA: Record<string, { video: string; poster: string }> = {
  "jarliet-dolls-quine-167cm-b-cup-silicone-companion-doll-etgn7": { video: "/videos/home-spotlight/quine.mp4", poster: "/images/home-hero/video-posters/quine.webp" },
  "irontech-vivian-153cm-f-cup-silicone-head-companion-doll-qryli": { video: "/videos/home-spotlight/vivian.mp4", poster: "/images/home-hero/video-posters/vivian.webp" },
  "starpery-freya-165cm-g-cup-silicone-head-companion-doll-46ftg": { video: "/videos/home-spotlight/freya.mp4", poster: "/images/home-hero/video-posters/freya.webp" },
  "erovenus-doris-112-5cm-d-cup-silicone-companion-doll-fhw2l": { video: "/videos/home-spotlight/doris.mp4", poster: "/images/home-hero/video-posters/doris.webp" },
  "yl-isla-158cm-e-cup-silicone-companion-doll-1iikg": { video: "/videos/home-spotlight/isla.mp4", poster: "/images/home-hero/video-posters/isla.webp" },
  "sedoll-carry-150cm-g-cup-tpe-companion-doll-1xx8o": { video: "/videos/home-spotlight/carry.mp4", poster: "/images/home-hero/video-posters/carry.webp" },
  "hr-dolls-zeki-165cm-e-cup-silicone-companion-doll-1imsn": { video: "/videos/home-spotlight/zeki.mp4", poster: "/images/home-hero/video-posters/zeki.webp" }
};

const SPOTLIGHT_HANDLE_PRIORITY = [
  "irontech-vivian-153cm-f-cup-silicone-head-companion-doll-qryli",
  "starpery-freya-165cm-g-cup-silicone-head-companion-doll-46ftg",
  "jarliet-dolls-quine-167cm-b-cup-silicone-companion-doll-etgn7",
  "erovenus-doris-112-5cm-d-cup-silicone-companion-doll-fhw2l",
  "yl-isla-158cm-e-cup-silicone-companion-doll-1iikg",
  "sedoll-carry-150cm-g-cup-tpe-companion-doll-1xx8o",
  "hr-dolls-zeki-165cm-e-cup-silicone-companion-doll-1imsn"
];

export function HomeAlive({
  products,
  bestSellingProducts = [],
  recentlyAddedProducts
}: {
  products: Product[];
  bestSellingProducts?: Product[];
  recentlyAddedProducts?: Product[];
}) {
  const featuredProducts = useMemo(() => storefrontFeatureProducts(products), [products]);
  const featuredRecentlyAddedProducts = useMemo(
    () => storefrontFeatureProducts(recentlyAddedProducts ?? []),
    [recentlyAddedProducts]
  );
  const spotlight = useMemo(() => buildSpotlightProducts(featuredProducts), [featuredProducts]);
  const rails = useMemo(
    () => buildRails(featuredProducts, storefrontFeatureProducts(bestSellingProducts), featuredRecentlyAddedProducts),
    [featuredProducts, bestSellingProducts, featuredRecentlyAddedProducts]
  );
  const [activeSpot, setActiveSpot] = useState(0);
  useHomeMotion();

  useEffect(() => {
    if (spotlight.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const interval = window.setInterval(() => setActiveSpot((current) => (current + 1) % spotlight.length), 6500);
    return () => window.clearInterval(interval);
  }, [spotlight.length]);

  const activeProduct = spotlight[activeSpot] ?? featuredProducts[0];

  return (
    <div className="home-alive">
      <section className="home-hero" data-tone="deep">
        <div className="home-hero__inner">
          <div className="home-hero__copy reveal in">
            <p className="home-kicker"><span /> Doll of the moment</p>
            <h1>
              One in the <em>spotlight</em>. Always someone new.
            </h1>
            <p className="home-hero__lead">
              Explore real DollWow catalog picks with clear specs, private checkout, and practical support when you want a second look.
            </p>
            <div className="home-hero__actions">
              <Link className="home-btn home-btn--primary" href="/shop/sex-dolls">Shop all dolls <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>

          <div className="home-spot reveal in" data-d="2">
            <div className="home-spot__media">
              {activeProduct ? (
                <Link
                  key={activeProduct.id}
                  className="home-spot__slide home-spot__slide--video is-active"
                  href={productUrl(activeProduct.handle)}
                  aria-label={`View ${productPublicTitle(activeProduct)}`}
                >
                  <HomeSpotlightVideo product={activeProduct} />
                </Link>
              ) : null}
            </div>
            <div className="home-spot__rail" aria-label="Featured dolls">
              {spotlight.map((product, index) => (
                <button
                  key={product.id}
                  type="button"
                  className={`home-spot__thumb ${index === activeSpot ? "is-active" : ""}`}
                  onClick={() => setActiveSpot(index)}
                  aria-label={`Show ${productPublicTitle(product)}`}
                >
                  {getHeroVideoMedia(product)?.poster || product.featuredImage ? (
                    <Image
                      src={getHeroVideoMedia(product)?.poster ?? protectedProductImageUrlFor(product, product.featuredImage)!}
                      alt=""
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  ) : (
                    <span>{initialsFor(product)}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <DollVueHomepageStrip />
      <TrustBand />
      <FactoryApprovalHomepagePreview />
      <section className="home-care-band" data-tone="deep"><CareForLifePanel /></section>
      <HomeDollWall products={featuredProducts} />

      {rails.map((rail, index) => (
        <ProductRail key={rail.key} rail={rail} index={index} />
      ))}

      <PreviewShowcase products={featuredProducts} />
      <ClosingBand />
    </div>
  );
}

function DollVueHomepageStrip() {
  return (
    <section className="home-dollvue-strip" aria-label="DollVue personalized appearance previews">
      <Link
        href="/dollvue"
        className="home-dollvue-strip__link"
        aria-label="Explore DollVue personalized doll previews"
      >
        <Image
          className="home-dollvue-strip__image home-dollvue-strip__image--desktop"
          src="/images/dollvue/home/dollvue-skin-tone-strip-desktop.png"
          alt="DollVue preview showing the same Luna doll in four selectable skin tones"
          width={1774}
          height={300}
          sizes="80vw"
        />
        <Image
          className="home-dollvue-strip__image home-dollvue-strip__image--mobile"
          src="/images/dollvue/home/dollvue-skin-tone-strip-mobile.png"
          alt="DollVue preview showing the same Luna doll in four selectable skin tones"
          width={1774}
          height={887}
          sizes="80vw"
        />
      </Link>
    </section>
  );
}

function TrustBand() {
  const cards = [
    {
      icon: ShieldCheck,
      label: "Arrival protection",
      copy: "If an order is lost, materially damaged, or clearly wrong, you have clear support instead of guesswork."
    },
    {
      icon: Lock,
      label: "Private by default",
      copy: "Plain packaging, neutral billing, and discreet communication from order to delivery."
    },
    {
      icon: Camera,
      label: "Factory photo approval",
      copy: "Custom builds include detailed factory photos and videos for your approval before shipment."
    },
    {
      icon: Search,
      label: "Price-match review",
      copy: "If you find the same configuration cheaper within 30 days, we review the real delivered deal and refund the difference when it qualifies."
    }
  ];

  return (
    <section className="home-band home-band--trust" data-tone="deep">
      <div className="home-band__inner">
        <div className="home-section-head reveal">
          <div>
            <p className="home-eyebrow">Why DollWow</p>
            <h2>More clarity before you buy.</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className="home-btn home-btn--ghost" href="/buyer-protection">Buyer protection</Link>
            <Link className="home-btn home-btn--ghost" href="/how-ordering-works">How it works</Link>
            <Link className="home-btn home-btn--ghost" href="/why-dollwow">About DollWow</Link>
          </div>
        </div>
        <div className="home-trust-grid">
          {cards.map((card, index) => {
            const Icon = card.icon;
            return (
              <article className="home-trust-card reveal" data-d={index + 1} key={card.label}>
                <div className="home-icon-tile"><Icon className="h-5 w-5" /></div>
                <h3>{card.label}</h3>
                <p>{card.copy}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ProductRail({ rail, index }: { rail: Rail; index: number }) {
  const railRef = useRef<HTMLDivElement>(null);

  function scrollBy(direction: -1 | 1) {
    railRef.current?.scrollBy({ left: direction * railRef.current.clientWidth * 0.82, behavior: "smooth" });
  }

  return (
    <section className="home-band" data-tone={rail.tone}>
      <div className="home-band__inner">
        <div className="home-rail-head reveal">
          <div className="home-rail-head__title">
            <div>
              <p className="home-eyebrow">{rail.eyebrow}</p>
              <h2>{rail.title}</h2>
              <p>{rail.copy}</p>
            </div>
          </div>
          <div className="home-rail-tools">
            {rail.key === "ready" ? <span className="home-countdown">Timing confirmed</span> : null}
            <Link href={rail.href}>See all <ArrowRight className="h-4 w-4" /></Link>
            <button type="button" onClick={() => scrollBy(-1)} aria-label={`Previous ${rail.title}`}><ChevronLeft className="h-5 w-5" /></button>
            <button type="button" onClick={() => scrollBy(1)} aria-label={`Next ${rail.title}`}><ChevronRight className="h-5 w-5" /></button>
          </div>
        </div>
        <div className="home-rail reveal" data-d={Math.min(index + 1, 4)} ref={railRef}>
          {rail.products.length ? (
            rail.products.slice(0, 14).map((product, productIndex) => (
              <HomeProductCard key={`${rail.key}-${product.id}`} product={product} priority={index === 0 && productIndex < 2} />
            ))
          ) : (
            <div className="home-empty-card">
              <ImageIcon className="h-7 w-7" />
              <strong>{rail.title}</strong>
              <p>{rail.emptyCopy ?? "We’ll add products here as soon as this collection is ready."}</p>
            </div>
          )}
          <Link className="home-rail-peek" href={rail.href}>
            <span>See all</span>
            <strong>{rail.title}</strong>
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function HomeProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const price = product.priceRange.minVariantPrice;
  const displayTitle = productPublicTitle(product);
  const ready = product.extended.stockStatus === "ready_to_ship";
  const specs = [product.extended.heightCm ? `${product.extended.heightCm} cm` : null, product.extended.material, formatCupSize(product.extended.cupSize)].filter(Boolean);
  const image = product.featuredImage ?? product.images[0] ?? null;
  const imageUrl = protectedProductImageUrlFor(product, image, "card");

  return (
    <article className="home-product-card">
      <Link href={productUrl(product.handle)} className="home-product-card__link" aria-label={`View ${displayTitle}`} />
      <div className="home-product-card__media">
        <HomeProductImage product={product} priority={priority} />
        <span className={`home-product-badge ${ready ? "is-ready" : ""}`}>{ready ? "Ready to ship" : "Custom build"}</span>
        {ready ? (
          <div className="home-product-card__warehouse">
            <WarehouseLocationBadge regions={product.extended.warehouseRegions} country={product.extended.warehouseCountry} compact />
          </div>
        ) : null}
      </div>
      <div className="home-product-card__body">
        <p>{product.extended.brand ?? product.vendor}</p>
        <h3>{shortTitle(displayTitle)}</h3>
        {isDollVueCatalogProduct(product) ? (
          <div className="product-card-dollvue-line">
            <DollVueBadge size="compact" tooltipAlign="start" />
            <span>DollVue enabled</span>
          </div>
        ) : null}
        <div className="home-spec-row">
          {specs.slice(0, 3).map((spec) => (
            <span key={spec}>{spec}</span>
          ))}
        </div>
        <div className="home-card-foot">
          <strong>{formatMoney(price.amount, price.currencyCode)}</strong>
          <span>View <ArrowRight className="h-3.5 w-3.5" /></span>
        </div>
      </div>
      <WishlistButton
        entry={{
          productHandle: product.handle,
          productTitle: displayTitle,
          brand: product.extended.brand ?? product.vendor,
          imageUrl,
          imageAlt: image?.altText ?? displayTitle,
          unitPrice: Number(price.amount),
          currencyCode: price.currencyCode,
          readyToShip: ready
        }}
        className="home-heart"
      />
    </article>
  );
}

function HomeProductImage({ product, priority = false }: { product: Product; priority?: boolean }) {
  const image = product.featuredImage ?? product.images[0] ?? null;
  const imageUrl = protectedProductImageUrlFor(product, image, "card");
  const displayTitle = productPublicTitle(product);
  return (
    <div className="home-image-shell">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={displayTitle}
          fill
          sizes="(min-width: 1100px) 360px, 82vw"
          priority={priority}
          className="object-cover"
        />
      ) : (
        <div className="home-image-shell__empty">
          <ImageIcon className="h-8 w-8" />
          <span>{displayTitle}</span>
        </div>
      )}
    </div>
  );
}

function HomeSpotlightVideo({ product }: { product: Product }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const media = getHeroVideoMedia(product);
  const displayTitle = productPublicTitle(product);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      video.pause();
      return;
    }
    video.play().catch(() => undefined);
  }, [media?.video]);

  if (!media) return <HomeProductImage product={product} priority />;

  return (
    <div className="home-image-shell home-video-shell">
      <video
        ref={videoRef}
        className="home-spot__video"
        poster={media.poster}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        disablePictureInPicture
        aria-label={`${displayTitle} product preview video`}
      >
        <source src={media.video} type="video/mp4" />
      </video>
      <span className="home-spot__video-badge">
        <span />
        {displayBrandFor(product)} <b aria-hidden="true">|</b> {modelNameFor(product)}
        <ArrowRight aria-hidden="true" />
      </span>
    </div>
  );
}

function modelNameFor(product: Product) {
  const brand = displayBrandFor(product);
  const title = productPublicTitle(product);
  const withoutBrand = title.replace(new RegExp(`^${escapeRegExp(brand)}(?:\\s+Dolls?)?\\s*`, "i"), "");
  return withoutBrand.split(/\s+\d{2,3}(?:[.,]\d+)?\s*cm\b/i)[0]?.trim() || shortTitle(title);
}

function displayBrandFor(product: Product) {
  return (product.extended.brand ?? product.vendor ?? "DollWow").replace(/\s+Dolls?$/i, "").trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildSpotlightProducts(products: Product[]) {
  return SPOTLIGHT_HANDLE_PRIORITY.map((handle) => products.find((product) => product.handle === handle))
    .filter((product): product is Product => Boolean(product && getHeroVideoMedia(product)));
}

function getHeroVideoMedia(product: Product) {
  return HERO_VIDEO_MEDIA[product.handle] ?? null;
}

function HomeDollWall({ products }: { products: Product[] }) {
  const tiles = buildLookTiles(products);
  if (tiles.length < 4) return null;

  return (
    <section className="home-band home-wall-band" data-tone="deep">
      <div className="home-band__inner home-wall">
        <div className="home-wall__head reveal">
          <p className="home-eyebrow">Browse by look</p>
          <h2>A quicker way to spot what catches your eye.</h2>
        </div>
        <div className="home-wall-grid reveal" data-d="2">
          {tiles.map((tile, index) => {
            const product = tile.product;
            const image = product.featuredImage ?? product.images[0];
            if (!image) return null;
            return (
              <Link key={tile.key} className={`home-wall-cell home-wall-cell--${index + 1}`} href={tile.href}>
                <Image src={protectedProductImageUrlFor(product, image, "card")!} alt={`${tile.label} collection preview`} fill sizes="(min-width: 1280px) 15vw, (min-width: 760px) 30vw, 46vw" className="home-wall-cell__image object-cover" />
                <span>
                  <small>{tile.eyebrow}</small>
                  {tile.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function buildLookTiles(products: Product[]): LookTile[] {
  const imageProducts = products.filter((product) => product.featuredImage || product.images[0]);
  const usedProductIds = new Set<string>();
  const definitions: LookDefinition[] = [
    ...catalogLookOptions
      .filter((look) => ["hair-blonde", "hair-brunette", "look-asian", "skin-black", "shape-curvy", "shape-petite"].includes(look.value))
      .map((look) => ({
        key: look.value,
        label: look.label,
        eyebrow: look.group,
        href: `/shop/${look.collectionHandle}`,
        match: (product: Product) => productMatchesLook(product, look.value) || inferredShapeLookTags(product).includes(look.value)
      })),
    {
      key: "female",
      label: "Female dolls",
      eyebrow: "Gender",
      href: "/shop/female-dolls",
      match: (product: Product) => !isHomepageMaleProduct(product)
    },
    {
      key: "male",
      label: "Male dolls",
      eyebrow: "Gender",
      href: "/shop/male-dolls",
      match: isHomepageMaleProduct
    },
    {
      key: "ready",
      label: "Ready to ship",
      eyebrow: "Availability",
      href: "/shop/ready-to-ship",
      match: (product: Product) => product.extended.stockStatus === "ready_to_ship"
    },
  ];

  const tiles: LookTile[] = [];
  for (const definition of definitions) {
    const matches = products.filter(definition.match);
    const product = imageProducts.find((item) => !usedProductIds.has(item.id) && definition.match(item));
    if (!product || matches.length === 0) continue;
    usedProductIds.add(product.id);
    tiles.push({
      key: definition.key,
      label: definition.label,
      eyebrow: definition.eyebrow,
      href: definition.href,
      product
    });
  }

  return tiles.slice(0, 6);
}

function PreviewShowcase({ products }: { products: Product[] }) {
  const picks = products.filter((product) => product.featuredImage || product.images[0]).slice(10, 13);

  return (
    <section className="home-band home-preview-band" data-tone="blush">
      <div className="home-band__inner home-preview">
        <div className="home-preview__stage reveal">
          {picks.map((product, index) => (
            <VisualPreviewTile key={product.id} product={product} wide={index === 0} />
          ))}
        </div>
        <div className="home-preview__copy reveal" data-d="2">
          <p className="home-eyebrow">Shop with confidence</p>
          <h2>See the style. Check every detail.</h2>
          <p>
            Start with the look that catches your eye, then open the product page for full photos, measurements, available options, and current delivery information.
          </p>
          <ul>
            <li><ShieldCheck className="h-4 w-4" /> Browse the full product gallery</li>
            <li><BadgeCheck className="h-4 w-4" /> Compare materials and measurements</li>
            <li><Truck className="h-4 w-4" /> Check options and delivery before checkout</li>
          </ul>
          <Link className="home-btn home-btn--primary" href="/shop/sex-dolls">Explore all dolls</Link>
        </div>
      </div>
    </section>
  );
}

function VisualPreviewTile({ product, wide = false }: { product: Product; wide?: boolean }) {
  const image = product.featuredImage ?? product.images[0] ?? null;
  const imageUrl = protectedProductImageUrlFor(product, image, "card");
  const displayTitle = productPublicTitle(product);

  return (
    <Link className={`home-preview__tile home-preview__tile--image ${wide ? "home-preview__tile--wide" : ""}`} href={productUrl(product.handle)}>
      {imageUrl ? <Image src={imageUrl} alt={displayTitle} fill sizes="(min-width: 1024px) 42vw, 92vw" className="object-cover" /> : null}
      <span>{shortTitle(displayTitle)}</span>
    </Link>
  );
}

function ClosingBand() {
  return (
    <section className="home-closing" data-tone="deep">
      <div className="home-closing__inner reveal">
        <p className="home-eyebrow">Ready when you are</p>
        <h2>Find the one. Buy with confidence.</h2>
        <p>Browse freely, build exactly what you want, or ask us to help compare options before you order.</p>
        <div className="home-hero__actions">
          <Link className="home-btn home-btn--primary" href="/shop/sex-dolls">Shop all dolls</Link>
          <Link className="home-btn home-btn--ghost" href="/help-me-choose">Help me choose</Link>
        </div>
      </div>
    </section>
  );
}

function buildRails(products: Product[], bestSellingProducts: Product[] = [], recentlyAddedProducts: Product[] = []): Rail[] {
  const ready = products.filter((product) => product.extended.stockStatus === "ready_to_ship");
  const female = products.filter((product) => !isHomepageMaleProduct(product));
  const male = uniqueHomepageModels(products.filter(isHomepageMaleProduct));
  const rare = products.filter(isRareProduct);
  const sale = products.filter(isSaleProduct);
  const newArrivals = homepageNewArrivals(recentlyAddedProducts.length ? recentlyAddedProducts : products).slice(0, 14);

  const rails: Rail[] = [
    {
      key: "ready",
      eyebrow: "In the warehouse now",
      title: "Ready to ship",
      copy: "Existing warehouse listings with the exact unit, location, configuration, and dispatch estimate confirmed before payment.",
      tone: "blush",
      href: "/shop/ready-to-ship",
      products: ready
    },
    {
      key: "female",
      eyebrow: "Main collection",
      title: "Female dolls",
      copy: "Browse by look, size, material, and build style across the core catalog.",
      tone: "rose",
      href: "/shop/female-dolls",
      products: female
    },
    {
      key: "male",
      eyebrow: "Main collection",
      title: "Male dolls",
      copy: "Male and masculine-body listings when available in the catalog.",
      emptyCopy: "Male doll listings will appear here once they are added to the DollWow catalog.",
      tone: "rose",
      href: "/shop/male-dolls",
      products: male
    },
    {
      key: "bestsellers",
      eyebrow: "Loved right now",
      title: "Bestsellers",
      copy: "A strong place to start when you want the most browsed catalog picks first.",
      tone: "deep",
      href: "/shop/sex-dolls",
      products: bestSellingProducts.slice(0, 14)
    },
    {
      key: "new",
      eyebrow: "Just added",
      title: "New arrivals",
      copy: "Fresh catalog picks recently added to DollWow.",
      tone: "deep",
      href: "/shop/sex-dolls",
      products: newArrivals
    },
    {
      key: "rare",
      eyebrow: "Limited & specialty",
      title: "Rare finds",
      copy: "Less common sizes, materials, and specialty builds worth a closer look.",
      tone: "blush",
      href: "/shop/sex-dolls",
      products: rare
    },
    {
      key: "sale",
      eyebrow: "Marked down",
      title: "On sale",
      copy: "Discounted listings and special offers when available.",
      emptyCopy: "No markdowns are active right now. Price-match support is still available on product pages.",
      tone: "deep",
      href: "/shop/sex-dolls",
      products: sale
    }
  ];

  return rails.filter((rail) => rail.products.length > 0);
}

function productSearchText(product: Product) {
  return `${product.title} ${product.vendor} ${product.productType} ${product.extended.brand ?? ""} ${product.extended.material ?? ""} ${product.extended.bodyType ?? ""} ${product.tags.join(" ")}`.toLowerCase();
}

function isRareProduct(product: Product) {
  const text = productSearchText(product);
  return /\b(rare|limited|specialty|special|petite|plus|tall|elf|anime|hybrid)\b/.test(text) || Boolean(product.extended.heightCm && product.extended.heightCm >= 170);
}

function isSaleProduct(product: Product) {
  const text = productSearchText(product);
  return /\b(sale|on-sale|markdown|marked-down|discount|clearance)\b/.test(text);
}

function shortTitle(title: string) {
  return title
    .replace(/\s+Sex Doll\b/gi, " Companion Doll")
    .replace(/\s+Companion Companion Doll\b/gi, " Companion Doll")
    .replace(/\s+-\s+DollWow$/i, "")
    .trim();
}

function formatCupSize(cupSize?: string) {
  if (!cupSize) return null;
  return /cup/i.test(cupSize) ? cupSize : `${cupSize}-cup`;
}

function initialsFor(product: Product) {
  return (product.extended.brand ?? product.vendor ?? "DW").split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function useHomeMotion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".home-alive");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const elements = Array.from(document.querySelectorAll<HTMLElement>(".home-alive .reveal"));
    const counters = Array.from(document.querySelectorAll<HTMLElement>(".home-alive [data-count]"));

    if (reducedMotion) {
      elements.forEach((element) => element.classList.add("in"));
      counters.forEach((counter) => {
        const target = Number(counter.dataset.to ?? "0");
        counter.textContent = String(target);
      });
      return;
    }

    root?.classList.add("home-motion-enabled");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const element = entry.target as HTMLElement;
          element.classList.add("in");
          observer.unobserve(element);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );

    elements.forEach((element) => observer.observe(element));

    const countObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const counter = entry.target as HTMLElement;
          animateCount(counter);
          countObserver.unobserve(counter);
        });
      },
      { threshold: 0.5 }
    );

    counters.forEach((counter) => countObserver.observe(counter));

    return () => {
      observer.disconnect();
      countObserver.disconnect();
      root?.classList.remove("home-motion-enabled");
    };
  }, []);
}

function animateCount(element: HTMLElement) {
  const target = Number(element.dataset.to ?? "0");
  const start = performance.now();
  const duration = 1100;

  function tick(now: number) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = String(Math.round(target * eased));
    if (progress < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}
