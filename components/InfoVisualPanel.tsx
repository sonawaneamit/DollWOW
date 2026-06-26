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
};

const fallbackVisuals: VisualItem[] = [
  {
    src: "/images/home-hero/portraits-new/starpery-adele-home-v2.png",
    alt: "Featured DollWow catalog doll",
    title: "Custom catalog build",
    subtitle: "DollWow"
  },
  {
    src: "/images/home-hero/portraits-new/zelex-ida-home.png",
    alt: "Ready-to-ship DollWow catalog doll",
    title: "Ready-to-ship pick",
    subtitle: "DollWow"
  },
  {
    src: "/images/home-hero/portraits-new/sedoll-carry-home.png",
    alt: "DollWow catalog portrait",
    title: "Private checkout",
    subtitle: "DollWow"
  }
];

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
    <div className="relative overflow-hidden rounded-[22px] border border-gold-500/16 bg-[radial-gradient(circle_at_30%_0%,rgba(232,180,143,0.18),transparent_34%),linear-gradient(180deg,#24120f,#0d0605)] p-3 shadow-[0_28px_80px_rgba(0,0,0,0.38)]">
      <div className={`grid gap-3 ${compact ? "" : "sm:grid-cols-[1.1fr_0.9fr] lg:grid-cols-1"}`}>
        <VisualCard item={hero} priority large />
        <div className="grid grid-cols-2 gap-3">
          {supporting.slice(0, 2).map((item) => (
            <VisualCard key={`${item.src}-${item.title}`} item={item} />
          ))}
        </div>
      </div>
      <div className="mt-3 border border-gold-500/12 bg-[#0b0504]/70 p-4">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-gold-300">{eyebrow}</p>
        <h2 className="mt-2 text-2xl font-semibold leading-tight text-ivory-50">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-ivory-300">{copy}</p>
        {cta ? (
          <Link href={cta.href} className="mt-4 inline-flex rounded-[12px] bg-gold-300 px-4 py-2 text-sm font-semibold text-[#1f120b] transition hover:bg-gold-200">
            {cta.label}
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function VisualCard({ item, large = false, priority = false }: { item: VisualItem; large?: boolean; priority?: boolean }) {
  const image = (
    <figure className={`group relative overflow-hidden border border-gold-500/12 bg-[#0b0504] ${large ? "aspect-[4/5]" : "aspect-[3/4]"}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.src}
        alt={item.alt}
        loading={priority ? "eager" : "lazy"}
        className="h-full w-full object-cover object-[center_18%] opacity-[0.92] saturate-[0.92] transition duration-500 group-hover:scale-[1.035] group-hover:opacity-100"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,3,2,0.04),rgba(8,3,2,0.12)_46%,rgba(8,3,2,0.72))]" />
      <figcaption className="absolute inset-x-0 bottom-0 p-3">
        <p className="text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-gold-200/90">{item.subtitle}</p>
        <p className="mt-1 line-clamp-2 text-sm font-semibold leading-tight text-ivory-50">{item.title}</p>
      </figcaption>
    </figure>
  );

  return item.href ? <Link href={item.href}>{image}</Link> : image;
}

async function getVisuals(seed: string): Promise<VisualItem[]> {
  try {
    const products = await getProducts({ first: 48 });
    const mapped = products.flatMap(productToVisuals).filter((item) => Boolean(item.src));
    const unique = dedupeBySrc(mapped);
    if (unique.length >= 3) return rotate(unique, hashSeed(seed)).slice(0, 3);
  } catch (error) {
    console.error("Info visual panel failed to load catalog images", error);
  }

  return rotate(fallbackVisuals, hashSeed(seed)).slice(0, 3);
}

function productToVisuals(product: Product): VisualItem[] {
  const brand = product.extended.brand || product.vendor || "DollWow";
  const productImages = [product.featuredImage, ...product.images].filter(Boolean).slice(0, 2) as NonNullable<Product["featuredImage"]>[];

  return productImages.map((image) => ({
    src: image.url,
    alt: image.altText || product.title,
    title: product.extended.displayName ? `${brand} ${product.extended.displayName}` : product.title,
    subtitle: brand,
    href: `/products/${product.handle}`
  }));
}

function dedupeBySrc(items: VisualItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.src)) return false;
    seen.add(item.src);
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
