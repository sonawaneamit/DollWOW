import Link from "next/link";
import type { ReactNode } from "react";
import { InfoVisualPanel } from "@/components/InfoVisualPanel";
import { TrustLogoStrip } from "@/components/TrustLogoStrip";

type PolicyCard = {
  title: string;
  body: string;
};

type PolicySection = {
  title: string;
  intro?: string;
  items: string[];
};

type PolicyLayoutProps = {
  eyebrow: string;
  title: string;
  intro: string;
  visual?: {
    eyebrow?: string;
    title?: string;
    copy?: string;
    cta?: { label: string; href: string };
  };
  cards?: PolicyCard[];
  sections?: PolicySection[];
  asideTitle?: string;
  asideItems?: string[];
  ctas?: Array<{ label: string; href: string; primary?: boolean }>;
  children?: ReactNode;
};

export function PolicyLayout({
  eyebrow,
  title,
  intro,
  visual,
  cards = [],
  sections = [],
  asideTitle,
  asideItems = [],
  ctas = [],
  children
}: PolicyLayoutProps) {
  return (
    <section className="mx-auto max-w-6xl px-5 py-12 text-text sm:px-6 lg:px-8 lg:py-16">
      <div>
        <p className="text-[15px] font-semibold text-text-dim">{eyebrow}</p>
        <h1 className="mt-2 max-w-4xl font-display text-[clamp(2.25rem,4vw,3.25rem)] font-semibold leading-[1.1] text-text">{title}</h1>
        <p className="mt-5 max-w-3xl text-[17px] leading-7 text-text-dim">{intro}</p>

        {ctas.length ? (
          <div className="mt-6 flex flex-wrap gap-3">
            {ctas.map((cta) => (
              <Link
                key={cta.href}
                href={cta.href}
                className={
                  cta.primary
                    ? "inline-flex min-h-[52px] items-center rounded-button bg-accent px-5 text-[17px] font-semibold text-white transition-colors hover:bg-accent-hover"
                    : "inline-flex min-h-[52px] items-center rounded-button border-2 border-accent px-5 text-[17px] font-semibold text-accent transition-colors hover:bg-accent-tint"
                }
              >
                {cta.label}
              </Link>
            ))}
          </div>
        ) : null}

        <div className="mt-7">
          <TrustLogoStrip eager />
        </div>
      </div>

      <div className="mt-8">
        <InfoVisualPanel
          seed={`${eyebrow}-${title}`}
          eyebrow={visual?.eyebrow ?? eyebrow}
          title={visual?.title}
          copy={visual?.copy}
          cta={visual?.cta}
          compact
        />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(260px,0.8fr)]">
        <div>

          {cards.length ? (
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {cards.map((card) => (
                <article key={card.title} className="rounded-md bg-surface p-5 shadow-card">
                  <h2 className="text-xl font-semibold text-text">{card.title}</h2>
                  <p className="mt-2 text-[15px] leading-6 text-text-dim">{card.body}</p>
                </article>
              ))}
            </div>
          ) : null}

          {sections.length ? (
            <div className="mt-10 space-y-8">
              {sections.map((section) => (
                <section key={section.title} className="rounded-lg bg-surface p-6 shadow-card">
                  <h2 className="text-2xl font-semibold text-text">{section.title}</h2>
                  {section.intro ? <p className="mt-2 text-[15px] leading-6 text-text-dim">{section.intro}</p> : null}
                  <div className="mt-5 space-y-3">
                    {section.items.map((item) => (
                      <div key={item} className="rounded-sm bg-surface-tint p-4 text-[15px] leading-6 text-text-dim">
                        {item}
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : null}

          {children ? <div className="mt-10">{children}</div> : null}
        </div>

        <div className="space-y-5">
          <aside className="h-fit rounded-lg bg-surface p-6 shadow-card">
            <p className="text-[15px] font-semibold text-text-dim">{asideTitle ?? "Quick notes"}</p>
            <div className="mt-4 space-y-3">
              {asideItems.map((item) => (
                <div key={item} className="rounded-sm bg-surface-tint p-4 text-[15px] leading-6 text-text-dim">
                  {item}
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
