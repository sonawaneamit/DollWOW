import type { Metadata } from "next";
import Link from "next/link";
import authors from "@/content/editorial/authors.json";

export const metadata: Metadata = {
  title: "Editorial Policy",
  description:
    "How DollWow writes, reviews, and maintains Learning Center guides, including contributor bylines, product accuracy, and catalog review standards.",
  alternates: { canonical: "/editorial-policy" }
};

const authorEntries = [
  { id: "jesse", profile: authors.jesse },
  { id: "alex", profile: authors.alex }
] as const;

const reviewStandards = [
  "Product, price, stock, option, shipping, warranty, and supplier claims are checked against DollWow catalog data, supplier materials, and published store policies before publication.",
  "When a detail depends on live inventory, warehouse confirmation, supplier approval, or a specific custom build, we make that clear instead of treating it as universal.",
  "Learning Center content avoids fake customer stories, fake reviews, invented product examples, and unsupported supplier authorization claims.",
  "AI tools may support drafting, editing, and visual concepts, but published product and policy claims are reviewed against DollWow-controlled data or approved source material.",
  "Health, care, legal, and safety topics are informational. They are not a substitute for medical, therapeutic, legal, or local compliance advice."
];

const accuracyStandards = [
  "Exact prices come from the live catalog or a reviewed product source.",
  "Delivery timing is written carefully because in-stock items, custom builds, supplier processing, and freight handling can differ.",
  "Editorial illustrations are used to explain buying concepts. Product photography and product pages are the place to inspect the actual item.",
  "Supplier, brand, and authorization details are included only when DollWow has a reviewed source for them.",
  "Contributor biographies explain who is writing or reviewing guidance without presenting contributors as company founders."
];

const trustNotes = [
  "Learning Center articles show contributor bylines so readers can see the point of view behind each guide.",
  "Product pages, collection pages, checkout, and published store policies are the final source for current prices, options, shipping, and availability.",
  "If something is unclear before checkout, DollWow support can help confirm product details, custom options, and timing."
];

export default function EditorialPolicyPage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "DollWow Editorial Policy",
    url: "https://dollwow.com/editorial-policy",
    isPartOf: {
      "@type": "WebSite",
      name: "DollWow",
      url: "https://dollwow.com"
    },
    mainEntity: {
      "@type": "Organization",
      name: "DollWow",
      publishingPrinciples: "https://dollwow.com/editorial-policy"
    }
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <section className="tone-section" data-tone="deep">
        <div className="tone-inner">
          <p className="text-sm uppercase tracking-[0.18em] text-gold-300">Editorial Policy</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-semibold leading-tight text-ivory-50 sm:text-5xl">
            How DollWow writes and reviews buyer guidance
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-ivory-300">
            DollWow publishes Learning Center guides for adults comparing expensive, private purchases. The goal is practical buyer clarity: what to compare, what to confirm, and where product or shipping claims need live support review.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/learn" className="rounded-[14px] bg-gold-300 px-4 py-2.5 text-sm font-semibold text-[#1f120b] transition hover:bg-gold-200">
              Read Learning Center
            </Link>
            <Link
              href="/support"
              className="rounded-[14px] border border-gold-500/18 bg-ink-800/72 px-4 py-2.5 text-sm font-semibold text-ivory-200 transition hover:border-gold-300/45 hover:text-ivory-50"
            >
              Ask support
            </Link>
          </div>
        </div>
      </section>

      <section className="tone-section" data-tone="blush">
        <div className="tone-inner">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.45fr)]">
            <div className="space-y-6">
              <section className="rounded-[8px] border border-gold-500/14 bg-ivory-50/[0.5] p-6">
                <h2 className="text-2xl font-semibold text-ink-950">Contributor Bylines</h2>
                <p className="mt-3 text-sm leading-6 text-ink-700">
                  DollWow uses contributor bylines for Learning Center and buying-guide content so readers know who is shaping the guidance.
                </p>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {authorEntries.map(({ id, profile }) => (
                    <article key={id} id={id} className="rounded-[8px] border border-gold-500/16 bg-white/55 p-5">
                      <h3 className="text-xl font-semibold text-ink-950">{profile.displayName}</h3>
                      <p className="mt-1 text-sm font-semibold text-gold-700">{profile.title}</p>
                      <p className="mt-3 text-sm leading-6 text-ink-700">{profile.bio}</p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="rounded-[8px] border border-gold-500/14 bg-ivory-50/[0.5] p-6">
                <h2 className="text-2xl font-semibold text-ink-950">Review Standards</h2>
                <div className="mt-5 space-y-3">
                  {reviewStandards.map((item) => (
                    <p key={item} className="rounded-[8px] border border-gold-500/12 bg-white/50 p-4 text-sm leading-6 text-ink-700">
                      {item}
                    </p>
                  ))}
                </div>
              </section>

              <section className="rounded-[8px] border border-gold-500/14 bg-ivory-50/[0.5] p-6">
                <h2 className="text-2xl font-semibold text-ink-950">How We Keep Product Claims Accurate</h2>
                <div className="mt-5 space-y-3">
                  {accuracyStandards.map((item) => (
                    <p key={item} className="rounded-[8px] border border-gold-500/12 bg-white/50 p-4 text-sm leading-6 text-ink-700">
                      {item}
                    </p>
                  ))}
                </div>
              </section>
            </div>

            <aside className="h-fit rounded-[8px] border border-gold-500/16 bg-ink-950 p-6 text-ivory-200">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-300">What To Check Before You Buy</p>
              <div className="mt-5 space-y-3 text-sm leading-6 text-ivory-300">
                {trustNotes.map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
