import { Suspense } from "react";
import Link from "next/link";
import { BadgeCheck, Boxes, CircleDollarSign, FileCheck2, Globe2, MessageCircle } from "lucide-react";
import { GoldButton } from "@/components/GoldButton";
import { InfoVisualPanel } from "@/components/InfoVisualPanel";
import { SupportLeadForm } from "@/components/SupportLeadForm";

export const metadata = {
  title: "Brand Partnerships",
  description:
    "Partner with DollWow for careful brand representation, MAP-aware pricing, guided buying, and customer support across the US and Europe."
};

const partnerReasons = [
  {
    title: "Brand-first presentation",
    copy: "Product pages are built to show the brand clearly: specs, measurements, option rules, delivery timing, and factory approval details.",
    icon: FileCheck2
  },
  {
    title: "Customer support handled well",
    copy: "We help shoppers compare sizing, material, options, stock, delivery, and price before they commit, reducing confusion before and after purchase.",
    icon: MessageCircle
  },
  {
    title: "MAP-aware price review",
    copy: "Price-match requests are reviewed carefully. We do not want to undercut brand rules or create messy public discounting.",
    icon: CircleDollarSign
  },
  {
    title: "US and Europe focus",
    copy: "DollWow is built for international buyers who want trustworthy ordering, clear policy pages, and support that understands the category.",
    icon: Globe2
  }
];

const operatingStandards = [
  "Honor MAP pricing, promo rules, and brand terms before public discounts are offered.",
  "Represent product photos, option images, specs, and customization rules accurately.",
  "Separate ready-to-ship and custom-order products clearly so timing is not misrepresented.",
  "Keep customer service, delivery questions, factory photo approval, and claim handling clear.",
  "Avoid fake reviews, fake buyer photos, or invented brand claims.",
  "Correct product details quickly when a brand provides updated information."
];

const brandNeeds = [
  {
    title: "Catalog assets",
    copy: "Product photos, option images, measurements, head/body references, and brand-specific customization rules.",
    icon: Boxes
  },
  {
    title: "MAP and promos",
    copy: "Retail price guidance, MAP requirements, approved seasonal offers, bundle rules, and discount restrictions.",
    icon: CircleDollarSign
  },
  {
    title: "Market support",
    copy: "US/EU availability, preferred fulfillment notes, warranty expectations, and the right support contact for escalations.",
    icon: Globe2
  }
];

export default function SupplierPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)] lg:items-start">
        <div className="rounded-[24px] border border-gold-500/14 bg-[linear-gradient(180deg,#1a110d,#100907)] p-7 sm:p-10">
          <p className="text-sm uppercase tracking-[0.18em] text-gold-300">Brand partnerships</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-semibold leading-tight text-ivory-50 sm:text-5xl">
            Careful brand representation for serious US and European buyers.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-ivory-300">
            DollWow is built for high-intent shoppers who compare brands, measurements, custom options, delivery timing, and price.
            We want brand partners to feel confident that their products are represented fairly, professionally, and in line with their terms.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <GoldButton href="mailto:hello@dollwow.com">Contact DollWow</GoldButton>
            <Link
              href="/why-dollwow"
              className="inline-flex items-center justify-center rounded-[14px] border border-gold-500/18 bg-ink-800/72 px-4 py-2.5 text-sm font-semibold text-ivory-200 transition hover:border-gold-300/45 hover:text-ivory-50"
            >
              See customer trust page
            </Link>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {["MAP-aware pricing", "Brand-safe support", "US/EU market focus"].map((item) => (
              <div key={item} className="border border-gold-500/12 bg-[#120907]/60 px-4 py-3 text-sm font-semibold text-ivory-200">
                {item}
              </div>
            ))}
          </div>
        </div>

        <aside className="space-y-5">
          <InfoVisualPanel
            seed="brand-partnerships"
            eyebrow="Catalog presentation"
            title="Real product pages, cleaner buying."
            copy="DollWow is designed to make brand photos, measurements, options, timing, and support easier for US and European buyers to understand."
            cta={{ label: "View catalog", href: "/shop" }}
            compact
          />
          <div className="rounded-[24px] border border-gold-500/14 bg-ink-800/72 p-6 sm:p-7">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-[16px] border border-gold-500/14 bg-[#20120d] text-gold-300">
              <BadgeCheck className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-2xl font-semibold text-ivory-50">What DollWow wants to protect</h2>
            <p className="mt-3 text-sm leading-6 text-ivory-400">
              We want clean authorization, accurate product data, approved image usage, MAP clarity, and a reliable brand contact for
              stock, pricing, support, and post-order questions.
            </p>
            <div className="mt-5 grid gap-3 text-sm text-ivory-300">
              <div className="border border-gold-500/10 bg-[#120907]/60 p-4">
                <strong className="block text-ivory-100">Best fit</strong>
                Brands that want stronger international presentation, cleaner pre-sale support, and better customer confidence.
              </div>
              <div className="border border-gold-500/10 bg-[#120907]/60 p-4">
                <strong className="block text-ivory-100">Launch posture</strong>
                We can start with a reviewed product set, then expand once MAP, option rules, fulfillment expectations, and terms are clear.
              </div>
            </div>
          </div>
        </aside>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {partnerReasons.map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.title} className="border border-gold-500/14 bg-ink-800/72 p-6">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-[16px] border border-gold-500/14 bg-[#20120d] text-gold-300">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-xl font-semibold text-ivory-50">{card.title}</h2>
              <p className="mt-2 text-sm leading-6 text-ivory-400">{card.copy}</p>
            </article>
          );
        })}
      </div>

      <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <div className="rounded-[24px] border border-gold-500/14 bg-[linear-gradient(180deg,#1a110d,#100907)] p-6 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-300">Operating standards</p>
          <h2 className="mt-3 text-3xl font-semibold text-ivory-50">How we protect brand trust.</h2>
          <div className="mt-5 space-y-3">
            {operatingStandards.map((item) => (
              <div key={item} className="flex gap-3 border border-gold-500/10 bg-[#120907]/60 p-4 text-sm leading-6 text-ivory-300">
                <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-gold-300" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[24px] border border-gold-500/14 bg-ink-800/62 p-6 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-300">Helpful brand inputs</p>
          <h2 className="mt-3 text-3xl font-semibold text-ivory-50">The few things that make onboarding smoother.</h2>
          <div className="mt-6 grid gap-4">
            {brandNeeds.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="border border-gold-500/12 bg-[#120907]/58 p-5">
                  <Icon className="h-5 w-5 text-gold-300" />
                  <h3 className="mt-4 text-lg font-semibold text-ivory-100">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-ivory-400">{item.copy}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-[24px] border border-gold-500/14 bg-[linear-gradient(180deg,#1a110d,#100907)] p-6 sm:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-300">Brand contact</p>
            <h2 className="mt-3 text-3xl font-semibold text-ivory-50">Send product, MAP, or authorization questions here.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ivory-400">
              Use this form for brand introductions, corrected product data, image permissions, stock files, price lists, MAP rules, or brand-specific option rules.
            </p>
          </div>
          <Link
            href="mailto:hello@dollwow.com"
            className="inline-flex w-fit items-center justify-center rounded-[14px] border border-gold-500/18 bg-[#120907]/65 px-4 py-2.5 text-sm font-semibold text-ivory-200 transition hover:border-gold-300/45 hover:text-ivory-50"
          >
            hello@dollwow.com
          </Link>
        </div>

        <div className="mt-6">
          <Suspense fallback={<div className="rounded-[24px] border border-gold-500/16 bg-ink-800/72 p-8 text-ivory-400">Loading brand form...</div>}>
            <SupportLeadForm defaultSource="brand-partnership" />
          </Suspense>
        </div>
      </section>
    </section>
  );
}
