import Link from "next/link";
import type { ReactNode } from "react";
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
  cards = [],
  sections = [],
  asideTitle,
  asideItems = [],
  ctas = [],
  children
}: PolicyLayoutProps) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(260px,0.8fr)]">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-gold-300">{eyebrow}</p>
          <h1 className="mt-2 text-4xl font-semibold leading-tight text-ivory-50 sm:text-5xl">{title}</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-ivory-300">{intro}</p>

          {ctas.length ? (
            <div className="mt-6 flex flex-wrap gap-3">
              {ctas.map((cta) => (
                <Link
                  key={cta.href}
                  href={cta.href}
                  className={
                    cta.primary
                      ? "rounded-[14px] bg-gold-300 px-4 py-2.5 text-sm font-semibold text-[#1f120b] transition hover:bg-gold-200"
                      : "rounded-[14px] border border-gold-500/18 bg-ink-800/72 px-4 py-2.5 text-sm font-semibold text-ivory-200 transition hover:border-gold-300/45 hover:text-ivory-50"
                  }
                >
                  {cta.label}
                </Link>
              ))}
            </div>
          ) : null}

          <div className="mt-7">
            <TrustLogoStrip />
          </div>

          {cards.length ? (
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {cards.map((card) => (
                <article key={card.title} className="rounded-[18px] border border-gold-500/14 bg-ink-800/72 p-5">
                  <h2 className="text-lg font-semibold text-ivory-100">{card.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-ivory-300">{card.body}</p>
                </article>
              ))}
            </div>
          ) : null}

          {sections.length ? (
            <div className="mt-10 space-y-8">
              {sections.map((section) => (
                <section key={section.title} className="rounded-[22px] border border-gold-500/14 bg-ink-800/58 p-6">
                  <h2 className="text-2xl font-semibold text-ivory-100">{section.title}</h2>
                  {section.intro ? <p className="mt-2 text-sm leading-6 text-ivory-400">{section.intro}</p> : null}
                  <div className="mt-5 space-y-3">
                    {section.items.map((item) => (
                      <div key={item} className="rounded-[14px] border border-gold-500/10 bg-[#120907]/65 p-4 text-sm leading-6 text-ivory-300">
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

        <aside className="h-fit rounded-[22px] border border-gold-500/14 bg-[linear-gradient(180deg,#1a110d,#100907)] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-300">{asideTitle ?? "Quick notes"}</p>
          <div className="mt-4 space-y-3">
            {asideItems.map((item) => (
              <div key={item} className="rounded-[14px] border border-gold-500/10 bg-[#120907]/55 p-4 text-sm leading-6 text-ivory-300">
                {item}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
