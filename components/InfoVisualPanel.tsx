import Link from "next/link";

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
  href: string;
  brand: string;
};

// These are deliberately curated local catalog portraits. Informational pages
// should never inherit a surprising supplier photo just because the catalog
// order changed.
const curatedVisuals: VisualItem[] = [
  {
    src: "/images/home-hero/portraits-new/starpery-adele-home-v2.png",
    alt: "Starpery Adele catalog portrait",
    title: "Starpery Adele",
    subtitle: "Custom order",
    brand: "Starpery",
    href: "/brands/starpery-dolls"
  },
  {
    src: "/images/home-hero/portraits-new/zelex-ida-home.png",
    alt: "Zelex Ida catalog portrait",
    title: "Zelex Ida",
    subtitle: "Ready to ship",
    brand: "Zelex Dolls",
    href: "/brands/zelex-dolls"
  },
  {
    src: "/images/home-hero/portraits-new/sedoll-carry-home.png",
    alt: "SE Doll Carry catalog portrait",
    title: "SE Doll Carry",
    subtitle: "Custom order",
    brand: "SE Doll",
    href: "/brands/se-doll"
  }
];

const trustBits = ["Private checkout", "Factory photos", "Price-match review"];

export function InfoVisualPanel({
  seed,
  eyebrow = "DollWow catalog",
  title = "Real listings, clearer buying.",
  copy = "Browse with product photos, clear specs, private checkout, and team support when you want a second look.",
  cta,
  compact = false
}: InfoVisualPanelProps) {
  const visual = curatedVisuals[hashSeed(seed) % curatedVisuals.length];

  return (
    <section
      className="info-visual-banner overflow-hidden rounded-lg border border-border bg-surface text-text shadow-card"
      aria-label={title}
    >
      <div className="info-visual-banner__layout">
        <div className={`flex min-w-0 flex-col justify-center ${compact ? "p-6 sm:p-7" : "p-6 sm:p-8 lg:p-10"}`}>
          <p className="text-[15px] font-semibold text-accent">{eyebrow}</p>
          <h2 className={`${compact ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl"} mt-2 max-w-[22ch] font-display font-semibold leading-tight text-text`}>
            {title}
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-text-dim">{copy}</p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            {trustBits.map((bit) => (
              <span key={bit} className="inline-flex min-h-10 items-center rounded-sm bg-surface-tint px-3 text-sm font-semibold text-text-dim">
                {bit}
              </span>
            ))}
          </div>

          {cta ? (
            <Link href={cta.href} className="mt-5 inline-flex min-h-[48px] w-fit items-center rounded-button bg-accent px-5 text-base font-semibold text-white hover:bg-accent-hover">
              {cta.label}
            </Link>
          ) : null}
        </div>

        <Link href={visual.href} className="info-visual-banner__media group" aria-label={`View ${visual.title}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={visual.src} alt={visual.alt} loading="lazy" className="h-full w-full object-cover object-[center_18%]" />
          <span className="absolute inset-x-4 bottom-4 rounded-sm bg-surface/95 p-3 shadow-card">
            <span className="block text-sm font-semibold text-text-dim">{visual.brand}</span>
            <span className="mt-0.5 block text-base font-semibold text-text">{visual.title}</span>
            <span className="mt-0.5 block text-sm text-text-dim">{visual.subtitle}</span>
          </span>
        </Link>
      </div>
    </section>
  );
}

function hashSeed(seed: string) {
  return seed.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
}
