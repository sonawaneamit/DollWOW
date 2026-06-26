import type { Metadata } from "next";
import Link from "next/link";
import { InfoVisualPanel } from "@/components/InfoVisualPanel";
import { Camera, CheckCircle2, Lock, MessageCircle, Scale, ShieldCheck, Truck } from "lucide-react";

export const metadata: Metadata = {
  title: "Why DollWow"
};

const proofCards = [
  {
    title: "Private by default",
    copy: "Plain packaging, neutral billing, and discreet communication are treated as the baseline, not an upgrade.",
    icon: Lock
  },
  {
    title: "Factory photo approval",
    copy: "Custom builds move through final photo and video approval before shipment, so there is less guesswork at delivery.",
    icon: Camera
  },
  {
    title: "Price-match review",
    copy: "If you find the same configuration cheaper within 30 days, we review the full delivered deal and refund the difference when it qualifies.",
    icon: Scale
  },
  {
    title: "Clear protection",
    copy: "Buyer protection, shipping protection, damage reporting, and timing rules are visible before checkout instead of hidden in support emails.",
    icon: ShieldCheck
  }
];

const confidenceChecks = [
  "The product clearly says whether it is ready to ship or custom built.",
  "Measurements and core product specs are visible on the product page.",
  "Custom orders include a pre-shipment approval step.",
  "Damage and delivery issues have clear reporting rules.",
  "You can ask our team before you buy."
];

const supportMoments = [
  {
    title: "Before checkout",
    copy: "Ask about sizing, material, warehouse timing, or whether two listings are really the same doll."
  },
  {
    title: "During approval",
    copy: "For custom builds, use the factory-photo stage to request cosmetic revisions before the order is released."
  },
  {
    title: "After delivery",
    copy: "If something arrives damaged or the delivery goes wrong, the support team can review it quickly."
  }
];

const promisePoints = [
  "If a custom build is offered, final factory photos and videos should be included before shipment.",
  "If an order arrives with meaningful transit damage, you should know how to request help.",
  "If a product is ready to ship, the timing should be clearly different from a made-to-order build.",
  "If a listing needs a second look, real support should still be reachable before checkout."
];

const trustRules = [
  {
    title: "No vague timing",
    copy: "Every product should tell you whether it is ready to ship or built to order. That timing difference matters."
  },
  {
    title: "No hidden support rules",
    copy: "Damage reporting, approval steps, and price-match review should be easy to find before you pay."
  },
  {
    title: "No pressure to guess",
    copy: "Measurements, option pricing, and comparison help should make the decision easier, not leave you filling in blanks."
  }
];

const readingLinks = [
  { label: "Buyer protection", href: "/buyer-protection" },
  { label: "Shipping protection", href: "/shipping-protection" },
  { label: "How ordering works", href: "/how-ordering-works" },
  { label: "Support", href: "/support" },
  { label: "Returns and replacements", href: "/returns" },
  { label: "Best price guarantee", href: "/best-price-guarantee" },
  { label: "Scam alert", href: "/scam-alert" }
];

export default function WhyPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-7 rounded-[28px] border border-gold-500/14 bg-[linear-gradient(180deg,#1a110d,#100907)] p-7 sm:p-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-gold-300">Why DollWow</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-semibold leading-tight text-ivory-50 sm:text-5xl">
            A more transparent way to buy.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-ivory-300">
            Most buyers already know what they are looking at. The real question is whether the store feels clear,
            private, reachable, and reliable when the order gets expensive.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/shop"
              className="rounded-[14px] bg-gold-300 px-4 py-2.5 text-sm font-semibold text-[#1f120b] transition hover:bg-gold-200"
            >
              Browse the catalog
            </Link>
            <Link
              href="/buyer-protection"
              className="rounded-[14px] border border-gold-500/18 bg-ink-800/72 px-4 py-2.5 text-sm font-semibold text-ivory-200 transition hover:border-gold-300/45 hover:text-ivory-50"
            >
              Read buyer protection
            </Link>
            <Link
              href="/support"
              className="rounded-[14px] border border-gold-500/18 bg-ink-800/72 px-4 py-2.5 text-sm font-semibold text-ivory-200 transition hover:border-gold-300/45 hover:text-ivory-50"
            >
              Ask our team
            </Link>
          </div>
        </div>
        <InfoVisualPanel
          seed="why-dollwow"
          eyebrow="Catalog trust"
          title="Photos, specs, timing, support."
          copy="DollWow puts the real product, measurements, order timing, and support path closer together."
          cta={{ label: "See protection", href: "/buyer-protection" }}
          compact
        />
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {proofCards.map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.title} className="rounded-[22px] border border-gold-500/14 bg-ink-800/72 p-6">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-[16px] border border-gold-500/14 bg-[#20120d] text-gold-300">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-xl font-semibold text-ivory-50">{card.title}</h2>
              <p className="mt-2 text-sm leading-6 text-ivory-400">{card.copy}</p>
            </article>
          );
        })}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
        <section className="rounded-[24px] border border-gold-500/14 bg-ink-800/62 p-6 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-300">Before you pay</p>
          <h2 className="mt-3 text-3xl font-semibold text-ivory-50">What you should be able to verify first.</h2>
          <div className="mt-6 space-y-3">
            {confidenceChecks.map((item) => (
              <div key={item} className="rounded-[16px] border border-gold-500/10 bg-[#120907]/65 px-4 py-3 text-sm leading-6 text-ivory-300">
                {item}
              </div>
            ))}
          </div>
        </section>

        <aside className="rounded-[24px] border border-gold-500/14 bg-[linear-gradient(180deg,#1a110d,#100907)] p-6 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-300">Order timing</p>
          <div className="mt-5 space-y-4">
            <div className="rounded-[16px] border border-gold-500/10 bg-[#120907]/60 p-4">
              <div className="flex items-center gap-3">
                <Truck className="h-5 w-5 text-gold-300" />
                <strong className="text-sm font-semibold text-ivory-100">Ready to ship</strong>
              </div>
              <p className="mt-2 text-sm leading-6 text-ivory-300">
                Usually released from the warehouse in 2-3 business days after stock confirmation, with fewer approval steps.
              </p>
            </div>
            <div className="rounded-[16px] border border-gold-500/10 bg-[#120907]/60 p-4">
              <div className="flex items-center gap-3">
                <Camera className="h-5 w-5 text-gold-300" />
                <strong className="text-sm font-semibold text-ivory-100">Custom build</strong>
              </div>
              <p className="mt-2 text-sm leading-6 text-ivory-300">
                Usually takes about 3-5 weeks before release, with factory photo and video approval before shipment.
              </p>
            </div>
          </div>
        </aside>
      </div>

      <section className="mt-8 rounded-[24px] border border-gold-500/14 bg-ink-800/62 p-6 sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-300">Support that matters</p>
        <h2 className="mt-3 text-3xl font-semibold text-ivory-50">When buyers usually want a second set of eyes.</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {supportMoments.map((item) => (
            <article key={item.title} className="rounded-[18px] border border-gold-500/12 bg-[#120907]/60 p-5">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-[14px] border border-gold-500/12 bg-[#20120d] text-gold-300">
                <MessageCircle className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-ivory-100">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-ivory-400">{item.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.9fr)]">
        <div className="rounded-[24px] border border-gold-500/14 bg-[linear-gradient(180deg,#1a110d,#100907)] p-6 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-300">What we mean by trust</p>
          <h2 className="mt-3 text-3xl font-semibold text-ivory-50">Simple promises, easy to check.</h2>
          <div className="mt-5 space-y-3">
            {promisePoints.map((item) => (
              <div key={item} className="flex gap-3 rounded-[16px] border border-gold-500/10 bg-[#120907]/60 p-4 text-sm leading-6 text-ivory-300">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-gold-300" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[24px] border border-gold-500/14 bg-ink-800/62 p-6 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-300">What we avoid</p>
          <div className="mt-5 space-y-4">
            {trustRules.map((item) => (
              <article key={item.title} className="rounded-[16px] border border-gold-500/10 bg-[#120907]/58 p-4">
                <h3 className="text-base font-semibold text-ivory-100">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-ivory-400">{item.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-[24px] border border-gold-500/14 bg-[linear-gradient(180deg,#1a110d,#100907)] p-6 sm:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-300">Read the rules yourself</p>
            <h2 className="mt-3 text-3xl font-semibold text-ivory-50">The important pages should never be hard to find.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ivory-400">
            If a store wants trust, the policy and process pages should be visible before checkout, not after a problem starts.
            </p>
          </div>
          <Link
            href="/how-ordering-works"
            className="inline-flex w-fit items-center gap-2 rounded-[14px] border border-gold-500/18 bg-[#120907]/65 px-4 py-2.5 text-sm font-semibold text-ivory-200 transition hover:border-gold-300/45 hover:text-ivory-50"
          >
            See how ordering works
          </Link>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {readingLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-[16px] border border-gold-500/12 bg-[#120907]/58 px-4 py-3 text-sm font-semibold text-ivory-200 transition hover:border-gold-300/45 hover:text-ivory-50"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </section>
    </section>
  );
}
