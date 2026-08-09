import { cache } from "react";
import Link from "next/link";
import { getProducts } from "@/lib/shopify/storefront";
import type { Product } from "@/types/product";

type InfoVisualPanelProps = {
  seed: string;
  eyebrow?: string;
  title?: string;
  copy?: string;
  cta?: { label: string; href: string };
  compact?: boolean;
};

type VisualItem = {
  src: string;
  alt: string;
  title: string;
  subtitle: string;
  href?: string;
  brand: string;
};

const fallbackVisuals: VisualItem[] = [
  {
    src: "/images/home-hero/portraits-new/starpery-adele-home-v2.png",
    alt: "Featured DollWow catalog doll",
    title: "Starpery Adele",
    subtitle: "Custom order",
    brand: "Starpery",
    href: "/shop"
  },
  {
    src: "/images/home-hero/portraits-new/zelex-ida-home.png",
    alt: "Ready-to-ship DollWow catalog doll",
    title: "Zelex Ida",
    subtitle: "Ready to ship",
    brand: "Zelex Dolls",
    href: "/warehouse"
  },
  {
    src: "/images/home-hero/portraits-new/sedoll-carry-home.png",
    alt: "DollWow catalog portrait",
    title: "SE Doll Carry",
    subtitle: "Private checkout",
    brand: "SE Doll",
    href: "/shop"
  }
];

const trustBits = ["Private checkout", "Factory photos", "Price-match review"];

const posterBrandTags = [
  "wm-dolls",
  "angelkiss-doll",
  "irontech-doll",
  "starpery-dolls",
  "sedoll",
  "zelex-dolls",
  "6ye-dolls"
];

const preferredBrandOrder = ["wm", "angelkiss", "irontech", "starpery", "se", "zelex", "6ye"];

export async function InfoVisualPanel({
  seed,
  eyebrow = "DollWow catalog",
  title = "Real listings, clearer buying.",
  copy = "Browse with product photos, clear specs, private checkout, and team support when you want a second look.",
  cta,
  compact = false
}: InfoVisualPanelProps) {
  const visuals = await getVisuals(seed);
  const [hero, ...supporting] = visuals;

  return (
    <section
      className={`grid overflow-hidden rounded-lg bg-surface text-text shadow-card lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.8fr)] ${compact ? "min-h-[380px]" : "min-h-[500px]"}`}
      aria-label={title}
    >
      <div className="flex flex-col justify-between p-6 sm:p-8">
        <div>
          <p className="text-[15px] font-semibold text-text-dim">{eyebrow}</p>
          <h2 className={`${compact ? "text-3xl" : "text-4xl"} mt-3 max-w-[15ch] font-display font-semibold leading-tight text-text`}>
            {title}
          </h2>
          <p className="mt-4 max-w-[31rem] text-base leading-7 text-text-dim">{copy}</p>
          {cta ? (
            <Link href={cta.href} className="mt-6 inline-flex min-h-[52px] items-center rounded-button bg-accent px-5 text-[17px] font-semibold text-white hover:bg-accent-hover">
              {cta.label}
            </Link>
          ) : null}
        </div>

        <div className="mt-8 grid gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {trustBits.map((bit) => (
              <span key={bit} className="inline-flex min-h-11 items-center rounded-sm bg-surface-tint px-3 text-sm font-semibold text-text-dim">
                {bit}
              </span>
            ))}
          </div>

          <div className="flex gap-2">
            {[hero, ...supporting].slice(0, 4).map((item) => (
              <PosterThumb key={`${item.src}-${item.title}`} item={item} />
            ))}
          </div>
        </div>
      </div>
      <div className="relative min-h-[360px] bg-surface-tint lg:min-h-full"><PosterHero item={hero} priority /></div>
    </section>
  );
}

function PosterHero({ item, priority = false }: { item: VisualItem; priority?: boolean }) {
  const image = (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.src}
        alt={item.alt}
        loading={priority ? "eager" : "lazy"}
        className="h-full w-full object-cover object-[center_16%]"
      />
      <figcaption className="absolute inset-x-4 bottom-4 rounded-sm bg-surface p-4 shadow-card sm:inset-x-auto sm:right-4 sm:max-w-[290px]">
        <p className="text-sm font-semibold text-text-dim">{item.brand}</p>
        <p className="mt-1 line-clamp-2 text-base font-semibold leading-tight text-text">{item.title}</p>
        <p className="mt-1 text-sm text-text-dim">{item.subtitle}</p>
      </figcaption>
    </>
  );

  return (
    <figure className="relative h-full w-full">
      {item.href ? <Link href={item.href} className="absolute inset-0">{image}</Link> : image}
    </figure>
  );
}

function PosterThumb({ item }: { item: VisualItem }) {
  const thumb = (
    <span className="relative block h-16 w-12 overflow-hidden rounded-sm border border-border bg-surface-tint">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={item.src} alt="" loading="lazy" className="h-full w-full object-cover object-[center_14%]" />
    </span>
  );

  return item.href ? <Link href={item.href}>{thumb}</Link> : thumb;
}

async function getVisuals(seed: string): Promise<VisualItem[]> {
  try {
    const products = await getPosterCatalog();
    const mapped = products.map(productToVisual).filter((item): item is VisualItem => Boolean(item?.src));
    const unique = dedupeBySrc(mapped);
    const selected = selectAcrossBrands(unique, seed);
    if (selected.length >= 3) return selected.slice(0, 4);
  } catch (error) {
    console.error("Info visual panel failed to load catalog images", error);
  }

  return rotate(fallbackVisuals, hashSeed(seed)).slice(0, 4);
}

const getPosterCatalog = cache(async () => {
  const brandBatches = await Promise.allSettled(
    posterBrandTags.map(async (tag) => {
      const products = await getProducts({ first: 18, query: `tag:${tag}` });
      return products.filter((product) => product.tags.some((productTag) => normalizeBrand(productTag) === normalizeBrand(tag)));
    })
  );
  const taggedProducts = brandBatches.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
  const broadProducts = await getProducts({ first: 120 });
  return dedupeByHandle([...taggedProducts, ...broadProducts]).filter((product) => {
    const image = product.featuredImage || product.images[0];
    return Boolean(image?.url);
  });
});

function productToVisual(product: Product): VisualItem | null {
  const image = product.featuredImage || product.images[0];
  if (!image?.url) return null;

  const brand = product.extended.brand || product.vendor || "DollWow";
  const detailParts = [product.extended.heightCm ? `${product.extended.heightCm} cm` : null, product.extended.material, product.extended.stockStatus === "ready_to_ship" ? "Ready to ship" : "Custom order"].filter(Boolean);
  const displayName = product.extended.displayName ? `${brand} ${product.extended.displayName}` : cleanPosterTitle(product.title, brand);

  return {
    src: image.url,
    alt: image.altText || product.title,
    title: displayName,
    subtitle: detailParts.join(" · "),
    brand,
    href: `/products/${product.handle}`
  };
}

function cleanPosterTitle(title: string, brand: string) {
  const withoutBrand = title.replace(new RegExp(`^${escapeRegExp(brand)}\\s+`, "i"), "");
  return withoutBrand.replace(/\s+Companion Doll$/i, "").trim() || title;
}

function selectAcrossBrands(items: VisualItem[], seed: string) {
  const offset = hashSeed(seed);
  const groups = groupByBrand(items);
  const preferred = rotate(preferredBrandOrder, offset);
  const selected: VisualItem[] = [];

  for (const brandKey of preferred) {
    const group = groups.find((entry) => entry.key.includes(brandKey));
    if (!group?.items.length) continue;
    selected.push(rotate(group.items, offset)[0]);
    if (selected.length >= 4) return selected;
  }

  const rotated = rotate(items, offset);
  for (const item of rotated) {
    if (selected.some((selectedItem) => selectedItem.src === item.src)) continue;
    selected.push(item);
    if (selected.length >= 4) return selected;
  }

  return selected;
}

function groupByBrand(items: VisualItem[]) {
  const groups = new Map<string, VisualItem[]>();
  for (const item of items) {
    const key = normalizeBrand(item.brand);
    groups.set(key, [...(groups.get(key) || []), item]);
  }
  return [...groups.entries()].map(([key, groupItems]) => ({ key, items: groupItems }));
}

function dedupeBySrc(items: VisualItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.src)) return false;
    seen.add(item.src);
    return true;
  });
}

function dedupeByHandle(products: Product[]) {
  const seen = new Set<string>();
  return products.filter((product) => {
    if (seen.has(product.handle)) return false;
    seen.add(product.handle);
    return true;
  });
}

function rotate<T>(items: T[], offset: number) {
  if (!items.length) return items;
  const start = offset % items.length;
  return [...items.slice(start), ...items.slice(0, start)];
}

function hashSeed(seed: string) {
  return seed.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
}

function normalizeBrand(brand: string) {
  return brand.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
