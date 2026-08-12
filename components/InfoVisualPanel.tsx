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
  video: string;
  poster: string;
  title: string;
  subtitle: string;
  href: string;
  brand: string;
};

// Supplier-approved product previews keep informational pages grounded in the
// real DollWow catalog instead of inheriting an unrelated generated portrait.
const curatedVisuals: VisualItem[] = [
  {
    video: "/videos/home-spotlight/quine.mp4",
    poster: "/images/home-hero/video-posters/quine.webp",
    title: "Jarliet Quine",
    subtitle: "167 cm · Silicone",
    brand: "Jarliet Dolls",
    href: "/products/jarliet-dolls-quine-167cm-b-cup-silicone-companion-doll-etgn7"
  },
  {
    video: "/videos/home-spotlight/vivian.mp4",
    poster: "/images/home-hero/video-posters/vivian.webp",
    title: "Irontech Vivian",
    subtitle: "153 cm · Silicone head",
    brand: "Irontech",
    href: "/products/irontech-vivian-153cm-f-cup-silicone-head-companion-doll-qryli"
  },
  {
    video: "/videos/home-spotlight/freya.mp4",
    poster: "/images/home-hero/video-posters/freya.webp",
    title: "Starpery Freya",
    subtitle: "165 cm · Silicone head",
    brand: "Starpery Dolls",
    href: "/products/starpery-freya-165cm-g-cup-silicone-head-companion-doll-46ftg"
  },
  {
    video: "/videos/home-spotlight/doris.mp4",
    poster: "/images/home-hero/video-posters/doris.webp",
    title: "Erovenus Doris",
    subtitle: "112.5 cm · Silicone",
    brand: "Erovenus",
    href: "/products/erovenus-doris-112-5cm-d-cup-silicone-companion-doll-fhw2l"
  },
  {
    video: "/videos/home-spotlight/isla.mp4",
    poster: "/images/home-hero/video-posters/isla.webp",
    title: "YL Isla",
    subtitle: "158 cm · Silicone",
    brand: "YL Doll",
    href: "/products/yl-isla-158cm-e-cup-silicone-companion-doll-1iikg"
  },
  {
    video: "/videos/home-spotlight/carry.mp4",
    poster: "/images/home-hero/video-posters/carry.webp",
    title: "SE Doll Carry",
    subtitle: "150 cm · TPE",
    brand: "SE Doll",
    href: "/products/sedoll-carry-150cm-g-cup-tpe-companion-doll-1xx8o"
  },
  {
    video: "/videos/home-spotlight/zeki.mp4",
    poster: "/images/home-hero/video-posters/zeki.webp",
    title: "HR Dolls Zeki",
    subtitle: "165 cm · Silicone",
    brand: "HR Dolls",
    href: "/products/hr-dolls-zeki-165cm-e-cup-silicone-companion-doll-1imsn"
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
          <video className="info-visual-banner__video" poster={visual.poster} autoPlay muted loop playsInline preload="metadata" aria-label={`${visual.title} product preview video`}>
            <source src={visual.video} type="video/mp4" />
          </video>
          <span className="info-visual-banner__video-label"><span /> Product preview</span>
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
