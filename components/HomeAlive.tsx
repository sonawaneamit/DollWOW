"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, BadgeCheck, Camera, ChevronLeft, ChevronRight, Heart, Lock, Search, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { productBodyType } from "@/lib/catalog/bodyType";
import { catalogLookOptions, inferredShapeLookTags, productMatchesLook } from "@/lib/catalog/lookTags";
import { productPublicTitle } from "@/lib/catalog/naming";
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

const HERO_PREVIEW_IMAGES: Record<string, string> = {
  "sedoll-carry-150cm-g-cup-tpe-companion-doll-1xx8o": "/images/home-hero/portraits-new/sedoll-carry-home.png",
  "starpery-adele-153cm-e-cup-silicone-head-companion-doll-1dn4l": "/images/home-hero/portraits-new/starpery-adele-home-v2.png",
  "172cm-5ft8-e-cup-silicone-sex-doll-ida-belle": "/images/home-hero/portraits-new/zelex-ida-home.png",
  "ida-belle-172-ready-to-ship": "/images/home-hero/portraits-new/zelex-ida-home.png"
};

const SPOTLIGHT_HANDLE_PRIORITY = [
  "sedoll-carry-150cm-g-cup-tpe-companion-doll-1xx8o",
  "starpery-adele-153cm-e-cup-silicone-head-companion-doll-1dn4l",
  "172cm-5ft8-e-cup-silicone-sex-doll-ida-belle",
  "ida-belle-172-ready-to-ship"
];

export function HomeAlive({ products }: { products: Product[] }) {
  const spotlight = useMemo(() => buildSpotlightProducts(products), [products]);
  const rails = useMemo(() => buildRails(products), [products]);
  const [activeSpot, setActiveSpot] = useState(0);
  const [paused, setPaused] = useState(false);

  useHomeMotion();

  useEffect(() => {
    if (spotlight.length < 2 || paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      setActiveSpot((index) => (index + 1) % spotlight.length);
    }, 4600);
    return () => window.clearInterval(timer);
  }, [paused, spotlight.length]);

  const activeProduct = spotlight[activeSpot] ?? products[0];

  return (
    <div className="home-alive">
      <section className="home-hero" data-tone="deep">
        <div className="home-hero__blob home-hero__blob--one" />
        <div className="home-hero__blob home-hero__blob--two" />
        <div className="home-hero__inner">
          <div className="home-hero__copy reveal in">
            <p className="home-kicker"><span /> Doll of the moment</p>
            <h1>
              One in the <em>spotlight</em>. Always someone new.
            </h1>
            <p className="home-hero__lead">
              Explore real DollWow catalog picks with clear specs, private checkout, and practical support when you want a second look.
            </p>
            {activeProduct && <SpotlightMeta product={activeProduct} />}
            <div className="home-hero__actions">
              <Link className="home-btn home-btn--primary" href={activeProduct ? `/products/${activeProduct.handle}` : "/shop"}>
                View this doll <ArrowRight className="h-4 w-4" />
              </Link>
              <Link className="home-btn home-btn--ghost" href="/shop">Shop all dolls</Link>
            </div>
          </div>

          <div className="home-spot reveal in" data-d="2" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
            <div className="home-spot__media">
              {spotlight.map((product, index) => (
                <Link
                  key={product.id}
                  className={`home-spot__slide ${index === activeSpot ? "is-active" : ""}`}
                  href={`/products/${product.handle}`}
                  aria-label={`View ${productPublicTitle(product)}`}
                >
                  <HomeProductImage product={product} priority={index === 0} useHeroPreview />
                </Link>
              ))}
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
                  {getHeroPreviewImage(product) || product.featuredImage ? (
                    <Image
                      src={getHeroPreviewImage(product) ?? product.featuredImage!.url}
                      alt=""
                      fill
                      sizes="56px"
                      className="object-cover"
                      unoptimized={Boolean(getHeroPreviewImage(product))}
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

      <HomeMarquee />
      <TrustBand />
      <HomeDollWall products={products} />

      {rails.map((rail, index) => (
        <ProductRail key={rail.key} rail={rail} index={index} />
      ))}

      <PreviewShowcase products={products} />
      <ClosingBand />
    </div>
  );
}

function SpotlightMeta({ product }: { product: Product }) {
  const price = product.priceRange.minVariantPrice;
  const displayTitle = productPublicTitle(product);
  const specs = [
    product.extended.heightCm ? `${product.extended.heightCm} cm` : null,
    product.extended.material,
    formatCupSize(product.extended.cupSize),
    product.extended.stockStatus === "ready_to_ship" ? "Ready to ship" : "Factory order"
  ].filter(Boolean);

  return (
    <div className="home-spot-meta">
      <p>{product.extended.brand ?? product.vendor}</p>
      <h2>{shortTitle(displayTitle)}</h2>
      <div className="home-chip-row">
        {specs.slice(0, 4).map((spec) => (
          <span key={spec}>{spec}</span>
        ))}
      </div>
      <strong>{formatMoney(price.amount, price.currencyCode)}</strong>
    </div>
  );
}

function HomeMarquee() {
  const items = ["Price-match support", "Discreet shipping", "Checked before production", "Specialist support", "Factory photos before ship", "Warehouse picks"];
  return (
    <section className="home-marquee" aria-label="DollWow benefits">
      <div className="home-marquee__track">
        {[...items, ...items].map((item, index) => (
          <span key={`${item}-${index}`}>{item}</span>
        ))}
      </div>
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
            <div className="home-icon-tile"><Sparkles className="h-5 w-5" /></div>
            <div>
              <p className="home-eyebrow">{rail.eyebrow}</p>
              <h2>{rail.title}</h2>
              <p>{rail.copy}</p>
            </div>
          </div>
          <div className="home-rail-tools">
            {rail.key === "ready" ? <span className="home-countdown">1-3 business days</span> : null}
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
              <Sparkles className="h-7 w-7" />
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

  return (
    <article className="home-product-card">
      <Link href={`/products/${product.handle}`} className="home-product-card__media" aria-label={`View ${displayTitle}`}>
        <HomeProductImage product={product} priority={priority} />
        <span className={`home-product-badge ${ready ? "is-ready" : ""}`}>{ready ? "Ready to ship" : "Custom build"}</span>
        <button type="button" className="home-heart" aria-label="Save for later"><Heart className="h-4 w-4" /></button>
      </Link>
      <div className="home-product-card__body">
        <p>{product.extended.brand ?? product.vendor}</p>
        <Link href={`/products/${product.handle}`}>{shortTitle(displayTitle)}</Link>
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
    </article>
  );
}

function HomeProductImage({ product, priority = false, useHeroPreview = false }: { product: Product; priority?: boolean; useHeroPreview?: boolean }) {
  const heroPreview = useHeroPreview ? getHeroPreviewImage(product) : null;
  const image = product.featuredImage ?? product.images[0] ?? null;
  const displayTitle = productPublicTitle(product);
  return (
    <div className="home-image-shell">
      {heroPreview ? (
        <Image
          src={heroPreview}
          alt={`${displayTitle} styled DollWow homepage preview`}
          fill
          sizes="(min-width: 1100px) 620px, 90vw"
          priority={priority}
          className="object-cover"
          unoptimized
        />
      ) : image ? (
        <Image
          src={image.url}
          alt={displayTitle}
          fill
          sizes="(min-width: 1100px) 360px, 82vw"
          priority={priority}
          className="object-cover"
        />
      ) : (
        <div className="home-image-shell__empty">
          <Sparkles className="h-8 w-8" />
          <span>{displayTitle}</span>
        </div>
      )}
    </div>
  );
}

function buildSpotlightProducts(products: Product[]) {
  return SPOTLIGHT_HANDLE_PRIORITY.map((handle) => products.find((product) => product.handle === handle))
    .filter((product): product is Product => Boolean(product && getHeroPreviewImage(product)));
}

function getHeroPreviewImage(product: Product) {
  return HERO_PREVIEW_IMAGES[product.handle] ?? null;
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
                <Image src={image.url} alt={`${tile.label} collection preview`} fill sizes="(min-width: 1280px) 15vw, (min-width: 760px) 30vw, 46vw" className="home-wall-cell__image object-cover" />
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
      match: (product: Product) => !isMaleProduct(product)
    },
    {
      key: "male",
      label: "Male dolls",
      eyebrow: "Gender",
      href: "/shop/male-dolls",
      match: isMaleProduct
    },
    {
      key: "ready",
      label: "Ready to ship",
      eyebrow: "Availability",
      href: "/warehouse",
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
          <p className="home-eyebrow">How it works</p>
          <h2>Styled for discovery. Grounded in the real listing.</h2>
          <p>
            Spotlight images on the homepage can feel more editorial, but every click still lands on the real product gallery, specs, timing, and custom options.
          </p>
          <ul>
            <li><ShieldCheck className="h-4 w-4" /> Styled previews stay separate from the product gallery</li>
            <li><BadgeCheck className="h-4 w-4" /> Real specs and options stay tied to the listing</li>
            <li><Truck className="h-4 w-4" /> No invented accessories, timing, or delivery promises</li>
          </ul>
          <Link className="home-btn home-btn--primary" href="/shop">Browse the catalog</Link>
        </div>
      </div>
    </section>
  );
}

function VisualPreviewTile({ product, wide = false }: { product: Product; wide?: boolean }) {
  const image = product.featuredImage ?? product.images[0] ?? null;
  const displayTitle = productPublicTitle(product);

  return (
    <Link className={`home-preview__tile home-preview__tile--image ${wide ? "home-preview__tile--wide" : ""}`} href={`/products/${product.handle}`}>
      {image ? <Image src={image.url} alt={displayTitle} fill sizes="(min-width: 1024px) 42vw, 92vw" className="object-cover" /> : null}
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
          <Link className="home-btn home-btn--primary" href="/shop">Shop all dolls</Link>
          <Link className="home-btn home-btn--ghost" href="/help-me-choose">Help me choose</Link>
        </div>
      </div>
    </section>
  );
}

function buildRails(products: Product[]): Rail[] {
  const ready = products.filter((product) => product.extended.stockStatus === "ready_to_ship");
  const female = products.filter((product) => !isMaleProduct(product));
  const male = products.filter(isMaleProduct);
  const rare = products.filter(isRareProduct);
  const sale = products.filter(isSaleProduct);
  const newArrivals = products.slice(12, 26).length >= 3 ? products.slice(12, 26) : products.slice(0, 14);

  const rails: Rail[] = [
    {
      key: "ready",
      eyebrow: "In the warehouse now",
      title: "Ready to ship",
      copy: "Warehouse listings that usually leave in 1-3 business days after stock confirmation.",
      tone: "blush",
      href: "/warehouse",
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
      href: "/shop",
      products: products.slice(0, 14)
    },
    {
      key: "new",
      eyebrow: "Just added",
      title: "New arrivals",
      copy: "Fresh catalog picks recently added to DollWow.",
      tone: "deep",
      href: "/shop",
      products: newArrivals
    },
    {
      key: "rare",
      eyebrow: "Limited & specialty",
      title: "Rare finds",
      copy: "Less common sizes, materials, and specialty builds worth a closer look.",
      tone: "blush",
      href: "/shop",
      products: rare
    },
    {
      key: "sale",
      eyebrow: "Marked down",
      title: "On sale",
      copy: "Discounted listings and special offers when available.",
      emptyCopy: "No markdowns are active right now. Price-match support is still available on product pages.",
      tone: "deep",
      href: "/shop",
      products: sale
    }
  ];

  return rails.filter((rail) => rail.products.length > 0);
}

function productSearchText(product: Product) {
  return `${product.title} ${product.vendor} ${product.productType} ${product.extended.brand ?? ""} ${product.extended.material ?? ""} ${product.extended.bodyType ?? ""} ${product.tags.join(" ")}`.toLowerCase();
}

function isMaleProduct(product: Product) {
  const bodyType = productBodyType(product);
  if (bodyType === "male") return true;
  if (bodyType === "female") return false;
  const text = productSearchText(product);
  return /\b(male|man|men|masculine|torso)\b/.test(text);
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
