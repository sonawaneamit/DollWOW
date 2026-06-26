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

type PosterTheme = {
  shell: string;
  wash: string;
  glow: string;
  accent: string;
  kicker: string;
  promo: string;
  promoSub: string;
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

const posterThemes: PosterTheme[] = [
  {
    shell: "border-gold-500/22 bg-[#100605]",
    wash: "bg-[radial-gradient(circle_at_24%_20%,rgba(237,188,151,0.28),transparent_26%),radial-gradient(circle_at_84%_18%,rgba(113,36,47,0.36),transparent_34%),linear-gradient(135deg,#2b100e_0%,#120706_55%,#060202_100%)]",
    glow: "bg-[linear-gradient(100deg,rgba(6,2,2,0.96)_0%,rgba(14,6,5,0.82)_42%,rgba(14,6,5,0.18)_68%,rgba(14,6,5,0.78)_100%)]",
    accent: "text-[#f1bd98]",
    kicker: "Private showroom",
    promo: "Curated picks",
    promoSub: "Real listings, polished shopping"
  },
  {
    shell: "border-[#f5d082]/24 bg-[#120b05]",
    wash: "bg-[radial-gradient(circle_at_28%_20%,rgba(253,215,132,0.26),transparent_24%),radial-gradient(circle_at_88%_12%,rgba(223,151,75,0.32),transparent_32%),linear-gradient(135deg,#2a1a0a_0%,#100805_48%,#050202_100%)]",
    glow: "bg-[linear-gradient(100deg,rgba(7,3,2,0.95)_0%,rgba(26,12,6,0.78)_44%,rgba(26,12,6,0.12)_70%,rgba(8,3,2,0.74)_100%)]",
    accent: "text-[#f7d9a8]",
    kicker: "DollWow advantage",
    promo: "Factory photos",
    promoSub: "Approval before shipment"
  },
  {
    shell: "border-[#d67f89]/22 bg-[#160706]",
    wash: "bg-[radial-gradient(circle_at_24%_22%,rgba(244,164,150,0.28),transparent_26%),radial-gradient(circle_at_86%_12%,rgba(123,33,56,0.38),transparent_34%),linear-gradient(135deg,#2d1111_0%,#140606_48%,#060202_100%)]",
    glow: "bg-[linear-gradient(100deg,rgba(8,3,3,0.95)_0%,rgba(25,8,8,0.78)_42%,rgba(25,8,8,0.12)_70%,rgba(8,3,3,0.76)_100%)]",
    accent: "text-[#f0aaa5]",
    kicker: "Buyer confidence",
    promo: "Price match",
    promoSub: "Send us the listing"
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
  const theme = posterThemes[hashSeed(seed) % posterThemes.length];

  return (
    <section
      className={`group relative isolate overflow-hidden rounded-[18px] border shadow-[0_28px_90px_rgba(0,0,0,0.45)] ${theme.shell} ${
        compact ? "min-h-[420px]" : "min-h-[500px] lg:min-h-[560px]"
      }`}
      aria-label={title}
    >
      <div className={`absolute inset-0 ${theme.wash}`} />
      <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:72px_72px]" />
      <div className="absolute inset-y-0 right-0 w-full sm:w-[64%]">
        <PosterHero item={hero} priority />
      </div>
      <div className={`absolute inset-0 ${theme.glow}`} />
      <div className="absolute right-5 top-5 hidden rounded-full border border-ivory-200/20 bg-[#080302]/42 px-4 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-ivory-100/88 backdrop-blur sm:block">
        {theme.kicker}
      </div>

      <div className="relative z-10 flex min-h-[inherit] max-w-[760px] flex-col justify-between p-5 sm:p-7 lg:p-8">
        <div>
          <p className={`text-[0.68rem] font-semibold uppercase tracking-[0.24em] ${theme.accent}`}>{eyebrow}</p>
          <h2 className={`${compact ? "text-3xl sm:text-4xl" : "text-4xl sm:text-5xl lg:text-6xl"} mt-4 max-w-[11ch] font-semibold leading-[0.96] text-ivory-50`}>
            {title}
          </h2>
          <p className="mt-5 max-w-[31rem] text-base leading-7 text-ivory-200/88 sm:text-lg">{copy}</p>
          {cta ? (
            <Link href={cta.href} className="mt-6 inline-flex rounded-[12px] bg-gold-300 px-5 py-3 text-sm font-semibold text-[#1f120b] shadow-[0_18px_50px_rgba(222,158,106,0.26)] transition hover:-translate-y-0.5 hover:bg-gold-200">
              {cta.label}
            </Link>
          ) : null}
        </div>

        <div className="mt-8 grid gap-4">
          <div className="w-fit border border-gold-500/18 bg-[#080302]/54 p-4 backdrop-blur-md">
            <p className={`text-[0.62rem] font-semibold uppercase tracking-[0.24em] ${theme.accent}`}>{theme.promo}</p>
            <p className="mt-1 text-sm text-ivory-200">{theme.promoSub}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {trustBits.map((bit) => (
              <span key={bit} className="rounded-full border border-ivory-100/16 bg-[#080302]/50 px-3 py-1.5 text-xs font-semibold text-ivory-100/86 backdrop-blur">
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
        className="h-full w-full object-cover object-[center_16%] opacity-[0.88] saturate-[0.94] transition duration-700 group-hover:scale-[1.02] group-hover:opacity-95"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_68%_24%,transparent_0%,rgba(6,2,2,0.08)_24%,rgba(6,2,2,0.68)_82%)]" />
      <figcaption className="absolute bottom-5 right-5 hidden max-w-[290px] border border-ivory-100/18 bg-[#080302]/54 p-4 text-right backdrop-blur-md sm:block">
        <p className="text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-gold-200/86">{item.brand}</p>
        <p className="mt-1 line-clamp-2 text-base font-semibold leading-tight text-ivory-50">{item.title}</p>
        <p className="mt-1 text-xs text-ivory-200/78">{item.subtitle}</p>
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
    <span className="relative block h-16 w-12 overflow-hidden rounded-[12px] border border-gold-300/28 bg-[#080302]/72 shadow-[0_12px_34px_rgba(0,0,0,0.34)]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={item.src} alt="" loading="lazy" className="h-full w-full object-cover object-[center_14%] opacity-90" />
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
